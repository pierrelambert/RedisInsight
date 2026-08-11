import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'url';
import { sanitizeVectorVisualizerCssAsset } from './src/distribution.ts';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
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
          path.resolve(
            fileURLToPath(new URL('.', import.meta.url)),
            '../node_modules/umap-js/LICENSE',
          ),
          path.resolve(notices, 'UMAP-JS-LICENSE'),
        );
        copyFileSync(
          path.resolve(
            fileURLToPath(new URL('.', import.meta.url)),
            'public/UMAP-JS-NOTICE.md',
          ),
          path.resolve(notices, 'UMAP-JS-NOTICE.md'),
        );
      },
    },
  ],
  resolve: {
    alias: {
      '@redislabsdev/redis-ui-components': '@redis-ui/components',
      '@redislabsdev/redis-ui-styles': '@redis-ui/styles',
      '@redislabsdev/redis-ui-icons': '@redis-ui/icons',
      '@redislabsdev/redis-ui-table': '@redis-ui/table',
      uiSrc: fileURLToPath(new URL('../../../src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 4178,
    fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] },
  },
  define: { global: 'globalThis', 'process.env': {} },
  build: {
    target: 'es2022',
    outDir: '../../../../../artifacts/playwright/e3-t1-vite',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        raw: path.resolve(
          fileURLToPath(new URL('.', import.meta.url)),
          'e3-t1.html',
        ),
        product: path.resolve(
          fileURLToPath(new URL('.', import.meta.url)),
          'e3-t1-product.html',
        ),
      },
    },
  },
});
