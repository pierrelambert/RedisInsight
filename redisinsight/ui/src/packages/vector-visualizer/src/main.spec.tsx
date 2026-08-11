import { act } from '@testing-library/react'

import { renderVectorVisualizer } from './main'

const renderPlugin = (props: Parameters<typeof renderVectorVisualizer>[0]) =>
  act(() => renderVectorVisualizer(props))

describe('renderVectorVisualizer', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>'
    document.body.className = 'theme_LIGHT'
    jest.spyOn(console, 'info').mockImplementation()
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('renders a safe result shape without command parameter payloads', () => {
    renderPlugin({
      command:
        'FT.SEARCH idx "*=>[KNN 10 @embedding $query_vector]" PARAMS 2 query_vector secret-vector',
      data: [{ status: 'success', response: ['private-vector'] }],
    })

    expect(document.body.textContent).toContain('Vector visualizer')
    expect(document.body.textContent).toContain('Workbench visualization')
    expect(document.body.textContent).toContain('PARAMS [redacted]')
    expect(document.body.textContent).not.toContain('secret-vector')
    expect(document.body.textContent).not.toContain('private-vector')
    expect(console.error).not.toHaveBeenCalled()
  })

  it('renders empty, failed, and unsupported states instead of a blank iframe', () => {
    renderPlugin({
      command: 'VSIM vectors VALUES 1 query_vector',
      data: [],
    })
    expect(document.body.textContent).toContain('without rows to visualize')

    renderPlugin({
      command: 'VSIM vectors VALUES 1 query_vector',
      data: [{ status: 'fail' }],
    })
    expect(document.body.textContent).toContain('The command failed')

    renderPlugin({ command: 'GET value', data: [] })
    expect(document.body.textContent).toContain('not supported')
  })

  it('keeps non-ready Workbench outcomes in the compact Query Lab frame', () => {
    renderPlugin({
      command: 'VSIM vectors VALUES 1 query_vector',
      data: [{ status: 'fail' }],
    })

    expect(
      document.querySelector('[data-testid="workbench-query-lab"]'),
    ).toBeTruthy()
    expect(document.body.textContent).toContain('Response unavailable')
    expect(document.body.textContent).toContain('Workbench result status')
  })

  it('binds a successful vector result to the shared Query Lab without rendering raw PARAMS', () => {
    renderPlugin({
      command:
        'FT.SEARCH idx:docs "*=>[KNN 1 @embedding $q AS score]" PARAMS 2 q raw-vector',
      data: [{ status: 'success', response: [1, 'doc:1', ['score', '0.2']] }],
    })

    expect(document.body.textContent).toContain('Retrieval debugger')
    expect(document.querySelector('[aria-label="Select doc:1"]')).toBeTruthy()
    expect(document.body.textContent).not.toContain('raw-vector')
    expect(document.body.textContent).toContain(
      'Atlas is unavailable in Workbench',
    )
    expect(document.body.textContent).toContain('Exactness unavailable')
  })

  it('renders ordinary VSIM with adapter-backed approximate exactness', () => {
    renderPlugin({
      command: 'VSIM vectors VALUES 2 0.1 0.2 COUNT 1',
      data: [{ status: 'success', response: ['member:1', '0.9'] }],
    })

    expect(document.body.textContent).toContain('Approximate result')
  })
})
