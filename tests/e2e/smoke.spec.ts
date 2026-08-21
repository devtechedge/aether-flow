import { expect, test } from '@playwright/test';

test.describe('AetherFlow smoke', () => {
  test('renders the IDE shell and default pipeline', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('app-header')).toContainText('AetherFlow IDE');
    await expect(page.getByTestId('graph-canvas')).toBeVisible();
    await expect(page.getByTestId('node-palette')).toBeVisible();
    await expect(page.getByText('Pipeline Entry')).toBeVisible();
    await expect(page.getByText('Gemini AutoReply')).toBeVisible();
  });

  test('compiles and runs the default pipeline in mock mode', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('run-pipeline').click();
    await expect(page.getByTestId('console-log')).toContainText(/Compilation complete|Pipeline simulation/i, {
      timeout: 15_000,
    });
    await expect(page.getByTestId('console-log')).toContainText(/Sandbox|Gemini|Pipeline/i, {
      timeout: 20_000,
    });
  });

  test('switches to version control and shows the default branch', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('tab-git').click();
    await expect(page.getByTestId('version-control')).toBeVisible();
    await expect(page.getByTestId('version-control')).toContainText('main');
  });

  test('adds a delay node from the palette', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('palette-delay').click();
    await expect(page.getByTestId('graph-canvas')).toContainText('New DELAY');
  });
});
