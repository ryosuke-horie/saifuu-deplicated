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
 * 初期化時やリフレッシュ時に使用
 */
export function useMasterData() {
	const categoriesQuery = useCategories();
	const subscriptionsQuery = useSubscriptions();

	return {
		categories: categoriesQuery,
		subscriptions: subscriptionsQuery,
		isLoading: categoriesQuery.isLoading || subscriptionsQuery.isLoading,
		error: categoriesQuery.error || subscriptionsQuery.error,
		refetch: () => {
			categoriesQuery.refetch();
			subscriptionsQuery.refetch();
		},
	};
}

/**
 * ダッシュボード用のデータを取得するフック
 * 必要な情報を効率的に取得
 */
export function useDashboardData() {
	const currentMonthTransactionsQuery = useCurrentMonthTransactions();
	const activeSubscriptionsQuery = useActiveSubscriptions();
	const categoriesQuery = useActiveCategories();
	const subscriptionCostsData = useSubscriptionsTotalCost();

	return {
		currentMonthTransactions: currentMonthTransactionsQuery,
		activeSubscriptions: activeSubscriptionsQuery,
		categories: categoriesQuery,
		subscriptionCosts: subscriptionCostsData,
		isLoading:
			currentMonthTransactionsQuery.isLoading ||
			activeSubscriptionsQuery.isLoading ||
			categoriesQuery.isLoading,
		error:
			currentMonthTransactionsQuery.error ||
			activeSubscriptionsQuery.error ||
			categoriesQuery.error,
		refetch: () => {
			currentMonthTransactionsQuery.refetch();
			activeSubscriptionsQuery.refetch();
			categoriesQuery.refetch();
		},
	};
}