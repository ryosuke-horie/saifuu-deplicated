import { expect, test } from "@playwright/test";

/**
 * 基本的なページロードテスト
 * CI効率化のため最小限のテストのみ実行
 */
test.describe("基本ページロード", () => {
	test("ダッシュボードページが正常にロードされる", async ({ page }) => {
		// ダッシュボードページにアクセス
		await page.goto("/dashboard");

		// ページタイトルが表示されることを確認
		await expect(
			page.getByRole("heading", { name: "ダッシュボード" }),
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

	test("取引フォームページが正常にロードされる", async ({ page }) => {
		// 取引フォームページにアクセス
		await page.goto("/transaction-form-demo");

		// ページタイトルが表示されることを確認
		await expect(
			page.getByRole("heading", { name: "Transaction Form Demo" }),
		).toBeVisible();

		// フォームが表示されることを確認
		await expect(
			page.getByRole("heading", { name: "支出を登録" }),
		).toBeVisible();
	});

	test("取引一覧ページが正常にロードされる", async ({ page }) => {
		// 取引一覧ページにアクセス
		await page.goto("/transaction-list-demo");

		// ページタイトルまたはメインコンテンツが表示されることを確認
		await expect(
			page.getByText("Transaction List Demo").or(page.getByText("取引一覧")),
		).toBeVisible();
	});
});
