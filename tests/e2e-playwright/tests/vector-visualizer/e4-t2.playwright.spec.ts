import { expect, test } from '@playwright/test';

const shot = (name: string) => `/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e4-t2-${name}.png`;
for (const [theme, width, height] of [
  ['light', 1440, 900],
  ['dark', 390, 844],
] as const) {
  test(`advanced evidence ${theme} ${width}x${height}`, async ({ page }) => {
    const consoleErrors: string[] = [];
    const requests: string[] = [];
    page.on('console', (message) => message.type() === 'error' && consoleErrors.push(message.text()));
    page.on('request', (request) => request.url().startsWith('http') && requests.push(request.url()));
    await page.setViewportSize({ width, height });
    await page.goto(`/src/advanced/e4-t2.html?source=vector-set&theme=${theme}`);
    await expect(page.locator('body')).toHaveClass(theme === 'dark' ? 'theme_DARK' : 'theme_LIGHT');
    await expect(page.getByText('VLINKS topology')).toBeVisible();
    await page.getByRole('button', { name: 'Select node:a' }).click();
    await expect(page.getByRole('status')).toHaveText('Selected node:a');
    await page.screenshot({
      path: shot(`vector-${theme}-${width}x${height}`),
      fullPage: true,
    });
    await page.goto(`/src/advanced/e4-t2.html?source=search&status=acl-unavailable&theme=${theme}`);
    await expect(page.getByText('Search topology unavailable')).toBeVisible();
    await expect(page.getByText('Redis ACLs do not allow this Advanced evidence.')).toBeVisible();
    await expect(page.getByText('Execution profile, not HNSW traversal.')).toBeVisible();
    await page.screenshot({
      path: shot(`search-acl-${theme}-${width}x${height}`),
      fullPage: true,
    });
    expect(consoleErrors).toEqual([]);
    expect(
      requests.filter(
        (url) =>
          !url.includes('127.0.0.1:4184') &&
          !url.includes('fonts.googleapis.com') &&
          !url.includes('fonts.gstatic.com'),
      ),
    ).toEqual([]);
  });
}
