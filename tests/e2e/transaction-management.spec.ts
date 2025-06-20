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
 * 取引管理フローのE2Eテスト
 * 取引の作成から確認までの一連のユーザージャーニーをテスト
 *
 * テスト戦略：
 * - 実際のユーザー操作フローに沿った統合テスト
 * - データの整合性確認を重視
 * - 正常系と異常系の両方をカバー
 */
test.describe("取引管理フロー", () => {
	let dashboardPage: DashboardPage;
	let transactionFormPage: TransactionFormPage;
	let transactionListPage: TransactionListPage;

	test.beforeEach(async ({ page }) => {
		dashboardPage = new DashboardPage(page);
		transactionFormPage = new TransactionFormPage(page);
		transactionListPage = new TransactionListPage(page);

		// テストデータのセットアップ
		await seedTestData();
	});

	test.afterEach(async () => {
		// テストデータのクリーンアップ
		await cleanupTestData();
	});

	test("支出を登録してダッシュボードで確認できる", async () => {
		// 1. ダッシュボードの初期状態確認
		await dashboardPage.goto();
		await dashboardPage.expectSummaryCardsVisible();

		const initialBalance = await dashboardPage.getBalance();
		const initialExpense = await dashboardPage.getTotalExpense();

		// 2. 取引登録フォームへ移動
		await dashboardPage.clickAddTransaction();

		// 3. 支出を登録
		await transactionFormPage.fillTransactionForm(testTransactions.expense);
		await transactionFormPage.selectCategory("テスト食費");
		await transactionFormPage.submit();

		// 4. ダッシュボードに戻って更新を確認
		await transactionFormPage.expectSubmitSuccess();

		// 5. サマリーカードの更新確認
		const expectedBalance = initialBalance - testTransactions.expense.amount;
		const expectedExpense = initialExpense + testTransactions.expense.amount;

		await dashboardPage.expectBalance(expectedBalance);
		await dashboardPage.expectTotalExpense(expectedExpense);

		// 6. 最近の取引に表示されることを確認
		await dashboardPage.expectRecentTransaction(
			testTransactions.expense.description,
		);
	});

	test("収入を登録してバランスが正しく更新される", async () => {
		// 1. ダッシュボードの初期状態確認
		await dashboardPage.goto();
		const initialBalance = await dashboardPage.getBalance();
		const initialIncome = await dashboardPage.getTotalIncome();

		// 2. 取引登録フォームへ移動（収入タイプで）
		await dashboardPage.clickAddTransaction();
		await transactionFormPage.goto("income");

		// 3. 収入を登録
		await transactionFormPage.fillTransactionForm(testTransactions.income);
		await transactionFormPage.selectCategory("テスト給与");
		await transactionFormPage.submit();

		// 4. ダッシュボードで更新確認
		await transactionFormPage.expectSubmitSuccess();

		const expectedBalance = initialBalance + testTransactions.income.amount;
		const expectedIncome = initialIncome + testTransactions.income.amount;

		await dashboardPage.expectBalance(expectedBalance);
		await dashboardPage.expectTotalIncome(expectedIncome);
		await dashboardPage.expectRecentTransaction(
			testTransactions.income.description,
		);
	});

	test("取引を登録して一覧ページで確認・編集・削除できる", async () => {
		// 1. 取引を登録
		await transactionFormPage.goto();
		await transactionFormPage.fillTransactionForm(testTransactions.expense);
		await transactionFormPage.selectCategory("テスト食費");
		await transactionFormPage.submit();

		// 2. 取引一覧ページで確認
		await transactionListPage.goto();
		await transactionListPage.expectTransactionVisible(
			testTransactions.expense.description,
		);

		// 3. 検索機能のテスト
		await transactionListPage.searchTransactions("ランチ");
		await transactionListPage.expectSearchResults("ランチ");

		// 4. フィルタ機能のテスト
		await transactionListPage.clearFilters();
		await transactionListPage.filterByType("expense");
		await transactionListPage.expectTransactionVisible(
			testTransactions.expense.description,
		);

		// 5. 削除機能のテスト
		await transactionListPage.deleteTransaction(0);
		await transactionListPage.expectDeleteModalVisible();
		await transactionListPage.confirmDelete();
		await transactionListPage.expectTransactionNotVisible(
			testTransactions.expense.description,
		);
	});

	test("複数の取引を連続登録してデータの整合性を確認", async () => {
		const transactions = [
			{ ...testTransactions.expense, description: "テスト取引1" },
			{ ...testTransactions.income, description: "テスト取引2" },
			{ ...testTransactions.expense, description: "テスト取引3", amount: 500 },
		];

		let expectedBalance = 0;
		let expectedIncome = 0;
		let expectedExpense = 0;

		// 1. 複数取引の登録
		for (const transaction of transactions) {
			await transactionFormPage.goto(transaction.type);
			await transactionFormPage.fillTransactionForm(transaction);

			const categoryName =
				transaction.type === "income" ? "テスト給与" : "テスト食費";
			await transactionFormPage.selectCategory(categoryName);
			await transactionFormPage.submit();
			await transactionFormPage.expectSubmitSuccess();

			// 期待値の更新
			if (transaction.type === "income") {
				expectedBalance += transaction.amount;
				expectedIncome += transaction.amount;
			} else {
				expectedBalance -= transaction.amount;
				expectedExpense += transaction.amount;
			}
		}

		// 2. ダッシュボードで合計値確認
		await dashboardPage.goto();
		await dashboardPage.expectBalance(expectedBalance);
		await dashboardPage.expectTotalIncome(expectedIncome);
		await dashboardPage.expectTotalExpense(expectedExpense);

		// 3. 取引一覧でカウント確認
		await transactionListPage.goto();
		await transactionListPage.expectTransactionCount(transactions.length);
	});

	test("カテゴリ別フィルタが正しく動作する", async () => {
		// 1. 異なるカテゴリで取引を作成
		const foodTransaction = {
			...testTransactions.expense,
			description: "食費取引",
		};
		const incomeTransaction = {
			...testTransactions.income,
			description: "給与取引",
		};

		// 食費取引の登録
		await transactionFormPage.goto();
		await transactionFormPage.fillTransactionForm(foodTransaction);
		await transactionFormPage.selectCategory("テスト食費");
		await transactionFormPage.submit();

		// 収入取引の登録
		await transactionFormPage.goto("income");
		await transactionFormPage.fillTransactionForm(incomeTransaction);
		await transactionFormPage.selectCategory("テスト給与");
		await transactionFormPage.submit();

		// 2. 取引一覧でカテゴリフィルタのテスト
		await transactionListPage.goto();

		// 食費カテゴリのフィルタ
		await transactionListPage.filterByCategory("テスト食費");
		await transactionListPage.expectTransactionVisible("食費取引");
		await transactionListPage.expectTransactionNotVisible("給与取引");

		// 給与カテゴリのフィルタ
		await transactionListPage.filterByCategory("テスト給与");
		await transactionListPage.expectTransactionVisible("給与取引");
		await transactionListPage.expectTransactionNotVisible("食費取引");

		// フィルタクリア
		await transactionListPage.clearFilters();
		await transactionListPage.expectTransactionVisible("食費取引");
		await transactionListPage.expectTransactionVisible("給与取引");
	});

	test("日付範囲フィルタが正しく動作する", async () => {
		// 1. 異なる日付で取引を作成
		const recentTransaction = {
			...testTransactions.expense,
			description: "最近の取引",
			transactionDate: "2025-01-15",
		};
		const oldTransaction = {
			...testTransactions.expense,
			description: "古い取引",
			transactionDate: "2024-12-01",
		};

		// 取引の登録
		for (const transaction of [recentTransaction, oldTransaction]) {
			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm(transaction);
			await transactionFormPage.selectCategory("テスト食費");
			await transactionFormPage.submit();
		}

		// 2. 日付範囲フィルタのテスト
		await transactionListPage.goto();

		// 2025年1月のみのフィルタ
		await transactionListPage.filterByDateRange("2025-01-01", "2025-01-31");
		await transactionListPage.expectTransactionVisible("最近の取引");
		await transactionListPage.expectTransactionNotVisible("古い取引");

		// 2024年12月のみのフィルタ
		await transactionListPage.filterByDateRange("2024-12-01", "2024-12-31");
		await transactionListPage.expectTransactionVisible("古い取引");
		await transactionListPage.expectTransactionNotVisible("最近の取引");
	});
});
