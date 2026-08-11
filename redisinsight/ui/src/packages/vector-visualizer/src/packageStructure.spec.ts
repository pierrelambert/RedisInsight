import { existsSync, readFileSync } from 'fs'
import path from 'path'

const packageRoot = path.resolve(__dirname, '..')
const repositoryRoot = path.resolve(packageRoot, '../../../../..')

const expectedComponentFiles: Record<string, string[]> = {
  'advanced/AdvancedView': [
    'AdvancedView.spec.tsx',
    'AdvancedView.styles.ts',
    'AdvancedView.tsx',
    'AdvancedView.types.ts',
    'index.ts',
  ],
  'atlas/Atlas': [
    'Atlas.spec.tsx',
    'Atlas.styles.ts',
    'Atlas.tsx',
    'Atlas.types.ts',
    'index.ts',
  ],
  'compare/CompareTune': [
    'CompareTune.spec.tsx',
    'CompareTune.styles.ts',
    'CompareTune.tsx',
    'CompareTune.types.ts',
    'index.ts',
  ],
  'explore/MetadataMatrix': [
    'MetadataMatrix.spec.tsx',
    'MetadataMatrix.styles.ts',
    'MetadataMatrix.tsx',
    'MetadataMatrix.types.ts',
    'index.ts',
  ],
  'health/HealthExplorers': [
    'HealthExplorers.spec.tsx',
    'HealthExplorers.styles.ts',
    'HealthExplorers.tsx',
    'HealthExplorers.types.ts',
    'index.ts',
  ],
  'selection/SelectionInspector': [
    'SelectionInspector.spec.tsx',
    'SelectionInspector.styles.ts',
    'SelectionInspector.tsx',
    'SelectionInspector.types.ts',
    'index.ts',
  ],
  'selection/SelectionTable': [
    'SelectionTable.constants.ts',
    'SelectionTable.spec.tsx',
    'SelectionTable.styles.ts',
    'SelectionTable.tsx',
    'SelectionTable.types.ts',
    'index.ts',
  ],
}

describe('Vector visualizer package structure', () => {
  it('provides standard package Jest and TypeScript configuration', () => {
    expect(existsSync(path.join(packageRoot, 'jest.config.cjs'))).toBe(true)
    expect(existsSync(path.join(packageRoot, 'tsconfig.json'))).toBe(true)

    const packageJson = JSON.parse(
      readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
    ) as { scripts?: Record<string, string> }
    expect(packageJson.scripts?.test).toContain('jest -c jest.config.cjs')
    expect(packageJson.scripts?.typecheck).toContain(
      'tsc --project tsconfig.json --noEmit',
    )
  })

  it('copies the plugin after the shared install in both production static-build scripts', () => {
    const shellScript = readFileSync(
      path.join(repositoryRoot, 'scripts/build-statics.sh'),
      'utf8',
    )
    const windowsScript = readFileSync(
      path.join(repositoryRoot, 'scripts/build-statics.cmd'),
      'utf8',
    )

    expect(shellScript).toContain('VECTOR_VISUALIZER_DIR=')
    expect(shellScript).toContain('${PLUGINS_DIR}/vector-visualizer')
    expect(windowsScript).toContain('set VECTOR_VISUALIZER_DIR=')
    expect(windowsScript).toContain('%PLUGINS_DIR%\\vector-visualizer')
  })

  it('keeps reviewed React components in self-contained component directories', () => {
    Object.entries(expectedComponentFiles).forEach(([directory, files]) => {
      files.forEach((file) => {
        expect(existsSync(path.join(packageRoot, 'src', directory, file))).toBe(
          true,
        )
      })
    })
    expect(existsSync(path.join(packageRoot, 'src/components/index.ts'))).toBe(
      true,
    )
  })
})
