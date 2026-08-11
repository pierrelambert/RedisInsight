import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultConfig } from '../../config/default';
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
    },
  ],
  resolve: {
    alias: {
      '@redislabsdev/redis-ui-components': '@redis-ui/components',
      '@redislabsdev/redis-ui-styles': '@redis-ui/styles',
      '@redislabsdev/redis-ui-icons': '@redis-ui/icons',
      '@redislabsdev/redis-ui-table': '@redis-ui/table',
      'redisinsight-plugin-sdk': fileURLToPath(
        new URL('../redisinsight-plugin-sdk/index.js', import.meta.url),
      ),
      apiClient: fileURLToPath(
        new URL('../../../../api-client', import.meta.url),
      ),
      uiSrc: fileURLToPath(new URL('../../../src', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 4179,
    fs: { allow: [fileURLToPath(new URL('../../..', import.meta.url))] },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    riConfig: defaultConfig,
  },
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
    outDir: '../../../../../artifacts/playwright/e2-t3-vite',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        workbench: path.resolve(
          fileURLToPath(new URL('.', import.meta.url)),
          'e2-t3.html',
        ),
      },
    },
  },
});
