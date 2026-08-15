import React from 'react'
import { apiService } from 'uiSrc/services'
import {
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  within,
} from 'uiSrc/utils/test-utils'
import type { WorkerLike } from 'uiSrc/packages/vector-visualizer/src/worker/layout'

const mockDispatch = jest.fn()

type MockWorkerRunMessage = {
  type: 'run' | 'health'
  job: {
    jobId: string
    count?: number
    ids?: string[]
    k?: number
    metric?: 'cosine' | 'l2' | 'ip'
  }
}

jest.mock('uiSrc/packages/vector-visualizer/src/worker/browserWorker', () => ({
  createBrowserLayoutWorker: () => {
    const worker: WorkerLike = {
      onerror: null,
      onmessage: null,
      postMessage: jest.fn((message: unknown) => {
        const run = message as Partial<MockWorkerRunMessage>
        if (!run.job) return
        const { job } = run
        if (run.type === 'health') {
          const ids = job.ids ?? []
          const metric = job.metric ?? 'cosine'
          queueMicrotask(() =>
            worker.onmessage?.(
              new MessageEvent('message', {
                data: {
                  type: 'health-complete',
                  jobId: job.jobId,
                  metric,
                  sampleIds: ids,
                  pairMeasure:
                    metric === 'cosine'
                      ? 'cosine similarity'
                      : metric === 'l2'
                        ? 'L2 distance'
                        : 'inner product',
                  duplicateDirection: metric === 'l2' ? 'at-most' : 'at-least',
                  edges:
                    ids.length > 1
                      ? [
                          {
                            sourceId: ids[0],
                            targetId: ids[1],
                            value:
                              metric === 'l2'
                                ? 0.01
                                : metric === 'ip'
                                  ? 1.2
                                  : 0.999,
                          },
                        ]
                      : [],
                  neighborDistanceMeasure:
                    metric === 'cosine'
                      ? 'cosine distance'
                      : metric === 'l2'
                        ? 'L2 distance'
                        : 'inner-product dissimilarity',
                  kthDistances: ids.map((id, index) => ({
                    id,
                    kthNeighborDistance:
                      ids.length > 10
                        ? index === ids.length - 1
                          ? 1
                          : 0.1 + index * 0.01
                        : Number.NaN,
                  })),
                  k: job.k ?? 10,
                  freshness: 'fresh',
                  exactness: 'sample-exact',
                },
              }),
            ),
          )
          return
        }
        if (run.type !== 'run' || job.count === undefined) return
        const count = job.count
        queueMicrotask(() =>
          worker.onmessage?.(
            new MessageEvent('message', {
              data: {
                type: 'complete',
                jobId: job.jobId,
                coordinates: new Float32Array(
                  Array.from({ length: count * 2 }, () => 0),
                ),
                quality: { kind: 'unknown', reason: 'not-measured' },
              },
            }),
          ),
        )
      }),
      terminate: jest.fn(),
    }
    return worker
  },
}))

jest.mock('uiSrc/slices/hooks', () => ({
  useAppSelector: jest.fn(() => ({ id: 'instance-1', cliClientUuid: 'cli-1' })),
  useAppDispatch: jest.fn(() => mockDispatch),
}))

import { useAppSelector } from 'uiSrc/slices/hooks'
import { serializeNativeArgument } from './nativeExecution'
import { setVectorVisualizerSource } from './nativeHandoff'
import { VectorVisualizerPage } from './VectorVisualizerPage'

const float32 = (...values: number[]) =>
  Array.from(new Uint8Array(new Float32Array(values).buffer))
    .map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
    .join('')

const searchInfo = (
  count: number,
  metric: 'COSINE' | 'L2' | 'IP' = 'COSINE',
  metadataFields: Array<[string, 'TEXT' | 'TAG' | 'NUMERIC']> = [],
) => [
  'num_docs',
  count,
  'attributes',
  [
    [
      'identifier',
      'embedding',
      'attribute',
      'embedding',
      'type',
      'VECTOR',
      'data_type',
      'FLOAT32',
      'dim',
      2,
      'distance_metric',
      metric,
      'algorithm',
      'HNSW',
    ],
    ...metadataFields.map(([field, type]) => [
      'identifier',
      field,
      'attribute',
      field,
      'type',
      type,
    ]),
  ],
]

const searchRows = (...rows: Array<[string, string]>) => [
  rows.length,
  ...rows.flatMap(([id, vector]) => [id, ['embedding', vector]]),
]

