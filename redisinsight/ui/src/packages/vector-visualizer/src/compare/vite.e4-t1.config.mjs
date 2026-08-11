import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultConfig } from '../../../../config/default';
import { sanitizeVectorVisualizerCssAsset } from '../distribution.ts';

const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
const uiRoot = fileURLToPath(new URL('../../../../..', import.meta.url));

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
    },
  ],
  resolve: {
    alias: {
      uiSrc: path.resolve(uiRoot, 'src'),
      apiClient: path.resolve(uiRoot, '../api-client'),
      '@redislabsdev/redis-ui-components': '@redis-ui/components',
      '@redislabsdev/redis-ui-styles': '@redis-ui/styles',
      '@redislabsdev/redis-ui-icons': '@redis-ui/icons',
      '@redislabsdev/redis-ui-table': '@redis-ui/table',
    },
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 4184,
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
    outDir: path.resolve(uiRoot, '../../artifacts/playwright/e4-t1-vite'),
    emptyOutDir: true,
    rollupOptions: { input: path.resolve(fixtureRoot, 'e4-t1.html') },
  },
});
