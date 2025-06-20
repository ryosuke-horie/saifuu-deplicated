import { expect, test } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";
import { TransactionFormPage } from "./pages/transaction-form.page";
import {
	cleanupTestData,
	seedTestData,
	testTransactions,
} from "./setup/database";

/**
 * 取引管理の正常系フローのE2Eテスト
 * 最小限の正常系動作のみを検証し、CI実行時間を効率化
 */
test.describe("取引管理正常系フロー", () => {
	let dashboardPage: DashboardPage;
	let transactionFormPage: TransactionFormPage;

	test.beforeEach(async ({ page }) => {
		dashboardPage = new DashboardPage(page);
		transactionFormPage = new TransactionFormPage(page);

		await seedTestData();
	});

	test.afterEach(async () => {
		await cleanupTestData();
	});

	test("支出を登録してダッシュボードで確認できる", async () => {
		// 1. ダッシュボードの初期状態確認
		await dashboardPage.goto();
		await dashboardPage.expectSummaryCardsVisible();

		// 2. 取引登録フォームへ移動
		await dashboardPage.clickAddTransaction();

		// 3. 支出を登録
		await transactionFormPage.fillTransactionForm(testTransactions.expense);
		await transactionFormPage.selectCategory("テスト食費");
		await transactionFormPage.submit();

		// 4. ダッシュボードに戻って更新を確認
		await transactionFormPage.expectSubmitSuccess();

		// 5. 最近の取引に表示されることを確認
		await dashboardPage.expectRecentTransaction(
			testTransactions.expense.description,
		);
	});

	test("収入を登録してバランスが正しく更新される", async () => {
		// 1. ダッシュボードにアクセス
		await dashboardPage.goto();

		// 2. 取引登録フォームへ移動（収入タイプで）
		await dashboardPage.clickAddTransaction();
		await transactionFormPage.goto("income");

		// 3. 収入を登録
		await transactionFormPage.fillTransactionForm(testTransactions.income);
		await transactionFormPage.selectCategory("テスト給与");
		await transactionFormPage.submit();

		// 4. ダッシュボードで更新確認
		await transactionFormPage.expectSubmitSuccess();
		await dashboardPage.expectRecentTransaction(
			testTransactions.income.description,
		);
	});
});
