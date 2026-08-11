import { expect, test } from '@playwright/test';

test('renders the Atlas through the real RedisInsight ThemeProvider in both themes', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  const results: Record<string, { background: string; text: string; palette: string }> = {};
  for (const theme of ['theme_LIGHT', 'theme_DARK']) {
    await page.goto(`/e3-t1-product.html?theme=${theme}`);
    await expect(page.getByRole('heading', { name: 'Atlas product fixture' })).toBeVisible();
    await expect(page.getByLabel('Linked accessible selection')).toContainText('f: selected, outlier');
    await expect(page.getByText('Marker shapes:')).toBeVisible();
    const canvas = page.getByLabel(/Atlas plot/);
    results[theme] = await canvas.evaluate((element) => ({
      background: getComputedStyle(element).backgroundColor,
      text: getComputedStyle(document.querySelector('[data-testid="atlas-copy"]')!).color,
      palette: element.getAttribute('data-point-palette') ?? '',
    }));
    await page.screenshot({
      path: `/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e3-t1-product-${theme === 'theme_LIGHT' ? 'light' : 'dark'}-1440x900.png`,
      fullPage: true,
    });
  }

  expect(results.theme_LIGHT.background).not.toBe(results.theme_DARK.background);
  expect(results.theme_LIGHT.text).not.toBe(results.theme_DARK.text);
  expect(results.theme_LIGHT.palette).not.toBe(results.theme_DARK.palette);
  expect(consoleErrors).toEqual([]);
});
