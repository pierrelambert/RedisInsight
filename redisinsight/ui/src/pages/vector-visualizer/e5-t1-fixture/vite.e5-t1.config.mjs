import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { defaultConfig } from '../../../config/default';
import { sanitizeVectorVisualizerCssAsset } from '../../../packages/vector-visualizer/src/distribution.ts';

const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
const uiRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const mockRoot = path.resolve(fixtureRoot, 'mocks');

export default defineConfig({
  root: uiRoot,
  plugins: [
    react(),
    {
      name: 'sanitize-vector-visualizer-fixture-css',
      generateBundle(_, bundle) {
        Object.values(bundle).forEach((asset) => {
          if (asset.type === 'asset' && typeof asset.source === 'string')
            asset.source = sanitizeVectorVisualizerCssAsset(
              'vector-visualizer/dist/styles.css',
              asset.source,
            );
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
          path.resolve(
            uiRoot,
            'src/packages/vector-visualizer/public/UMAP-JS-NOTICE.md',
          ),
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
    port: 4185,
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
    outDir: path.resolve(uiRoot, '../../artifacts/playwright/e5-t1-vite'),
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(fixtureRoot, 'e5-t1.html') },
  },
});
