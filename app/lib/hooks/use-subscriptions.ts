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

	const { onSuccess: userOnSuccess, ...restOptions } = options ?? {};

	return useMutation({
		mutationFn: (data: CreateSubscriptionRequest) =>
			apiServices.subscriptions.createSubscription(data),
		onSuccess: (data, variables, context) => {
			// サブスクリプション一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});

			// 新しいサブスクリプションをキャッシュに追加
			queryClient.setQueryData<SubscriptionDetailResponse>(
				queryKeys.subscriptions.detail(data.data.id),
				data,
			);

			// 取引統計にも影響するため関連キャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});

			// ユーザー提供のonSuccessも実行
			userOnSuccess?.(data, variables, context);
		},
		...restOptions,
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
		{ previousSubscription: SubscriptionDetailResponse | undefined }
	>,
) {
	const queryClient = useQueryClient();

	const {
		onError: userOnError,
		onSettled: userOnSettled,
		...restOptions
	} = options ?? {};

	return useMutation<
		SubscriptionDetailResponse,
		ApiError,
		{ id: number; data: UpdateSubscriptionRequest },
		{ previousSubscription: SubscriptionDetailResponse | undefined }
	>({
		mutationFn: ({ id, data }) =>
			apiServices.subscriptions.updateSubscription(id, data),
		onMutate: async ({ id, data }) => {
			// オプティミスティックアップデート用のキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});

			// 現在のデータを取得（ロールバック用）
			const previousSubscription =
				queryClient.getQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
				);

			// オプティミスティックにデータを更新
			if (previousSubscription) {
				queryClient.setQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
					(old) => {
						if (!old) return old;
						return {
							...old,
							data: { ...old.data, ...data },
						};
					},
				);
			}

			return { previousSubscription };
		},
		onError: (err, variables, context) => {
			// エラー時にロールバック
			if (context?.previousSubscription) {
				queryClient.setQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(variables.id),
					context.previousSubscription,
				);
			}

			// ユーザー提供のonErrorも実行
			userOnError?.(err, variables, context);
		},
		onSettled: (data, error, variables, context) => {
			// 関連するクエリを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.detail(variables.id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});

			// ユーザー提供のonSettledも実行
			userOnSettled?.(data, error, variables, context);
		},
		...restOptions,
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
		{ previousSubscriptions: SubscriptionsListResponse | undefined }
	>,
) {
	const queryClient = useQueryClient();

	const {
		onSuccess: userOnSuccess,
		onError: userOnError,
		onSettled: userOnSettled,
		...restOptions
	} = options ?? {};

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscriptions: SubscriptionsListResponse | undefined }
	>({
		mutationFn: (id: number) =>
			apiServices.subscriptions.deleteSubscription(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート用のキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});

			// 現在の一覧データを取得（ロールバック用）
			const previousSubscriptions =
				queryClient.getQueryData<SubscriptionsListResponse>(
					queryKeys.subscriptions.lists(),
				);

			// オプティミスティックに一覧から削除
			if (previousSubscriptions) {
				queryClient.setQueryData<SubscriptionsListResponse>(
					queryKeys.subscriptions.lists(),
					(old) => {
						if (!old) return old;
						return {
							...old,
							data: old.data.filter((subscription) => subscription.id !== id),
							count: old.count ? old.count - 1 : undefined,
						};
					},
				);
			}

			return { previousSubscriptions };
		},
		onError: (err, id, context) => {
			// エラー時にロールバック
			if (context?.previousSubscriptions) {
				queryClient.setQueryData<SubscriptionsListResponse>(
					queryKeys.subscriptions.lists(),
					context.previousSubscriptions,
				);
			}

			// ユーザー提供のonErrorも実行
			userOnError?.(err, id, context);
		},
		onSuccess: (data, id, context) => {
			// 削除されたサブスクリプションの詳細キャッシュを削除
			queryClient.removeQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});

			// ユーザー提供のonSuccessも実行
			userOnSuccess?.(data, id, context);
		},
		onSettled: (data, error, id, context) => {
			// 関連するクエリを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});

			// ユーザー提供のonSettledも実行
			userOnSettled?.(data, error, id, context);
		},
		...restOptions,
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
		{ previousSubscription: SubscriptionDetailResponse | undefined }
	>,
) {
	const queryClient = useQueryClient();

	const {
		onError: userOnError,
		onSettled: userOnSettled,
		...restOptions
	} = options ?? {};

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscription: SubscriptionDetailResponse | undefined }
	>({
		mutationFn: (id: number) =>
			apiServices.subscriptions.deactivateSubscription(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});

			const previousSubscription =
				queryClient.getQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
				);

			if (previousSubscription) {
				queryClient.setQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
					(old) => {
						if (!old) return old;
						return {
							...old,
							data: { ...old.data, isActive: false },
						};
					},
				);
			}

			return { previousSubscription };
		},
		onError: (err, id, context) => {
			if (context?.previousSubscription) {
				queryClient.setQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
					context.previousSubscription,
				);
			}

			// ユーザー提供のonErrorも実行
			userOnError?.(err, id, context);
		},
		onSettled: (data, error, id, context) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});

			// ユーザー提供のonSettledも実行
			userOnSettled?.(data, error, id, context);
		},
		...restOptions,
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
		{ previousSubscription: SubscriptionDetailResponse | undefined }
	>,
) {
	const queryClient = useQueryClient();

	const {
		onError: userOnError,
		onSettled: userOnSettled,
		...restOptions
	} = options ?? {};

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousSubscription: SubscriptionDetailResponse | undefined }
	>({
		mutationFn: (id: number) =>
			apiServices.subscriptions.activateSubscription(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート
			await queryClient.cancelQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});

			const previousSubscription =
				queryClient.getQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
				);

			if (previousSubscription) {
				queryClient.setQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
					(old) => {
						if (!old) return old;
						return {
							...old,
							data: { ...old.data, isActive: true },
						};
					},
				);
			}

			return { previousSubscription };
		},
		onError: (err, id, context) => {
			if (context?.previousSubscription) {
				queryClient.setQueryData<SubscriptionDetailResponse>(
					queryKeys.subscriptions.detail(id),
					context.previousSubscription,
				);
			}

			// ユーザー提供のonErrorも実行
			userOnError?.(err, id, context);
		},
		onSettled: (data, error, id, context) => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.subscriptions.lists(),
			});

			// ユーザー提供のonSettledも実行
			userOnSettled?.(data, error, id, context);
		},
		...restOptions,
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
			const amount = Number(subscription.amount);

			switch (subscription.frequency) {
				case "monthly":
					monthlyAmount = amount;
					break;
				case "yearly":
					monthlyAmount = amount / 12;
					break;
				case "weekly":
					monthlyAmount = (amount * 52) / 12;
					break;
				case "daily":
					monthlyAmount = amount * 30; // 概算
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
