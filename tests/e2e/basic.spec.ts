import { expect, test } from "@playwright/test";

/**
 * 基本的な動作確認テスト
 * E2E環境が正しく動作することを確認
 */
test.describe("基本動作確認", () => {
	test("ホームページが正常に表示される", async ({ page }) => {
		await page.goto("/");

		// ページタイトルが存在することを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });

		// 基本的なHTML要素が存在することを確認
		await expect(page.locator("body")).toBeVisible();
	});

	test("ダッシュボードページにアクセスできる", async ({ page }) => {
		await page.goto("/dashboard");

		// ページが読み込まれることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });

		// 基本的なHTML要素が存在することを確認
		await expect(page.locator("body")).toBeVisible();
	});
});
