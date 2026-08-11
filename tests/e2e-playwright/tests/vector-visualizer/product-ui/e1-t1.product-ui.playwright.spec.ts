import { expect, Page, test } from '@playwright/test';

const fixtureRoute = '/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html?source=search';
const realAppBaseUrl = process.env.E1_REAL_APP_BASE_URL;
const realAppApiOrigin = process.env.E1_REAL_APP_API_ORIGIN;
const realAppInstanceId = process.env.E1_REAL_APP_INSTANCE_ID;
const realAppVectorSetKey = process.env.E1_REAL_APP_VECTOR_SET_KEY;

const landmarks = (page: Page) => ({
  controls: page.getByTestId('vector-visualizer-controls'),
  visualization: page.getByTestId('vector-visualizer-visualization'),
  resultsInspector: page.getByTestId('vector-visualizer-results-inspector'),
});

const observePage = (page: Page, allowedOrigin: string | string[]) => {
  const allowedOrigins = new Set(
    (Array.isArray(allowedOrigin) ? allowedOrigin : [allowedOrigin]).map((origin) => new URL(origin).origin),
  );
  const errors: string[] = [];
  const warnings: string[] = [];
  const unexpectedRequests: string[] = [];
  const failedRequests: string[] = [];
  const failedResponses: string[] = [];
  const benignSameOriginStatuses = new Set<number>();
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
    if (message.type() === 'warning') warnings.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => {
    const url = request.url();
    if (!allowedOrigins.has(new URL(url).origin)) unexpectedRequests.push(url);
  });
  page.on('requestfailed', (request) => {
    failedRequests.push(`${request.url()}: ${request.failure()?.errorText ?? 'unknown failure'}`);
  });
  page.on('response', (response) => {
    if (
      allowedOrigins.has(new URL(response.url()).origin) &&
      response.status() >= 400 &&
      !benignSameOriginStatuses.has(response.status())
    ) {
      failedResponses.push(`${response.status()} ${response.url()}`);
    }
  });
  return () => {
    expect(errors).toEqual([]);
    expect(unexpectedRequests).toEqual([]);
    expect(failedRequests).toEqual([]);
    expect(failedResponses).toEqual([]);

    return warnings;
  };
};

const observeAssertion = async (page: Page, allowedOrigin: string | string[], assertion: () => Promise<void>) => {
  const assertClean = observePage(page, allowedOrigin);
  let assertionError: unknown;
  try {
    await assertion();
  } catch (error) {
    assertionError = error;
  }

  let signalError: unknown;
  try {
    assertClean();
  } catch (error) {
    signalError = error;
  }

  return { assertionError, signalError };
};

const throwObservedFailures = ({ assertionError, signalError }: Awaited<ReturnType<typeof observeAssertion>>) => {
  if (assertionError && signalError)
    throw new AggregateError([assertionError, signalError], 'Product assertion and browser-signal gate both failed');
  if (assertionError) throw assertionError;
  if (signalError) throw signalError;
};

const expectBrowserClean = async (page: Page, allowedOrigin: string | string[], assertion: () => Promise<void>) => {
  throwObservedFailures(await observeAssertion(page, allowedOrigin, assertion));
};

const expectDesktopWorkspace = async ({ controls, visualization, resultsInspector }: ReturnType<typeof landmarks>) => {
  await expect(controls).toBeVisible();
  await expect(visualization).toBeVisible();
  await expect(resultsInspector).toBeVisible();

  const [controlsBox, visualizationBox, resultsBox] = await Promise.all([
    controls.boundingBox(),
    visualization.boundingBox(),
    resultsInspector.boundingBox(),
  ]);
  expect(controlsBox).not.toBeNull();
  expect(visualizationBox).not.toBeNull();
  expect(resultsBox).not.toBeNull();

  const controlsRect = controlsBox!;
  const visualizationRect = visualizationBox!;
  const resultsRect = resultsBox!;
  const workspaceWidth = resultsRect.x + resultsRect.width - controlsRect.x;

  expect(controlsRect.width).toBeGreaterThanOrEqual(200);
  expect(controlsRect.width).toBeLessThanOrEqual(280);
  expect(resultsRect.width).toBeGreaterThanOrEqual(280);
  expect(resultsRect.width).toBeLessThanOrEqual(360);
  expect(visualizationRect.width / workspaceWidth).toBeGreaterThanOrEqual(0.55);
  expect(controlsRect.y).toBe(visualizationRect.y);
  expect(resultsRect.y).toBe(visualizationRect.y);
};

