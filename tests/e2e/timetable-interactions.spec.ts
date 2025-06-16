import { expect, test } from "@playwright/test";

/**
 * タイムテーブルの基本的な相互作用テスト
 * レッスン選択とポップアップの動作をテスト
 */

test.describe("タイムテーブルの相互作用", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("h1:has-text('レッスン体験申し込み')", {
			timeout: 10000,
		});
	});

	test("レッスンをクリックしたときポップアップを開く", async ({ page }) => {
		// Find first available lesson
		const firstAvailableLesson = page.locator(".event:not(.past)").first();
		await firstAvailableLesson.click();

		// Check if popup opened
		await expect(page.locator(".popup")).toBeVisible();
	});
});
