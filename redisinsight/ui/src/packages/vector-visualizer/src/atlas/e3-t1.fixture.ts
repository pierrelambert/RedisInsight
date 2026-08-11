import { createSampleSnapshot } from '../sampling/sampling'
import { AtlasRenderer } from '../renderer/AtlasRenderer'
import { createBrowserLayoutWorker } from '../worker/browserWorker'
import { LayoutWorkerClient } from '../worker/layout'
import { atlasProvenanceRows } from './provenance'

const canvas = document.querySelector<HTMLCanvasElement>('#atlas')!
const count = document.querySelector<HTMLParagraphElement>('#count')!
const status = document.querySelector<HTMLParagraphElement>('#status')!
const selected = document.querySelector<HTMLButtonElement>('#selected')!
const provenance = document.querySelector<HTMLDListElement>('#provenance')!
const timings: Record<string, number | string> = {
  browser: navigator.userAgent,
  sampling: 'not-run: fixture has no Redis source',
}
const fixturePalette = {
  default: '#163341',
  selected: '#006e9b',
  liveNeighbor: '#3a8365',
  outlier: '#a06c18',
  duplicate: '#d90b78',
  hovered: '#40a5cd',
  pointSize: 12,
}

const renderer = new AtlasRenderer(canvas, {
  onSelect: (ids) => {
    selected.textContent = ids.length
      ? `Selected plotted record ${ids[0]}`
      : 'No plotted record selected'
  },
  onHover: (id) => {
    selected.title = id ? `Hovering plotted record ${id}` : ''
  },
  onUnsupported: () => {
    status.textContent =
      'WebGL2 is unavailable; use the linked selection table.'
  },
  onContextLost: () => {
    status.textContent = 'The WebGL2 context was lost.'
  },
  onContextRestored: () => {
    status.textContent = 'The WebGL2 context was restored.'
  },
})

renderer.resize(960, 520, window.devicePixelRatio)

const render = (size: number) => {
  const started = performance.now()
  const ids = Array.from({ length: size }, (_, index) => `sample-${index}`)
  const coordinates = Float32Array.from(
    ids.flatMap((_, index) => [
      Math.sin(index) + index / size,
      Math.cos(index),
    ]),
  )
  renderer.setPoints(coordinates, ids, fixturePalette)
  timings.firstRenderMs = performance.now() - started
  timings.rawRenderPointCount = size
  count.textContent = `${size} plotted records`
}

atlasProvenanceRows({
  sourceCount: 20_000,
  sampleCount: 0,
  method: 'UMAP',
  seed: 7,
  freshness: 'fresh',
  exactness: 'approximate',
  quality: { kind: 'unknown', reason: 'not-measured' },
}).forEach(([label, value]) => {
  const term = document.createElement('dt')
  term.textContent = label
  const detail = document.createElement('dd')
  detail.textContent = value
  provenance.append(term, detail)
})

document.querySelector<HTMLButtonElement>('#load-large')!.onclick = () =>
  render(20_000)
document.querySelector<HTMLButtonElement>('#load-empty')!.onclick = () =>
  render(0)
document.querySelector<HTMLButtonElement>('#malformed')!.onclick = () => {
  try {
    renderer.setPoints(
      new Float32Array([0, 0, 1]),
      ['sample-0'],
      fixturePalette,
    )
  } catch {
    status.textContent = 'Malformed layout was rejected.'
  }
}
document.querySelector<HTMLButtonElement>('#select')!.onclick = () => {
  selected.textContent = 'Selected plotted record sample-0'
}
document.querySelector<HTMLButtonElement>('#context-loss')!.onclick = () => {
  canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }))
}
document.querySelector<HTMLButtonElement>('#cancel')!.onclick = () => {
  const sample = createSampleSnapshot({
    ids: ['sample-0', 'sample-1'],
    sourceCount: 2,
    vectors: new Float32Array([1, 0, 0, 1]),
  })
  const client = new LayoutWorkerClient(createBrowserLayoutWorker)
  const layout = client.start({
    version: 1,
    jobId: 'fixture-cancel',
    algorithm: 'umap',
    metric: 'cosine',
    count: 2,
    dimensions: 2,
    vectors: sample.takeVectors(),
    seed: 7,
    parameters: { nNeighbors: 1 },
  })
  sample.invalidate()
  client.cancel()
  void layout.catch(() => {
    status.textContent = 'Cancelled; raw vectors were invalidated in memory.'
  })
}

const runProjection = async (size: number) => {
  const preparedAt = performance.now()
  const sample = createSampleSnapshot({
    ids: Array.from({ length: size }, (_, index) => `sample-${index}`),
    sourceCount: size,
    vectors: Float32Array.from({ length: size * 2 }, (_, index) =>
      index % 2 ? Math.cos(index / 2) : Math.sin(index / 2),
    ),
  })
  timings[`fixtureVectorPreparation${size}Ms`] = performance.now() - preparedAt
  timings[`layoutPointCount${size}`] = size
  const client = new LayoutWorkerClient(createBrowserLayoutWorker)
  const postedAt = performance.now()
  status.textContent = `Running ${size.toLocaleString()} UMAP layout.`
  try {
    const result = await client.start({
      version: 1,
      jobId: `fixture-${size}`,
      algorithm: 'umap',
      metric: 'cosine',
      count: size,
      dimensions: 2,
      vectors: sample.takeVectors(),
      seed: 7,
      parameters: { nNeighbors: 15 },
    })
    sample.invalidate()
    if (result.type !== 'complete') throw new Error(result.type)
    const receivedAt = performance.now()
    const renderAt = performance.now()
    renderer.setPoints(result.coordinates, sample.ids, fixturePalette)
    timings[`layout${size}Ms`] = result.timing?.layoutMs ?? 'unknown'
    timings[`transfer${size}Ms`] =
      receivedAt - postedAt - (result.timing?.layoutMs ?? 0)
    timings[`firstRender${size}Ms`] = performance.now() - renderAt
    status.textContent = `${size.toLocaleString()} UMAP layout completed.`
  } catch (error) {
    sample.invalidate()
    status.textContent = `${size.toLocaleString()} UMAP layout failed: ${
      error instanceof Error ? error.message : 'unknown'
    }`
  } finally {
    client.dispose()
  }
}

document.querySelector<HTMLButtonElement>('#run-2k')!.onclick = () =>
  void runProjection(2_000)
document.querySelector<HTMLButtonElement>('#run-20k')!.onclick = () =>
  void runProjection(20_000)

window.addEventListener('beforeunload', () => renderer.destroy())
Object.assign(window, { __E3_T1_TIMINGS__: timings })
render(1)
