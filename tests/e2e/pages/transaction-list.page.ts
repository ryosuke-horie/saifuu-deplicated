import { type Locator, type Page, expect } from "@playwright/test";

/**
 * 取引一覧ページのPage Object Model
 * 取引一覧画面の要素とアクションを定義
 *
 * 設計判断：
 * - フィルタリング・検索機能に対応
 * - 取引の編集・削除アクションを提供
 * - ページネーション機能を考慮
 */
export class TransactionListPage {
	private readonly page: Page;

	// セレクター定義
	private readonly selectors = {
		transactionList: '[data-testid="transaction-list"]',
		transactionItem: '[data-testid="transaction-item"]',
		searchInput: '[data-testid="search-input"]',
		categoryFilter: '[data-testid="category-filter"]',
		typeFilter: '[data-testid="type-filter"]',
		dateFromFilter: '[data-testid="date-from-filter"]',
		dateToFilter: '[data-testid="date-to-filter"]',
		applyFiltersButton: '[data-testid="apply-filters-button"]',
		clearFiltersButton: '[data-testid="clear-filters-button"]',
		sortBySelect: '[data-testid="sort-by-select"]',
		addTransactionButton: '[data-testid="add-transaction-button"]',
		editTransactionButton: '[data-testid="edit-transaction-button"]',
		deleteTransactionButton: '[data-testid="delete-transaction-button"]',
		confirmDeleteButton: '[data-testid="confirm-delete-button"]',
		cancelDeleteButton: '[data-testid="cancel-delete-button"]',
		deleteModal: '[data-testid="delete-modal"]',
		emptyMessage: '[data-testid="empty-message"]',
		loadingSpinner: '[data-testid="loading-spinner"]',
		errorMessage: '[data-testid="error-message"]',
		paginationPrev: '[data-testid="pagination-prev"]',
		paginationNext: '[data-testid="pagination-next"]',
		paginationInfo: '[data-testid="pagination-info"]',
	};

	constructor(page: Page) {
		this.page = page;
	}

	// ナビゲーション
	async goto() {
		await this.page.goto("/transactions");
		await this.waitForLoad();
	}

	async waitForLoad() {
		await this.page.waitForSelector(this.selectors.loadingSpinner, {
			state: "hidden",
			timeout: 10000,
		});
		await this.page.waitForSelector(this.selectors.transactionList, {
			state: "visible",
			timeout: 10000,
		});
	}

	// 要素取得
	get transactionList(): Locator {
		return this.page.locator(this.selectors.transactionList);
	}

	get transactionItems(): Locator {
		return this.page.locator(this.selectors.transactionItem);
	}

	get searchInput(): Locator {
		return this.page.locator(this.selectors.searchInput);
	}

	get addTransactionButton(): Locator {
		return this.page.locator(this.selectors.addTransactionButton);
	}

	// 検索・フィルタリング
	async searchTransactions(query: string) {
		await this.searchInput.fill(query);
		await this.page.keyboard.press("Enter");
		await this.waitForLoad();
	}

	async filterByCategory(categoryName: string) {
		await this.page.locator(this.selectors.categoryFilter).selectOption({
			label: categoryName,
		});
		await this.applyFilters();
	}

	async filterByType(type: "income" | "expense" | "all") {
		await this.page.locator(this.selectors.typeFilter).selectOption({
			value: type,
		});
		await this.applyFilters();
	}

	async filterByDateRange(fromDate: string, toDate: string) {
		await this.page.locator(this.selectors.dateFromFilter).fill(fromDate);
		await this.page.locator(this.selectors.dateToFilter).fill(toDate);
		await this.applyFilters();
	}

	async applyFilters() {
		await this.page.locator(this.selectors.applyFiltersButton).click();
		await this.waitForLoad();
	}

	async clearFilters() {
		await this.page.locator(this.selectors.clearFiltersButton).click();
		await this.waitForLoad();
	}

