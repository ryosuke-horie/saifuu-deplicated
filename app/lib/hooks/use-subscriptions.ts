import {
	type UseMutationOptions,
	type UseQueryOptions,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { ApiError } from "../api/client";
import { apiServices } from "../api/services";
import { queryKeys } from "../query/provider";
import type {
	BaseApiResponse,
	CreateSubscriptionRequest,
	SubscriptionDetailResponse,
	SubscriptionsListResponse,
	UpdateSubscriptionRequest,
} from "../schemas/api-responses";

/**
 * サブスクリプション関連のカスタムフック
 *
 * 設計方針:
 * - 定期支払いの管理に特化した機能
 * - アクティブ/非アクティブ状態の管理
 * - 次回支払日による自動ソート
 * - 年間/月間コストの計算機能
 */

// ========================================
// クエリフック（データ取得）
// ========================================

/**
 * サブスクリプション一覧を取得するフック
 */
export function useSubscriptions(
	options?: UseQueryOptions<SubscriptionsListResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.subscriptions.lists(),
		queryFn: () => apiServices.subscriptions.getSubscriptions(),
		...options,
	});
}

/**
 * サブスクリプション詳細を取得するフック
 */
export function useSubscription(
	id: number,
	options?: UseQueryOptions<SubscriptionDetailResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.subscriptions.detail(id),
		queryFn: () => apiServices.subscriptions.getSubscription(id),
		enabled: !!id,
		...options,
	});
}

// ========================================
// ミューテーションフック（データ更新）
// ========================================

/**
 * サブスクリプション作成のフック
 */
export function useCreateSubscription(
	options?: UseMutationOptions<
		SubscriptionDetailResponse,
		ApiError,
		CreateSubscriptionRequest
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateSubscriptionRequest) =>
			apiServices.subscriptions.createSubscription(data),
		onSuccess: (data) => {
			// サブスクリプション一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});

			// 新しいサブスクリプションをキャッシュに追加
			queryClient.setQueryData(
				queryKeys.subscriptions.detail(data.data.id),
				data,
			);

			// 取引統計にも影響するため関連キャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});
		},
		...options,
	});
}

/**
 * サブスクリプション更新のフック
 */
export function useUpdateSubscription(
	options?: UseMutationOptions<
		SubscriptionDetailResponse,
		ApiError,
		{ id: number; data: UpdateSubscriptionRequest },
		{ previousSubscription: unknown }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		SubscriptionDetailResponse,
		ApiError,
		{ id: number; data: UpdateSubscriptionRequest },
		{ previousSubscription: unknown }
	>({
		mutationFn: ({ id, data }) =>
			apiServices.subscriptions.updateSubscription(id, data),
		onMutate: async ({ id, data }) => {
			// オプティミスティックアップデート用のキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});

			// 現在のデータを取得（ロールバック用）
			const previousSubscription = queryClient.getQueryData(
				queryKeys.subscriptions.detail(id),
			);

			// オプティミスティックにデータを更新
			if (previousSubscription) {
				queryClient.setQueryData(
					queryKeys.subscriptions.detail(id),
					(old: SubscriptionDetailResponse) => ({
						...old,
						data: { ...old.data, ...data },
					}),
				);
			}

			return { previousSubscription };
		},
		onError: (err, { id }, context) => {
			// エラー時にロールバック
			if (context?.previousSubscription) {
				queryClient.setQueryData(
					queryKeys.subscriptions.detail(id),
					context.previousSubscription,
				);
			}
		},
		onSettled: (data, error, { id }) => {
			// 関連するクエリを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});
		},
		...options,
	});
}

/**
 * サブスクリプション削除のフック
 */
export function useDeleteSubscription(
	options?: UseMutationOptions<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscriptions: unknown }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscriptions: unknown }
	>({
		mutationFn: (id: number) =>
			apiServices.subscriptions.deleteSubscription(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート用のキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});

			// 現在の一覧データを取得（ロールバック用）
			const previousSubscriptions = queryClient.getQueryData(
				queryKeys.subscriptions.lists(),
			);

			// オプティミスティックに一覧から削除
			if (previousSubscriptions) {
				queryClient.setQueryData(
					queryKeys.subscriptions.lists(),
					(old: SubscriptionsListResponse) => ({
						...old,
						data: old.data.filter((subscription) => subscription.id !== id),
						count: old.count ? old.count - 1 : undefined,
					}),
				);
			}

			return { previousSubscriptions };
		},
		onError: (err, id, context) => {
			// エラー時にロールバック
			if (context?.previousSubscriptions) {
				queryClient.setQueryData(
					queryKeys.subscriptions.lists(),
					context.previousSubscriptions,
				);
			}
		},
		onSuccess: (data, id) => {
			// 削除されたサブスクリプションの詳細キャッシュを削除
			queryClient.removeQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});
		},
		onSettled: () => {
			// 関連するクエリを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});
		},
		...options,
	});
}

/**
 * サブスクリプション一時停止のフック
 */
