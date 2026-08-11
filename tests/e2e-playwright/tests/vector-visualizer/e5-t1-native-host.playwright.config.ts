import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  testMatch: 'e5-t1-native-host.playwright.spec.ts',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4185',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command:
      'node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite build --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/pages/vector-visualizer/e5-t1-fixture/vite.e5-t1.config.mjs && node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite preview --host 127.0.0.1 --port 4185 --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/pages/vector-visualizer/e5-t1-fixture/vite.e5-t1.config.mjs',
    cwd: '/private/tmp/redisinsight-vector-visualizer/redisinsight/ui',
    reuseExistingServer: false,
    url: 'http://127.0.0.1:4185/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html',
  },
});