const searchRowsWithFields = (
  ...rows: Array<[string, string, Record<string, string | number | boolean>]>
) => [
  rows.length,
  ...rows.flatMap(([id, vector, fields]) => [
    id,
    ['embedding', vector, ...Object.entries(fields).flat()],
  ]),
]

const openAdditionalWorkflow = (
  name: 'Query Lab' | 'Health' | 'Compare & Tune' | 'Advanced',
) => {
  fireEvent.click(screen.getByText('Additional evidence workflows'))
  fireEvent.click(screen.getByRole('button', { name }))
}

const getVisibleText = (text: string) =>
  screen
    .getAllByText(text)
    .find((element) => !element.closest('[hidden], details:not([open])'))!

describe('VectorVisualizerPage', () => {
  beforeEach(() => {
    ;(useAppSelector as jest.Mock).mockReturnValue({
      id: 'instance-1',
      cliClientUuid: 'cli-1',
    })
    mockDispatch.mockClear()
    jest.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
  })

  afterEach(() => {
    // Consume any handoff that a test did not mount with.
    render(<VectorVisualizerPage />).unmount()
    jest.restoreAllMocks()
  })

  it('shows an explicit recovery state when the one-shot source has expired', () => {
    render(<VectorVisualizerPage />)

    expect(
      screen.getByTestId('vector-visualizer-source-missing'),
    ).toHaveTextContent('Select Visualize from a Search index or Vector Set')
    expect(
      screen.getAllByRole('heading', { name: 'Vector Visualizer' }),
    ).toHaveLength(1)
  })

  it('preserves the one-shot source when the page is mounted through a lazy route', async () => {
    const LazyVectorVisualizerPage = React.lazy(async () => ({
      default: VectorVisualizerPage,
    }))
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-lazy',
      vectorField: 'embedding',
    })

    render(
      <React.StrictMode>
        <React.Suspense fallback={<div>Loading route</div>}>
          <LazyVectorVisualizerPage />
        </React.Suspense>
      </React.StrictMode>,
    )

    expect(
      await screen.findByTestId('vector-visualizer-native-host'),
    ).toHaveTextContent(
      'Source ready: Search index idx-lazy, vector field embedding.',
    )
  })

  it('initializes the RedisInsight CLI client before enabling sampling', async () => {
    ;(useAppSelector as jest.Mock).mockReturnValue({
      id: 'instance-1',
      cliClientUuid: '',
      loading: false,
    })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-client',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)

    await waitFor(() => expect(mockDispatch).toHaveBeenCalledTimes(1))
    expect(
      screen.getByRole('button', { name: 'Sample vectors' }),
    ).toBeDisabled()
  })

  it('opens Atlas with an explicit bounded sample control and no implicit command', () => {
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-products',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)

    expect(
      screen.getByTestId('vector-visualizer-native-host'),
    ).toHaveTextContent(
      'Source ready: Search index idx-products, vector field embedding.',
    )
    expect(
      screen.getByText('No Redis command is run when this workspace opens.'),
    ).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Atlas' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    expect(screen.getByRole('button', { name: 'Sample vectors' })).toBeEnabled()
    expect(screen.getByLabelText(/Sample budget/)).toHaveValue('2000')
    expect(screen.getByLabelText('Projection')).toHaveTextContent('UMAP')
    expect(screen.getByLabelText('Compare UMAP and PCA')).toBeDisabled()
    const pageContext = screen.getByTestId('vector-visualizer-page-context')
    expect(pageContext).toHaveTextContent('Search index idx-products')
    expect(pageContext).toHaveTextContent('Not sampled')
    expect(
      screen.getByTestId('vector-visualizer-visualization'),
    ).not.toContainElement(pageContext)
    expect(
      screen.queryByText(
        'Atlas is a 2D projection of a bounded sample. Distances in the plot do not replace response-backed source metrics.',
      ),
    ).not.toBeInTheDocument()
    openAdditionalWorkflow('Health')

    expect(screen.getByRole('heading', { name: 'X-ray summary' })).toBeVisible()
    expect(screen.getAllByText('Unknown candidate evidence')).not.toHaveLength(
      0,
    )
  })

  it('samples a Search source only after explicit action and keeps IDs-only selection state without retaining vectors in view state', async () => {
    const vectorBytes = Array.from(
      new Uint8Array(new Float32Array([1, 2]).buffer),
    )
      .map((byte) => `\\x${byte.toString(16).padStart(2, '0')}`)
      .join('')
    let searchCalls = 0
    const post = jest
      .spyOn(apiService, 'post')
      .mockImplementation((_, body) => {
        const command = (body as { command: string }).command
        if (command.startsWith('FT.INFO'))
          return Promise.resolve({
            data: {
              status: 'success',
              response: [
                'num_docs',
                1,
                'attributes',
                [
                  [
                    'identifier',
                    'embedding',
                    'attribute',
                    'embedding',
                    'type',
                    'VECTOR',
                    'data_type',
                    'FLOAT32',
                    'dim',
                    2,
                    'distance_metric',
                    'COSINE',
                    'algorithm',
                    'HNSW',
                  ],
                ],
              ],
            },
          }) as never
        searchCalls += 1
        return Promise.resolve({
          data: {
            status: 'success',
            response:
              searchCalls === 1
                ? [1, 'doc:1', ['embedding', vectorBytes]]
                : [
                    [1, 'doc:neighbor', ['__vv_metric', 0.125]],
                    ['Total profile time', '2.5', 'Vector mode', 'BATCHES'],
                  ],
          },
        }) as never
      })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-products',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)
    expect(post).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )
    expect(
      screen.getByTestId('vector-visualizer-mode-header'),
    ).toContainElement(screen.getByRole('tab', { name: 'Atlas' }))
    expect(
      screen.queryByText('Sample provenance and metadata configuration'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Atlas evidence and accessible point selection'),
    ).not.toBeInTheDocument()
    expect(screen.getAllByText('Method')).not.toHaveLength(0)
    expect(getVisibleText('UMAP')).toBeVisible()
    expect(screen.getAllByText('42')).not.toHaveLength(0)
    expect(post).toHaveBeenCalledTimes(3)
    expect(screen.queryByText(vectorBytes)).not.toBeInTheDocument()

    const resultsInspector = screen.getByTestId(
      'vector-visualizer-results-inspector',
    )
    const visualization = screen.getByTestId('vector-visualizer-visualization')
    expect(visualization).toHaveAttribute('data-selected-count', '0')
    expect(visualization).not.toHaveAttribute('data-selected-id')
    fireEvent.click(
      within(resultsInspector).getByTestId(
        'vector-visualizer-selected-row-doc:1',
      ),
    )
    expect(visualization).toHaveAttribute('data-selected-id', 'doc:1')
    expect(screen.getAllByText('ft-search')).not.toHaveLength(0)

    fireEvent.click(screen.getByRole('tab', { name: 'Neighbors' }))
    expect(post).toHaveBeenCalledTimes(3)
    expect(resultsInspector).toHaveTextContent(
      'Sample or query the selected Search index to view result evidence.',
    )
    expect(within(resultsInspector).queryByRole('grid')).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('button', { name: 'Run selected anchor query' }),
    )
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /Select doc:neighbor/ }),
      ).toBeVisible(),
    )
    expect(
      within(visualization).getByRole('heading', {
        name: 'Neighbors of doc:1',
      }),
    ).toBeVisible()
    expect(
      within(visualization).queryByText('Retrieval debugger'),
    ).not.toBeInTheDocument()
    expect(
      within(visualization).queryByRole('heading', {
        name: 'Returned results',
      }),
    ).not.toBeInTheDocument()
    expect(
      within(visualization).getByLabelText(
        'Query-centered radial neighbor layout',
      ),
    ).toHaveAttribute('data-neighbor-count', '1')
    expect(
      screen.getByRole('button', { name: /Select doc:neighbor/ }),
    ).toHaveAttribute('title', 'Similarity: 0.88 · Raw distance: 0.13')
    expect(post).toHaveBeenCalledTimes(4)
    expect(
      within(resultsInspector).getByRole('heading', {
        name: 'Nearest documents',
      }),
    ).toBeVisible()
    expect(resultsInspector).toHaveTextContent(
      'Bounded read-only FT.SEARCH response',
    )
    expect(
      within(resultsInspector).getByRole('gridcell', {
        name: 'Score/distance 0.13',
      }),
    ).toBeInTheDocument()

    fireEvent.click(
      within(resultsInspector).getByTestId(
        'vector-visualizer-selected-row-doc:neighbor',
      ),
    )

    await waitFor(() =>
      expect(
        screen.getByTestId('vector-visualizer-visualization'),
      ).toHaveAttribute('data-selected-id', 'doc:neighbor'),
    )
    expect(
      within(visualization).getByRole('heading', {
        name: 'Neighbors of doc:1',
      }),
    ).toBeVisible()
    expect(
      within(resultsInspector).getByTestId(
        'vector-visualizer-selected-row-doc:neighbor',
      ),
    ).toHaveAttribute('data-selected', 'true')
    expect(
      within(
        within(resultsInspector).getByLabelText('Selected record inspector'),
      ).getByTitle('doc:neighbor'),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('tab', { name: 'Atlas' }))
    fireEvent.click(
      within(resultsInspector).getByTestId(
        'vector-visualizer-selected-row-doc:1',
      ),
    )

    openAdditionalWorkflow('Health')
    await waitFor(() =>
      expect(getVisibleText('Algorithm / quantization')).toBeVisible(),
    )
    expect(screen.getByText('Indexed count')).toBeVisible()
    expect(screen.getByText('Duplicate candidate rate')).toBeVisible()
    expect(screen.getByText('Outlier candidate rate')).toBeVisible()
    expect(screen.getByText('Metadata coverage')).toBeVisible()
    expect(screen.getByText('Query score distribution')).toBeVisible()
    expect(
      screen.getByLabelText('Health selected record inspector'),
    ).toHaveTextContent('doc:1')

    openAdditionalWorkflow('Compare & Tune')
    fireEvent.click(
      screen.getByRole('button', { name: 'Save local sample manifest' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Save local sample manifest' }),
    )
    expect(screen.getByText('Compatible manifests')).toBeVisible()
    expect(screen.getByText(/^vector norm:/)).toHaveTextContent('(sampled)')
    expect(screen.getByText(/^neighbor overlap:/)).toHaveTextContent(
      '(sampled)',
    )
    expect(screen.getByText(/^source configuration:/)).toHaveTextContent(
      '(measured)',
    )
    const tunePanel = screen.getByLabelText('Tune')
    expect(tunePanel).toHaveTextContent('M16')
    expect(tunePanel).toHaveTextContent('EF_CONSTRUCTION200')
    expect(tunePanel).toHaveTextContent('EF_RUNTIME10')
    expect(tunePanel).toHaveTextContent('EPSILON0.01')
    expect(within(tunePanel).queryByText('undefined')).not.toBeInTheDocument()

    openAdditionalWorkflow('Advanced')
    expect(screen.getByText('Measured Search execution evidence')).toBeVisible()
    expect(
      screen.queryByText(
        'Unavailable: Redis did not return a measurable FT.PROFILE response.',
      ),
    ).not.toBeInTheDocument()
    expect(screen.getByText('2.5')).toBeVisible()
    expect(screen.getByText('BATCHES')).toBeVisible()
  })

  it('exports backing Redis HASH documents instead of chart result rows', async () => {
    const blobParts: BlobPart[][] = []
    const originalBlob = global.Blob
    const originalCreateElement = document.createElement.bind(document)
    const originalCreateObjectUrl = URL.createObjectURL
    const originalRevokeObjectUrl = URL.revokeObjectURL
    const click = jest.fn()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: jest.fn(() => 'blob:vector-documents'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    })
    global.Blob = jest.fn((parts?: BlobPart[], options?: BlobPropertyBag) => {
      blobParts.push(parts ?? [])
      return new originalBlob(parts, options)
    }) as never
    jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      const element = originalCreateElement(tagName)
      if (String(tagName) === 'a')
        Object.defineProperty(element, 'click', {
          configurable: true,
          value: click,
        })
      return element
    })
    const vectorBytes = float32(1, 2)
    const commands: string[] = []
    jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
      const command = (body as { command: string }).command
      commands.push(command)
      const response = command.startsWith('FT.INFO')
        ? searchInfo(1, 'COSINE', [['brand', 'TAG']])
        : command.startsWith('FT.SEARCH')
          ? searchRowsWithFields([
              'bikes:10088',
              vectorBytes,
              { brand: 'Nord' },
            ])
          : command.startsWith('HGETALL')
            ? [
                'model',
                'Ncc1702',
                'brand',
                'Nord',
                'price',
                '3599',
                'description_embeddings',
                vectorBytes,
              ]
            : []
      return Promise.resolve({
        data: { status: 'success', response },
      }) as never
    })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx:bikes_vss',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Export visible documents' }),
    )

    await waitFor(() =>
      expect(commands.some((command) => command.startsWith('HGETALL'))).toBe(
        true,
      ),
    )
    await waitFor(() => expect(blobParts).toHaveLength(1))
    const payload = JSON.parse(String(blobParts[0][0]))
    expect(payload).toEqual([
      {
        id: 'bikes:10088',
        source: {
          kind: 'search-index',
          index: 'idx:bikes_vss',
          storage: 'hash',
        },
        document: {
          model: 'Ncc1702',
          brand: 'Nord',
          price: '3599',
          description_embeddings: vectorBytes,
        },
      },
    ])
    expect(JSON.stringify(payload)).not.toContain('"metric"')
    expect(JSON.stringify(payload)).not.toContain('"plotted"')
    expect(click).toHaveBeenCalledTimes(1)
    global.Blob = originalBlob
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectUrl,
    })
  })

  it('renders k sensitivity maps from the retained sampled Search vectors', async () => {
    const rows = Array.from({ length: 6 }, (_, index) => [
      `doc:${index + 1}`,
      float32(index + 1, index + 2),
    ]) as Array<[string, string]>
    jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
      const command = (body as { command: string }).command
      const response = command.startsWith('FT.INFO')
        ? searchInfo(rows.length)
        : command.startsWith('FT.SEARCH')
          ? searchRows(...rows)
          : []
      return Promise.resolve({
        data: { status: 'success', response },
      }) as never
    })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-products',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )

    openAdditionalWorkflow('Compare & Tune')
    fireEvent.click(
      screen.getByRole('button', { name: 'Run k sensitivity maps' }),
    )

    await waitFor(() =>
      expect(screen.getByLabelText('MiniAtlas K=5')).toBeVisible(),
    )
    expect(
      screen.queryByText('No sensitivity runs are available.'),
    ).not.toBeInTheDocument()
    expect(screen.getByLabelText('MiniAtlas K=15')).toBeVisible()
    expect(screen.getByLabelText('MiniAtlas K=30')).toBeVisible()
  })

  it('preserves a binary Vector Set member through VEMB and documented VLINKS layers', async () => {
    const member = 'member\\x00\\xff'
    const target = 'target\\x00\\xfe'
    const encodedTruth = '"\\x54\\x52\\x55\\x54\\x48"'
    const commands: string[] = []
    jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
      const command = (body as { command: string }).command
      commands.push(command)
      const response = command.startsWith('VCARD')
        ? 1
        : command.startsWith('VDIM')
          ? 2
          : command.startsWith('VINFO')
            ? ['quant-type', 'int8', 'vector-dim', 2, 'max-level', 3]
            : command.startsWith('VRANGE')
              ? [member]
              : command.startsWith('VEMB')
                ? [1, 0]
                : command.startsWith('VGETATTR')
                  ? '{"category":"Documentation","published":true}'
                  : command.startsWith('VSIM')
                    ? command.endsWith(encodedTruth)
                      ? [member, 1]
                      : [member, 0.99]
                    : command.startsWith('VLINKS')
                      ? [[target]]
                      : []
      return Promise.resolve({
        data: { status: 'success', response },
      }) as never
    })
    setVectorVisualizerSource({
      kind: 'vector-set',
      key: new Uint8Array([0, 255]),
    })

    render(<VectorVisualizerPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )
    expect(screen.getByText('Color by')).toBeVisible()
    expect(
      screen.getByRole('combobox', { name: 'Color by' }),
    ).toHaveTextContent('category')
    expect(
      within(screen.getByRole('tabpanel', { name: 'Atlas' })).getByLabelText(
        /Atlas plot/,
      ),
    ).toHaveAttribute('data-colored-point-count', '1')
    expect(
      screen.queryByText('Sample provenance and metadata configuration'),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText('Atlas evidence and accessible point selection'),
    ).not.toBeInTheDocument()
    fireEvent.click(
      within(
        screen.getByTestId('vector-visualizer-results-inspector'),
      ).getByTestId(`vector-visualizer-selected-row-${member}`),
    )
    openAdditionalWorkflow('Compare & Tune')
    fireEvent.click(
      screen.getByRole('button', { name: 'Save local sample manifest' }),
    )
    fireEvent.click(
      screen.getByRole('button', { name: 'Save local sample manifest' }),
    )
    expect(screen.getByText('Compatible manifests')).toBeVisible()
    expect(commands.some((command) => command.startsWith('VSIM'))).toBe(false)
    fireEvent.click(
      screen.getByRole('button', { name: 'Preview truth benchmark' }),
    )
    expect(screen.getByText(/VSIM,\s*TRUTH/)).toBeVisible()
    expect(commands.some((command) => command.startsWith('VSIM'))).toBe(false)
    fireEvent.click(
      screen.getByRole('button', { name: 'Confirm read-only benchmark' }),
    )
    await waitFor(() => expect(screen.getByText(/Measured run:/)).toBeVisible())
    expect(
      commands.filter((command) => command.startsWith('VSIM')),
    ).toHaveLength(2)
    expect(commands.some((command) => command.endsWith(encodedTruth))).toBe(
      true,
    )
    openAdditionalWorkflow('Advanced')
    fireEvent.click(
      screen.getByRole('button', { name: 'Load selected VLINKS topology' }),
    )

    await waitFor(() => expect(screen.getByText(target)).toBeVisible())
    expect(
      screen.getByText(
        'HNSW layer adjacency, not semantic nearest-neighbor truth.',
      ),
    ).toBeVisible()
    expect(screen.getByText('Layer 0')).toBeVisible()
  })

  it('applies Color by changes immediately and explains DBSCAN clusters with sampled metadata', async () => {
    const user = userEvent.setup()
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })
    const rows = Array.from(
      { length: 13 },
      (_, index) =>
        [
          `doc:${index + 1}`,
          float32(index + 1, index + 2),
          {
            brand: `brand-${index + 1}`,
            ...(index < 2 ? { type: 'bike' } : {}),
          },
        ] as [string, string, Record<string, string>],
    )
    const commands: string[] = []
    const post = jest
      .spyOn(apiService, 'post')
      .mockImplementation((_, body) => {
        const command = (body as { command: string }).command
        commands.push(command)
        return Promise.resolve({
          data: {
            status: 'success',
            response: command.startsWith('FT.INFO')
              ? searchInfo(13, 'COSINE', [
                  ['brand', 'TAG'],
                  ['type', 'TAG'],
                ])
              : searchRowsWithFields(...rows),
          },
        }) as never
      })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-metadata',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)
    fireEvent.change(screen.getByLabelText('Filter sampled documents'), {
      target: { value: '@brand:brand-1' },
    })
    await waitFor(() =>
      expect(screen.getByLabelText('Filter sampled documents')).toHaveValue(
        '@brand:brand-1',
      ),
    )
    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))

    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )
    const atlasPanel = within(screen.getByRole('tabpanel', { name: 'Atlas' }))
    const atlasPlot = atlasPanel.getByLabelText(/Atlas plot/)
    expect(atlasPlot).toHaveAttribute('data-colored-point-count', '13')
    expect(
      commands.some((command) =>
        command.includes(serializeNativeArgument('@brand:brand-1')),
      ),
    ).toBe(true)
    expect(screen.getByText('@brand:brand-1')).toBeVisible()
    await user.click(screen.getByLabelText('Color by'))
    await user.click(screen.getByText('type'))
    expect(atlasPlot).toHaveAttribute('data-colored-point-count', '2')
    await user.click(screen.getByLabelText('Color by'))
    await user.click(screen.getByText(/Clusters \(DBSCAN\)/))
    expect(atlasPlot).toHaveAttribute('data-colored-point-count', '13')
    expect(
      screen.getByRole('button', { name: /Cluster \d+ · brand-/ }),
    ).toBeVisible()
    fireEvent.click(screen.getByTestId('vector-visualizer-selected-row-doc:1'))
    fireEvent.click(screen.getByRole('button', { name: 'Copy query template' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledTimes(1))
    const copiedQuery = writeText.mock.calls[0][0] as string
    expect(copiedQuery).toContain(
      'RedisInsight Vector Visualizer query template',
    )
    expect(copiedQuery).toContain('Anchor document: doc:1')
    expect(copiedQuery).toContain('Anchor vector field: embedding')
    expect(copiedQuery).toContain('Workbench cannot paste')
    expect(copiedQuery).toContain('KNN 11')
    expect(copiedQuery).not.toContain('KNN 50')
    expect(copiedQuery).toContain('<raw-binary-vector-blob>')
    expect(copiedQuery).not.toContain('"<raw-binary-vector-blob>"')
    expect(copiedQuery).not.toContain('\\x')
    fireEvent.change(screen.getByLabelText('Filter sampled documents'), {
      target: { value: '@type:bike' },
    })
    expect(screen.getByText('@type:bike · resample to apply')).toBeVisible()
    expect(post).toHaveBeenCalledTimes(3)
  })

  it('opens duplicate and outlier candidates in the shared Health inspector with their bounded rule', async () => {
    const rows = Array.from(
      { length: 12 },
      (_, index) =>
        [`doc:${index + 1}`, float32(index + 1, 1)] as [string, string],
    )
    jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
      const command = (body as { command: string }).command
      return Promise.resolve({
        data: {
          status: 'success',
          response: command.startsWith('FT.INFO')
            ? searchInfo(12)
            : searchRows(...rows),
        },
      }) as never
    })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-health',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )
    openAdditionalWorkflow('Health')
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Inspect duplicate candidate group 1',
        }),
      ).toBeVisible(),
    )
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Inspect duplicate candidate group 1',
      }),
    )
    expect(screen.queryByLabelText('Selected IDs')).not.toBeInTheDocument()
    expect(screen.getByText('2 selected')).toBeInTheDocument()
    expect(
      screen.getAllByTestId('vector-visualizer-selected-row-doc:1')[0],
    ).toHaveAttribute('data-selected', 'true')
    expect(
      screen.getAllByLabelText('Health candidate rule')[0],
    ).toHaveTextContent(
      'connected components over original-space cosine similarity',
    )

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Inspect outlier candidate doc:12',
      }),
    )
    expect(screen.queryByLabelText('Selected IDs')).not.toBeInTheDocument()
    expect(screen.getByText('1 selected')).toBeInTheDocument()
    expect(
      screen.getAllByTestId('vector-visualizer-selected-row-doc:12')[0],
    ).toHaveAttribute('data-selected', 'true')
    expect(screen.getByLabelText('Health candidate rule')).toHaveTextContent(
      'median/MAD over kth-neighbor cosine distances; k=10; exactness sample-exact',
    )
  })

  it('renders Aggregate and Hybrid results without an empty neighbor evidence shell', async () => {
    const rows = [
      ['doc:1', float32(1, 2), { brand: 'Nord' }],
      ['doc:2', float32(2, 3), { brand: 'Redis' }],
    ] as Array<[string, string, Record<string, string>]>
    const commands: string[] = []
    jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
      const command = (body as { command: string }).command
      commands.push(command)
      let response: unknown
      if (command.startsWith('FT.INFO')) {
        response = searchInfo(2, 'COSINE', [['brand', 'TAG']])
      } else if (command.startsWith('FT.SEARCH')) {
        response = searchRowsWithFields(...rows)
      } else if (command.includes(serializeNativeArgument('AGGREGATE'))) {
        response = [
          [
            1,
            [
              'brand',
              'Nord',
              'count',
              2,
              'best_distance',
              0.05,
              'avg_distance',
              0.1,
              'worst_distance',
              0.16,
            ],
          ],
          ['Total profile time', '1.4'],
        ]
      } else if (command.includes(serializeNativeArgument('HYBRID'))) {
        response = [
          'total_results',
          1,
          'results',
          [
            [
              '__key',
              'doc:1',
              'text_score',
              '0.9',
              'vector_score',
              '0.8',
              '__combined_score',
              '0.95',
            ],
          ],
          'warnings',
          [],
          'execution_time',
          '1.1',
          ['Total profile time', '1.1'],
        ]
      } else {
        response = []
      }
      return Promise.resolve({
        data: { status: 'success', response },
      }) as never
    })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-query-modes',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )
    fireEvent.click(
      within(
        screen.getByTestId('vector-visualizer-results-inspector'),
      ).getByTestId('vector-visualizer-selected-row-doc:1'),
    )
    openAdditionalWorkflow('Query Lab')

    fireEvent.click(screen.getByRole('button', { name: 'Aggregate' }))
    fireEvent.change(screen.getByPlaceholderText('category'), {
      target: { value: 'brand' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Run selected anchor query' }),
    )

    await waitFor(() =>
      expect(screen.getByLabelText('Aggregate result groups')).toBeVisible(),
    )
    expect(screen.getByLabelText('Aggregate result groups')).toHaveTextContent(
      'brand: Nord',
    )
    expect(screen.getByLabelText('Aggregate result groups')).toHaveTextContent(
      '2 returned docs',
    )
    expect(screen.getByLabelText('Aggregate result groups')).toHaveTextContent(
      'Best similarity: 0.95',
    )
    expect(screen.getByLabelText('Aggregate result groups')).toHaveTextContent(
      'Average similarity: 0.9',
    )
    expect(screen.getByLabelText('Aggregate result groups')).toHaveTextContent(
      'Worst similarity: 0.84',
    )
    expect(screen.getByLabelText('Aggregate result groups')).toHaveTextContent(
      'grouped within returned top-k query results',
    )
    expect(
      screen.getByLabelText('Aggregate result groups'),
    ).not.toHaveTextContent('max_value')
    expect(
      screen.queryByRole('heading', { name: 'Neighbors' }),
    ).not.toBeInTheDocument()
    expect(commands.some((command) => command.startsWith('FT.PROFILE'))).toBe(
      true,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Hybrid' }))
    fireEvent.change(screen.getByPlaceholderText('*'), {
      target: { value: 'Nord' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: 'Run selected anchor query' }),
    )

    await waitFor(() =>
      expect(screen.getByTestId('hybrid-score-chart')).toBeInTheDocument(),
    )
    expect(
      screen.queryByRole('heading', { name: 'Neighbors' }),
    ).not.toBeInTheDocument()
    expect(commands.some((command) => command.startsWith('FT.PROFILE'))).toBe(
      true,
    )
  })

  it('keeps native Neighbors focused and passes bounded response evidence to the optional Query Lab', async () => {
    const rows = Array.from(
      { length: 12 },
      (_, index) =>
        [`doc:${index + 1}`, float32(index + 1, 1)] as [string, string],
    )
    let searchCalls = 0
    const commands: string[] = []
    jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
      const command = (body as { command: string }).command
      commands.push(command)
      if (command.startsWith('FT.INFO'))
        return Promise.resolve({
          data: { status: 'success', response: searchInfo(12) },
        }) as never
      searchCalls += 1
      return Promise.resolve({
        data: {
          status: 'success',
          response:
            searchCalls === 1
              ? searchRows(...rows)
              : [
                  2,
                  'doc:2',
                  ['__vv_metric', 0.1],
                  'doc:3',
                  ['__vv_metric', 0.2],
                ],
        },
      }) as never
    })
    setVectorVisualizerSource({
      kind: 'search-index',
      index: 'idx-query-source',
      vectorField: 'embedding',
    })

    render(<VectorVisualizerPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))
    await waitFor(() =>
      expect(
        screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
      ).toBeVisible(),
    )
    fireEvent.click(
      within(
        screen.getByTestId('vector-visualizer-results-inspector'),
      ).getByTestId('vector-visualizer-selected-row-doc:1'),
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Neighbors' }))
    fireEvent.click(
      screen.getByRole('button', { name: 'Run selected anchor query' }),
    )

    await waitFor(() =>
      expect(screen.getAllByLabelText(/metric threshold ring/)).toHaveLength(3),
    )
    expect(
      screen.getByLabelText('Query-centered radial neighbor layout'),
    ).toHaveAttribute('data-neighbor-count', '2')
    expect(
      commands.some((command) =>
        command.includes(
          serializeNativeArgument(
            '*=>[KNN 11 @embedding $vv_anchor AS __vv_metric]',
          ),
        ),
      ),
    ).toBe(true)
    fireEvent.keyDown(screen.getByLabelText('Neighbor limit'), {
      key: 'ArrowRight',
    })
    fireEvent.keyDown(screen.getByLabelText('Neighbor limit'), {
      key: 'ArrowRight',
    })
    await waitFor(() =>
      expect(
        commands.some((command) =>
          command.includes(
            serializeNativeArgument(
              '*=>[KNN 21 @embedding $vv_anchor AS __vv_metric]',
            ),
          ),
        ),
      ).toBe(true),
    )
    expect(
      screen.getByLabelText('Query-centered radial neighbor layout'),
    ).toHaveAttribute('data-result-boundary', '20')
    expect(commands.some((command) => command.includes('KNN 50'))).toBe(false)
    expect(
      screen.queryByRole('heading', { name: 'Retrieval debugger' }),
    ).not.toBeInTheDocument()

    openAdditionalWorkflow('Query Lab')
    expect(screen.getByText(/Bounded source sample: 12 values/)).toBeVisible()
    expect(
      screen.getByText(/locally derived from bounded Redis response vectors/),
    ).toBeVisible()
    expect(screen.getByText('Threshold: Unavailable')).toBeVisible()
  })

  it.each([
    ['L2', 'L2 distance ≤ 0.05'],
    ['IP', 'inner product ≥ 0.995'],
  ] as const)(
    'shows named bounded original-space Health evidence for Search %s',
    async (metric, expectedRule) => {
      const rows = Array.from(
        { length: 12 },
        (_, index) =>
          [`doc:${index + 1}`, float32(index + 1, 1)] as [string, string],
      )
      jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
        const command = (body as { command: string }).command
        return Promise.resolve({
          data: {
            status: 'success',
            response: command.startsWith('FT.INFO')
              ? searchInfo(12, metric)
              : searchRows(...rows),
          },
        }) as never
      })
      setVectorVisualizerSource({
        kind: 'search-index',
        index: `idx-health-${metric.toLowerCase()}`,
        vectorField: 'embedding',
      })

      render(<VectorVisualizerPage />)
      fireEvent.click(screen.getByRole('button', { name: 'Sample vectors' }))
      await waitFor(() =>
        expect(
          screen.getByRole('heading', { name: /^(Index|Vector set) atlas$/ }),
        ).toBeVisible(),
      )
      openAdditionalWorkflow('Health')

      await waitFor(() =>
        expect(screen.getByText(new RegExp(expectedRule))).toBeVisible(),
      )
      expect(
        screen.queryByText('Unknown candidate evidence'),
      ).not.toBeInTheDocument()
    },
  )
})
