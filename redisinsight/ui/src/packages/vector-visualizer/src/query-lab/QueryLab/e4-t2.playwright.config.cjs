const { defineConfig } = require('@playwright/test');
const path = require('node:path');

const fixtureDirectory = __dirname;
const configPath = path.join(fixtureDirectory, 'vite.e4-t2.config.mjs');

module.exports = defineConfig({
  testDir: fixtureDirectory,
  testMatch: 'e4-t2.playwright.cjs',
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4192',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `node ../../../../../../../../node_modules/.bin/vite --config ${configPath}`,
    cwd: fixtureDirectory,
    url: 'http://127.0.0.1:4192/src/query-lab/QueryLab/e4-t2.html',
    reuseExistingServer: false,
  },
});
