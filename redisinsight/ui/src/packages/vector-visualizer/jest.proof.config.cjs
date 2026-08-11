const rootConfig = require('../../../../../jest.config.cjs');
const path = require('path');

module.exports = {
  ...rootConfig,
  rootDir: path.resolve(__dirname, '../../../../../'),
  modulePathIgnorePatterns: [],
  setupFiles: [],
  setupFilesAfterEnv: [],
  testEnvironment: 'node',
};
