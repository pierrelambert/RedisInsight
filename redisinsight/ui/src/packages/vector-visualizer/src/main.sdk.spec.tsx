import { act } from '@testing-library/react'

jest.mock('./workbenchSdk', () => ({
  getWorkbenchHost: jest.fn(() => ({
    followUp: { cancel: jest.fn(), run: jest.fn() },
    loadState: jest.fn(),
    saveState: jest.fn(),
  })),
}))

import { renderVectorVisualizer } from './main'
import { getWorkbenchHost } from './workbenchSdk'

describe('Workbench SDK activation boundary', () => {
  it('obtains the SDK host during activation without issuing a Redis command', () => {
    jest.spyOn(console, 'info').mockImplementation()
    document.body.innerHTML = '<div id="app"></div>'
    document.body.className = 'theme_LIGHT'

    act(() => renderVectorVisualizer({ command: 'GET key', data: [] }))

    expect(getWorkbenchHost).toHaveBeenCalledTimes(1)
    jest.restoreAllMocks()
  })
})
