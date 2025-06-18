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
	CategoriesListResponse,
	CategoryDetailResponse,
	CreateCategoryRequest,
	ReorderCategoriesRequest,
	UpdateCategoryRequest,
} from "../schemas/api-responses";

/**
 * カテゴリ関連のカスタムフック
 *
 * 設計方針:
 * - TanStack Queryの機能を活用した効率的なデータフェッチ
 * - オプティミスティックアップデートによるUX向上
 * - 適切なキャッシュ無効化とデータ同期
 * - エラーハンドリングとローディング状態の管理
 */

// ========================================
// クエリフック（データ取得）
// ========================================

/**
 * カテゴリ一覧を取得するフック
 */
export function useCategories(
	options?: UseQueryOptions<CategoriesListResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.categories.lists(),
		queryFn: () => apiServices.categories.getCategories(),
		...options,
	});
}

/**
 * カテゴリ詳細を取得するフック
 */
export function useCategory(
	id: number,
	options?: UseQueryOptions<CategoryDetailResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.categories.detail(id),
		queryFn: () => apiServices.categories.getCategory(id),
		enabled: !!id, // IDが有効な場合のみクエリを実行
		...options,
	});
}

// ========================================
// ミューテーションフック（データ更新）
// ========================================

/**
 * カテゴリ作成のフック
 */
export function useCreateCategory(
	options?: UseMutationOptions<
		CategoryDetailResponse,
		ApiError,
		CreateCategoryRequest
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: CreateCategoryRequest) =>
			apiServices.categories.createCategory(data),
		onSuccess: (data) => {
			// カテゴリ一覧のキャッシュを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories.lists(),
			});

			// 新しいカテゴリをキャッシュに追加
			queryClient.setQueryData(queryKeys.categories.detail(data.data.id), data);
		},
		...options,
	});
}

/**
 * カテゴリ更新のフック
 */
export function useUpdateCategory(
	options?: UseMutationOptions<
		CategoryDetailResponse,
		ApiError,
		{ id: number; data: UpdateCategoryRequest },
		{ previousCategory: CategoryDetailResponse | undefined }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		CategoryDetailResponse,
		ApiError,
		{ id: number; data: UpdateCategoryRequest },
		{ previousCategory: CategoryDetailResponse | undefined }
	>({
		mutationFn: ({ id, data }) =>
			apiServices.categories.updateCategory(id, data),
		onMutate: async ({ id, data }) => {
			// オプティミスティックアップデート用のキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.categories.detail(id),
			});

			// 現在のデータを取得（ロールバック用）
			const previousCategory = queryClient.getQueryData<CategoryDetailResponse>(
				queryKeys.categories.detail(id),
			);

			// オプティミスティックにデータを更新
			if (previousCategory) {
				queryClient.setQueryData<CategoryDetailResponse>(
					queryKeys.categories.detail(id),
					(old) => {
						if (!old) return old;
						return {
							...old,
							data: { ...old.data, ...data },
						};
					},
				);
			}

			return {
				previousCategory: previousCategory as
					| CategoryDetailResponse
					| undefined,
			};
		},
		onError: (err, { id }, context) => {
			// エラー時にロールバック
			if (context?.previousCategory) {
				queryClient.setQueryData(
					queryKeys.categories.detail(id),
					context.previousCategory,
				);
			}
		},
		onSettled: (data, error, { id }) => {
			// 関連するクエリを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories.lists(),
			});
		},
		...options,
	});
}

/**
 * カテゴリ削除のフック
 */
export function useDeleteCategory(
	options?: UseMutationOptions<
		BaseApiResponse,
		ApiError,
		number,
		{ previousCategories: CategoriesListResponse | undefined }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation<
		BaseApiResponse,
		ApiError,
		number,
		{ previousCategories: CategoriesListResponse | undefined }
	>({
		mutationFn: (id: number) => apiServices.categories.deleteCategory(id),
		onMutate: async (id) => {
			// オプティミスティックアップデート用のキャンセル
			await queryClient.cancelQueries({
				queryKey: queryKeys.categories.lists(),
			});

			// 現在の一覧データを取得（ロールバック用）
			const previousCategories = queryClient.getQueryData(
				queryKeys.categories.lists(),
			);

			// オプティミスティックに一覧から削除
			if (previousCategories) {
				queryClient.setQueryData<CategoriesListResponse>(
					queryKeys.categories.lists(),
					(old) => {
						if (!old) return old;
						return {
							...old,
							data: old.data.filter((category) => category.id !== id),
							count: old.count ? old.count - 1 : undefined,
						};
					},
				);
			}

			return {
				previousCategories: previousCategories as
					| CategoriesListResponse
					| undefined,
			};
		},
		onError: (err, id, context) => {
			// エラー時にロールバック
			if (context?.previousCategories) {
				queryClient.setQueryData(
					queryKeys.categories.lists(),
					context.previousCategories,
				);
			}
		},
		onSuccess: (data, id) => {
			// 削除されたカテゴリの詳細キャッシュを削除
			queryClient.removeQueries({
				queryKey: queryKeys.categories.detail(id),
			});
		},
		onSettled: () => {
			// 関連するクエリを無効化
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories.lists(),
			});
		},
		...options,
	});
}

/**
 * カテゴリ並び替えのフック
 */
export function useReorderCategories(
	options?: UseMutationOptions<
		BaseApiResponse,
		ApiError,
		ReorderCategoriesRequest
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: ReorderCategoriesRequest) =>
			apiServices.categories.reorderCategories(data),
		onSuccess: () => {
			// カテゴリ一覧を再取得（並び順が変更されるため）
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories.lists(),
			});
		},
		...options,
	});
}

// ========================================
// 便利なユーティリティフック
// ========================================

/**
 * 特定タイプのカテゴリのみを取得するフック
 */
export function useCategoriesByType(
	type: "income" | "expense",
	options?: UseQueryOptions<CategoriesListResponse, ApiError>,
) {
	const {
		data: categoriesResponse,
		isLoading,
		error,
		...rest
	} = useCategories(options);

	const filteredCategories = categoriesResponse?.data.filter(
		(category) => category.type === type,
	);

	return {
		data: filteredCategories
			? {
					...categoriesResponse,
					data: filteredCategories,
					count: filteredCategories.length,
				}
			: undefined,
		isLoading,
		error,
		...rest,
	};
}

/**
 * アクティブなカテゴリのみを取得するフック
 */
export function useActiveCategories(
	options?: UseQueryOptions<CategoriesListResponse, ApiError>,
) {
	const {
		data: categoriesResponse,
		isLoading,
		error,
		...rest
	} = useCategories(options);

	const activeCategories = categoriesResponse?.data.filter(
		(category) => category.isActive,
	);

	return {
		data: activeCategories
			? {
					...categoriesResponse,
					data: activeCategories,
					count: activeCategories.length,
				}
			: undefined,
		isLoading,
		error,
		...rest,
	};
}
