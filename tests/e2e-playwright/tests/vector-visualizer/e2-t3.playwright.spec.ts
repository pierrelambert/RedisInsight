import { expect, Page, test } from '@playwright/test';

const assertCleanWorkbench = (page: Page) => {
  const consoleErrors: string[] = [];
  const requestUrls: string[] = [];
  page.on('console', (message: { type: () => string; text: () => string }) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => consoleErrors.push(error.message));
  page.on('request', (request: { url: () => string }) => requestUrls.push(request.url()));
  return {
    errors: consoleErrors,
    assertClean: () => {
      expect(consoleErrors).toEqual([]);
      expect(requestUrls.filter((url) => !url.startsWith('http://127.0.0.1:4179/'))).toEqual([]);
    },
  };
};

test('renders Phase 3 Workbench Query Lab in light and dark with linked selection', async ({ page }) => {
  const workbench = assertCleanWorkbench(page);
  for (const theme of ['light', 'dark']) {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/e2-t3.html?theme=${theme}&result=ready`);
    await page.waitForLoadState('networkidle');
    expect(workbench.errors).toEqual([]);
    await expect(page.getByRole('heading', { name: 'Vector Visualizer', level: 1 })).toBeVisible();
    await page.getByRole('button', { name: 'Select doc:2', exact: true }).click();
    await expect(page.getByRole('status')).toHaveText('Selected doc:2');
    await expect(page.getByRole('row', { name: /doc:2/ })).toHaveAttribute('aria-selected', 'true');
    await page.screenshot({
      path: `/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e2-t3-${theme}-1440x900.png`,
      fullPage: true,
    });
  }
  workbench.assertClean();
});

test('renders Redis-shaped aggregate, hybrid, and documented RESP2 profile evidence including stages', async ({
  page,
}) => {
  const workbench = assertCleanWorkbench(page);
  await page.setViewportSize({ width: 1440, height: 900 });

  for (const command of ['aggregate', 'hybrid']) {
    await page.goto(`/e2-t3.html?theme=light&result=ready&command=${command}`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('button', { name: 'Select doc:2', exact: true })).toBeVisible();
    await expect(page.getByText('Distance', { exact: true }).first()).toBeVisible();
  }

  await page.goto('/e2-t3.html?theme=dark&result=ready&command=profile');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Measured Search profile' })).toBeVisible();
  await expect(page.getByText('Returned iterator stages')).toBeVisible();
  await expect(page.getByText('WILDCARD · count: 10')).toBeVisible();

  await page.goto('/e2-t3.html?theme=dark&result=ready&command=profile-hybrid');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: 'Measured Search profile' })).toBeVisible();
  await expect(page.getByText('WILDCARD · count: 10')).toBeVisible();

  await page.goto('/e2-t3.html?theme=light&result=ready&command=vsim');
  await page.waitForLoadState('networkidle');
  await expect(page.getByText('Approximate result')).toBeVisible();
  workbench.assertClean();
});

test('renders ready, empty, and failure states at the minimum desktop window', async ({ page }) => {
  const workbench = assertCleanWorkbench(page);
  await page.setViewportSize({ width: 960, height: 680 });
  await page.goto('/e2-t3.html?theme=dark&result=ready&command=profile');
  await page.waitForLoadState('networkidle');
  await expect(page.getByLabel('Query-centered radial neighbor layout')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Measured Search profile' })).toBeVisible();
  await page.screenshot({
    path: '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e2-t3-minimum-desktop-ready-960x680.png',
    fullPage: true,
  });
  await page.goto('/e2-t3.html?theme=dark&result=empty');
  await page.waitForLoadState('networkidle');
  expect(workbench.errors).toEqual([]);
  await expect(page.getByText('without rows to visualize')).toBeVisible();
  await page.goto('/e2-t3.html?theme=light&result=fail');
  await expect(page.getByText('The command failed')).toBeVisible();
  await page.screenshot({
    path: '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e2-t3-minimum-desktop-fail-960x680.png',
    fullPage: true,
  });
  workbench.assertClean();
});
