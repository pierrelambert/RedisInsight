const remoteFontImport =
  /@import\s*(?:url\(\s*["']?https:\/\/fonts\.(?:googleapis|gstatic)\.com[^)]*\)|["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'])\s*;/gi

/** Distribution assets must not cause third-party font requests. */
export const stripRemoteFontImports = (css: string) =>
  css.replace(remoteFontImport, '').trim()

export const sanitizeVectorVisualizerCssAsset = (
  fileName: string,
  source: string | Uint8Array,
) =>
  fileName === 'vector-visualizer/dist/styles.css' && typeof source === 'string'
    ? stripRemoteFontImports(source)
    : source
