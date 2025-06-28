import { type Locator, type Page, expect } from "@playwright/test";

/**
 * サブスクリプション管理ページのPage Object Model
 * サブスクリプション画面の要素とアクションを定義
 *
 * 設計判断：
 * - Issue 165の要件：画面アクセスのみを検証するシンプルな実装
 * - PageHeaderコンポーネントの存在確認を中心とした検証
 * - 既存のDashboardPageパターンを踏襲
 */
export class SubscriptionsPage {
	private readonly page: Page;

	// セレクター定義
	private readonly selectors = {
		pageHeader: "header h1",
		subscriptionTitle: "text=サブスクリプション管理",
		// より具体的なセレクターを使用してヘッダーアクションのボタンを特定
		newSubscriptionButtonLink: 'a[href="/subscriptions/new"]',
		subscriptionCards: '[data-testid="subscription-cards"]',
		loadingSpinner: '[data-testid="loading-spinner"]',
		errorMessage: '[data-testid="error-message"]',
	};

	constructor(page: Page) {
		this.page = page;
	}

	// ナビゲーション
	async goto() {
		await this.page.goto("/subscriptions");
		await this.waitForLoad();
	}

	async waitForLoad() {
		// ページが読み込まれるまで待機
		await this.page.waitForLoadState("networkidle", { timeout: 15000 });

		// ページタイトルが正しく設定されるまで待機
		await expect(this.page).toHaveTitle(/サブスクリプション管理/, {
			timeout: 10000,
		});

		// サブスクリプション管理のタイトルが表示されるまで待機
		await expect(this.subscriptionTitle).toBeVisible({ timeout: 10000 });
	}

	// 要素取得
	get pageHeader(): Locator {
		return this.page.locator(this.selectors.pageHeader);
	}

	get subscriptionTitle(): Locator {
		return this.page.locator(this.selectors.subscriptionTitle);
	}

	get newSubscriptionButton(): Locator {
		return this.page.locator(this.selectors.newSubscriptionButtonLink);
	}

	// アサーション
	async expectPageVisible() {
		// サブスクリプション管理ページが表示されることを確認
		await expect(this.subscriptionTitle).toBeVisible({ timeout: 10000 });
	}

	async expectPageTitle() {
		// ページタイトルが正しく設定されることを確認
		await expect(this.page).toHaveTitle(/サブスクリプション管理/, {
			timeout: 10000,
		});
	}

	async expectNewSubscriptionButtonVisible() {
		// 新規サブスクリプションボタンが表示されることを確認
		await expect(this.newSubscriptionButton).toBeVisible({ timeout: 10000 });
	}
}
