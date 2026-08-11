import '@testing-library/jest-dom'

// RedisInsight's icon/theme dependency graph reaches the ESM-only rawproto
// formatter, which is outside this package's UI contract.
jest.mock('rawproto', () => ({
  getData: jest.fn(),
  getProto: jest.fn(),
}))

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}))
