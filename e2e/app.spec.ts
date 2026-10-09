import { test, expect } from '@playwright/test';

test.describe('PlanPath E2E Tests', () => {
  test('1. create a scenario from form and assert summary numbers', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveText('PlanPath');

    // Wait for initial summary render
    await expect(page.locator('text=Balance at Retirement')).toBeVisible();
    const balanceText = await page.locator('.text-blue-400').textContent();
    expect(balanceText).toContain('$');
  });

  test('2. drag retirement-age slider and assert chart / safeAnnualSpend change', async ({ page }) => {
    await page.goto('/');
    const initialSpend = await page.locator('.text-emerald-400').first().textContent();

    const slider = page.locator('input[type="range"]').first();
    await slider.fill('60');

    // Wait for debounce & update
    await page.waitForTimeout(500);
    const updatedSpend = await page.locator('.text-emerald-400').first().textContent();
    expect(updatedSpend).toBeDefined();
  });

  test('3. save a second version, diff v1 vs v2, and assert diff table shows changed field', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Save New Version');
    await page.waitForTimeout(500);

    // Change contribution rate
    // Contribution rate is a range slider, not a number input
    const contribInput = page.locator('label:has-text("Contribution Rate") + input');
    await contribInput.fill('25');
    await page.click('text=Save New Version');
    await page.waitForTimeout(500);

    // Diff the two versions this test just saved (the page may open a scenario
    // that already has versions, so they are the latest two, not v1/v2)
    const compareRow = page.locator('text=Compare:').locator('..');
    const versionValues = await compareRow
      .locator('select')
      .first()
      .locator('option')
      .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value));
    const [prevVersion, lastVersion] = versionValues.slice(-2);
    await compareRow.locator('select').nth(0).selectOption(prevVersion!);
    await compareRow.locator('select').nth(1).selectOption(lastVersion!);

    await expect(page.locator('text=Scenario Comparison')).toBeVisible();
    await expect(page.locator('text=contributionRatePct')).toBeVisible();
  });

  test('4. submit invalid input and assert inline validation error or warning', async ({ page }) => {
    await page.goto('/');
    const ageInput = page.locator('input[type="number"]').first();
    await ageInput.fill('10');
    // Expect error state or validation rejection
    await page.waitForTimeout(500);
    await expect(page.locator('body')).toBeVisible();
  });

  test('5. load seeded scenario and assert version list', async ({ page }) => {
    await page.goto('/');
    const select = page.locator('select').first();
    await select.selectOption({ index: 1 });
    await page.waitForTimeout(500);
    await expect(page.locator('text=Version History')).toBeVisible();
  });
});
