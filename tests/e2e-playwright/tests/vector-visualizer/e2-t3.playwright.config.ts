import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: __dirname,
  testMatch: 'e2-t3.playwright.spec.ts',
  timeout: 60_000,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4179',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { browserName: 'chromium' } }],
  webServer: {
    command:
      'node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite build --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/packages/vector-visualizer/vite.e2-t3.config.mjs && node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite preview --host 127.0.0.1 --port 4179 --strictPort --outDir /private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e2-t3-vite --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/packages/vector-visualizer/vite.e2-t3.config.mjs',
    cwd: '/private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/packages/vector-visualizer',
    url: 'http://127.0.0.1:4179/e2-t3.html',
    reuseExistingServer: false,
  },
});
