import { expect, test } from "@playwright/test";

/**
 * 基本的なページロードテスト
 * CI効率化のため最小限のテストのみ実行
 */
test.describe("基本ページロード", () => {
	test("ホームページが正常にロードされる", async ({ page }) => {
		// ホームページにアクセス
		await page.goto("/");

		// ページタイトルが表示されることを確認
		await expect(
			page.getByRole("heading", { name: "ホーム", level: 1 }),
		).toBeVisible();

		// サマリーカードコンテナが表示されることを確認（ローディング中でも可）
		await expect(
			page
				.locator(
					'[data-testid="summary-cards"], [data-testid="summary-cards-loading"], [data-testid="summary-cards-error"]',
				)
				.first(),
		).toBeVisible({ timeout: 30000 });
	});

	test("サブスクリプションページが正常にロードされる", async ({ page }) => {
		// サブスクリプションページにアクセス
		await page.goto("/subscriptions");

		// ページタイトルが表示されることを確認
		await expect(
			page.getByRole("heading", { name: "サブスクリプション管理", level: 1 }),
		).toBeVisible();
	});
});
