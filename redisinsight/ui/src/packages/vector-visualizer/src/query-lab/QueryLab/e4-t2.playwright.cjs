const { expect, test } = require('@playwright/test');

const desktopViewports = [
  { name: 'reference light', theme: 'light', width: 1440, height: 900 },
  { name: 'minimum dark', theme: 'dark', width: 960, height: 680 },
];
const FIXTURE_ORIGIN = 'http://127.0.0.1:4192';

const observeBrowserSignals = (page) => {
  const consoleErrors = [];
  const failedRequests = [];
  const sameOriginErrorResponses = [];
  const outboundErrorResponses = [];
  const faviconResponses = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('requestfailed', (request) => failedRequests.push(request.url()));
  page.on('response', (response) => {
    const responseUrl = new URL(response.url());
    const responseDetail = `${response.status()} ${response.url()}`;

    if (responseUrl.pathname === '/favicon.ico') {
      faviconResponses.push(responseDetail);
    }
    if (response.status() < 400) return;
    if (responseUrl.origin === FIXTURE_ORIGIN) {
      sameOriginErrorResponses.push(responseDetail);
      return;
    }
    outboundErrorResponses.push(responseDetail);
  });

  return {
    consoleErrors,
    failedRequests,
    faviconResponses,
    outboundErrorResponses,
    sameOriginErrorResponses,
  };
};

const expectSettledBrowserSignals = async (page, signals) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => resolve())),
  );

  expect(signals.consoleErrors).toEqual([]);
  expect(signals.failedRequests).toEqual([]);
  expect(signals.sameOriginErrorResponses).toEqual([]);
  expect(signals.outboundErrorResponses).toEqual([]);
  expect(
    signals.faviconResponses.every((response) => !response.startsWith('4')),
  ).toBe(true);
};

const workspaceGeometry = (workspace) => {
  const [evidence, inspector] = Array.from(workspace.children).map((child) =>
    child.getBoundingClientRect(),
  );
  const bounds = workspace.getBoundingClientRect();

  return {
    documentHeight: document.documentElement.scrollHeight,
    evidence: {
      bottom: evidence.bottom,
      left: evidence.left,
      right: evidence.right,
      top: evidence.top,
    },
    inspector: {
      bottom: inspector.bottom,
      left: inspector.left,
      right: inspector.right,
      top: inspector.top,
    },
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
    workspace: {
      bottom: bounds.bottom,
      left: bounds.left,
      right: bounds.right,
      top: bounds.top,
    },
  };
};

const expectDesktopWorkspaceToFit = (geometry) => {
  expect(geometry.documentHeight).toBeLessThanOrEqual(geometry.viewportHeight);
  [geometry.workspace, geometry.evidence, geometry.inspector].forEach(
    (bounds) => {
      expect(bounds.top).toBeGreaterThanOrEqual(0);
      expect(bounds.left).toBeGreaterThanOrEqual(0);
      expect(bounds.bottom).toBeLessThanOrEqual(geometry.viewportHeight);
      expect(bounds.right).toBeLessThanOrEqual(geometry.viewportWidth);
    },
  );
};

desktopViewports.forEach(({ name, theme, width, height }) => {
  test(`renders the ${name} Workbench evidence workspace`, async ({ page }) => {
    const signals = observeBrowserSignals(page);

    await page.setViewportSize({ width, height });
    await page.goto(`/src/query-lab/QueryLab/e4-t2.html?theme=${theme}`);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('link[rel="icon"]')).toHaveAttribute(
      'href',
      /^data:image\//,
    );

    await expect(page.locator('body')).toHaveClass(
      theme === 'dark' ? 'theme_DARK' : 'theme_LIGHT',
    );
    await expect(
      page.getByRole('heading', { name: 'Response evidence' }),
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Returned results' }),
    ).toBeVisible();
    await expect(
      page.getByText('Atlas is unavailable in Workbench'),
    ).toBeVisible();

    const geometry = await page
      .getByTestId('query-lab-workspace')
      .evaluate(workspaceGeometry);

    expect(geometry.evidence.right - geometry.evidence.left).toBeGreaterThan(
      geometry.inspector.right - geometry.inspector.left,
    );
    expectDesktopWorkspaceToFit(geometry);

    const inspectorBefore = geometry.inspector;
    const evidenceScrollport = page.getByTestId(
      'query-lab-evidence-scrollport',
    );
    const distributionBin = page.getByRole('button', {
      name: /Distribution bin 1/i,
    });
    await distributionBin.focus();
    await expect(distributionBin).toBeFocused();
    await expect(distributionBin).toBeVisible();
    await evidenceScrollport.evaluate((scrollport) => {
      scrollport.scrollTop = scrollport.scrollHeight;
    });
    const scrollportState = await evidenceScrollport.evaluate((scrollport) => ({
      clientHeight: scrollport.clientHeight,
      panel: scrollport.parentElement?.getBoundingClientRect().toJSON(),
      rect: scrollport.getBoundingClientRect().toJSON(),
      scrollHeight: scrollport.scrollHeight,
      scrollTop: scrollport.scrollTop,
    }));
    expect(scrollportState.scrollHeight).toBeGreaterThan(
      scrollportState.clientHeight,
    );
    expect(scrollportState.scrollTop).toBeGreaterThan(0);

    const inspectorAfter = await page
      .getByRole('complementary', { name: 'Returned results' })
      .evaluate((inspector) => inspector.getBoundingClientRect().toJSON());
    expect(inspectorAfter).toMatchObject(inspectorBefore);

    const grid = page.getByRole('grid', { name: 'Virtualized selection' });
    await grid.focus();
    await grid.press('ArrowDown');
    await expect(page.getByRole('status')).toContainText('Selected doc:987');

    await page.screenshot({
      path: `/tmp/vector-visualizer-e4-t2-${theme}-${width}x${height}.png`,
      fullPage: false,
    });

    await expectSettledBrowserSignals(page, signals);
  });
});

test('renders empty and failed Workbench results as coherent state panels', async ({
  page,
}) => {
  for (const state of ['empty', 'failed']) {
    const signals = observeBrowserSignals(page);
    await page.setViewportSize({ width: 960, height: 680 });
    await page.goto(`/src/query-lab/QueryLab/e4-t2.html?state=${state}`);
    await expect(
      page.getByRole('heading', { name: 'Response unavailable' }),
    ).toBeVisible();
    await expect(page.getByLabel('Workbench result status')).toBeVisible();
    const statePanel = await page
      .getByLabel('Workbench result status')
      .evaluate((panel) => ({
        documentHeight: document.documentElement.scrollHeight,
        panel: panel.getBoundingClientRect().toJSON(),
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      }));
    expect(statePanel.documentHeight).toBeLessThanOrEqual(
      statePanel.viewportHeight,
    );
    expect(statePanel.panel.bottom).toBeLessThanOrEqual(
      statePanel.viewportHeight,
    );
    expect(statePanel.panel.right).toBeLessThanOrEqual(
      statePanel.viewportWidth,
    );
    await expectSettledBrowserSignals(page, signals);
  }
});
