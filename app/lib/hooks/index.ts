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

/**
 * 全てのマスターデータを一度に取得するフック
 * 注意: 循環インポートを避けるため、使用時は個別にインポートしてください
 */
// export function useMasterData() {
//   const categories = useCategories();
//   const subscriptions = useSubscriptions();
//   return { categories, subscriptions };
// }

/**
 * ダッシュボード用のデータを取得するフック
 * 注意: 循環インポートを避けるため、使用時は個別にインポートしてください
 */
// export function useDashboardData() {
//   const currentMonthTransactions = useCurrentMonthTransactions();
//   const activeSubscriptions = useActiveSubscriptions();
//   const categories = useActiveCategories();
//   return { currentMonthTransactions, activeSubscriptions, categories };
// }
