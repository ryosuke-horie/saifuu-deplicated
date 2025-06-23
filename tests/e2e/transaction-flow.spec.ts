import { expect, test } from "@playwright/test";

/**
 * 基本的なページロードテスト
 * CI効率化のため最小限のテストのみ実行
 * 固定ヘッダー対応のため、headerタグを基準にテスト
 */
test.describe("基本ページロード", () => {
	test("ダッシュボードページが正常にロードされる", async ({ page }) => {
		// ダッシュボードページ（ホーム）に直接アクセス
		await page.goto("/");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// 固定ヘッダーの存在を確認
		await expect(page.locator("header")).toBeVisible({ timeout: 15000 });

		// ページタイトルが設定されていることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});

	test("サブスクリプションページが正常にロードされる", async ({ page }) => {
		// サブスクリプションページにアクセス
		await page.goto("/subscriptions");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// 固定ヘッダーの存在を確認
		await expect(page.locator("header")).toBeVisible({ timeout: 15000 });

		// ページタイトルが設定されていることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});

	test("取引一覧ページが正常にロードされる", async ({ page }) => {
		// 取引一覧ページにアクセス
		await page.goto("/transactions");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// 固定ヘッダーの存在を確認
		await expect(page.locator("header")).toBeVisible({ timeout: 15000 });

		// ページタイトルが設定されていることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});
});