export function useDeactivateSubscription(
	options?: UseMutationOptions<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscription: unknown }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscription: unknown }
	>({
		mutationFn: (id: number) =>
			apiServices.subscriptions.deactivateSubscription(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});

			const previousSubscription = queryClient.getQueryData(
				queryKeys.subscriptions.detail(id),
			);

			if (previousSubscription) {
				queryClient.setQueryData(
					queryKeys.subscriptions.detail(id),
					(old: SubscriptionDetailResponse) => ({
						...old,
						data: { ...old.data, isActive: false },
					}),
				);
			}

			return { previousSubscription };
		},
		onError: (err, id, context) => {
			if (context?.previousSubscription) {
				queryClient.setQueryData(
					queryKeys.subscriptions.detail(id),
					context.previousSubscription,
				);
			}
		},
		onSettled: (data, error, id) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});
		},
		...options,
	});
}

/**
 * サブスクリプション再開のフック
 */
export function useActivateSubscription(
	options?: UseMutationOptions<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscription: unknown }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscription: unknown }
	>({
		mutationFn: (id: number) =>
			apiServices.subscriptions.activateSubscription(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});

			const previousSubscription = queryClient.getQueryData(
				queryKeys.subscriptions.detail(id),
			);

			if (previousSubscription) {
				queryClient.setQueryData(
					queryKeys.subscriptions.detail(id),
					(old: SubscriptionDetailResponse) => ({
						...old,
						data: { ...old.data, isActive: true },
					}),
				);
			}

			return { previousSubscription };
		},
		onError: (err, id, context) => {
			if (context?.previousSubscription) {
				queryClient.setQueryData(
					queryKeys.subscriptions.detail(id),
					context.previousSubscription,
				);
			}
		},
		onSettled: (data, error, id) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});
		},
		...options,
	});
}

// ========================================
// 便利なユーティリティフック
// ========================================

/**
 * アクティブなサブスクリプションのみを取得するフック
 */
export function useActiveSubscriptions(
	options?: UseQueryOptions<SubscriptionsListResponse, ApiError>,
) {
	const {
		data: subscriptionsResponse,
		isLoading,
		error,
		...rest
	} = useSubscriptions(options);

	const activeSubscriptions = subscriptionsResponse?.data.filter(
		(subscription) => subscription.isActive,
	);

	return {
		data: activeSubscriptions
			? {
					...subscriptionsResponse,
					data: activeSubscriptions,
					count: activeSubscriptions.length,
				}
			: undefined,
		isLoading,
		error,
		...rest,
	};
}

/**
 * 非アクティブなサブスクリプションのみを取得するフック
 */
export function useInactiveSubscriptions(
	options?: UseQueryOptions<SubscriptionsListResponse, ApiError>,
) {
	const {
		data: subscriptionsResponse,
		isLoading,
		error,
		...rest
	} = useSubscriptions(options);

	const inactiveSubscriptions = subscriptionsResponse?.data.filter(
		(subscription) => !subscription.isActive,
	);

	return {
		data: inactiveSubscriptions
			? {
					...subscriptionsResponse,
					data: inactiveSubscriptions,
					count: inactiveSubscriptions.length,
				}
			: undefined,
		isLoading,
		error,
		...rest,
	};
}

/**
 * 今月支払予定のサブスクリプションを取得するフック
 */
export function useCurrentMonthSubscriptions(
	options?: UseQueryOptions<SubscriptionsListResponse, ApiError>,
) {
	const {
		data: subscriptionsResponse,
		isLoading,
		error,
		...rest
	} = useActiveSubscriptions(options);

	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	const thisMonthSubscriptions = subscriptionsResponse?.data.filter(
		(subscription) => {
			const nextPaymentDate = new Date(subscription.nextPaymentDate);
			return (
				nextPaymentDate.getMonth() === currentMonth &&
				nextPaymentDate.getFullYear() === currentYear
			);
		},
	);

	return {
		data: thisMonthSubscriptions
			? {
					...subscriptionsResponse,
					data: thisMonthSubscriptions,
					count: thisMonthSubscriptions.length,
				}
			: undefined,
		isLoading,
		error,
		...rest,
	};
}

/**
 * 月間サブスクリプション総額を計算するフック
 */
export function useSubscriptionsTotalCost() {
	const { data: subscriptionsResponse } = useActiveSubscriptions();

	if (!subscriptionsResponse) return { monthlyTotal: 0, yearlyTotal: 0 };

	const totals = subscriptionsResponse.data.reduce(
		(acc, subscription) => {
			let monthlyAmount = 0;

			switch (subscription.frequency) {
				case "monthly":
					monthlyAmount = subscription.amount;
					break;
				case "yearly":
					monthlyAmount = subscription.amount / 12;
					break;
				case "weekly":
					monthlyAmount = (subscription.amount * 52) / 12;
					break;
				case "daily":
					monthlyAmount = subscription.amount * 30; // 概算
					break;
			}

			acc.monthlyTotal += monthlyAmount;
			acc.yearlyTotal += monthlyAmount * 12;

			return acc;
		},
		{ monthlyTotal: 0, yearlyTotal: 0 },
	);

	return {
		monthlyTotal: Math.round(totals.monthlyTotal),
		yearlyTotal: Math.round(totals.yearlyTotal),
	};
}
