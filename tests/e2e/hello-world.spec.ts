import { expect, test } from "@playwright/test";

test("displays Hello World", async ({ page }) => {
	await page.goto("/");

	// Check that Hello World is displayed
	await expect(page.locator("h1")).toContainText("Hello World");

	// Check that the page title is set
	await expect(page).toHaveTitle(/Hello World/);
});
