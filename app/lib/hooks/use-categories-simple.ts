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
 * カテゴリ関連のカスタムフック（シンプル版）
 */

// ========================================
// クエリフック（データ取得）
// ========================================

export function useCategories(
	options?: UseQueryOptions<CategoriesListResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.categories.lists(),
		queryFn: () => apiServices.categories.getCategories(),
		...options,
	});
}

export function useCategory(
	id: number,
	options?: UseQueryOptions<CategoryDetailResponse, ApiError>,
) {
	return useQuery({
		queryKey: queryKeys.categories.detail(id),
		queryFn: () => apiServices.categories.getCategory(id),
		enabled: !!id,
		...options,
	});
}

// ========================================
// ミューテーションフック（データ更新）
// ========================================

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
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories.lists(),
			});
		},
		...options,
	});
}

export function useUpdateCategory(
	options?: UseMutationOptions<
		CategoryDetailResponse,
		ApiError,
		{ id: number; data: UpdateCategoryRequest }
	>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ id, data }) =>
			apiServices.categories.updateCategory(id, data),
		onSuccess: (data, { id }) => {
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

export function useDeleteCategory(
	options?: UseMutationOptions<BaseApiResponse, ApiError, number>,
) {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (id: number) => apiServices.categories.deleteCategory(id),
		onSuccess: (data, id) => {
			queryClient.removeQueries({
				queryKey: queryKeys.categories.detail(id),
			});
			queryClient.invalidateQueries({
				queryKey: queryKeys.categories.lists(),
			});
		},
		...options,
	});
}

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
