import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultConfig } from '../../../../../config/default';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL('../../..', import.meta.url)),
  plugins: [react()],
  resolve: {
    alias: {
      '@redislabsdev/redis-ui-components': '@redis-ui/components',
      '@redislabsdev/redis-ui-icons': '@redis-ui/icons',
      '@redislabsdev/redis-ui-styles': '@redis-ui/styles',
      '@redislabsdev/redis-ui-table': '@redis-ui/table',
      apiClient: fileURLToPath(
        new URL('../../../../../../../api-client', import.meta.url),
      ),
      'redisinsight-plugin-sdk': fileURLToPath(
        new URL(
          '../../../../redisinsight-plugin-sdk/index.js',
          import.meta.url,
        ),
      ),
      uiSrc: fileURLToPath(new URL('../../../../../', import.meta.url)),
    },
    dedupe: ['react', 'react-dom'],
  },
  server: { host: '127.0.0.1', port: 4192 },
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
    outDir: '../../../../../artifacts/playwright/e4-t2-workbench-vite',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        e4t2Workbench: path.resolve(here, 'e4-t2.html'),
      },
    },
  },
});
