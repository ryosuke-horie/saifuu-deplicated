import {
	type UseInfiniteQueryOptions,
	type UseMutationOptions,
	type UseQueryOptions,
	useInfiniteQuery,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import type { SelectTransaction } from "../../../db/schema";
import type { ApiError } from "../api/client";
import { apiServices } from "../api/services";
import { queryKeys } from "../query/provider";
import type {
	BaseApiResponse,
	CreateTransactionRequest,
	TransactionDetailResponse,
	TransactionFilters,
	TransactionSort,
	TransactionsListResponse,
	UpdateTransactionRequest,
} from "../schemas/api-responses";

/**
 * 取引関連のカスタムフック
 *
 * 設計方針:
 * - 高度なフィルタリングとページネーション対応
 * - 無限スクロール機能を提供
 * - オプティミスティックアップデートによるUX向上
 * - 統計情報の効率的なキャッシュ管理
 */

// ========================================
// 取引フィルター・ソート用の型定義
// ========================================

export interface UseTransactionsParams {
	filters?: Partial<TransactionFilters>;
	sort?: Partial<TransactionSort>;
	page?: number;
	limit?: number;
}

// ========================================
// クエリフック（データ取得）
// ========================================

/**
 * 取引一覧を取得するフック（ページネーション対応）
 */
export function useTransactions(
	params: UseTransactionsParams = {},
	options?: UseQueryOptions<TransactionsListResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.transactions.list(params),
		queryFn: () => apiServices.transactions.getTransactions(params),
		...options,
	});
}

/**
 * 取引一覧を無限スクロールで取得するフック
 */
export function useInfiniteTransactions(
	params: Omit<UseTransactionsParams, "page"> = {},
	options?: UseInfiniteQueryOptions<
		TransactionsListResponse,
		ApiError,
		TransactionsListResponse,
		any,
		number
	>,
) {
	return useInfiniteQuery({
		queryKey: queryKeys.transactions.list(params),
		queryFn: ({ pageParam = 1 }) =>
			apiServices.transactions.getTransactions({
				...params,
				page: pageParam,
			}),
		initialPageParam: 1,
		getNextPageParam: (lastPage) => {
			const { pagination } = lastPage;
			return pagination.hasNextPage ? pagination.currentPage + 1 : undefined;
		},
		getPreviousPageParam: (firstPage) => {
			const { pagination } = firstPage;
			return pagination.hasPrevPage ? pagination.currentPage - 1 : undefined;
		},
		...options,
	});
}

/**
 * 取引詳細を取得するフック
 */
export function useTransaction(
	id: number,
	options?: UseQueryOptions<TransactionDetailResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.transactions.detail(id),
		queryFn: () => apiServices.transactions.getTransaction(id),
		enabled: !!id,
		...options,
	});
}

/**
 * 取引統計を取得するフック
 */
export function useTransactionStats(
	params: {
		startDate?: string;
		endDate?: string;
		groupBy?: "month" | "category" | "type";
	} = {},
	options?: UseQueryOptions<BaseApiResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.transactions.stats(params),
		queryFn: () => apiServices.transactions.getTransactionStats(params),
		...options,
	});
}

// ========================================
// ミューテーションフック（データ更新）
// ========================================

/**
 * 取引作成のフック
 */
export function useCreateTransaction(
	options?: UseMutationOptions<
		TransactionDetailResponse,
		ApiError,
		CreateTransactionRequest
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateTransactionRequest) =>
			apiServices.transactions.createTransaction(data),
		onSuccess: (data) => {
			// 取引一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.lists(),
			});

			// 統計情報のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});

			// 新しい取引をキャッシュに追加
			queryClient.setQueryData(
				queryKeys.transactions.detail(data.data.id),
				data,
			);
		},
		...options,
	});
}

/**
 * 取引更新のフック
 */
