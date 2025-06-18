/**
 * カスタムフックの統合エクスポート
 *
 * 設計方針:
 * - 全てのカスタムフックを一元管理
 * - 型安全な再エクスポート
 * - 便利なユーティリティフックの提供
 */

// カテゴリ関連フック
export {
	useCategories,
	useCategory,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
	useReorderCategories,
	useCategoriesByType,
	useActiveCategories,
} from "./use-categories";

// 取引関連フック
export {
	useTransactions,
	useInfiniteTransactions,
	useTransaction,
	useTransactionStats,
	useCreateTransaction,
	useUpdateTransaction,
	useDeleteTransaction,
	useCurrentMonthTransactions,
	useTransactionsByDateRange,
	useTransactionsByCategory,
	useIncomeTransactions,
	useExpenseTransactions,
	type UseTransactionsParams,
} from "./use-transactions";

// サブスクリプション関連フック
export {
	useSubscriptions,
	useSubscription,
	useCreateSubscription,
	useUpdateSubscription,
	useDeleteSubscription,
	useDeactivateSubscription,
	useActivateSubscription,
	useActiveSubscriptions,
	useInactiveSubscriptions,
	useCurrentMonthSubscriptions,
	useSubscriptionsTotalCost,
} from "./use-subscriptions";

// ========================================
// 統合ユーティリティフック
// ========================================

export { useMasterData, useDashboardData } from "./use-utils";