	async sortBy(sortOption: string) {
		await this.page.locator(this.selectors.sortBySelect).selectOption({
			value: sortOption,
		});
		await this.waitForLoad();
	}

	// 取引操作
	async clickAddTransaction() {
		await this.addTransactionButton.click();
	}

	async editTransaction(transactionIndex: number) {
		const editButton = this.transactionItems
			.nth(transactionIndex)
			.locator(this.selectors.editTransactionButton);
		await editButton.click();
	}

	async deleteTransaction(transactionIndex: number) {
		const deleteButton = this.transactionItems
			.nth(transactionIndex)
			.locator(this.selectors.deleteTransactionButton);
		await deleteButton.click();

		// 削除確認モーダルの表示を待つ
		await expect(this.page.locator(this.selectors.deleteModal)).toBeVisible();
	}

	async confirmDelete() {
		await this.page.locator(this.selectors.confirmDeleteButton).click();
		await this.page.waitForSelector(this.selectors.deleteModal, {
			state: "hidden",
		});
		await this.waitForLoad();
	}

	async cancelDelete() {
		await this.page.locator(this.selectors.cancelDeleteButton).click();
		await this.page.waitForSelector(this.selectors.deleteModal, {
			state: "hidden",
		});
	}

	// 取引情報取得
	async getTransactionCount(): Promise<number> {
		return await this.transactionItems.count();
	}

	async getTransactionDescription(index: number): Promise<string> {
		const transaction = this.transactionItems.nth(index);
		const description = await transaction
			.locator('[data-testid="transaction-description"]')
			.textContent();
		return description || "";
	}

	async getTransactionAmount(index: number): Promise<number> {
		const transaction = this.transactionItems.nth(index);
		const amountText = await transaction
			.locator('[data-testid="transaction-amount"]')
			.textContent();

		if (!amountText) return 0;

		// 数値部分を抽出
		const match = amountText.match(/[\d,]+/);
		if (!match) return 0;

		return Number.parseInt(match[0].replace(/,/g, ""), 10);
	}

	// ページネーション
	async goToNextPage() {
		await this.page.locator(this.selectors.paginationNext).click();
		await this.waitForLoad();
	}

	async goToPreviousPage() {
		await this.page.locator(this.selectors.paginationPrev).click();
		await this.waitForLoad();
	}

	// アサーション
	async expectTransactionCount(count: number) {
		await expect(this.transactionItems).toHaveCount(count);
	}

	async expectTransactionVisible(description: string) {
		await expect(this.transactionList).toContainText(description);
	}

	async expectTransactionNotVisible(description: string) {
		await expect(this.transactionList).not.toContainText(description);
	}

	async expectEmptyMessage() {
		await expect(this.page.locator(this.selectors.emptyMessage)).toBeVisible();
	}

	async expectNoEmptyMessage() {
		await expect(
			this.page.locator(this.selectors.emptyMessage),
		).not.toBeVisible();
	}

	async expectSearchResults(query: string) {
		// 検索結果の取引が全て検索クエリを含むことを確認
		const transactions = await this.transactionItems.all();
		for (const transaction of transactions) {
			const text = await transaction.textContent();
			expect(text?.toLowerCase()).toContain(query.toLowerCase());
		}
	}

	async expectDeleteModalVisible() {
		await expect(this.page.locator(this.selectors.deleteModal)).toBeVisible();
	}

	async expectDeleteModalHidden() {
		await expect(
			this.page.locator(this.selectors.deleteModal),
		).not.toBeVisible();
	}

	// ユーティリティ
	async waitForSearchResults(timeoutMs = 5000) {
		await this.page.waitForLoadState("networkidle", { timeout: timeoutMs });
		await this.waitForLoad();
	}

	async takeScreenshot(name: string) {
		await this.page.screenshot({
			path: `test-results/screenshots/transaction-list-${name}.png`,
			fullPage: true,
		});
	}
}
