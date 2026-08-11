import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  testMatch: 'e4-t1.playwright.spec.ts',
  timeout: 60_000,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4184', trace: 'retain-on-failure' },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command:
      'node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite preview --host 127.0.0.1 --port 4184 --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/packages/vector-visualizer/src/compare/vite.e4-t1.config.mjs',
    cwd: '/private/tmp/redisinsight-vector-visualizer/redisinsight/ui',
    reuseExistingServer: false,
  },
});