export function useUpdateTransaction(
	options?: UseMutationOptions<
		TransactionDetailResponse,
		ApiError,
		{ id: number; data: UpdateTransactionRequest },
		{
			previousTransaction: TransactionDetailResponse | undefined;
			previousLists: Array<[any, any]>;
		}
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		TransactionDetailResponse,
		ApiError,
		{ id: number; data: UpdateTransactionRequest },
		{
			previousTransaction: TransactionDetailResponse | undefined;
			previousLists: Array<[any, any]>;
		}
	>({
		mutationFn: ({ id, data }) =>
			apiServices.transactions.updateTransaction(id, data),
		onMutate: async ({ id, data }) => {
			// 進行中のクエリをキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.transactions.detail(id),
			});
			await queryClient.cancelQueries({
				queryKey: queryKeys.transactions.lists(),
			});

			// 現在のデータを取得（ロールバック用）
			const previousTransaction =
				queryClient.getQueryData<TransactionDetailResponse>(
					queryKeys.transactions.detail(id),
				);

			const previousLists = queryClient.getQueriesData({
				queryKey: queryKeys.transactions.lists(),
			});

			// タグの型変換処理（配列 -> JSON文字列、データベース形式に合わせる）
			const convertTagsForDb = (tags: string[] | string | undefined | null) => {
				if (Array.isArray(tags)) {
					return JSON.stringify(tags);
				}
				return tags;
			};

			// オプティミスティックアップデート用のデータ準備
			const optimisticData: Partial<SelectTransaction> = {
				...data,
				tags: convertTagsForDb(data.tags) as string | null,
				updatedAt: new Date().toISOString(),
			};

			// オプティミスティックアップデート: 詳細データ
			if (previousTransaction) {
				const optimisticTransaction: TransactionDetailResponse = {
					...previousTransaction,
					data: {
						...previousTransaction.data,
						...optimisticData,
						tags: Array.isArray(optimisticData.tags)
							? optimisticData.tags
							: typeof optimisticData.tags === "string"
								? JSON.parse(optimisticData.tags)
								: null,
					},
				};

				queryClient.setQueryData(
					queryKeys.transactions.detail(id),
					optimisticTransaction,
				);
			}

			// オプティミスティックアップデート: 一覧データ
			queryClient.setQueriesData(
				{ queryKey: queryKeys.transactions.lists() },
				(old: TransactionsListResponse | undefined) => {
					if (!old) return old;

					return {
						...old,
						data: old.data.map((transaction) =>
							transaction.id === id
								? { ...transaction, ...optimisticData }
								: transaction,
						),
					};
				},
			);

			return {
				previousTransaction,
				previousLists,
			};
		},
		onError: (err, { id }, context) => {
			// エラー時にロールバック: 詳細データ
			if (context?.previousTransaction) {
				queryClient.setQueryData(
					queryKeys.transactions.detail(id),
					context.previousTransaction,
				);
			}

			// エラー時にロールバック: 一覧データ
			if (context?.previousLists) {
				for (const [queryKey, queryData] of context.previousLists) {
					queryClient.setQueryData(queryKey, queryData);
				}
			}
		},
		onSuccess: (data, { id }) => {
			// 成功時: サーバーからの最新データでキャッシュを更新
			queryClient.setQueryData(queryKeys.transactions.detail(id), data);

			// 一覧データもサーバーからの最新データで更新
			queryClient.setQueriesData(
				{ queryKey: queryKeys.transactions.lists() },
				(old: TransactionsListResponse | undefined) => {
					if (!old) return old;

					return {
						...old,
						data: old.data.map((transaction) =>
							transaction.id === id ? data.data : transaction,
						),
					};
				},
			);

			// 統計情報のキャッシュを無効化（金額や日付変更により影響を受ける可能性）
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});
		},
		...options,
	});
}

/**
 * 取引削除のフック
 */
export function useDeleteTransaction(
	options?: UseMutationOptions<
		BaseApiResponse,
		ApiError,
		number,
		{ previousTransactions: unknown }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousTransactions: unknown }
	>({
		mutationFn: (id: number) => apiServices.transactions.deleteTransaction(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート用のキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.transactions.lists(),
			});

			// 現在の一覧データを取得（ロールバック用）
			const previousTransactions = queryClient.getQueryData(
				queryKeys.transactions.lists(),
			);

			// オプティミスティックに一覧から削除
			queryClient.setQueriesData(
				{ queryKey: queryKeys.transactions.lists() },
				(old: TransactionsListResponse | undefined) => {
					if (!old) return old;
					return {
						...old,
						data: old.data.filter((transaction) => transaction.id !== id),
						count: old.count ? old.count - 1 : undefined,
					};
				},
			);

			return { previousTransactions };
		},
		onError: (err, id, context) => {
			// エラー時にロールバック
			if (context?.previousTransactions) {
				queryClient.setQueryData(
					queryKeys.transactions.lists(),
					context.previousTransactions,
				);
			}
		},
		onSuccess: (data, id) => {
			// 削除された取引の詳細キャッシュを削除
			queryClient.removeQueries({
				queryKey: queryKeys.transactions.detail(id),
			});
		},
		onSettled: () => {
			// 関連するクエリを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.lists(),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.transactions.all,
			});
		},
		...options,
	});
}

// ========================================
// 便利なユーティリティフック
// ========================================

/**
 * 今月の取引を取得するフック
 */
export function useCurrentMonthTransactions(
	additionalParams: UseTransactionsParams = {},
	options?: UseQueryOptions<TransactionsListResponse, ApiError>,
) {
	const now = new Date();
	const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
	const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

	return useTransactions(
		{
			...additionalParams,
			filters: {
				from: firstDay.toISOString().split("T")[0],
				to: lastDay.toISOString().split("T")[0],
				...additionalParams.filters,
			},
		},
		options,
	);
}

/**
 * 特定期間の取引を取得するフック
 */
export function useTransactionsByDateRange(
	startDate: string,
	endDate: string,
	additionalParams: UseTransactionsParams = {},
	options?: UseQueryOptions<TransactionsListResponse, ApiError>,
) {
	return useTransactions(
		{
			...additionalParams,
			filters: {
				from: startDate,
				to: endDate,
				...additionalParams.filters,
			},
		},
		options,
	);
}

/**
 * 特定カテゴリの取引を取得するフック
 */
export function useTransactionsByCategory(
	categoryId: number,
	additionalParams: UseTransactionsParams = {},
	options?: UseQueryOptions<TransactionsListResponse, ApiError>,
) {
	return useTransactions(
		{
			...additionalParams,
			filters: {
				category_id: categoryId,
				...additionalParams.filters,
			},
		},
		{
			enabled: !!categoryId,
			...options,
		} as UseQueryOptions<TransactionsListResponse, ApiError>,
	);
}

/**
 * 収入のみの取引を取得するフック
 */
export function useIncomeTransactions(
	additionalParams: UseTransactionsParams = {},
	options?: UseQueryOptions<TransactionsListResponse, ApiError>,
) {
	return useTransactions(
		{
			...additionalParams,
			filters: {
				type: "income",
				...additionalParams.filters,
			},
		},
		options,
	);
}

/**
 * 支出のみの取引を取得するフック
 */
export function useExpenseTransactions(
	additionalParams: UseTransactionsParams = {},
	options?: UseQueryOptions<TransactionsListResponse, ApiError>,
) {
	return useTransactions(
		{
			...additionalParams,
			filters: {
				type: "expense",
				...additionalParams.filters,
			},
		},
		options,
	);
}
