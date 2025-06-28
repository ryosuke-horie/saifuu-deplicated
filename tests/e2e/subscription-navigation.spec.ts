import { expect, test } from "@playwright/test";
import { SubscriptionsPage } from "./pages/subscriptions.page";

/**
 * Issue 165: サブスクリプション管理画面へのナビゲーションテスト
 *
 * 要件：
 * - Chromeだけを対象する（PC/Android）
 * - Topからサブスク管理画面にルーティングすることだけテストする
 *
 * テスト対象：
 * 1. ダッシュボードのヘッダーアクション「サブスク管理」ボタン
 * 2. ダッシュボードのメインコンテンツ「サブスクリプション管理を開始」ボタン
 */
test.describe("サブスクリプション管理画面ナビゲーション", () => {
	let subscriptionsPage: SubscriptionsPage;

	test.beforeEach(async ({ page }) => {
		subscriptionsPage = new SubscriptionsPage(page);
	});

	test("ヘッダーの「サブスク管理」ボタンからサブスクリプション画面に遷移できる", async ({
		page,
	}) => {
		// ダッシュボードページにアクセス
		await page.goto("/");
		await page.waitForLoadState("networkidle", { timeout: 15000 });

		// ダッシュボードページが読み込まれることを確認
		await expect(page).toHaveTitle(/ダッシュボード.*Saifuu/, {
			timeout: 10000,
		});

		// ヘッダーナビゲーション内の「サブスク管理」ボタンをクリック
		const headerSubsButton = page.getByRole("navigation").getByRole("link", {
			name: "サブスク管理",
		});
		await expect(headerSubsButton).toBeVisible({ timeout: 15000 });
		await headerSubsButton.click();

		// URLがサブスクリプション管理画面に遷移することを確認
		await expect(page).toHaveURL("/subscriptions", { timeout: 10000 });

		// サブスクリプション管理画面が正しく表示されることを確認
		await subscriptionsPage.expectPageVisible();
		await subscriptionsPage.expectPageTitle();
	});

	test("メインコンテンツの「サブスクリプション管理を開始」ボタンからサブスクリプション画面に遷移できる", async ({
		page,
	}) => {
		// ダッシュボードページにアクセス
		await page.goto("/");
		await page.waitForLoadState("networkidle", { timeout: 15000 });

		// ダッシュボードページが読み込まれることを確認
		await expect(page).toHaveTitle(/ダッシュボード.*Saifuu/, {
			timeout: 10000,
		});

		// メインコンテンツの「サブスクリプション管理を開始」ボタンをクリック
		const mainSubsButton = page.getByRole("main").getByRole("link", {
			name: "サブスクリプション管理を開始",
		});
		await expect(mainSubsButton).toBeVisible({ timeout: 15000 });
		await mainSubsButton.click();

		// URLがサブスクリプション管理画面に遷移することを確認
		await expect(page).toHaveURL("/subscriptions", { timeout: 10000 });

		// サブスクリプション管理画面が正しく表示されることを確認
		await subscriptionsPage.expectPageVisible();
		await subscriptionsPage.expectPageTitle();
	});

	test("サブスクリプション管理画面に直接アクセスできる", async ({ page }) => {
		// サブスクリプション管理画面に直接アクセス
		await subscriptionsPage.goto();

		// URLが正しいことを確認
		await expect(page).toHaveURL("/subscriptions", { timeout: 10000 });

		// サブスクリプション管理画面が正しく表示されることを確認
		await subscriptionsPage.expectPageVisible();
		await subscriptionsPage.expectPageTitle();

		// 基本的な要素が表示されることを確認（新規サブスクリプションボタン）
		await subscriptionsPage.expectNewSubscriptionButtonVisible();
	});
});
