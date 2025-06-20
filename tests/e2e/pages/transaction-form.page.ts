import { type Locator, type Page, expect } from "@playwright/test";

/**
 * 取引フォームページのPage Object Model
 * 取引登録・編集フォームの要素とアクションを定義
 *
 * 設計判断：
 * - 収入・支出両方の取引タイプに対応
 * - バリデーションエラーの確認機能を提供
 * - フォーム送信後の成功・失敗状態を適切に処理
 */
export class TransactionFormPage {
	private readonly page: Page;

	// セレクター定義
	private readonly selectors = {
		amountInput: '[data-testid="amount-input"]',
		typeRadio: '[data-testid="type-radio"]',
		expenseRadio: '[data-testid="expense-radio"]',
		incomeRadio: '[data-testid="income-radio"]',
		categorySelect: '[data-testid="category-select"]',
		descriptionInput: '[data-testid="description-input"]',
		transactionDateInput: '[data-testid="transaction-date-input"]',
		paymentMethodSelect: '[data-testid="payment-method-select"]',
		submitButton: '[data-testid="submit-button"]',
		cancelButton: '[data-testid="cancel-button"]',
		errorMessage: '[data-testid="error-message"]',
		fieldError: '[data-testid="field-error"]',
		successMessage: '[data-testid="success-message"]',
		loadingSpinner: '[data-testid="loading-spinner"]',
		form: '[data-testid="transaction-form"]',
	};

	constructor(page: Page) {
		this.page = page;
	}

	// ナビゲーション
	async goto(type: "income" | "expense" = "expense") {
		await this.page.goto(`/transaction-form-demo?type=${type}`);
		await this.waitForLoad();
	}

	async waitForLoad() {
		await this.page.waitForSelector(this.selectors.form, {
			state: "visible",
			timeout: 10000,
		});
	}

	// 要素取得
	get amountInput(): Locator {
		return this.page.locator(this.selectors.amountInput);
	}

	get descriptionInput(): Locator {
		return this.page.locator(this.selectors.descriptionInput);
	}

	get categorySelect(): Locator {
		return this.page.locator(this.selectors.categorySelect);
	}

	get transactionDateInput(): Locator {
		return this.page.locator(this.selectors.transactionDateInput);
	}

	get paymentMethodSelect(): Locator {
		return this.page.locator(this.selectors.paymentMethodSelect);
	}

	get submitButton(): Locator {
		return this.page.locator(this.selectors.submitButton);
	}

	get cancelButton(): Locator {
		return this.page.locator(this.selectors.cancelButton);
	}

	// フォーム入力アクション
	async fillAmount(amount: number) {
		await this.amountInput.fill(amount.toString());
	}

	async selectTransactionType(type: "income" | "expense") {
		if (type === "income") {
			await this.page.locator(this.selectors.incomeRadio).check();
		} else {
			await this.page.locator(this.selectors.expenseRadio).check();
		}
	}

	async fillDescription(description: string) {
		await this.descriptionInput.fill(description);
	}

	async selectCategory(categoryName: string) {
		await this.categorySelect.selectOption({ label: categoryName });
	}

	async selectCategoryByValue(categoryId: string) {
		await this.categorySelect.selectOption({ value: categoryId });
	}

	async fillTransactionDate(date: string) {
		await this.transactionDateInput.fill(date);
	}

	async selectPaymentMethod(method: string) {
		await this.paymentMethodSelect.selectOption({ value: method });
	}

	// 複合アクション
	async fillTransactionForm(transaction: {
		amount: number;
		type: "income" | "expense";
		description: string;
		transactionDate: string;
		paymentMethod?: string;
	}) {
		await this.fillAmount(transaction.amount);
		await this.selectTransactionType(transaction.type);
		await this.fillDescription(transaction.description);
		await this.fillTransactionDate(transaction.transactionDate);

		if (transaction.paymentMethod) {
			await this.selectPaymentMethod(transaction.paymentMethod);
		}
	}

	// フォーム送信
	async submit() {
		await this.submitButton.click();
	}

	async cancel() {
		await this.cancelButton.click();
	}

	// フォーム状態確認
	async isSubmitButtonEnabled(): Promise<boolean> {
		return await this.submitButton.isEnabled();
	}

	async isFormLoading(): Promise<boolean> {
		return await this.page.locator(this.selectors.loadingSpinner).isVisible();
	}

	// アサーション
	async expectSubmitSuccess() {
		// 成功時のリダイレクトまたは成功メッセージを確認
		await Promise.race([
			// ダッシュボードへのリダイレクト
			this.page.waitForURL("**/dashboard", { timeout: 5000 }),
			// 成功メッセージの表示
			expect(this.page.locator(this.selectors.successMessage)).toBeVisible(),
		]);
	}

	async expectValidationError(message: string) {
		await expect(this.page.locator(this.selectors.errorMessage)).toContainText(
			message,
		);
	}

	async expectFieldValidationError(fieldName: string, message: string) {
		const fieldError = this.page.locator(
			`${this.selectors.fieldError}[data-field="${fieldName}"]`,
		);
		await expect(fieldError).toContainText(message);
	}

	async expectFormVisible() {
		await expect(this.page.locator(this.selectors.form)).toBeVisible();
	}

	async expectSubmitButtonDisabled() {
		await expect(this.submitButton).toBeDisabled();
	}

	async expectSubmitButtonEnabled() {
		await expect(this.submitButton).toBeEnabled();
	}

	// カテゴリ選択肢の確認
	async expectCategoryOptions(expectedOptions: string[]) {
		const options = this.categorySelect.locator("option");
		for (const option of expectedOptions) {
			await expect(options).toContainText(option);
		}
	}

	// 支払い方法選択肢の確認
	async expectPaymentMethodOptions(expectedOptions: string[]) {
		const options = this.paymentMethodSelect.locator("option");
		for (const option of expectedOptions) {
			await expect(options).toContainText(option);
		}
	}

	// ユーティリティ
	async clearForm() {
		await this.amountInput.fill("");
		await this.descriptionInput.fill("");
		await this.categorySelect.selectOption({ index: 0 });
		await this.transactionDateInput.fill("");
		await this.paymentMethodSelect.selectOption({ index: 0 });
	}

	async waitForFormSubmission(timeoutMs = 5000) {
		// フォーム送信の処理完了を待つ
		await this.page.waitForLoadState("networkidle", { timeout: timeoutMs });
	}

	async takeScreenshot(name: string) {
		await this.page.screenshot({
			path: `test-results/screenshots/transaction-form-${name}.png`,
			fullPage: true,
		});
	}
}
