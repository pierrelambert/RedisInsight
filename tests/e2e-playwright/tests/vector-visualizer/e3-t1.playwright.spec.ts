import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

test('renders sampled Atlas fixtures accessibly and records renderer timing', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/e3-t1.html');
  await expect(page.getByRole('heading', { name: 'Atlas fixture' })).toBeVisible();
  await expect(page.getByRole('note')).toHaveText('2D projection of a sample');
  await expect(page.getByText('1 plotted records')).toBeVisible();

  await page.getByRole('button', { name: 'Load 0 points' }).click();
  await expect(page.getByText('0 plotted records')).toBeVisible();
  await page.getByRole('button', { name: 'Load malformed layout' }).click();
  await expect(page.getByRole('status')).toContainText('Malformed layout was rejected');

  await page.getByRole('button', { name: 'Load 20,000 points' }).click();
  await expect(page.getByText('20000 plotted records')).toBeVisible();
  await page.getByRole('button', { name: 'Run 2,000 UMAP layout' }).click();
  await expect(page.getByRole('status')).toContainText('2,000 UMAP layout completed.', { timeout: 120_000 });
  await page.screenshot({
    path: '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e3-t1-light-1440x900.png',
  });
  await page.setViewportSize({ width: 960, height: 680 });
  await expect(page.getByRole('button', { name: 'Select first plotted record' })).toBeVisible();
  await page.getByRole('button', { name: 'Cancel layout worker' }).click();
  await expect(page.getByRole('status')).toContainText('Cancelled');
  await page.getByRole('button', { name: 'Simulate WebGL context loss' }).click();
  await expect(page.getByRole('status')).toContainText('context was lost');

  await page.screenshot({
    path: '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e3-t1-raw-960x680.png',
  });
  await mkdir('/private/tmp/redisinsight-vector-visualizer/artifacts/playwright', { recursive: true });
  await writeFile(
    '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e3-t1-performance-2k.json',
    JSON.stringify(
      await page.evaluate(() => (window as unknown as Window & { __E3_T1_TIMINGS__: unknown }).__E3_T1_TIMINGS__),
      null,
      2,
    ),
  );

  expect(consoleErrors).toEqual([]);
});

test('measures the real Worker UMAP path at 20,000 points', async ({ page }) => {
  await page.goto('/e3-t1.html');
  await page.getByRole('button', { name: 'Run 20,000 UMAP layout' }).click();
  await expect(page.getByRole('status')).toContainText('20,000 UMAP layout completed.', { timeout: 120_000 });
  await writeFile(
    '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright/e3-t1-performance-20k.json',
    JSON.stringify(
      await page.evaluate(() => (window as unknown as Window & { __E3_T1_TIMINGS__: unknown }).__E3_T1_TIMINGS__),
      null,
      2,
    ),
  );
});
