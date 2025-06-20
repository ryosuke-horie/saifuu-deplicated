import { type Locator, type Page, expect } from "@playwright/test";

/**
 * ダッシュボードページのPage Object Model
 * ダッシュボード画面の要素とアクションを定義
 *
 * 設計判断：
 * - data-testid属性を使用して要素特定の安定性を確保
 * - expectメソッドでアサーション機能を提供
 * - 実際のユーザーアクションを模倣したメソッド設計
 */
export class DashboardPage {
	private readonly page: Page;

	// セレクター定義
	private readonly selectors = {
		summaryCards: '[data-testid="summary-cards"]',
		totalIncomeCard: '[data-testid="total-income"]',
		totalExpenseCard: '[data-testid="total-expense"]',
		balanceCard: '[data-testid="balance"]',
		recentTransactions: '[data-testid="recent-transactions"]',
		addTransactionButton: '[data-testid="add-transaction-btn"]',
		viewAllTransactionsLink: '[data-testid="view-all-transactions"]',
		transactionItem: '[data-testid="transaction-item"]',
		loadingSpinner: '[data-testid="loading-spinner"]',
		errorMessage: '[data-testid="error-message"]',
	};

	constructor(page: Page) {
		this.page = page;
	}

	// ナビゲーション
	async goto() {
		await this.page.goto("/dashboard");
		await this.waitForLoad();
	}

	async waitForLoad() {
		// ローディング完了を待つ
		await this.page.waitForSelector(this.selectors.loadingSpinner, {
			state: "hidden",
			timeout: 10000,
		});
		// サマリーカードの表示を待つ
		await this.page.waitForSelector(this.selectors.summaryCards, {
			state: "visible",
			timeout: 10000,
		});
	}

	// 要素取得
	get summaryCards(): Locator {
		return this.page.locator(this.selectors.summaryCards);
	}

	get totalIncomeCard(): Locator {
		return this.page.locator(this.selectors.totalIncomeCard);
	}

	get totalExpenseCard(): Locator {
		return this.page.locator(this.selectors.totalExpenseCard);
	}

	get balanceCard(): Locator {
		return this.page.locator(this.selectors.balanceCard);
	}

	get recentTransactions(): Locator {
		return this.page.locator(this.selectors.recentTransactions);
	}

	get addTransactionButton(): Locator {
		return this.page.locator(this.selectors.addTransactionButton);
	}

	// アクション
	async clickAddTransaction() {
		await this.addTransactionButton.click();
	}

	async clickViewAllTransactions() {
		await this.page.locator(this.selectors.viewAllTransactionsLink).click();
	}

	async getBalance(): Promise<number> {
		const balanceText = await this.balanceCard.textContent();
		if (!balanceText) return 0;

		// 数値部分を抽出（例: "¥123,456" -> 123456）
		const match = balanceText.match(/[\d,]+/);
		if (!match) return 0;

		return Number.parseInt(match[0].replace(/,/g, ""), 10);
	}

	async getTotalIncome(): Promise<number> {
		const incomeText = await this.totalIncomeCard.textContent();
		if (!incomeText) return 0;

		const match = incomeText.match(/[\d,]+/);
		if (!match) return 0;

		return Number.parseInt(match[0].replace(/,/g, ""), 10);
	}

	async getTotalExpense(): Promise<number> {
		const expenseText = await this.totalExpenseCard.textContent();
		if (!expenseText) return 0;

		const match = expenseText.match(/[\d,]+/);
		if (!match) return 0;

		return Number.parseInt(match[0].replace(/,/g, ""), 10);
	}

	// アサーション
	async expectSummaryCardsVisible() {
		await expect(this.summaryCards).toBeVisible();
	}

	async expectBalance(expectedBalance: number) {
		await expect(this.balanceCard).toContainText(
			expectedBalance.toLocaleString("ja-JP"),
		);
	}

	async expectTotalIncome(expectedIncome: number) {
		await expect(this.totalIncomeCard).toContainText(
			expectedIncome.toLocaleString("ja-JP"),
		);
	}

	async expectTotalExpense(expectedExpense: number) {
		await expect(this.totalExpenseCard).toContainText(
			expectedExpense.toLocaleString("ja-JP"),
		);
	}

	async expectRecentTransaction(description: string) {
		await expect(this.recentTransactions).toContainText(description);
	}

	async expectRecentTransactionCount(count: number) {
		const transactions = this.page.locator(this.selectors.transactionItem);
		await expect(transactions).toHaveCount(count);
	}

	async expectNoRecentTransactions() {
		await expect(this.recentTransactions).toContainText("取引がありません");
	}

	async expectErrorMessage(message: string) {
		await expect(this.page.locator(this.selectors.errorMessage)).toContainText(
			message,
		);
	}

	async expectLoadingComplete() {
		await expect(
			this.page.locator(this.selectors.loadingSpinner),
		).not.toBeVisible();
	}

	// ユーティリティ
	async waitForDataUpdate(timeoutMs = 5000) {
		// データ更新後のレンダリング完了を待つ
		await this.page.waitForTimeout(1000);
		await this.waitForLoad();
	}

	async takeScreenshot(name: string) {
		await this.page.screenshot({
			path: `test-results/screenshots/dashboard-${name}.png`,
			fullPage: true,
		});
	}
}