const expectNoReadyStatePageOverflow = async (page: Page) => {
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
};

const expectFullyContained = async (
  container: ReturnType<Page['getByTestId']>,
  element: ReturnType<Page['getByTestId']>,
) => {
  const [containerBox, elementBox] = await Promise.all([container.boundingBox(), element.boundingBox()]);

  expect(containerBox).not.toBeNull();
  expect(elementBox).not.toBeNull();

  const containerRect = containerBox!;
  const elementRect = elementBox!;
  expect(elementRect.x).toBeGreaterThanOrEqual(containerRect.x);
  expect(elementRect.y).toBeGreaterThanOrEqual(containerRect.y);
  expect(elementRect.x + elementRect.width).toBeLessThanOrEqual(containerRect.x + containerRect.width);
  expect(elementRect.y + elementRect.height).toBeLessThanOrEqual(containerRect.y + containerRect.height);
};

const selectSample = async (page: Page, state = 'ready', theme?: 'dark') => {
  await page.goto(`${fixtureRoute}&state=${state}${theme ? `&theme=${theme}` : ''}`);
  await expect(page.getByRole('button', { name: 'Sample vectors' })).toBeVisible();
  await page.getByRole('button', { name: 'Sample vectors' }).click();
  const stateSlot = page.getByTestId('vector-visualizer-visualization').getByTestId('vector-visualizer-state-slot');
  if (state === 'loading') {
    await expect(stateSlot).toContainText('Sampling vectors');
    return;
  }
  if (state === 'empty') {
    await expect(stateSlot).toContainText('No vectors were returned');
    return;
  }
  if (state === 'error') {
    await expect(stateSlot).toContainText('Sampling could not complete');
    return;
  }
  await expect(page.getByRole('heading', { name: 'Index atlas' })).toBeVisible();
};

const prepareSample = async (page: Page) => {
  await selectSample(page);
  const { resultsInspector } = landmarks(page);
  const selectedRow = resultsInspector.getByTestId('vector-visualizer-selected-row-doc:1');

  await expect(selectedRow).toBeVisible();
  await selectedRow.click();
  await expect(selectedRow).toHaveAttribute('data-selected', 'true');
};

const prepareColorableSample = async (page: Page) => {
  await selectSample(page);
  const { controls } = landmarks(page);
  const colorBy = controls.getByLabel('Color by');

  await expect(colorBy).toBeVisible();
  await expect(colorBy).toContainText('region');
  await colorBy.click();
  await expect(page.getByRole('option', { name: 'cluster' })).toBeVisible();
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Sample vectors' }).click();
  await expect(page.getByRole('heading', { name: 'Index atlas' })).toBeVisible();
};

const expectSupportedSampleSelection = async (page: Page, mode: 'atlas' | 'selection', selectedId = 'doc:1') => {
  const { visualization, resultsInspector } = landmarks(page);
  const selectedRow = resultsInspector.getByTestId(`vector-visualizer-selected-row-${selectedId}`);

  await expect(visualization).toHaveAttribute('data-active-mode', mode);
  await expect(visualization).toHaveAttribute('data-selected-id', selectedId);
  await expect(selectedRow).toHaveAttribute('data-selected', 'true');
  await expect(resultsInspector.getByLabel('Selected record inspector').getByTitle(selectedId)).toBeVisible();
};

