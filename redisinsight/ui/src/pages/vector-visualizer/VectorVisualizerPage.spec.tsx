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
    expect(screen.queryByText('Projection')).not.toBeInTheDocument()
    const pageContext = screen.getByTestId('vector-visualizer-page-context')
    expect(pageContext).toHaveTextContent('Search index idx-products')
    expect(pageContext).toHaveTextContent('Not sampled')
    expect(
      screen.getByTestId('vector-visualizer-visualization'),
    ).not.toContainElement(pageContext)
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
                : [1, 'doc:neighbor', ['__vv_metric', 0.125]],
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
    expect(screen.getByText(/VSIM TRUTH/)).toBeVisible()
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

  it('applies Color by changes immediately and lets users show more than twelve labels', async () => {
    const user = userEvent.setup()
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
    expect(atlasPanel.getAllByLabelText(/cluster label$/)).toHaveLength(12)

    await user.click(screen.getByLabelText('Cluster label limit'))
    await user.click(screen.getByText('All visible'))
    expect(atlasPanel.getAllByLabelText(/cluster label$/)).toHaveLength(13)

    await user.click(screen.getByLabelText('Color by'))
    await user.click(screen.getByText('type'))
    expect(atlasPlot).toHaveAttribute('data-colored-point-count', '2')
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
    expect(screen.getAllByLabelText('Selected IDs')[0]).toHaveTextContent(
      'doc:1, doc:2',
    )
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
    expect(screen.getAllByLabelText('Selected IDs')[0]).toHaveTextContent(
      'doc:12',
    )
    expect(screen.getByLabelText('Health candidate rule')).toHaveTextContent(
      'median/MAD over kth-neighbor cosine distances; k=10; exactness sample-exact',
    )
  })

  it('keeps native Neighbors focused and passes bounded response evidence to the optional Query Lab', async () => {
    const rows = Array.from(
      { length: 12 },
      (_, index) =>
        [`doc:${index + 1}`, float32(index + 1, 1)] as [string, string],
    )
    let searchCalls = 0
    jest.spyOn(apiService, 'post').mockImplementation((_, body) => {
      const command = (body as { command: string }).command
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
