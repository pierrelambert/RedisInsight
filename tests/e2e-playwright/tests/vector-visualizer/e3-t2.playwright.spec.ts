import { expect, test } from '@playwright/test';

const artifactDir = '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright';

test('proves actual Explore and Health components in both themes and viewports', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  for (const [theme, width, height] of [
    ['theme_LIGHT', 1440, 900],
    ['theme_LIGHT', 390, 844],
    ['theme_DARK', 1440, 900],
    ['theme_DARK', 390, 844],
  ] as const) {
    await page.setViewportSize({ width, height });
    await page.goto(`/e3-t2.html?theme=${theme}`);
    await expect(page.getByRole('heading', { name: 'Metadata × cluster count matrix' })).toBeVisible();
    const matrixCell = page.getByRole('button', {
      name: 'cluster-a, eu: 2 sampled records',
    });
    await matrixCell.focus();
    await matrixCell.press('Enter');
    await expect(page.getByText('Selected: a,b')).toBeVisible();
    await page.getByRole('button', { name: 'Inspect duplicate candidate group 1' }).click();
    await expect(page.getByText('Selected: a,b')).toBeVisible();
    await page.getByRole('button', { name: 'Inspect outlier candidate c' }).click();
    await expect(page.getByText('Selected: c')).toBeVisible();
    await page.screenshot({
      path: `${artifactDir}/e3-t2-${theme}-${width}x${height}.png`,
    });
    await page.getByRole('button', { name: 'Stale' }).click();
    await expect(page.getByText('Sampled count matrix is stale.')).toBeVisible();
    await page.getByRole('button', { name: 'Ready' }).click();
    await page.getByRole('button', { name: 'Unknown' }).click();
    await expect(page.getByText('Unknown candidate evidence')).toHaveCount(2);
    await expect(page.getByText(/No Healthy status is inferred/)).toHaveCount(2);
    await page.getByRole('button', { name: 'Ready' }).click();
    await page.getByRole('button', { name: 'Empty' }).click();
    await expect(page.getByText('No sampled records are available for the metadata matrix.')).toBeVisible();
    await page.screenshot({
      path: `${artifactDir}/e3-t2-states-${theme}-${width}x${height}.png`,
    });
  }
  expect(errors).toEqual([]);
});
