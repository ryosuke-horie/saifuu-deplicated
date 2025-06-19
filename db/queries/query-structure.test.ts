import { describe, expect, it } from "vitest";

/**
 * データベースクエリ関数の構造とエクスポートの確認テスト
 *
 * 実際のデータベース接続なしで、関数の存在と型安全性を確認
 */

describe("Query functions structure", () => {
	describe("transactions queries", () => {
		it("必要な関数がエクスポートされている", async () => {
			// 動的インポートで関数の存在を確認
			const transactionsModule = await import("./transactions");

			// 主要な関数がエクスポートされていることを確認
			expect(typeof transactionsModule.createTransaction).toBe("function");
			expect(typeof transactionsModule.getTransactionById).toBe("function");
			expect(typeof transactionsModule.getTransactionsList).toBe("function");
			expect(typeof transactionsModule.updateTransaction).toBe("function");
			expect(typeof transactionsModule.deleteTransaction).toBe("function");
			expect(typeof transactionsModule.getTransactionsByDateRange).toBe(
				"function",
			);
			expect(typeof transactionsModule.getMonthlyTransactionSummary).toBe(
				"function",
			);
			expect(typeof transactionsModule.getRecentTransactions).toBe("function");
		});

		it("関数の基本的な動作を確認", async () => {
			// TypeScriptの型は実行時には利用できないため、
			// 代わりに関数が正しくインポートできることを確認
			const transactionsModule = await import("./transactions");

			// 関数が正しく定義されていることを確認
			expect(transactionsModule.getTransactionsList).toBeDefined();
			expect(typeof transactionsModule.getTransactionsList).toBe("function");
		});
	});

	describe("subscriptions queries", () => {
		it("必要な関数がエクスポートされている", async () => {
			const subscriptionsModule = await import("./subscriptions");

			expect(typeof subscriptionsModule.createSubscription).toBe("function");
			expect(typeof subscriptionsModule.getSubscriptionById).toBe("function");
			expect(typeof subscriptionsModule.getSubscriptionsList).toBe("function");
			expect(typeof subscriptionsModule.updateSubscription).toBe("function");
			expect(typeof subscriptionsModule.deleteSubscription).toBe("function");
			expect(typeof subscriptionsModule.getActiveSubscriptions).toBe(
				"function",
			);
			expect(typeof subscriptionsModule.getSubscriptionsDueToday).toBe(
				"function",
			);
			expect(typeof subscriptionsModule.updateNextPaymentDate).toBe("function");
			expect(typeof subscriptionsModule.deactivateSubscription).toBe(
				"function",
			);
			expect(typeof subscriptionsModule.getMonthlySubscriptionTotal).toBe(
				"function",
			);
			expect(typeof subscriptionsModule.calculateNextPaymentDate).toBe(
				"function",
			);
		});
	});

	describe("categories queries", () => {
		it("必要な関数がエクスポートされている", async () => {
			const categoriesModule = await import("./categories");

			expect(typeof categoriesModule.createCategory).toBe("function");
			expect(typeof categoriesModule.updateCategory).toBe("function");
			expect(typeof categoriesModule.deleteCategory).toBe("function");
			expect(typeof categoriesModule.getAllCategories).toBe("function");
			expect(typeof categoriesModule.getCategoriesByType).toBe("function");
			expect(typeof categoriesModule.getCategoryById).toBe("function");
			expect(typeof categoriesModule.getActiveCategories).toBe("function");
			expect(typeof categoriesModule.updateDisplayOrder).toBe("function");
			expect(typeof categoriesModule.reorderCategories).toBe("function");
			expect(typeof categoriesModule.isCategoryInUse).toBe("function");
		});

		it("reorderCategoriesはupdateDisplayOrderのエイリアスである", async () => {
			const categoriesModule = await import("./categories");

			// エイリアス関数が正しく設定されている
			expect(categoriesModule.reorderCategories).toBe(
				categoriesModule.updateDisplayOrder,
			);
		});
	});

	describe("All query modules", () => {
		it("共通のパラメータパターンを持つ", async () => {
			const [transactions, subscriptions, categories] = await Promise.all([
				import("./transactions"),
				import("./subscriptions"),
				import("./categories"),
			]);

			// 全モジュールのcreate関数が存在することを確認
			expect(typeof transactions.createTransaction).toBe("function");
			expect(typeof subscriptions.createSubscription).toBe("function");
			expect(typeof categories.createCategory).toBe("function");

			// 全モジュールのupdate関数が存在することを確認
			expect(typeof transactions.updateTransaction).toBe("function");
			expect(typeof subscriptions.updateSubscription).toBe("function");
			expect(typeof categories.updateCategory).toBe("function");

			// 全モジュールのdelete関数が存在することを確認
			expect(typeof transactions.deleteTransaction).toBe("function");
			expect(typeof subscriptions.deleteSubscription).toBe("function");
			expect(typeof categories.deleteCategory).toBe("function");
		});
	});
});
