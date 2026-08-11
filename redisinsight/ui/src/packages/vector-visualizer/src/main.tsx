import React, { Component } from 'react'
import type { ReactNode } from 'react'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { Col, Row } from 'uiSrc/components/base/layout/flex'
import { Text, Title } from 'uiSrc/components/base/text'
import { RiBadge } from 'uiSrc/components/base/display/badge/RiBadge'
import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'
import styled from 'styled-components'

import { QueryLab } from './components'
import {
  parseWorkbenchQueryRun,
  redactWorkbenchCommand,
} from './workbenchIntegration'
import type { WorkbenchQueryRun } from './workbenchIntegration'
import { getWorkbenchHost } from './workbenchSdk'

const LOG_PREFIX = '[vector-visualizer-plugin]'
const roots = new WeakMap<HTMLElement, Root>()

const Shell = styled(Col).attrs({ gap: 'l' })`
  block-size: 100vh;
  min-block-size: 0;
  min-inline-size: 0;
  box-sizing: border-box;
  overflow: hidden;
  padding: ${({ theme }) => theme.core.space.space200};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral100};
`

const ReadyContent = styled(Col).attrs({ gap: 'm' })`
  flex: 1 1 0;
  min-block-size: 0;
  min-inline-size: 0;
  overflow: hidden;
`

const Header = styled(Row).attrs({ align: 'center', gap: 'm' })`
  flex: 0 0 auto;
  justify-content: space-between;
  padding-block-end: ${({ theme }) => theme.core.space.space100};
  border-block-end: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
`

const CommandPanel = styled(Col).attrs({ gap: 'xs' })`
  flex: 0 0 auto;
  padding: ${({ theme }) => theme.core.space.space200};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral200};
`

const StatePanel = styled(Col).attrs({ gap: 's' })`
  min-block-size: ${({ theme }) => `calc(${theme.core.space.space800} * 2)`};
  justify-content: center;
  padding: ${({ theme }) => theme.core.space.space300};
  border: ${({ theme }) => theme.core.space.space010} solid
    ${({ theme }) => theme.semantic.color.border.neutral500};
  border-radius: ${({ theme }) => theme.components.card.borderRadius};
  background-color: ${({ theme }) =>
    theme.semantic.color.background.neutral200};
`

const Command = styled.code`
  display: block;
  overflow-wrap: anywhere;
`

interface PluginProps {
  command?: unknown
  data?: unknown
}

type ViewState =
  | 'loading'
  | 'ready'
  | 'empty'
  | 'failed'
  | 'unsupported'
  | 'invalid'

interface SafeViewModel {
  command: string
  run: WorkbenchQueryRun
}

const summarizeProps = (props: PluginProps): SafeViewModel => {
  return {
    command: redactWorkbenchCommand(props.command),
    run: parseWorkbenchQueryRun(props),
  }
}

const stateCopy: Record<Exclude<ViewState, 'ready'>, string> = {
  loading: 'Preparing a safe result summary.',
  empty: 'The command completed without rows to visualize.',
  failed: 'The command failed. Review the Workbench result and retry.',
  unsupported: 'This command shape is not supported by Vector visualizer.',
  invalid: 'Vector visualizer received an invalid command result.',
}

const runStateCopy: Record<
  Exclude<WorkbenchQueryRun['kind'], 'ready'>,
  string
> = {
  empty: stateCopy.empty,
  failed: stateCopy.failed,
  'acl-unavailable': 'Redis ACLs do not allow this evidence.',
  invalid: stateCopy.invalid,
  unsupported: stateCopy.unsupported,
}

class PluginErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true }
  }

  componentDidCatch(error: Error): void {
    // eslint-disable-next-line no-console -- plugin failures require a safe prefixed diagnostic.
    console.error(LOG_PREFIX, 'render failed', { name: error.name })
  }

  render(): ReactNode {
    if (this.state.failed) {
      return (
        <StatePanel aria-label="Vector visualizer error">
          <Text color="danger">
            Vector visualizer could not render this result.
          </Text>
        </StatePanel>
      )
    }
    return this.props.children
  }
}

const PluginShell = ({ model }: { model: SafeViewModel }) => (
  <Shell aria-live="polite" data-testid="workbench-query-lab">
    <Header>
      <Col grow={false} gap="xs">
        <Text color="subdued" size="XS">
          Workbench visualization
        </Text>
        <Title component="h1" size="M">
          Vector visualizer
        </Title>
      </Col>
      <RiBadge variant="light">
        {model.run.kind === 'ready' ? 'Response ready' : 'Response unavailable'}
      </RiBadge>
    </Header>
    <CommandPanel as="section" aria-label="Executed vector query">
      <Text color="subdued" size="XS">
        Executed command
      </Text>
      <Command>{model.command || 'Unavailable'}</Command>
    </CommandPanel>
    {model.run.kind === 'ready' ? (
      <ReadyContent>
        <Text color="subdued" size="XS">
          Atlas is unavailable in Workbench because the plugin SDK cannot
          provide bounded cancellable sampling. This response-only view does not
          issue additional Redis commands.
        </Text>
        <QueryLab
          exactness={model.run.exactness}
          freshness="current"
          neighbors={model.run.neighbors}
          profile={model.run.profile}
          sourceKind={model.run.sourceKind}
          status="ready"
        />
      </ReadyContent>
    ) : (
      <StatePanel aria-label="Workbench result status">
        <Text color="subdued" size="XS">
          Workbench result status
        </Text>
        <Title component="h2" size="S">
          Response unavailable
        </Title>
        <Text color={model.run.kind === 'failed' ? 'danger' : 'default'}>
          {runStateCopy[model.run.kind]}
        </Text>
        <Text color="subdued" size="XS">
          Review the Workbench result and rerun the command. No additional Redis
          command was issued.
        </Text>
      </StatePanel>
    )}
  </Shell>
)

export const renderVectorVisualizer = (props: PluginProps = {}): void => {
  // Activation obtains the only SDK bridge; it executes only explicit UI follow-ups.
  void getWorkbenchHost()
  const host = document.getElementById('app')
  if (!host) {
    // eslint-disable-next-line no-console -- plugin activation needs a safe host diagnostic.
    console.error(LOG_PREFIX, 'activation failed', { reason: 'missing-host' })
    return
  }

  try {
    const model = summarizeProps(props)
    // eslint-disable-next-line no-console -- deliberately excludes commands and result payloads.
    console.info(LOG_PREFIX, 'activated', {
      state: model.run.kind,
      resultCount: model.run.kind === 'ready' ? model.run.neighbors.length : 0,
    })
    const root = roots.get(host) ?? createRoot(host)
    roots.set(host, root)
    flushSync(() => {
      root.render(
        <ThemeProvider>
          <PluginErrorBoundary>
            <PluginShell model={model} />
          </PluginErrorBoundary>
        </ThemeProvider>,
      )
    })
  } catch (error) {
    // eslint-disable-next-line no-console -- plugin activation failure needs a safe diagnostic.
    console.error(LOG_PREFIX, 'activation failed', {
      reason: error instanceof Error ? error.name : 'unknown',
    })
    host.textContent = 'Vector visualizer could not initialize.'
  }
}

export default { renderVectorVisualizer }
