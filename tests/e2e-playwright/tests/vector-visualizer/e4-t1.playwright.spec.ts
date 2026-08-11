import { expect, Page, test } from '@playwright/test';

const artifacts = '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright';

const observe = (page: Page) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  return () => {
    expect(errors).toEqual([]);
    expect(
      requests.filter(
        (url) =>
          !url.startsWith('http://127.0.0.1:4184/') &&
          !url.startsWith('https://fonts.googleapis.com/') &&
          !url.startsWith('https://fonts.gstatic.com/'),
      ),
    ).toEqual([]);
  };
};

const blockThemeFonts = (page: Page) =>
  page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, body: '' }));

for (const viewport of [
  { theme: 'light', width: 1440, height: 900 },
  { theme: 'dark', width: 390, height: 844 },
] as const) {
  test(`Compare and Tune ${viewport.theme} ${viewport.width}x${viewport.height}`, async ({ page }) => {
    const assertClean = observe(page);
    await blockThemeFonts(page);
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    });
    await page.goto(`/src/packages/vector-visualizer/src/compare/e4-t1.html?theme=${viewport.theme}`);
    await expect(page.getByText('Compatible manifests')).toBeVisible();
    await expect(page.getByText('Measured run: baseline')).toBeVisible();
    await page.screenshot({
      path: `${artifacts}/e4-t1-compatible-${viewport.theme}-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Incompatible drift' }).click();
    await expect(page.getByText('dimensions differ')).toBeVisible();
    await page.screenshot({
      path: `${artifacts}/e4-t1-incompatible-${viewport.theme}-${viewport.width}x${viewport.height}.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Compatible drift', exact: true }).click();
    await page.getByRole('button', { name: 'Preview truth benchmark' }).click();
    await expect(page.getByText('50 bounded comparisons')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel benchmark' }).click();
    await expect(page.getByText('No benchmark executed')).toBeVisible();
    await page.getByRole('button', { name: 'Preview truth benchmark' }).click();
    await page.getByRole('button', { name: 'Confirm read-only benchmark' }).click();
    await expect(page.getByText('Read-only benchmark confirmation captured')).toBeVisible();
    await page.getByRole('button', { name: 'Empty state' }).click();
    await expect(page.getByText('No comparable benchmark runs')).toBeVisible();
    await page.getByRole('button', { name: 'Unsupported state' }).click();
    await expect(page.getByText('Compare & Tune is unavailable for this source.')).toBeVisible();
    await page.getByRole('button', { name: 'Error state' }).click();
    await expect(page.getByText('Compare & Tune could not load. Retry.')).toBeVisible();
    assertClean();
  });
}
