import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: __dirname,
  testMatch: 'e4-t2.playwright.spec.ts',
  use: { baseURL: 'http://127.0.0.1:4184', browserName: 'chromium' },
  webServer: {
    command:
      'node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite build --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/packages/vector-visualizer/src/advanced/vite.e4-t2.config.mjs && node /private/tmp/redisinsight-vector-visualizer/node_modules/.bin/vite preview --host 127.0.0.1 --port 4184 --strictPort --outDir /private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e4-t2-vite --config /private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/packages/vector-visualizer/src/advanced/vite.e4-t2.config.mjs',
    cwd: '/private/tmp/redisinsight-vector-visualizer/redisinsight/ui/src/packages/vector-visualizer/src/advanced',
    url: 'http://127.0.0.1:4184/src/advanced/e4-t2.html',
    reuseExistingServer: false,
  },
});
