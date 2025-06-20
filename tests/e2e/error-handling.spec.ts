import { expect, test } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";
import { TransactionFormPage } from "./pages/transaction-form.page";
import { TransactionListPage } from "./pages/transaction-list.page";
import {
	cleanupTestData,
	seedTestData,
	testTransactions,
} from "./setup/database";

/**
 * エラーハンドリングのE2Eテスト
 * フォームバリデーション、APIエラー、ネットワークエラーなどの異常系をテスト
 *
 * テスト戦略：
 * - ユーザーが遭遇する可能性のあるエラー状況を網羅
 * - 適切なエラーメッセージの表示確認
 * - システムの堅牢性を検証
 */
test.describe("エラーハンドリング", () => {
	let transactionFormPage: TransactionFormPage;
	let dashboardPage: DashboardPage;
	let transactionListPage: TransactionListPage;

	test.beforeEach(async ({ page }) => {
		transactionFormPage = new TransactionFormPage(page);
		dashboardPage = new DashboardPage(page);
		transactionListPage = new TransactionListPage(page);

		// 基本的なテストデータのセットアップ
		await seedTestData();
	});

	test.afterEach(async () => {
		await cleanupTestData();
	});

	test.describe("フォームバリデーション", () => {
		test("無効な金額でバリデーションエラーが表示される", async () => {
			await transactionFormPage.goto();

			// 負の金額
			await transactionFormPage.fillAmount(-1000);
			await transactionFormPage.fillDescription("テスト取引");
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectValidationError(
				"金額は正の数値を入力してください",
			);
		});

		test("金額が0の場合にバリデーションエラーが表示される", async () => {
			await transactionFormPage.goto();

			await transactionFormPage.fillAmount(0);
			await transactionFormPage.fillDescription("テスト取引");
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectValidationError(
				"金額は1円以上を入力してください",
			);
		});

		test("説明が空の場合にバリデーションエラーが表示される", async () => {
			await transactionFormPage.goto();

			await transactionFormPage.fillAmount(1000);
			await transactionFormPage.fillDescription("");
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectFieldValidationError(
				"description",
				"説明は必須です",
			);
		});

		test("カテゴリが未選択の場合にバリデーションエラーが表示される", async () => {
			await transactionFormPage.goto();

			await transactionFormPage.fillAmount(1000);
			await transactionFormPage.fillDescription("テスト取引");
			// カテゴリを選択しない
			await transactionFormPage.submit();

			await transactionFormPage.expectFieldValidationError(
				"category",
				"カテゴリを選択してください",
			);
		});

		test("日付が未来の場合にバリデーションエラーが表示される", async () => {
			await transactionFormPage.goto();

			const futureDate = new Date();
			futureDate.setFullYear(futureDate.getFullYear() + 1);
			const formattedDate = futureDate.toISOString().split("T")[0];

			await transactionFormPage.fillAmount(1000);
			await transactionFormPage.fillDescription("テスト取引");
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.fillTransactionDate(formattedDate);
			await transactionFormPage.submit();

			await transactionFormPage.expectFieldValidationError(
				"transactionDate",
				"未来の日付は選択できません",
			);
		});

		test("非常に長い説明でバリデーションエラーが表示される", async () => {
			await transactionFormPage.goto();

			const longDescription = "あ".repeat(256); // 255文字制限を超える

			await transactionFormPage.fillAmount(1000);
			await transactionFormPage.fillDescription(longDescription);
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectFieldValidationError(
				"description",
				"説明は255文字以内で入力してください",
			);
		});

		test("非常に大きな金額でバリデーションエラーが表示される", async () => {
			await transactionFormPage.goto();

			await transactionFormPage.fillAmount(100000000); // 1億円
			await transactionFormPage.fillDescription("テスト取引");
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectValidationError(
				"金額は9999万円以下で入力してください",
			);
		});
	});

	test.describe("APIエラー", () => {
		test("APIエラー時に適切なエラーメッセージが表示される", async ({
			page,
		}) => {
			// APIをモックしてエラーレスポンスを返す
			await page.route("/api/transactions/create", (route) => {
				route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({
						error:
							"サーバーエラーが発生しました。しばらく時間をおいて再度お試しください。",
					}),
				});
			});

			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm(testTransactions.expense);
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectValidationError(
				"サーバーエラーが発生しました",
			);
		});

		test("ネットワークエラー時に適切なエラーメッセージが表示される", async ({
			page,
		}) => {
			// ネットワークエラーをシミュレート
			await page.route("/api/transactions/create", (route) => {
				route.abort("connectionreset");
			});

			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm(testTransactions.expense);
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectValidationError(
				"ネットワークエラーが発生しました",
			);
		});

		test("タイムアウトエラー時に適切なエラーメッセージが表示される", async ({
			page,
		}) => {
			// タイムアウトをシミュレート
			await page.route("/api/transactions/create", async (route) => {
				await new Promise((resolve) => setTimeout(resolve, 31000)); // 30秒のタイムアウトを超える
				route.fulfill({
					status: 408,
					contentType: "application/json",
					body: JSON.stringify({ error: "リクエストがタイムアウトしました" }),
				});
			});

			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm(testTransactions.expense);
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectValidationError(
				"リクエストがタイムアウトしました",
			);
		});

		test("重複データエラー時に適切なエラーメッセージが表示される", async ({
			page,
		}) => {
			// 重複エラーをシミュレート
			await page.route("/api/transactions/create", (route) => {
				route.fulfill({
					status: 409,
					contentType: "application/json",
					body: JSON.stringify({
						error: "同じ日時・金額・説明の取引が既に存在します",
					}),
				});
			});

			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm(testTransactions.expense);
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			await transactionFormPage.expectValidationError(
				"同じ日時・金額・説明の取引が既に存在します",
			);
		});
	});

	test.describe("削除操作エラー", () => {
		test("存在しない取引の削除時にエラーメッセージが表示される", async ({
			page,
		}) => {
			// 取引を作成
			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm(testTransactions.expense);
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();

			// 削除APIをモックしてエラーレスポンスを返す
			await page.route("/api/transactions/*/delete", (route) => {
				route.fulfill({
					status: 404,
					contentType: "application/json",
					body: JSON.stringify({ error: "取引が見つかりません" }),
				});
			});

			await transactionListPage.goto();
			await transactionListPage.deleteTransaction(0);
			await transactionListPage.confirmDelete();

			// エラーメッセージの確認（実装によっては通知やモーダルで表示）
			await expect(
				page.locator('[data-testid="error-notification"]'),
			).toContainText("取引が見つかりません");
		});
	});

	test.describe("データ読み込みエラー", () => {
		test("ダッシュボードデータ読み込みエラー時に適切なエラー表示", async ({
			page,
		}) => {
			// ダッシュボードAPIをモックしてエラーレスポンスを返す
			await page.route("/api/transactions", (route) => {
				route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ error: "データの読み込みに失敗しました" }),
				});
			});

			await dashboardPage.goto();
			await dashboardPage.expectErrorMessage("データの読み込みに失敗しました");
		});

		test("取引一覧データ読み込みエラー時に適切なエラー表示", async ({
			page,
		}) => {
			// 取引一覧APIをモックしてエラーレスポンスを返す
			await page.route("/api/transactions", (route) => {
				route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ error: "取引データの読み込みに失敗しました" }),
				});
			});

			await transactionListPage.goto();
			await expect(page.locator('[data-testid="error-message"]')).toContainText(
				"取引データの読み込みに失敗しました",
			);
		});

		test("カテゴリデータ読み込みエラー時にフォームが適切に動作", async ({
			page,
		}) => {
			// カテゴリAPIをモックしてエラーレスポンスを返す
			await page.route("/api/categories", (route) => {
				route.fulfill({
					status: 500,
					contentType: "application/json",
					body: JSON.stringify({ error: "カテゴリの読み込みに失敗しました" }),
				});
			});

			await transactionFormPage.goto();

			// カテゴリ選択肢が表示されないか、エラーメッセージが表示される
			await expect(
				page.locator('[data-testid="category-error"]'),
			).toContainText("カテゴリの読み込みに失敗しました");

			// 送信ボタンが無効化される
			await transactionFormPage.expectSubmitButtonDisabled();
		});
	});

	test.describe("フォーム状態管理", () => {
		test("送信中はボタンが無効化される", async ({ page }) => {
			// APIレスポンスを遅延させる
			await page.route("/api/transactions/create", async (route) => {
				await new Promise((resolve) => setTimeout(resolve, 2000));
				route.continue();
			});

			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm(testTransactions.expense);
			await transactionFormPage.selectCategory("テスト食費");

			// 送信ボタンクリック
			await transactionFormPage.submit();

			// 送信中はボタンが無効化される
			await transactionFormPage.expectSubmitButtonDisabled();

			// ローディングスピナーが表示される
			await expect(transactionFormPage.isFormLoading()).resolves.toBe(true);
		});

		test("必須フィールドが未入力の間は送信ボタンが無効", async () => {
			await transactionFormPage.goto();

			// 初期状態では送信ボタンが無効
			await transactionFormPage.expectSubmitButtonDisabled();

			// 金額のみ入力
			await transactionFormPage.fillAmount(1000);
			await transactionFormPage.expectSubmitButtonDisabled();

			// 説明も入力
			await transactionFormPage.fillDescription("テスト");
			await transactionFormPage.expectSubmitButtonDisabled();

			// カテゴリも選択して送信ボタンが有効化
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.expectSubmitButtonEnabled();
		});
	});
});
