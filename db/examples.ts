/**
 * Drizzle ORM使用例
 *
 * このファイルは実際のアプリケーションでデータベースを操作する際の
 * 参考例を提供します。本格的な実装時には削除してください。
 */

import { createDb } from "./connection";
import {
	createSubscription,
	getActiveSubscriptions,
	getSubscriptionsDueToday,
} from "./queries/subscriptions";
import {
	createTransaction,
	getRecentTransactions,
	getTransactionsByDateRange,
} from "./queries/transactions";
import type { CreateTransaction } from "./schema";

/**
 * 使用例: Cloudflare Workersのエンドポイント内でのデータベース操作
 */
export async function exampleUsage(env: { DB: D1Database }) {
	// データベース接続を作成
	const db = createDb(env.DB);

	// ========================================
	// トランザクション操作例
	// ========================================

	// 新しい支出を登録
	const newExpense = await createTransaction(db, {
		amount: 1500,
		type: "expense",
		categoryId: 1, // 食費
		description: "ランチ代",
		transactionDate: "2025-01-15",
		paymentMethod: "クレジットカード",
		tags: ["外食", "平日"],
	} satisfies CreateTransaction);

	console.log("作成された支出:", newExpense);

	// 新しい収入を登録
	const newIncome = await createTransaction(db, {
		amount: 50000,
		type: "income",
		categoryId: 12, // 給与
		description: "副業収入",
		transactionDate: "2025-01-15",
		paymentMethod: "銀行振込",
	} satisfies CreateTransaction);

	console.log("作成された収入:", newIncome);

	// 最近のトランザクションを取得
	const recentTransactions = await getRecentTransactions(db, 5);
	console.log("最近のトランザクション:", recentTransactions);

	// 期間指定でトランザクションを取得
	const monthlyTransactions = await getTransactionsByDateRange(
		db,
		"2025-01-01",
		"2025-01-31",
		"expense", // 支出のみ
	);
	console.log("1月の支出:", monthlyTransactions);

	// ========================================
	// サブスクリプション操作例
	// ========================================

	// 新しいサブスクリプションを作成
	const newSubscription = await createSubscription(db, {
		name: "ChatGPT Plus",
		amount: 2000,
		categoryId: 10, // 書籍・学習
		frequency: "monthly",
		nextPaymentDate: "2025-02-01",
		description: "AI学習ツール",
		isActive: true,
		autoGenerate: true,
	});

	console.log("作成されたサブスクリプション:", newSubscription);

	// アクティブなサブスクリプション一覧を取得
	const activeSubscriptions = await getActiveSubscriptions(db);
	console.log("アクティブなサブスクリプション:", activeSubscriptions);

	// 今日支払い予定のサブスクリプションを取得
	const subscriptionsDue = await getSubscriptionsDueToday(db);
	console.log("今日支払い予定:", subscriptionsDue);

	return {
		newExpense,
		newIncome,
		recentTransactions,
		monthlyTransactions,
		newSubscription,
		activeSubscriptions,
		subscriptionsDue,
	};
}

/**
 * React Routerのローダー関数での使用例
 */
export async function exampleLoader({
	context,
}: { context: { cloudflare: { env: { DB: D1Database } } } }) {
	const db = createDb(context.cloudflare.env.DB);

	// ホーム画面で必要なデータを並行取得
	const [recentTransactions, activeSubscriptions] = await Promise.all([
		getRecentTransactions(db, 10),
		getActiveSubscriptions(db),
	]);

	return {
		recentTransactions,
		activeSubscriptions,
	};
}

/**
 * React Routerのアクション関数での使用例
 */
export async function exampleAction({
	request,
	context,
}: {
	request: Request;
	context: { cloudflare: { env: { DB: D1Database } } };
}) {
	const db = createDb(context.cloudflare.env.DB);
	const formData = await request.formData();

	const transactionData: CreateTransaction = {
		amount: Number(formData.get("amount")),
		type: formData.get("type") as "income" | "expense",
		categoryId: Number(formData.get("categoryId")),
		description: formData.get("description") as string,
		transactionDate: formData.get("transactionDate") as string,
		paymentMethod: formData.get("paymentMethod") as string,
	};

	// バリデーションは実際のアプリではZodスキーマを使用
	const newTransaction = await createTransaction(db, transactionData);

	return { success: true, transaction: newTransaction };
}
