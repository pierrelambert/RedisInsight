import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'path';
import { fileURLToPath } from 'url';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { defaultConfig } from '../../../../../redisinsight/ui/src/config/default';
import { sanitizeVectorVisualizerCssAsset } from '../../../../../redisinsight/ui/src/packages/vector-visualizer/src/distribution.ts';

const testRoot = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = path.resolve(testRoot, '../../../../..');
const uiRoot = path.resolve(repoRoot, 'redisinsight/ui');
const fixtureRoot = path.resolve(uiRoot, 'src/pages/vector-visualizer/e5-t1-fixture');
const mockRoot = path.resolve(testRoot, 'e1-t1-fixture/mocks');

const localFavicon = {
  name: 'e1-fixture-local-favicon',
  configurePreviewServer(server) {
    server.middlewares.use('/favicon.ico', (_request, response) => {
      response.statusCode = 204;
      response.end();
    });
  },
};

export default defineConfig({
  root: uiRoot,
  plugins: [
    react(),
    localFavicon,
    {
      name: 'sanitize-vector-visualizer-e1-fixture-css',
      generateBundle(_, bundle) {
        Object.values(bundle).forEach((asset) => {
          if (asset.type === 'asset' && typeof asset.source === 'string')
            asset.source = sanitizeVectorVisualizerCssAsset('vector-visualizer/dist/styles.css', asset.source);
        });
      },
      writeBundle(outputOptions) {
        const notices = path.resolve(outputOptions.dir, 'notices');
        mkdirSync(notices, { recursive: true });
        copyFileSync(
          path.resolve(uiRoot, 'src/packages/node_modules/umap-js/LICENSE'),
          path.resolve(notices, 'UMAP-JS-LICENSE'),
        );
        copyFileSync(
          path.resolve(uiRoot, 'src/packages/vector-visualizer/public/UMAP-JS-NOTICE.md'),
          path.resolve(notices, 'UMAP-JS-NOTICE.md'),
        );
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: /^uiSrc\/slices\/hooks$/,
        replacement: path.resolve(mockRoot, 'slicesHooks.mock.ts'),
      },
      {
        find: /^uiSrc\/services\/apiService$/,
        replacement: path.resolve(mockRoot, 'services.mock.ts'),
      },
      {
        find: '@redislabsdev/redis-ui-components',
        replacement: '@redis-ui/components',
      },
      {
        find: '@redislabsdev/redis-ui-styles',
        replacement: '@redis-ui/styles',
      },
      {
        find: '@redislabsdev/redis-ui-icons',
        replacement: '@redis-ui/icons',
      },
      { find: '@redislabsdev/redis-ui-table', replacement: '@redis-ui/table' },
      { find: 'uiSrc', replacement: path.resolve(uiRoot, 'src') },
      { find: 'apiClient', replacement: path.resolve(uiRoot, '../api-client') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 4196,
    fs: { allow: [path.resolve(uiRoot, '..')] },
  },
  define: { global: 'globalThis', 'process.env': {}, riConfig: defaultConfig },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'legacy',
        additionalData: (source, filename) =>
          filename.endsWith('.scss')
            ? '@use "uiSrc/styles/mixins/_eui.scss";\n' +
              '@use "uiSrc/styles/mixins/_global.scss";\n' +
              `@layer app { ${source} }`
            : source,
      },
    },
  },
  build: {
    target: 'es2022',
    outDir: path.resolve(repoRoot, 'artifacts/playwright/e1-t1-vite'),
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(fixtureRoot, 'e5-t1.html') },
  },
});
