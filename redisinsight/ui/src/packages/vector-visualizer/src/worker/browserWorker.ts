import type { WorkerLike } from './layout'

/** Vite resolves this module URL into the dedicated Worker asset. */
export const createBrowserLayoutWorker = (): WorkerLike =>
  // @ts-ignore -- Vite transforms import.meta.url for the dedicated Worker asset.
  new Worker(new URL('./layout.worker.ts', import.meta.url), { type: 'module' })
