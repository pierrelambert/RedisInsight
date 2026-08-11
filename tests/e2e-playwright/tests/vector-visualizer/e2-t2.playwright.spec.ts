import { expect, Page, test } from '@playwright/test';

const artifacts = '/private/tmp/redisinsight-vector-visualizer/artifacts/playwright';
const indexInfoUrl = 'http://localhost:5540/api/databases/database-1/redisearch/info';

const observePage = (page: Page) => {
  const errors: string[] = [];
  const requests: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  return {
    errors,
    assertClean: () => {
      expect(errors).toEqual([]);
      expect(
        requests.filter(
          (url) =>
            !url.startsWith('http://127.0.0.1:4181/') &&
            url !== indexInfoUrl &&
            !url.startsWith('https://fonts.googleapis.com/') &&
            !url.startsWith('https://fonts.gstatic.com/'),
        ),
      ).toEqual([]);
    },
  };
};

const blockThemeFonts = (page: Page) =>
  page.route(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\//, (route) => route.fulfill({ status: 200, body: '' }));

const mockIndexInfo = (page: Page) =>
  page.route(indexInfoUrl, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        index_definition: { key_type: 'HASH', prefixes: ['product:'] },
        index_options: {},
        attributes: [
          { identifier: 'title', attribute: 'title', type: 'TEXT' },
          {
            identifier: 'embedding',
            attribute: 'embedding',
            type: 'VECTOR',
          },
          {
            identifier: 'image_embedding',
            attribute: 'image_embedding',
            type: 'VECTOR',
          },
        ],
        num_docs: '2',
        max_doc_id: '2',
        num_records: '2',
        num_terms: '0',
      }),
    }),
  );

for (const testCase of [
  { source: 'search', theme: 'light', width: 1440, height: 900 },
  { source: 'search', theme: 'dark', width: 390, height: 844 },
  { source: 'vector-set', theme: 'light', width: 1440, height: 900 },
  { source: 'vector-set', theme: 'dark', width: 390, height: 844 },
] as const) {
  test(`${testCase.source} native handoff in ${testCase.theme} at ${testCase.width}x${testCase.height}`, async ({
    page,
  }) => {
    const observation = observePage(page);
    await blockThemeFonts(page);
    await mockIndexInfo(page);
    await page.setViewportSize({
      width: testCase.width,
      height: testCase.height,
    });
    await page.goto(
      `/src/pages/vector-visualizer/e2-t2-fixture/e2-t2.html?source=${testCase.source}&theme=${testCase.theme}`,
    );
    await page.waitForLoadState('networkidle');
    expect(observation.errors).toEqual([]);
    await page.screenshot({
      path: `${artifacts}/e2-t2-entry-${testCase.source}-${testCase.theme}-${testCase.width}x${testCase.height}.png`,
      fullPage: true,
    });

    if (testCase.source === 'search') {
      await page
        .getByRole('button', {
          name: 'Visualize vectors for idx-products',
        })
        .click();
      await expect(page.getByTestId('vector-search-vector-field-picker')).toBeVisible();
      await page.screenshot({
        path: `${artifacts}/e2-t2-search-picker-${testCase.theme}-${testCase.width}x${testCase.height}.png`,
        fullPage: true,
      });
      await page.getByTestId('vector-search-visualize-field-embedding').click();
      await expect(page.getByTestId('vector-visualizer-native-host')).toContainText(
        'Source ready: Search index idx-products, vector field embedding.',
      );
    } else {
      await page.getByTestId('vector-set-visualize-btn').click();
      await expect(page.getByTestId('vector-visualizer-native-host')).toContainText(
        'Source ready: Vector Set key selected.',
      );
      await expect(page.locator('body')).not.toContainText('0,255,10');
    }

    await expect(page.getByTestId('fixture-location')).toHaveText('/instance-1/vector-visualizer');
    await expect(page.getByTestId('fixture-location')).not.toContainText('?');
    await page.screenshot({
      path: `${artifacts}/e2-t2-${testCase.source}-${testCase.theme}-${testCase.width}x${testCase.height}.png`,
      fullPage: true,
    });

    await page.getByRole('button', { name: 'Back to source' }).click();
    await expect(page.getByTestId('fixture-location')).toHaveText(
      testCase.source === 'search' ? '/instance-1/vector-search' : '/instance-1/browser',
    );
    if (testCase.source === 'search') {
      await expect(
        page.getByRole('button', {
          name: 'Visualize vectors for idx-products',
        }),
      ).toBeVisible();
    } else {
      await expect(page.getByTestId('vector-set-visualize-btn')).toBeVisible();
    }
    observation.assertClean();
  });
}

test('feature flag off preserves both existing native surfaces', async ({ page }) => {
  const observation = observePage(page);
  await blockThemeFonts(page);
  await mockIndexInfo(page);
  await page.goto('/src/pages/vector-visualizer/e2-t2-fixture/e2-t2.html?source=search&enabled=0');
  await expect(page.getByRole('button', { name: /Visualize vectors for/ })).toHaveCount(0);
  await page.goto('/src/pages/vector-visualizer/e2-t2-fixture/e2-t2.html?source=vector-set&enabled=0');
  await expect(page.getByTestId('vector-set-visualize-btn')).toHaveCount(0);
  observation.assertClean();
});
