/**
 * MSW（Mock Service Worker）サーバー設定
 *
 * 設計方針:
 * - 全APIエンドポイントのモックハンドラーを統合管理
 * - Storybook環境での一貫したAPI動作を提供
 * - 開発・テスト・ストーリー表示用のデータセット提供
 * - エラーケース・エッジケースの包括的なサポート
 */

import { setupWorker } from "msw/browser";
import categoriesHandlers from "./handlers/categories";
import subscriptionsHandlers from "./handlers/subscriptions";
import transactionsHandlers from "./handlers/transactions";

// ========================================
// デフォルトハンドラー群
// ========================================

// 全ハンドラーを統合
export const handlers = [
	...categoriesHandlers,
	...transactionsHandlers,
	...subscriptionsHandlers,
];

// ========================================
// MSWワーカー設定
// ========================================

// ブラウザ環境用のワーカーを作成
export const worker = setupWorker(...handlers);

// ========================================
// カテゴリ別ハンドラーエクスポート
// ========================================

// 個別ハンドラー群をエクスポート（ストーリー固有の設定用）
export {
	categoriesHandlers,
	// カテゴリ特殊ハンドラー
	emptyCategoriesHandler,
	singleCategoryHandler,
	incomeCategoriesOnlyHandler,
	expenseCategoriesOnlyHandler,
	categoryErrorHandler,
} from "./handlers/categories";

export {
	transactionsHandlers,
	// 取引特殊ハンドラー
	emptyTransactionsHandler,
	incomeOnlyHandler,
	expenseOnlyHandler,
	transactionErrorHandler,
} from "./handlers/transactions";

export {
	subscriptionsHandlers,
	// サブスクリプション特殊ハンドラー
	emptySubscriptionsHandler,
	activeSubscriptionsOnlyHandler,
	inactiveSubscriptionsOnlyHandler,
	monthlySubscriptionsOnlyHandler,
	subscriptionErrorHandler,
} from "./handlers/subscriptions";

// ========================================
// データエクスポート
// ========================================

// モックデータを直接エクスポート（ストーリー内での参照用）
export {
	mockCategories,
	mockIncomeCategories,
	mockExpenseCategories,
	mockCategoriesApiResponse,
} from "./data/categories";

export {
	mockTransactions,
	mockIncomeTransactions,
	mockExpenseTransactions,
} from "./data/transactions";

export {
	mockSubscriptions,
	mockActiveSubscriptions,
	mockInactiveSubscriptions,
	mockSubscriptionsApiResponse,
} from "./data/subscriptions";

// ========================================
// 便利なハンドラーセット
// ========================================

/**
 * 基本的なデータセット用ハンドラー
 * 通常のストーリーで使用される標準的なデータパターン
 */
export const basicHandlers = [
	...categoriesHandlers,
	...transactionsHandlers,
	...subscriptionsHandlers,
];

/**
 * 空データセット用ハンドラー
 * 初期状態やデータなし状態のテスト用
 */
export const emptyDataHandlers = [
	// カテゴリは基本データを返す（空にするとUIが壊れるため）
	...categoriesHandlers,
	// 取引とサブスクリプションは空
	emptyTransactionsHandler,
	emptySubscriptionsHandler,
];

/**
 * エラー状態用ハンドラー
 * エラーハンドリングのテスト用
 */
export const errorHandlers = [
	categoryErrorHandler,
	transactionErrorHandler,
	subscriptionErrorHandler,
];

/**
 * 大量データ用ハンドラー
 * パフォーマンステスト・ページネーションテスト用
 */
export const largeDataHandlers = [
	...categoriesHandlers,
	...transactionsHandlers,
	...subscriptionsHandlers,
];

// ========================================
// ユーティリティ関数
// ========================================

/**
 * 特定のストーリー用にハンドラーをカスタマイズするヘルパー
 */
export const createCustomHandlers = (customHandlers: any[]) => {
	return [
		...basicHandlers.filter(
			(handler) =>
				!customHandlers.some(
					(custom) =>
						custom.info.method === handler.info.method &&
						custom.info.path === handler.info.path,
				),
		),
		...customHandlers,
	];
};

/**
 * レスポンス遅延を追加するヘルパー
 */
export const withDelay = (ms: number) => async () => {
	await new Promise((resolve) => setTimeout(resolve, ms));
};

/**
 * ランダム遅延を追加するヘルパー
 */
export const withRandomDelay =
	(minMs = 100, maxMs = 2000) =>
	async () => {
		const delay = Math.random() * (maxMs - minMs) + minMs;
		await new Promise((resolve) => setTimeout(resolve, delay));
	};

// ========================================
// Storybook初期化ヘルパー
// ========================================

/**
 * Storybook環境でのMSW初期化
 * preview.tsxから呼び出される
 */
export const initializeMSW = () => {
	if (typeof window !== "undefined") {
		// ブラウザ環境でのみ初期化
		worker.start({
			onUnhandledRequest: "bypass", // 未処理のリクエストはそのまま通す
			serviceWorker: {
				url: "/mockServiceWorker.js", // Storybookの公開ディレクトリから提供
			},
		});
	}
};

// ========================================
// 開発支援機能
// ========================================

/**
 * 開発時のデバッグ情報表示
 */
export const debugMSW = () => {
	if (process.env.NODE_ENV === "development") {
		console.group("🔧 MSW Debug Information");
		console.log("📋 Total handlers:", handlers.length);
		console.log("🏷️ Categories handlers:", categoriesHandlers.length);
		console.log("💳 Transactions handlers:", transactionsHandlers.length);
		console.log("🔄 Subscriptions handlers:", subscriptionsHandlers.length);
		console.log("📊 Mock data summary:");
		console.log("  - Categories:", mockCategories.length);
		console.log("  - Transactions:", mockTransactions.length);
		console.log("  - Subscriptions:", mockSubscriptions.length);
		console.groupEnd();
	}
};

/**
 * ハンドラーリストの表示（デバッグ用）
 */
export const listHandlers = () => {
	if (process.env.NODE_ENV === "development") {
		console.group("🛣️ MSW Handler Routes");
		for (const handler of handlers) {
			const info = handler.info as any;
			console.log(`${info.method?.toUpperCase()} ${info.path}`);
		}
		console.groupEnd();
	}
};

// ========================================
// 型定義
// ========================================

export type HandlerSet = typeof handlers;
export type CategoryHandler = (typeof categoriesHandlers)[0];
export type TransactionHandler = (typeof transactionsHandlers)[0];
export type SubscriptionHandler = (typeof subscriptionsHandlers)[0];

// デフォルトエクスポート
export default handlers;
