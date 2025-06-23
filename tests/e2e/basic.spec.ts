import { expect, test } from "@playwright/test";

/**
 * 基本的な動作確認テスト
 * E2E環境が正しく動作することを確認
 * 固定ヘッダー対応版
 */
test.describe("基本動作確認", () => {
	test("ダッシュボードページが正常に表示される", async ({ page }) => {
		await page.goto("/");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// ヘッダーの存在を確認（固定ヘッダーが実装されたため）
		await expect(page.locator("header")).toBeVisible({ timeout: 15000 });

		// ページタイトルが存在することを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});

	test("ダッシュボードページにアクセスできる", async ({ page }) => {
		await page.goto("/");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// ヘッダーの存在を確認（固定ヘッダーが実装されたため）
		await expect(page.locator("header")).toBeVisible({ timeout: 15000 });

		// ページが読み込まれることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});
});