const path = require('path');
const rootConfig = require('../../../../../jest.config.cjs');

module.exports = {
  ...rootConfig,
  rootDir: path.resolve(__dirname, '../../../../../'),
  modulePathIgnorePatterns: [],
};
