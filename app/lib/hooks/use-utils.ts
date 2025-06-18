import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { useCategories } from "./use-categories";
import { useActiveCategories } from "./use-categories";
import { useSubscriptions } from "./use-subscriptions";
import { useActiveSubscriptions } from "./use-subscriptions";
import { useSubscriptionsTotalCost } from "./use-subscriptions";
import { useCurrentMonthTransactions } from "./use-transactions";

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
