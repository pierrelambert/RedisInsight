import { stripRemoteFontImports } from './distribution'

describe('vector visualizer distribution privacy', () => {
  it('removes remote font imports while retaining local CSS', () => {
    const css = [
      '@import url("https://fonts.googleapis.com/css2?family=Geist");',
      '@import "https://fonts.gstatic.com/s/font.css";',
      '.vector-visualizer { color: currentColor; }',
    ].join('\n')

    expect(stripRemoteFontImports(css)).toBe(
      '.vector-visualizer { color: currentColor; }',
    )
  })
})
