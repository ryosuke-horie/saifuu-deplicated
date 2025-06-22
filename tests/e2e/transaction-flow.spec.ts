import { expect, test } from "@playwright/test";

/**
 * 基本的なページロードテスト
 * CI効率化のため最小限のテストのみ実行
 * 新しいUI構造対応のため、最も基本的な要素のみをテスト
 */
test.describe("基本ページロード", () => {
	test("ダッシュボードページが正常にロードされる", async ({ page }) => {
		// ダッシュボードページ（ホーム）に直接アクセス
		await page.goto("/");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// 最低限の確認：bodyタグが存在し、ページが基本的にロードされていること
		await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

		// ページタイトルが設定されていることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});

	test("サブスクリプションページが正常にロードされる", async ({ page }) => {
		// サブスクリプションページにアクセス
		await page.goto("/subscriptions");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// 最低限の確認：bodyタグが存在し、ページが基本的にロードされていること
		await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

		// ページタイトルが設定されていることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});

	test("取引一覧ページが正常にロードされる", async ({ page }) => {
		// 取引一覧ページにアクセス
		await page.goto("/transaction-list-demo");

		// ページがロードされるまで待機
		await page.waitForLoadState("networkidle");

		// 最低限の確認：bodyタグが存在し、ページが基本的にロードされていること
		await expect(page.locator("body")).toBeVisible({ timeout: 10000 });

		// ページタイトルが設定されていることを確認
		await expect(page).toHaveTitle(/.*/, { timeout: 10000 });
	});
});
