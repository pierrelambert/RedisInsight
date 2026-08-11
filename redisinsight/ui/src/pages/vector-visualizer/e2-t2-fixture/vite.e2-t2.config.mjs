import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defaultConfig } from '../../../config/default';

const fixtureRoot = fileURLToPath(new URL('.', import.meta.url));
const uiRoot = fileURLToPath(new URL('../../../..', import.meta.url));
const mockRoot = path.resolve(fixtureRoot, 'mocks');
const vectorSetDetails = path.resolve(
  uiRoot,
  'src/pages/browser/modules/key-details/components/vector-set-details/VectorSetDetails.tsx',
);
const vectorSetMock = path.resolve(mockRoot, 'vectorSetChildren.mock.tsx');

export default defineConfig({
  root: uiRoot,
  plugins: [
    react(),
    {
      name: 'e2-t2-vector-set-fixture-seams',
      resolveId(source, importer) {
        if (
          importer?.endsWith('/useListContent/useListContent.ts') &&
          source === '../useIndexListData'
        ) {
          return path.resolve(mockRoot, 'useIndexListData.mock.ts');
        }
        if (
          importer === vectorSetDetails &&
          [
            './hooks',
            './vector-set-element-form',
            './vector-set-element-list',
            './element-details',
            './similarity-search-form',
            './similarity-search-results',
          ].includes(source)
        ) {
          return vectorSetMock;
        }
        return null;
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
        find: /^uiSrc\/pages\/vector-search\/hooks\/useIndexListData$/,
        replacement: path.resolve(mockRoot, 'useIndexListData.mock.ts'),
      },
      {
        find: /^uiSrc\/pages\/vector-search\/hooks\/useIndexInfo\/useIndexInfo$/,
        replacement: path.resolve(mockRoot, 'useIndexInfo.mock.ts'),
      },
      {
        find: /^uiSrc\/pages\/vector-search\/components\/index-list$/,
        replacement: path.resolve(mockRoot, 'IndexList.mock.tsx'),
      },
      {
        find: /^uiSrc\/pages\/vector-search\/components\/index-info-side-panel$/,
        replacement: path.resolve(mockRoot, 'browserModules.mock.tsx'),
      },
      {
        find: /^uiSrc\/pages\/browser\/modules$/,
        replacement: path.resolve(mockRoot, 'browserModules.mock.tsx'),
      },
      {
        find: /^uiSrc\/pages\/browser\/modules\/key-details\/components\/key-details-actions$/,
        replacement: path.resolve(mockRoot, 'keyDetailsActions.mock.tsx'),
      },
      {
        find: /^uiSrc\/pages\/browser\/modules\/key-details-header\/components\/key-details-header-formatter$/,
        replacement: path.resolve(mockRoot, 'formatter.mock.tsx'),
      },
      {
        find: /^uiSrc\/telemetry$/,
        replacement: path.resolve(mockRoot, 'telemetry.mock.ts'),
      },
      {
        find: /^react-virtualized-auto-sizer$/,
        replacement: path.resolve(mockRoot, 'autoSizer.mock.tsx'),
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
      {
        find: '@redislabsdev/redis-ui-table',
        replacement: '@redis-ui/table',
      },
      {
        find: 'apiClient',
        replacement: path.resolve(uiRoot, '../api-client'),
      },
      { find: 'uiSrc', replacement: path.resolve(uiRoot, 'src') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  server: {
    host: '127.0.0.1',
    port: 4181,
    fs: { allow: [path.resolve(uiRoot, '..')] },
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
    outDir: path.resolve(uiRoot, '../../artifacts/playwright/e2-t2-vite'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(fixtureRoot, 'e2-t2.html'),
    },
  },
});
