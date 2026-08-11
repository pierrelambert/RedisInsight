import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  MemoryRouter,
  Route,
  Switch,
  useHistory,
  useLocation,
} from 'react-router-dom'
import { Button } from 'uiSrc/components/base/forms/buttons'
import { Col } from 'uiSrc/components/base/layout/flex'
import { Text } from 'uiSrc/components/base/text'
import { ThemeProvider } from 'uiSrc/components/base/utils/pluginsThemeContext'

import { VectorSetDetails } from '../../browser/modules/key-details/components/vector-set-details/VectorSetDetails'
import { ListContent } from '../../vector-search/pages/VectorSearchListPage/components/list-content/ListContent'
import { VectorVisualizerPage } from '../VectorVisualizerPage'

declare global {
  interface Window {
    __E2T2_FIXTURE__: { enabled: boolean }
  }
}

const parameters = new URLSearchParams(window.location.search)
const source =
  parameters.get('source') === 'vector-set' ? 'vector-set' : 'search'
const theme = parameters.get('theme') === 'dark' ? 'theme_DARK' : 'theme_LIGHT'

window.__E2T2_FIXTURE__ = { enabled: parameters.get('enabled') !== '0' }
document.body.className = theme

const instanceId = 'instance-1'

const FixtureLocation = () => {
  const location = useLocation()
  return <Text data-testid="fixture-location">{location.pathname}</Text>
}

const NativeHost = () => {
  const history = useHistory()
  return (
    <Col gap="m">
      <Button onClick={() => history.goBack()}>Back to source</Button>
      <VectorVisualizerPage />
    </Col>
  )
}

const VectorSetSource = () => (
  <VectorSetDetails
    onRemoveKey={() => undefined}
    onOpenAddItemPanel={() => undefined}
    onCloseAddItemPanel={() => undefined}
    onCloseKey={() => undefined}
    onEditKey={() => undefined}
    isFullScreen={false}
    arePanelsCollapsed={false}
    onToggleFullScreen={() => undefined}
  />
)

const initialEntry =
  source === 'search'
    ? `/${instanceId}/vector-search`
    : `/${instanceId}/browser`

createRoot(document.getElementById('app')!).render(
  <ThemeProvider>
    <MemoryRouter initialEntries={[initialEntry]}>
      <Col gap="m">
        <FixtureLocation />
        <Switch>
          <Route exact path="/:instanceId/vector-search">
            <ListContent />
          </Route>
          <Route exact path="/:instanceId/browser">
            <VectorSetSource />
          </Route>
          <Route exact path="/:instanceId/vector-visualizer">
            <NativeHost />
          </Route>
        </Switch>
      </Col>
    </MemoryRouter>
  </ThemeProvider>,
)
