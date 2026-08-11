import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  testMatch: 'e2-t2.playwright.spec.ts',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4181',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command:
      'node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite preview --host 127.0.0.1 --port 4181 --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/pages/vector-visualizer/e2-t2-fixture/vite.e2-t2.config.mjs',
    cwd: '/private/tmp/redisinsight-vector-visualizer/redisinsight/ui',
    reuseExistingServer: false,
  },
});