test.describe('E1.R1 Vector Visualizer product-ui promotion repair', () => {
  test('REQ-VV-012 keeps the desktop ready state in one bounded three-pane row', async ({ page }) => {
    await expectBrowserClean(page, 'http://127.0.0.1:4196/', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await selectSample(page);
      const currentLandmarks = landmarks(page);
      await expectDesktopWorkspace(currentLandmarks);
      await expectNoReadyStatePageOverflow(page);
      const title = page.getByRole('heading', { name: 'Vector Visualizer' });
      const pageContext = page.getByTestId('vector-visualizer-page-context');
      const [titleBox, contextBox, visualizationBox] = await Promise.all([
        title.boundingBox(),
        pageContext.boundingBox(),
        currentLandmarks.visualization.boundingBox(),
      ]);
      expect(contextBox!.y).toBeGreaterThan(titleBox!.y);
      expect(contextBox!.y + contextBox!.height).toBeLessThan(visualizationBox!.y);
      await expect(currentLandmarks.visualization).not.toContainText('Fresh sample');
      await expect(currentLandmarks.controls.getByRole('button', { name: 'Projection' })).toHaveCount(0);
      const tableScroll = currentLandmarks.resultsInspector.getByTestId('vector-visualizer-results-table-scroll');
      const detail = currentLandmarks.resultsInspector.getByTestId('vector-visualizer-results-detail');
      await expect(tableScroll).toBeVisible();
      await expect(detail).toBeVisible();
      await expect(tableScroll.getByRole('grid')).toHaveAttribute('aria-colcount', '1');
      await expect(tableScroll.getByText('Unavailable')).toHaveCount(0);
      const [tableBox, detailBox] = await Promise.all([tableScroll.boundingBox(), detail.boundingBox()]);
      expect(tableBox!.y + tableBox!.height).toBeLessThanOrEqual(detailBox!.y);
    });
  });

  test('REQ-VV-013 links Atlas, Neighbors, and Selection through one workspace', async ({ page }) => {
    await expectBrowserClean(page, 'http://127.0.0.1:4196/', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await prepareSample(page);
      const { controls, visualization, resultsInspector } = landmarks(page);
      const filter = controls.getByLabel('Filter sampled documents');

      await expect(filter).toBeDisabled();
      await expect(controls).toContainText('Native sampling is currently bounded and unfiltered.');
      const colorBy = controls.getByLabel('Color by');
      await expect(colorBy).toBeEnabled();
      await expect(colorBy).toContainText('region');
      await colorBy.click();
      await expect(page.getByRole('option', { name: 'cluster' })).toBeVisible();
      await page.keyboard.press('Escape');

      const atlasTab = visualization.getByRole('tab', { name: 'Atlas' });
      await expect(atlasTab).toBeVisible();
      await atlasTab.click();
      await expectSupportedSampleSelection(page, 'atlas');

      const neighborsTab = visualization.getByRole('tab', { name: 'Neighbors' });
      await expect(neighborsTab).toBeVisible();
      await neighborsTab.click();
      await expect(visualization).toHaveAttribute('data-active-mode', 'neighbors');
      await expect(visualization).toHaveAttribute('data-selected-id', 'doc:1');
      await expect(resultsInspector).toContainText(
        'Sample or query the selected Search index to view result evidence.',
      );
      await expect(resultsInspector.getByRole('grid')).toHaveCount(0);
      await page.getByRole('button', { name: 'Run selected anchor query' }).click();

      const neighborRow = resultsInspector.getByTestId('vector-visualizer-selected-row-doc:2');
      await expect(neighborRow).toBeVisible();
      await expect(resultsInspector.getByRole('heading', { name: 'Nearest documents' })).toBeVisible();
      await expect(resultsInspector).toContainText('Bounded read-only FT.SEARCH response');
      await expect(resultsInspector.getByRole('gridcell', { name: 'Score/distance 0.13' })).toBeVisible();
      await neighborRow.click();
      await expect(visualization).toHaveAttribute('data-selected-id', 'doc:2');
      await expect(neighborRow).toHaveAttribute('data-selected', 'true');
      await expect(resultsInspector.getByLabel('Selected record inspector').getByTitle('doc:2')).toBeVisible();

      const selectionTab = visualization.getByRole('tab', { name: 'Selection' });
      await expect(selectionTab).toBeVisible();
      await selectionTab.click();
      const selectedSampleRow = resultsInspector.getByTestId('vector-visualizer-selected-row-doc:2');
      await expect(selectedSampleRow).toBeVisible();
      await expectSupportedSampleSelection(page, 'selection', 'doc:2');
    });
  });

  test('E5.R2 renders dense response-backed Atlas, Neighbors, and Selection visual contexts', async ({ page }) => {
    await expectBrowserClean(page, 'http://127.0.0.1:4196/', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await prepareColorableSample(page);

      const { controls, visualization, resultsInspector } = landmarks(page);
      const atlasPanel = visualization.getByRole('tabpanel', { name: 'Atlas' });
      const atlas = atlasPanel.getByLabel('Atlas plot; use the linked selection table for keyboard navigation');

      await expect(controls.getByText('Color by', { exact: true })).toBeVisible();
      await expect(controls.getByRole('switch', { name: 'Show cluster labels' })).toBeChecked();
      await expect(atlas).toHaveAttribute('data-colored-point-count', /^(?:[2-9]\d|[1-9]\d{2,})$/);
      await expect(atlas).toHaveAttribute('data-point-count', /^(?:[5-9]\d|[1-9]\d{2,})$/);
      expect(await atlas.evaluate((element) => element.clientHeight)).toBeGreaterThanOrEqual(360);
      await expect(atlasPanel.getByText('UMAP 1 · derived coordinate')).toBeVisible();
      await expect(atlasPanel.getByText('UMAP 2 · derived coordinate')).toBeVisible();
      for (const label of ['catalog', 'support', 'document', 'product'])
        await expect(atlasPanel.getByLabel(`${label} cluster label`)).toBeVisible();
      await expect(resultsInspector.getByRole('heading', { name: 'Sampled documents' })).toBeVisible();
      await expect(resultsInspector.getByRole('grid')).toHaveAttribute('aria-rowcount', '97');
      await page.screenshot({ path: '/tmp/e5-r8-atlas-reference-repair-1440x900.png' });

      await page.setViewportSize({ width: 960, height: 680 });
      const compactAtlasLandmarks = landmarks(page);
      await expect(compactAtlasLandmarks.controls).toBeVisible();
      await expect(compactAtlasLandmarks.visualization).toBeVisible();
      await expect(compactAtlasLandmarks.resultsInspector).toBeVisible();
      await expectNoReadyStatePageOverflow(page);
      const compactAtlasPanel = compactAtlasLandmarks.visualization.getByRole('tabpanel', {
        name: 'Atlas',
      });
      const compactAtlas = compactAtlasPanel.getByLabel(
        'Atlas plot; use the linked selection table for keyboard navigation',
      );
      for (const label of ['catalog', 'support', 'document', 'product']) {
        const clusterLabel = compactAtlasPanel.getByLabel(`${label} cluster label`);
        await expect(clusterLabel).toBeVisible();
        await expectFullyContained(compactAtlas, clusterLabel);
      }
      await page.screenshot({ path: '/tmp/e5-r8-atlas-reference-repair-960x680.png' });
      await page.setViewportSize({ width: 1440, height: 900 });

      await resultsInspector.getByTestId('vector-visualizer-selected-row-doc:1').click();
      await visualization.getByRole('tab', { name: 'Neighbors' }).click();
      await expect(visualization.getByRole('heading', { name: 'Neighbors of doc:1' })).toBeVisible();
      await expect(visualization.getByRole('heading', { name: 'Retrieval debugger' })).toHaveCount(0);
      await expect(visualization.getByRole('heading', { name: 'Returned results' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Run selected anchor query' }).click();
      await expect(resultsInspector.getByTestId('vector-visualizer-selected-row-doc:9')).toBeVisible();
      await expect(visualization.getByLabel('Query-centered radial neighbor layout')).toHaveAttribute(
        'data-neighbor-count',
        '49',
      );
      await expect(visualization.getByLabel('Query-centered radial neighbor layout')).toHaveAttribute(
        'data-colored-point-count',
        '49',
      );
      await expect(visualization.getByLabel(/metric threshold ring/)).toHaveCount(3);
      await expect(visualization.getByRole('list', { name: 'Neighbor color legend' })).toBeVisible();
      await expect(visualization.getByRole('button', { name: 'Select query anchor doc:1' })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(visualization.getByRole('button', { name: 'Select doc:1', exact: true })).toHaveCount(0);
      const [neighborPlotBox, boundaryRingBox] = await Promise.all([
        visualization.getByLabel('Query-centered radial neighbor layout').boundingBox(),
        visualization
          .getByLabel(/metric threshold ring/)
          .last()
          .boundingBox(),
      ]);
      expect(neighborPlotBox!.width).toBeGreaterThan(boundaryRingBox!.width * 2.5);
      expect(boundaryRingBox!.x).toBeGreaterThanOrEqual(neighborPlotBox!.x);
      expect(boundaryRingBox!.y).toBeGreaterThanOrEqual(neighborPlotBox!.y);
      expect(boundaryRingBox!.x + boundaryRingBox!.width).toBeLessThanOrEqual(
        neighborPlotBox!.x + neighborPlotBox!.width,
      );
      expect(boundaryRingBox!.y + boundaryRingBox!.height).toBeLessThanOrEqual(
        neighborPlotBox!.y + neighborPlotBox!.height,
      );

      await visualization.getByRole('tab', { name: 'Selection' }).click();
      const selectionCanvas = visualization
        .getByRole('tabpanel', { name: 'Selection' })
        .getByLabel('Selection plot; drag to select a region; use the linked selection table for keyboard navigation');
      await expect(selectionCanvas).toBeVisible();
      await expect(selectionCanvas).toHaveAttribute('data-selection-mode', 'region');
      await expect(selectionCanvas).toHaveAttribute('data-colored-point-count', '96');

      const selectionCanvasBox = await selectionCanvas.boundingBox();
      expect(selectionCanvasBox).not.toBeNull();
      await page.mouse.move(
        selectionCanvasBox!.x + selectionCanvasBox!.width * 0.12,
        selectionCanvasBox!.y + selectionCanvasBox!.height * 0.18,
      );
      await page.mouse.down();
      await page.mouse.move(
        selectionCanvasBox!.x + selectionCanvasBox!.width * 0.58,
        selectionCanvasBox!.y + selectionCanvasBox!.height * 0.74,
      );
      await page.mouse.up();

      const selectedCount = Number(await visualization.getAttribute('data-selected-count'));
      expect(selectedCount).toBeGreaterThan(1);
      expect(selectedCount).toBeLessThan(96);
      const selectedRegion = visualization.getByLabel('Selected region bounds');
      await expect(selectedRegion).toBeVisible();
      await expect(selectedRegion).toHaveAttribute('data-selected-count', String(selectedCount));
      await expect(resultsInspector.getByRole('heading', { name: 'Selected documents' })).toBeVisible();
      await expect(resultsInspector.getByRole('grid')).toHaveAttribute('aria-rowcount', String(selectedCount + 1));
      const selectedRegionBox = await selectedRegion.boundingBox();
      expect(selectedRegionBox).not.toBeNull();
      expect(selectedRegionBox!.x).toBeGreaterThanOrEqual(selectionCanvasBox!.x);
      expect(selectedRegionBox!.y).toBeGreaterThanOrEqual(selectionCanvasBox!.y);
      expect(selectedRegionBox!.x + selectedRegionBox!.width).toBeLessThanOrEqual(
        selectionCanvasBox!.x + selectionCanvasBox!.width,
      );
      expect(selectedRegionBox!.y + selectedRegionBox!.height).toBeLessThanOrEqual(
        selectionCanvasBox!.y + selectionCanvasBox!.height,
      );
      await page.screenshot({ path: '/tmp/e5-r7-selection-reference-repair-1440x900.png' });

      await page.setViewportSize({ width: 960, height: 680 });
      const minimumLandmarks = landmarks(page);
      await expect(minimumLandmarks.controls).toBeVisible();
      await expect(minimumLandmarks.visualization).toBeVisible();
      await expect(minimumLandmarks.resultsInspector).toBeVisible();
      const [minimumControlsBox, minimumVisualizationBox, minimumResultsBox] = await Promise.all([
        minimumLandmarks.controls.boundingBox(),
        minimumLandmarks.visualization.boundingBox(),
        minimumLandmarks.resultsInspector.boundingBox(),
      ]);
      expect(minimumVisualizationBox!.width).toBeGreaterThan(minimumControlsBox!.width);
      expect(minimumVisualizationBox!.width).toBeGreaterThan(minimumResultsBox!.width);
      await expectNoReadyStatePageOverflow(page);
      const minimumSelectionCanvas = minimumLandmarks.visualization
        .getByRole('tabpanel', { name: 'Selection' })
        .getByLabel('Selection plot; drag to select a region; use the linked selection table for keyboard navigation');
      await expectFullyContained(
        minimumSelectionCanvas,
        minimumLandmarks.visualization.getByLabel('Selected region bounds'),
      );
      await page.screenshot({ path: '/tmp/e5-r7-selection-reference-repair-960x680.png' });
    });
  });

  test('REQ-VV-014 keeps all three regions reachable at supported desktop widths', async ({ page }) => {
    await expectBrowserClean(page, 'http://127.0.0.1:4196/', async () => {
      await page.setViewportSize({ width: 1100, height: 768 });
      await selectSample(page);
      const intermediateLandmarks = landmarks(page);
      await expect(intermediateLandmarks.controls).toBeVisible();
      await expect(intermediateLandmarks.visualization).toBeVisible();
      await expect(intermediateLandmarks.resultsInspector).toBeVisible();
      const [controlsBox, visualizationBox, resultsBox] = await Promise.all([
        intermediateLandmarks.controls.boundingBox(),
        intermediateLandmarks.visualization.boundingBox(),
        intermediateLandmarks.resultsInspector.boundingBox(),
      ]);
      expect(visualizationBox!.width).toBeGreaterThan(controlsBox!.width);
      expect(visualizationBox!.width).toBeGreaterThan(resultsBox!.width);
      await expectNoReadyStatePageOverflow(page);

      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.setViewportSize({ width: 960, height: 680 });
      await selectSample(page);
      const minimumLandmarks = landmarks(page);
      await expect(minimumLandmarks.controls).toBeVisible();
      await expect(minimumLandmarks.visualization).toBeVisible();
      await expect(minimumLandmarks.resultsInspector).toBeVisible();
      const workspace = page.getByTestId('vector-visualizer-workspace');
      await expectFullyContained(workspace, minimumLandmarks.controls);
      await expectFullyContained(workspace, minimumLandmarks.visualization);
      await expectFullyContained(workspace, minimumLandmarks.resultsInspector);
      await expectNoReadyStatePageOverflow(page);
      const [minimumControlsBox, minimumVisualizationBox, minimumResultsBox] = await Promise.all([
        minimumLandmarks.controls.boundingBox(),
        minimumLandmarks.visualization.boundingBox(),
        minimumLandmarks.resultsInspector.boundingBox(),
      ]);
      expect(minimumVisualizationBox!.width).toBeGreaterThan(minimumControlsBox!.width);
      expect(minimumVisualizationBox!.width).toBeGreaterThan(minimumResultsBox!.width);
      await expect(
        minimumLandmarks.resultsInspector.evaluate((element) => element.scrollWidth <= element.clientWidth),
      ).resolves.toBe(true);
      await expect(
        minimumLandmarks.controls.evaluate((element) => element.scrollHeight > element.clientHeight),
      ).resolves.toBe(true);
      const lowerControl = minimumLandmarks.controls.getByLabel(/Sample budget/);
      await minimumLandmarks.controls.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect.poll(() => minimumLandmarks.controls.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      await lowerControl.focus();
      await expect(lowerControl).toBeFocused();
      await expectFullyContained(workspace, lowerControl);
      const reducedMotionDuration = await minimumLandmarks.visualization.evaluate((element) =>
        Number.parseFloat(window.getComputedStyle(element).transitionDuration),
      );
      expect(reducedMotionDuration).toBeLessThanOrEqual(0.001);

      const atlasTab = minimumLandmarks.visualization.getByRole('tab', {
        name: 'Atlas',
      });
      await atlasTab.focus();
      await page.keyboard.press('ArrowRight');
      const neighborsTab = minimumLandmarks.visualization.getByRole('tab', {
        name: 'Neighbors',
      });
      await expect(neighborsTab).toBeFocused();
      await expect(neighborsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  test('REQ-VV-015 preserves a dark-theme Atlas state without approving a baseline', async ({ page }) => {
    await expectBrowserClean(page, 'http://127.0.0.1:4196/', async () => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await selectSample(page, 'ready', 'dark');
      await expect(landmarks(page).visualization).toBeVisible();
      await expect(page.locator('body')).toHaveClass(/theme_DARK/);
      await expect(landmarks(page).visualization).toHaveAttribute('data-visualizer-state', 'ready');
    });
  });

  for (const state of ['loading', 'empty', 'error'] as const) {
    test(`REQ-VV-015 enters the ${state} state before visual acceptance`, async ({ page }) => {
      await expectBrowserClean(page, 'http://127.0.0.1:4196/', async () => {
        await page.setViewportSize({ width: 1440, height: 900 });
        await selectSample(page, state);
        await expect(landmarks(page).visualization).toHaveAttribute('data-visualizer-state', state);
        await expect(landmarks(page).visualization.getByTestId('vector-visualizer-state-slot')).toBeVisible();
      });
    });
  }

  test('uses the configured full RedisInsight route when an app environment is supplied', async ({ page }) => {
    test.skip(
      !realAppBaseUrl || !realAppApiOrigin || !realAppInstanceId || !realAppVectorSetKey,
      'Environment gate: set E1_REAL_APP_BASE_URL, E1_REAL_APP_API_ORIGIN, E1_REAL_APP_INSTANCE_ID, and E1_REAL_APP_VECTOR_SET_KEY.',
    );
    const baseUrl = realAppBaseUrl!;
    const vectorSetKey = realAppVectorSetKey!;
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(new URL(`/${realAppInstanceId}/browser`, baseUrl).toString());
    await page.getByTestId('view-type-browser-btn').click();
    await page.getByPlaceholder('Filter by Key Name or Pattern').fill(vectorSetKey);
    await page.getByTestId('search-btn').click();
    await page.getByRole('gridcell', { name: vectorSetKey, exact: true }).click();
    await page.getByTestId('vector-set-visualize-btn').click();
    await expect(page).toHaveURL(new RegExp(`/${realAppInstanceId}/vector-visualizer$`));

    await expectBrowserClean(page, [new URL(baseUrl).origin, realAppApiOrigin!], async () => {
      await expectDesktopWorkspace(landmarks(page));
      await expectNoReadyStatePageOverflow(page);
      await page.getByRole('button', { name: 'Sample vectors' }).click();
      const { visualization, resultsInspector } = landmarks(page);
      const liveAtlas = visualization
        .getByRole('tabpanel', { name: 'Atlas' })
        .getByLabel('Atlas plot; use the linked selection table for keyboard navigation');
      await expect(liveAtlas).toHaveAttribute('data-point-count', /^[1-9]\d*$/);
      await expect(liveAtlas).toHaveAttribute('data-colored-point-count', /^[1-9]\d*$/);
      const liveColorBy = page.getByRole('combobox', { name: 'Color by' });
      await expect(liveColorBy).toContainText('category');
      await liveColorBy.click();
      await expect(page.getByRole('option', { name: 'published' })).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(
        page.getByTestId('vector-visualizer-controls').getByRole('switch', {
          name: 'Show cluster labels',
        }),
      ).toBeChecked();
      const liveAtlasPanel = visualization.getByRole('tabpanel', { name: 'Atlas' });
      await expect(liveAtlasPanel.getByText('UMAP 1 · derived coordinate')).toBeVisible();
      await expect(liveAtlasPanel.getByText('UMAP 2 · derived coordinate')).toBeVisible();
      const liveClusterLabels = liveAtlasPanel.getByLabel(/cluster label$/);
      await expect.poll(() => liveClusterLabels.count()).toBeGreaterThan(1);
      const liveClusterLabelBoxes = await liveClusterLabels.evaluateAll((labels) =>
        labels.map((label) => {
          const bounds = label.getBoundingClientRect();
          return {
            left: bounds.left,
            right: bounds.right,
            top: bounds.top,
            bottom: bounds.bottom,
          };
        }),
      );
      for (let leftIndex = 0; leftIndex < liveClusterLabelBoxes.length; leftIndex += 1) {
        for (let rightIndex = leftIndex + 1; rightIndex < liveClusterLabelBoxes.length; rightIndex += 1) {
          const left = liveClusterLabelBoxes[leftIndex];
          const right = liveClusterLabelBoxes[rightIndex];
          const overlaps =
            left.left < right.right && left.right > right.left && left.top < right.bottom && left.bottom > right.top;
          expect(overlaps).toBe(false);
        }
      }
      await expect(
        resultsInspector.getByTestId('vector-visualizer-results-table-scroll').getByRole('grid'),
      ).toHaveAttribute('aria-colcount', '1');
      await expect(page.getByTestId('vector-visualizer-page-context')).toContainText('Fresh sample');
      await expect(visualization).not.toContainText('Fresh sample');
      await expect(
        page.getByTestId('vector-visualizer-controls').getByRole('button', { name: 'Projection' }),
      ).toHaveCount(0);
      await page.screenshot({ path: '/tmp/e5-r8-atlas-real-route-1440x900.png' });
      await resultsInspector.getByRole('row').nth(1).click();
      await visualization.getByRole('tab', { name: 'Neighbors' }).click();
      const liveNeighborHeading = visualization.getByRole('heading', { name: /Neighbors of / });
      await expect(liveNeighborHeading).toBeVisible();
      const liveAnchorId = (await liveNeighborHeading.textContent())?.replace('Neighbors of ', '') ?? '';
      await expect(visualization.getByRole('heading', { name: 'Retrieval debugger' })).toHaveCount(0);
      await expect(visualization.getByRole('heading', { name: 'Returned results' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Run selected anchor query' }).click();
      await expect(visualization.getByLabel('Query-centered radial neighbor layout')).toHaveAttribute(
        'data-neighbor-count',
        /^[1-9]\d*$/,
      );
      await expect(visualization.getByLabel(/metric threshold ring/)).toHaveCount(3);
      await expect(visualization.getByRole('button', { name: `Select query anchor ${liveAnchorId}` })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      await expect(visualization.getByRole('button', { name: `Select ${liveAnchorId}`, exact: true })).toHaveCount(0);
      await page.screenshot({ path: '/tmp/e5-r5-neighbors-real-route-1440x900.png' });
      await visualization.getByRole('tab', { name: 'Selection' }).click();
      const liveSelectionCanvas = visualization
        .getByRole('tabpanel', { name: 'Selection' })
        .getByLabel('Selection plot; drag to select a region; use the linked selection table for keyboard navigation');
      await expect(liveSelectionCanvas).toBeVisible();
      await expect(liveSelectionCanvas).toHaveAttribute('data-selection-mode', 'region');
      const liveSelectionCanvasBox = await liveSelectionCanvas.boundingBox();
      expect(liveSelectionCanvasBox).not.toBeNull();
      await page.mouse.move(
        liveSelectionCanvasBox!.x + liveSelectionCanvasBox!.width * 0.1,
        liveSelectionCanvasBox!.y + liveSelectionCanvasBox!.height * 0.12,
      );
      await page.mouse.down();
      await page.mouse.move(
        liveSelectionCanvasBox!.x + liveSelectionCanvasBox!.width * 0.65,
        liveSelectionCanvasBox!.y + liveSelectionCanvasBox!.height * 0.82,
      );
      await page.mouse.up();
      await expect.poll(async () => Number(await visualization.getAttribute('data-selected-count'))).toBeGreaterThan(1);
      await expect(visualization.getByLabel('Selected region bounds')).toBeVisible();
      await expect(resultsInspector.getByRole('heading', { name: 'Selected elements' })).toBeVisible();
      await page.screenshot({ path: '/tmp/e5-r7-selection-real-route-1440x900.png' });
      await visualization.getByRole('tab', { name: 'Atlas' }).click();
      await page.screenshot({ path: '/tmp/e5-r4-real-route-1440x900.png' });
    });
  });
});
