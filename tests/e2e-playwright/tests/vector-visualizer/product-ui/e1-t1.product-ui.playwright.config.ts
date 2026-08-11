import { defineConfig } from '@playwright/test';

const repoRoot = '/private/tmp/redisinsight-vector-visualizer';

export default defineConfig({
  testDir: __dirname,
  testMatch: 'e1-t1.product-ui.playwright.spec.ts',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4196',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command:
      `node ${repoRoot}/node_modules/.bin/vite build --config ${repoRoot}/tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1-fixture.vite.config.mjs && ` +
      `node ${repoRoot}/node_modules/.bin/vite preview --host 127.0.0.1 --port 4196 --strictPort --config ${repoRoot}/tests/e2e-playwright/tests/vector-visualizer/product-ui/e1-t1-fixture.vite.config.mjs`,
    cwd: `${repoRoot}/redisinsight/ui`,
    reuseExistingServer: false,
    url: 'http://127.0.0.1:4196/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html',
  },
});
