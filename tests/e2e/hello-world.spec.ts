import { expect, test } from "@playwright/test";

test("displays Hello World", async ({ page }) => {
	await page.goto("/");

	// Hello Worldのテキストが表示されているか確認
	await expect(page.locator("h1")).toContainText("Hello World");
});
