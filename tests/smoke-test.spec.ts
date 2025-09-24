import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Basic Functionality', () => {
  test('should load homepage without errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    // Check main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('#search-section')).toBeVisible();
    
    // Check for critical console errors (filter out known API warnings)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('API key') && 
      !error.includes('403') &&
      !error.includes('Aviationstack')
    );
    
    expect(criticalErrors).toEqual([]);
  });

  test('should navigate to results page', async ({ page }) => {
    await page.goto('/results/smoke-test');
    await page.waitForLoadState('domcontentloaded');
    
    // Should not crash and should show some content
    await expect(page.locator('body')).toBeVisible();
    
    // Should either show results or loading state
    const hasResults = await page.locator('text=/result|flight|loading/i').count() > 0;
    expect(hasResults).toBe(true);
  });

  test('should have working search form elements', async ({ page }) => {
    await page.goto('/');
    await page.locator('#search-section').scrollIntoViewIfNeeded();
    
    // Check that key form elements are present and interactive
    const originsField = page.locator('[data-testid*="airport-multi-select-origins"], input[placeholder*="origin" i]').first();
    const destinationsField = page.locator('[data-testid*="airport-multi-select-destinations"], input[placeholder*="destination" i]').first();
    const searchButton = page.locator('[data-testid*="search"], button[type="submit"], button:has-text("Search")').first();
    
    await expect(originsField).toBeVisible();
    await expect(destinationsField).toBeVisible();  
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();
  });
});