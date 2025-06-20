/**
 * E2Eテスト用データベースセットアップ
 * テストデータの作成・クリーンアップを担当
 *
 * 設計判断：
 * - テストごとに独立したデータ環境を提供
 * - フィクスチャデータは現実的な値を使用
 * - 各テスト後のクリーンアップで干渉を防止
 */

import type {
	categories,
	subscriptions,
	transactions,
} from "../../../db/schema";

// テスト用カテゴリデータ
export const testCategories = [
	{
		name: "テスト食費",
		type: "expense" as const,
		color: "#FF6B6B",
		icon: "🍕",
		displayOrder: 1,
	},
	{
		name: "テスト交通費",
		type: "expense" as const,
		color: "#4ECDC4",
		icon: "🚗",
		displayOrder: 2,
	},
	{
		name: "テスト給与",
		type: "income" as const,
		color: "#45B7D1",
		icon: "💰",
		displayOrder: 3,
	},
] as const;

// テスト用取引データ
export const testTransactions = {
	expense: {
		amount: 1200,
		type: "expense" as const,
		description: "テスト用ランチ代",
		transactionDate: "2025-01-15",
		paymentMethod: "credit_card",
		categoryId: null, // セットアップ時に設定
	},
	income: {
		amount: 300000,
		type: "income" as const,
		description: "テスト用給与",
		transactionDate: "2025-01-01",
		categoryId: null, // セットアップ時に設定
	},
} as const;

// テスト用サブスクリプションデータ
export const testSubscriptions = [
	{
		name: "テストNetflix",
		amount: 1200,
		billingCycle: "monthly" as const,
		description: "テスト用動画配信",
		nextBillingDate: "2025-02-01",
		isActive: true,
		categoryId: null, // セットアップ時に設定
	},
	{
		name: "テストSpotify",
		amount: 980,
		billingCycle: "monthly" as const,
		description: "テスト用音楽配信",
		nextBillingDate: "2025-02-15",
		isActive: true,
		categoryId: null, // セットアップ時に設定
	},
] as const;

/**
 * テストデータの初期化
 * カテゴリ、取引、サブスクリプションのテストデータを作成
 */
export async function seedTestData() {
	// 実際の実装では、APIエンドポイントを通じてデータを作成
	// これにより実際のアプリケーションフローをテスト
	const baseUrl = "http://localhost:5173";

	// テストカテゴリの作成
	const createdCategories: any[] = [];
	for (const category of testCategories) {
		const response = await fetch(`${baseUrl}/api/categories/create`, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(category),
		});
		if (response.ok) {
			const created = await response.json();
			createdCategories.push(created);
		}
	}

	// 取引データにカテゴリIDを設定
	const expenseCategory = createdCategories.find(
		(c: any) => c.name === "テスト食費",
	);
	const incomeCategory = createdCategories.find(
		(c: any) => c.name === "テスト給与",
	);

	if (expenseCategory && incomeCategory) {
		// テスト取引の作成
		const transactionData = [
			{ ...testTransactions.expense, categoryId: expenseCategory.id },
			{ ...testTransactions.income, categoryId: incomeCategory.id },
		];

		for (const transaction of transactionData) {
			await fetch(`${baseUrl}/api/transactions/create`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(transaction),
			});
		}

		// テストサブスクリプションの作成
		const subscriptionData = testSubscriptions.map((sub) => ({
			...sub,
			categoryId: expenseCategory.id,
		}));

		for (const subscription of subscriptionData) {
			await fetch(`${baseUrl}/api/subscriptions/create`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(subscription),
			});
		}
	}

	return {
		categories: createdCategories,
		transactions: [],
		subscriptions: [],
	};
}

/**
 * テストデータのクリーンアップ
 * 各テスト後に実行してデータを削除
 */
export async function cleanupTestData() {
	const baseUrl = "http://localhost:5173";

	try {
		// 取引データの削除
		const transactionsResponse = await fetch(`${baseUrl}/api/transactions`);
		if (transactionsResponse.ok) {
			const transactions: any[] = await transactionsResponse.json();
			for (const transaction of transactions) {
				await fetch(`${baseUrl}/api/transactions/${transaction.id}/delete`, {
					method: "DELETE",
				});
			}
		}

		// サブスクリプションデータの削除
		const subscriptionsResponse = await fetch(`${baseUrl}/api/subscriptions`);
		if (subscriptionsResponse.ok) {
			const subscriptions: any[] = await subscriptionsResponse.json();
			for (const subscription of subscriptions) {
				await fetch(`${baseUrl}/api/subscriptions/${subscription.id}/delete`, {
					method: "DELETE",
				});
			}
		}

		// カテゴリデータの削除
		const categoriesResponse = await fetch(`${baseUrl}/api/categories`);
		if (categoriesResponse.ok) {
			const categories: any[] = await categoriesResponse.json();
			for (const category of categories) {
				// デフォルトカテゴリは削除しない
				if (category.name.startsWith("テスト")) {
					await fetch(`${baseUrl}/api/categories/${category.id}/delete`, {
						method: "DELETE",
					});
				}
			}
		}
	} catch (error) {
		console.warn("テストデータのクリーンアップに失敗:", error);
	}
}
