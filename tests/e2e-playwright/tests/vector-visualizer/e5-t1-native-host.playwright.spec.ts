import { expect, Page, test } from '@playwright/test';

declare global {
  interface Window {
    __E5_T1_COMMAND_COUNT__?: number;
  }
}

const artifacts = '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright';

const observePage = (page: Page) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  return {
    assertClean: () => {
      expect(errors).toEqual([]);
      expect(requests.filter((url) => !url.startsWith('http://127.0.0.1:4185/'))).toEqual([]);
    },
  };
};

for (const scenario of [
  { source: 'search', theme: 'light', width: 1440, height: 900 },
  { source: 'vector-set', theme: 'dark', width: 960, height: 680 },
] as const) {
  test(`${scenario.source} samples explicitly in ${scenario.theme} mode`, async ({ page }) => {
    const observation = observePage(page);
    await page.setViewportSize({ width: scenario.width, height: scenario.height });
    await page.goto(
      `/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html?source=${scenario.source}&theme=${scenario.theme}`,
    );

    await expect(page.getByText('No Redis command is run when this workspace opens.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sample vectors' })).toBeVisible();
    await expect(page.locator('body')).toHaveClass(scenario.theme === 'dark' ? /theme_DARK/ : /theme_LIGHT/);
    await expect(page.getByLabel('Atlas').getByText('Explore is ready.')).toBeVisible();
    await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(0);

    await page.getByRole('button', { name: 'Sample vectors' }).click();
    await expect(page.getByRole('heading', { name: /^(Index|Vector set) atlas$/ })).toBeVisible();
    await expect(
      page
        .getByRole('tabpanel', { name: 'Atlas' })
        .getByLabel('Atlas plot; use the linked selection table for keyboard navigation'),
    ).toBeVisible();
    const resultsInspector = page.getByTestId('vector-visualizer-results-inspector');
    await expect(resultsInspector.getByRole('grid')).toHaveAttribute(
      'aria-rowcount',
      scenario.source === 'search' ? '97' : '5',
    );
    await expect(resultsInspector.getByRole('grid')).toHaveAttribute('aria-colcount', '1');
    const atlasPlot = page
      .getByRole('tabpanel', { name: 'Atlas' })
      .getByLabel('Atlas plot; use the linked selection table for keyboard navigation');
    await expect(atlasPlot).toHaveAttribute('data-point-count', scenario.source === 'search' ? '96' : '4');
    if (scenario.source === 'vector-set') {
      await expect(atlasPlot).toHaveAttribute('data-colored-point-count', '4');
      await expect(page.getByRole('combobox', { name: 'Color by' })).toContainText('category');
    }
    const atlasPanel = page.getByRole('tabpanel', { name: 'Atlas' });
    await atlasPanel.getByText('Atlas evidence and accessible point selection').click();
    await atlasPanel.getByText('Sample provenance and metadata configuration').click();
    await expect(atlasPanel.getByText('UMAP', { exact: true })).toBeVisible();
    await expect(page.getByTestId('vector-visualizer-controls').getByText('42', { exact: true })).toBeVisible();
    await expect(atlasPanel.getByText('Fresh', { exact: true })).toBeVisible();
    await expect(
      atlasPanel.getByText(
        scenario.source === 'search'
          ? /bounded-k-neighbor-preservation \(.+ at k=15; sample 96; sample exact; freshness unknown\)/
          : /bounded-k-neighbor-preservation \(.+ at k=3; sample 4; sample exact; freshness unknown\)/,
      ),
    ).toBeVisible();
    await expect(atlasPanel.getByText(scenario.source === 'search' ? /^hnsw$/i : /^int8$/i)).toBeVisible();
    if (scenario.source === 'vector-set') {
      await expect(atlasPanel.getByText('VINFO graph max level')).toBeVisible();
      await expect(atlasPanel.getByText(/topology fact only; not query traversal or Search parity/i)).toBeVisible();
    }
    await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(
      scenario.source === 'search' ? 3 : 13,
    );
    let sampleCommandCount = scenario.source === 'search' ? 3 : 13;
    if (scenario.source === 'search') {
      const colorBy = page.getByRole('combobox', { name: 'Color by' });
      await expect(colorBy).toContainText('region');
      await colorBy.click();
      await page.getByRole('option', { name: 'cluster' }).click();
      await atlasPanel.getByLabel('Authoritative cluster label field').fill('cluster');
      await page.getByRole('button', { name: 'Sample vectors' }).click();
      sampleCommandCount += 3;
      await expect(
        page.getByTestId('vector-visualizer-controls').getByText('Color by', {
          exact: true,
        }),
      ).toBeVisible();
      await expect(atlasPlot).toHaveAttribute('data-colored-point-count', '96');
      await expect(page.locator('body')).not.toContainText('fixture-private-value');
      await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(sampleCommandCount);
    }
    const selectedId = scenario.source === 'search' ? 'doc:1' : 'member:1';
    const neighborId = scenario.source === 'search' ? 'doc:2' : 'member:neighbor';
    const visualization = page.getByTestId('vector-visualizer-visualization');
    await resultsInspector.getByTestId(`vector-visualizer-selected-row-${selectedId}`).click();
    await expect(visualization).toHaveAttribute('data-selected-count', '1');
    await visualization.getByRole('tab', { name: 'Neighbors' }).click();
    await expect(visualization.getByRole('heading', { name: `Neighbors of ${selectedId}` })).toBeVisible();
    await expect(visualization.getByRole('heading', { name: 'Retrieval debugger' })).toHaveCount(0);
    await expect(visualization.getByRole('heading', { name: 'Returned results' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Run selected anchor query' })).toBeEnabled();
    await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(sampleCommandCount);
    await page.getByRole('button', { name: 'Run selected anchor query' }).click();
    const neighbor = page.getByRole('button', {
      name: `Select ${neighborId}`,
      exact: true,
    });
    await expect(neighbor).toBeVisible();
    await expect(neighbor).toHaveAttribute(
      'title',
      scenario.source === 'search' ? 'Distance: 0.02' : 'Similarity: 0.99',
    );
    await expect(visualization.getByLabel('Query-centered radial neighbor layout')).toHaveAttribute(
      'data-neighbor-count',
      scenario.source === 'search' ? '49' : '1',
    );
    await expect(visualization.getByLabel(/metric threshold ring/)).toHaveCount(3);
    await expect(visualization.getByRole('button', { name: `Select query anchor ${selectedId}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(visualization.getByRole('button', { name: `Select ${selectedId}`, exact: true })).toHaveCount(0);
    await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(sampleCommandCount + 1);
    await neighbor.click();
    await page.getByRole('tab', { name: 'Atlas' }).click();
    await expect(page.getByLabel('Selected IDs').first()).toContainText(neighborId);
    if (scenario.source === 'vector-set') {
      await resultsInspector.getByTestId('vector-visualizer-selected-row-member:1').click();
    }
    await page.getByText('Additional evidence workflows').click();
    await page.getByRole('button', { name: 'Health' }).click();
    if (scenario.source === 'search') {
      await expect(page.getByText(/maximum 200/)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Duplicate candidates', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Inspect duplicate candidate group 1' }).click();
      await expect(page.getByLabel('Health selected record inspector')).toContainText('doc:1');
      await expect(page.getByLabel('Health selected record inspector')).toContainText('doc:2');
      await expect(page.getByLabel('Health candidate rule').first()).toContainText(
        'connected components over original-space cosine similarity',
      );
      await page.getByRole('button', { name: 'Inspect outlier candidate doc:12' }).click();
      await expect(page.getByLabel('Health selected record inspector')).toContainText('doc:12');
      await page.screenshot({
        path: `${artifacts}/e5-t1-search-health-light-1440x900.png`,
        fullPage: true,
      });
    } else {
      await expect(page.getByLabel('Unknown candidate evidence').first()).toBeVisible();
    }
    await page.getByRole('button', { name: 'Compare & Tune' }).click();
    if (scenario.source === 'search') {
      await page.getByRole('button', { name: 'Save local sample manifest' }).click();
      await page.getByRole('button', { name: 'Save local sample manifest' }).click();
      await expect(page.getByText('Compatible manifests')).toBeVisible();
      await expect(page.getByText(/^cluster population:/i)).toContainText('(sampled)');
      await expect(page.getByText(/^vector norm:/i)).toContainText('(sampled)');
      await expect(page.getByText(/^metadata coverage:/i)).toContainText('(sampled)');
      await expect(page.getByText('No comparable measured Pareto evidence is available.')).toBeVisible();
      await page.screenshot({
        path: `${artifacts}/e5-t1-search-compare-light-1440x900.png`,
        fullPage: true,
      });
    } else {
      await page.getByRole('button', { name: 'Save local sample manifest' }).click();
      await page.getByRole('button', { name: 'Save local sample manifest' }).click();
      await expect(page.getByText('Compatible manifests')).toBeVisible();
      await expect(page.getByText('No comparable measured Pareto evidence is available.')).toBeVisible();
      await page.getByRole('button', { name: 'Preview truth benchmark' }).click();
      await expect(page.getByText(/VSIM TRUTH/)).toBeVisible();
      await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(sampleCommandCount + 1);
      await page.getByRole('button', { name: 'Confirm read-only benchmark' }).click();
      await expect(page.getByText(/Measured run:/)).toBeVisible();
      await expect(page.getByText(/measured ·/)).toBeVisible();
      await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(sampleCommandCount + 3);
      await page.screenshot({
        path: `${artifacts}/e5-t1-vector-set-benchmark-dark-960x680.png`,
        fullPage: true,
      });
      sampleCommandCount += 2;
    }
    await page.getByRole('button', { name: 'Advanced' }).click();
    if (scenario.source === 'search') {
      await expect(page.getByText('Search topology unavailable')).toBeVisible();
      await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(sampleCommandCount + 1);
    } else {
      await expect(page.getByRole('button', { name: 'Load selected VLINKS topology' })).toBeEnabled();
      await page.getByRole('button', { name: 'Load selected VLINKS topology' }).click();
      await expect(page.getByText('HNSW layer adjacency, not semantic nearest-neighbor truth.')).toBeVisible();
      await expect(page.getByText('Showing 2 of 2 adjacencies.')).toBeVisible();
      await expect(page.evaluate(() => window.__E5_T1_COMMAND_COUNT__)).resolves.toBe(sampleCommandCount + 2);
    }
    await page.screenshot({
      path: `${artifacts}/e5-t1-${scenario.source}-${scenario.theme}-${scenario.width}x${scenario.height}.png`,
      fullPage: true,
    });
    observation.assertClean();
  });
}

test('cancel and ACL states are visible without a stale Atlas', async ({ page }) => {
  const observation = observePage(page);
  await page.goto('/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html?source=search&mode=cancel');
  await page.getByRole('button', { name: 'Sample vectors' }).click();
  await expect(page.getByRole('button', { name: 'Cancel' })).toBeEnabled();
  await page.getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByTestId('vector-visualizer-state-slot')).toContainText(
    'Sampling was cancelled and raw vectors were cleared from memory.',
  );
  await expect(page.getByRole('heading', { name: /^(Index|Vector set) atlas$/ })).toHaveCount(0);

  await page.goto('/src/pages/vector-visualizer/e5-t1-fixture/e5-t1.html?source=search&mode=acl');
  await page.getByRole('button', { name: 'Sample vectors' }).click();
  await expect(page.getByTestId('vector-visualizer-state-slot')).toContainText(
    'Redis ACLs do not allow this sampling capability.',
  );
  observation.assertClean();
});
