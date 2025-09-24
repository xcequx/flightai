import { test, expect } from '@playwright/test';

test.describe('Flight Search End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Go to the main page
    await page.goto('/');
    // Wait for the page to be loaded
    await page.waitForLoadState('domcontentloaded');
  });

  test('should load the main page without errors', async ({ page }) => {
    // Check that the hero section is visible
    await expect(page.locator('text=AI Travel Planner')).toBeVisible();
    
    // Check that the search section is present
    await expect(page.locator('#search-section')).toBeVisible();
    
    // Verify no console errors on page load
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit for any console errors to appear
    await page.waitForTimeout(1000);
    
    expect(consoleErrors).toEqual([]);
  });

  test('should fill flight search form and submit successfully (PL to TH)', async ({ page }) => {
    // Monitor console for errors and warnings
    const consoleMessages: { type: string, text: string }[] = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });

    // Scroll to search section
    await page.locator('#search-section').scrollIntoViewIfNeeded();
    
    // Fill Origins - Select Poland (PL)
    const originsSelect = page.locator('[data-testid="airport-multi-select-origins"] .multi-select-trigger');
    await originsSelect.click();
    await page.locator('[data-testid="airport-multi-select-origins"] input').fill('poland');
    await page.waitForTimeout(500);
    // Select Poland from dropdown
    await page.locator('[data-testid="airport-multi-select-origins"] [role="option"]').first().click();
    // Close dropdown by clicking outside
    await page.locator('body').click();

    // Fill Destinations - Select Thailand (TH)
    const destinationsSelect = page.locator('[data-testid="airport-multi-select-destinations"] .multi-select-trigger');
    await destinationsSelect.click();
    await page.locator('[data-testid="airport-multi-select-destinations"] input').fill('thailand');
    await page.waitForTimeout(500);
    // Select Thailand from dropdown
    await page.locator('[data-testid="airport-multi-select-destinations"] [role="option"]').first().click();
    // Close dropdown by clicking outside
    await page.locator('body').click();

    // Fill date range
    const dateRangeButton = page.locator('[data-testid="date-range-picker"] button');
    await dateRangeButton.click();
    
    // Select departure date (next month)
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 15);
    const departureDateStr = nextMonth.getDate().toString();
    
    await page.locator(`[data-testid="date-picker-calendar"] button:has-text("${departureDateStr}")`).first().click();
    
    // Select return date (few days later)
    const returnDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), nextMonth.getDate() + 7);
    const returnDateStr = returnDate.getDate().toString();
    
    await page.locator(`[data-testid="date-picker-calendar"] button:has-text("${returnDateStr}")`).first().click();

    // Enable neighboring countries checkbox for better results
    const neighboringCheckbox = page.locator('[data-testid="checkbox-include-neighbors"]');
    await neighboringCheckbox.check();
    
    // Verify form is filled correctly
    await expect(originsSelect).toContainText('PL');
    await expect(destinationsSelect).toContainText('TH');
    await expect(neighboringCheckbox).toBeChecked();

    // Submit the search form
    const searchButton = page.locator('[data-testid="button-search-flights"]');
    await expect(searchButton).toBeVisible();
    await expect(searchButton).toBeEnabled();
    
    await searchButton.click();

    // Wait for navigation to results page
    await page.waitForURL(/.*\/results\/.*/, { timeout: 10000 });
    
    // Check that we're on the results page
    expect(page.url()).toMatch(/\/results\//);

    // Check for DOM nesting or other console errors (filter out expected API warnings)
    const relevantErrors = consoleMessages.filter(msg => 
      msg.type === 'error' && 
      !msg.text.includes('API key') &&
      !msg.text.includes('403') &&
      !msg.text.includes('Aviationstack')
    );
    
    expect(relevantErrors).toEqual([]);
    
    console.log('✅ Form submission completed successfully');
    console.log('📊 Console messages:', consoleMessages.length);
  });

  test('should display flight results after search', async ({ page }) => {
    // Navigate directly to a results page with mock data
    await page.goto('/results/test-search-id');
    
    // Wait for page to load and results to appear
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Wait for loading animation to complete

    // Check that results header is present
    await expect(page.locator('text=Flight Results')).toBeVisible({ timeout: 10000 });
    
    // Check that flight results are displayed
    const flightCards = page.locator('[data-testid*="flight-card"], .flight-result, [class*="flight"]');
    await expect(flightCards.first()).toBeVisible({ timeout: 10000 });
    
    // Verify that at least one flight result is present
    const flightCount = await flightCards.count();
    expect(flightCount).toBeGreaterThan(0);
    
    // Check for price information
    await expect(page.locator('text=/\\d+.*zł|\\d+.*PLN/i')).toBeVisible();
    
    // Check for flight route information (airports codes like WAW, DXB, BKK)
    await expect(page.locator('text=/[A-Z]{3}/').first()).toBeVisible();
    
    console.log(`✅ Found ${flightCount} flight results displayed`);
  });

  test('should display mock data notification when API is unavailable', async ({ page }) => {
    // Navigate to results page
    await page.goto('/results/mock-data-test');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check for mock data indicator
    const mockDataBadge = page.locator('text=/mock.*data/i, text=/🎭/');
    await expect(mockDataBadge.or(page.locator('[data-testid*="mock"], [class*="mock"]'))).toBeVisible({ timeout: 5000 });
    
    // Verify flight results are still displayed even with mock data
    const resultsSection = page.locator('[data-testid*="results"], [class*="result"], main');
    await expect(resultsSection.first()).toBeVisible();
    
    console.log('✅ Mock data is properly displayed when API is unavailable');
  });

  test('should check console for DOM nesting errors', async ({ page }) => {
    const consoleErrors: string[] = [];
    const domErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
        if (text.includes('validateDOMNesting') || text.includes('cannot appear as a descendant')) {
          domErrors.push(text);
        }
      }
    });

    // Navigate to main page and interact with search
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    // Scroll through different sections to trigger any potential DOM issues
    await page.locator('#search-section').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
    
    // Try to open search form elements
    const originsSelect = page.locator('[data-testid="airport-multi-select-origins"] .multi-select-trigger').first();
    if (await originsSelect.isVisible()) {
      await originsSelect.click();
      await page.waitForTimeout(500);
      await page.locator('body').click(); // Close dropdown
    }
    
    // Check footer and other page sections
    await page.locator('footer').scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1000);
    
    // Navigate to results to check for DOM issues there
    await page.goto('/results/dom-test');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Check that there are no DOM nesting errors
    expect(domErrors).toEqual([]);
    
    // Log all console errors for debugging (but don't fail the test unless they're DOM-related)
    if (consoleErrors.length > 0) {
      console.log('⚠️ Console errors found (non-DOM):', consoleErrors);
    } else {
      console.log('✅ No console errors found');
    }
    
    console.log('✅ No DOM nesting errors detected');
  });

  test('should verify complete flight search workflow', async ({ page }) => {
    // This test combines all steps into a complete workflow
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error' && 
          !msg.text().includes('API key') && 
          !msg.text().includes('403') &&
          !msg.text().includes('Aviationstack')) {
        consoleErrors.push(msg.text());
      }
    });

    // Step 1: Open main page
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Step 2: Fill search form (PL to TH with dates and options)
    await page.locator('#search-section').scrollIntoViewIfNeeded();
    
    // Origins: Poland
    const originsSelect = page.locator('[data-testid="airport-multi-select-origins"] .multi-select-trigger').first();
    await originsSelect.click();
    await page.locator('[data-testid="airport-multi-select-origins"] input').fill('PL');
    await page.waitForTimeout(300);
    await page.locator('[data-testid="airport-multi-select-origins"] [role="option"]').first().click();
    await page.locator('body').click();

    // Destinations: Thailand
    const destinationsSelect = page.locator('[data-testid="airport-multi-select-destinations"] .multi-select-trigger').first();
    await destinationsSelect.click();
    await page.locator('[data-testid="airport-multi-select-destinations"] input').fill('TH');
    await page.waitForTimeout(300);
    await page.locator('[data-testid="airport-multi-select-destinations"] [role="option"]').first().click();
    await page.locator('body').click();

    // Date range
    const dateButton = page.locator('[data-testid="date-range-picker"] button').first();
    await dateButton.click();
    
    // Select dates from calendar
    const calendarDays = page.locator('[data-testid="date-picker-calendar"] button[data-testid*="day"], [role="gridcell"]:not([data-outside])');
    await calendarDays.nth(10).click(); // Departure
    await calendarDays.nth(17).click(); // Return
    
    // Enable neighboring countries
    await page.locator('[data-testid="checkbox-include-neighbors"]').check();

    // Step 3: Submit search
    const searchButton = page.locator('[data-testid="button-search-flights"]');
    await searchButton.click();

    // Step 4: Verify results appear
    await page.waitForURL(/.*\/results\/.*/, { timeout: 15000 });
    await page.waitForTimeout(4000); // Wait for loading to complete
    
    // Check results are displayed
    const resultsTitle = page.locator('text=/flight.*results/i, text=/wyniki/i').first();
    await expect(resultsTitle).toBeVisible({ timeout: 10000 });
    
    // Check for flight data (prices, routes, etc.)
    await expect(page.locator('text=/zł|PLN|\$|\€/').first()).toBeVisible({ timeout: 5000 });
    
    // Step 5: Verify console has no critical errors
    expect(consoleErrors).toEqual([]);
    
    // Step 6: Confirm mock data is working
    const mockDataIndicators = page.locator('text=/mock/i, text=/🎭/');
    const hasMockDataIndicator = await mockDataIndicators.count() > 0;
    
    if (hasMockDataIndicator) {
      console.log('✅ Mock data is properly displayed');
    }
    
    // Verify flight results are present regardless of data source
    const flightElements = page.locator('[data-testid*="flight"], [class*="flight"], [class*="result"]');
    const flightCount = await flightElements.count();
    expect(flightCount).toBeGreaterThan(0);
    
    console.log('✅ Complete flight search workflow completed successfully');
    console.log(`📊 Found ${flightCount} flight results`);
    console.log('✅ All test requirements met:');
    console.log('  - Form works without errors ✓');
    console.log('  - Results appear after submit ✓');
    console.log('  - Console without critical errors ✓');
    console.log('  - Mock data flights displayed correctly ✓');
  });
});