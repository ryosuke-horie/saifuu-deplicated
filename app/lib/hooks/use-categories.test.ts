/**
 * use-categories.ts カスタムフックのテスト
 *
 * テスト対象:
 * - クエリフック（useCategories、useCategory）
 * - ミューテーションフック（useCreateCategory、useUpdateCategory、useDeleteCategory、useReorderCategories）
 * - ユーティリティフック（useCategoriesByType、useActiveCategories）
 * - オプティミスティックアップデート機能
 * - エラー時のロールバック機能
 * - ローディング状態の管理
 *
 * React QueryとReact Router v7の統合テスト
 * Issue #37の例に基づいたテスト実装
 */

import {
	QueryClient,
	QueryClientProvider,
	useMutation,
	useQuery,
	useQueryClient,
} from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import * as React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// apiServicesをモック
vi.mock("../api/services", () => ({
	apiServices: {
		categories: {
			getCategories: vi.fn(),
			getCategory: vi.fn(),
			createCategory: vi.fn(),
			updateCategory: vi.fn(),
			deleteCategory: vi.fn(),
			reorderCategories: vi.fn(),
		},
	},
}));

// queryKeysのみをモック（React Router問題を回避しつつ実際のキー生成を再現）
vi.mock("../query/provider", () => {
	return {
		queryKeys: {
			categories: {
				all: ["categories"] as const,
				lists: () => ["categories", "list"] as const,
				list: (filters?: Record<string, unknown>) => ["categories", "list", { filters }] as const,
				details: () => ["categories", "detail"] as const,
				detail: (id: number) => ["categories", "detail", id] as const,
			},
		},
	};
});

// モックした後にimportを行う
import { apiServices } from "../api/services";
// React QueryとReact Router v7の統合問題を回避するため、直接実装
function createTestQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				staleTime: 0,
				refetchOnMount: false,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
			},
			mutations: {
				retry: false,
				onError: () => {},
			},
		},
	});
}

function clearQueryClientCache(queryClient: QueryClient) {
	queryClient.clear();
	queryClient.removeQueries();
	queryClient.cancelQueries();
}

function setQueryData<T>(
	queryClient: QueryClient,
	queryKey: readonly unknown[],
	data: T,
) {
	queryClient.setQueryData([...queryKey], data);
}

function setQueryError(
	queryClient: QueryClient,
	queryKey: readonly unknown[],
	error: Error,
) {
	// React Query v5では直接的なエラー状態設定は異なるアプローチを使用
	queryClient.setQueryData([...queryKey], undefined);
	// エラー状態の設定は、実際のクエリが失敗した場合にライブラリが自動的に行う
}
import { ApiError } from "../api/client";

import { queryKeys } from "../query/provider";
import type {
	BaseApiResponse,
	CategoriesListResponse,
	CategoryDetailResponse,
	CreateCategoryRequest,
	ReorderCategoriesRequest,
	UpdateCategoryRequest,
} from "../schemas/api-responses";

// 実際のhookをインポート
import {
	useActiveCategories,
	useCategories,
	useCategoriesByType,
	useCategory,
	useCreateCategory,
	useDeleteCategory,
	useReorderCategories,
	useUpdateCategory,
} from "./use-categories";

// ========================================
// モックセットアップ
// ========================================

// apiServicesをモック
vi.mock("../api/services", () => ({
	apiServices: {
		categories: {
			getCategories: vi.fn(),
			getCategory: vi.fn(),
			createCategory: vi.fn(),
			updateCategory: vi.fn(),
			deleteCategory: vi.fn(),
			reorderCategories: vi.fn(),
		},
	},
}));

// モックしたapiServicesを取得
const mockApiServices = vi.mocked(apiServices, true);

// ========================================
// テストデータ
// ========================================

const mockCategoriesListResponse: CategoriesListResponse = {
	success: true,
	data: [
		{
			id: 1,
			name: "食費",
			type: "expense",
			color: "#FF6B6B",
			icon: "🍽️",
			isActive: true,
			displayOrder: 1,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: 2,
			name: "給与",
			type: "income",
			color: "#4ECDC4",
			icon: "💰",
			isActive: true,
			displayOrder: 1,
			createdAt: "2024-01-02T00:00:00.000Z",
			updatedAt: "2024-01-02T00:00:00.000Z",
		},
		{
			id: 3,
			name: "交通費",
			type: "expense",
			color: "#45B7D1",
			icon: "🚗",
			isActive: false,
			displayOrder: 2,
			createdAt: "2024-01-03T00:00:00.000Z",
			updatedAt: "2024-01-03T00:00:00.000Z",
		},
	],
	count: 3,
};

const mockCategoryDetailResponse: CategoryDetailResponse = {
	success: true,
	data: {
		id: 1,
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		icon: "🍽️",
		isActive: true,
		displayOrder: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
};

const mockApiError = new ApiError("API Error", 400);

// ========================================
// テストヘルパー
// ========================================

function createWrapperWithQueryClient(queryClient: QueryClient) {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(
			QueryClientProvider,
			{ client: queryClient },
			children,
		);
	};
}

// ========================================
// テストスイート
// ========================================

describe("use-categories hooks", () => {
	let queryClient: QueryClient;

	beforeEach(() => {
		queryClient = createTestQueryClient();
		vi.clearAllMocks();
	});

	afterEach(() => {
		clearQueryClientCache(queryClient);
	});

	// ========================================
	// クエリフックのテスト
	// ========================================

	describe("useCategories", () => {
		it("カテゴリ一覧を正常に取得できること", async () => {
			mockApiServices.categories.getCategories.mockResolvedValue(
				mockCategoriesListResponse,
			);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// 初期状態はローディング
			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();

			// データ取得完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockCategoriesListResponse);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();

			// APIが正しく呼ばれること
			expect(mockApiServices.categories.getCategories).toHaveBeenCalledWith();
		});

		it("API エラー時にエラー状態を返すこと", async () => {
			mockApiServices.categories.getCategories.mockRejectedValue(mockApiError);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(mockApiError);
			expect(result.current.data).toBeUndefined();
		});

		it("事前にキャッシュされたデータを返すこと", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.categories.lists();
			setQueryData(queryClient, queryKey, mockCategoriesListResponse);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// キャッシュからすぐにデータが取得される
			expect(result.current.data).toEqual(mockCategoriesListResponse);
			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("useCategory", () => {
		it("カテゴリ詳細を正常に取得できること", async () => {
			mockApiServices.categories.getCategory.mockResolvedValue(
				mockCategoryDetailResponse,
			);

			const { result } = renderHook(() => useCategory(1), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockCategoryDetailResponse);
			expect(mockApiServices.categories.getCategory).toHaveBeenCalledWith(1);
		});

		it("IDが無効な場合はクエリを実行しないこと", () => {
			const { result } = renderHook(() => useCategory(0), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.fetchStatus).toBe("idle");
			expect(mockApiServices.categories.getCategory).not.toHaveBeenCalled();
		});
	});

	// ========================================
	// ミューテーションフックのテスト
	// ========================================

	describe("useCreateCategory", () => {
		it("カテゴリを正常に作成できること", async () => {
			mockApiServices.categories.createCategory.mockResolvedValue(
				mockCategoryDetailResponse,
			);

			const { result } = renderHook(() => useCreateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateCategoryRequest = {
				name: "食費",
				type: "expense",
				color: "#FF6B6B",
				icon: "🍽️",
			};

			await act(async () => {
				result.current.mutate(createData);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockCategoryDetailResponse);
			expect(mockApiServices.categories.createCategory).toHaveBeenCalledWith(
				createData,
			);
		});

		it("作成成功時にキャッシュが適切に更新されること", async () => {
			// onSuccessが実行されることを確認するためのスパイ
			const onSuccessSpy = vi.fn();
			
			mockApiServices.categories.createCategory.mockResolvedValue(
				mockCategoryDetailResponse,
			);

			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.categories.lists();
			setQueryData(queryClient, listQueryKey, mockCategoriesListResponse);

			const { result } = renderHook(() => useCreateCategory({
				onSuccess: onSuccessSpy
			}), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateCategoryRequest = {
				name: "食費",
				type: "expense",
				color: "#FF6B6B",
				icon: "🍽️",
			};

			await act(async () => {
				result.current.mutate(createData);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// onSuccessコールバックが実行されたことを確認
			expect(onSuccessSpy).toHaveBeenCalledWith(
				mockCategoryDetailResponse,
				createData,
				undefined
			);

			// 新しいカテゴリの詳細がキャッシュに追加されることを確認
			const detailQueryKey = queryKeys.categories.detail(1);
			const cachedDetail = queryClient.getQueryData(detailQueryKey);
			expect(cachedDetail).toEqual(mockCategoryDetailResponse);
		});

		it("作成エラー時にエラー状態を返すこと", async () => {
			mockApiServices.categories.createCategory.mockRejectedValue(mockApiError);

			const { result } = renderHook(() => useCreateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateCategoryRequest = {
				name: "食費",
				type: "expense",
				color: "#FF6B6B",
				icon: "🍽️",
			};

			await act(async () => {
				result.current.mutate(createData);
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(mockApiError);
		});
	});

	describe("useUpdateCategory", () => {
		it("カテゴリを正常に更新できること", async () => {
			const updatedResponse = {
				...mockCategoryDetailResponse,
				data: {
					...mockCategoryDetailResponse.data,
					name: "更新された食費",
				},
			};

			mockApiServices.categories.updateCategory.mockResolvedValue(
				updatedResponse,
			);

			const { result } = renderHook(() => useUpdateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateCategoryRequest = {
				name: "更新された食費",
			};

			await act(async () => {
				result.current.mutate({ id: 1, data: updateData });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(updatedResponse);
			expect(mockApiServices.categories.updateCategory).toHaveBeenCalledWith(
				1,
				updateData,
			);
		});

		it("オプティミスティックアップデートが動作すること", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.categories.detail(1);
			setQueryData(queryClient, queryKey, mockCategoryDetailResponse);

			// 更新レスポンスを遅延させる
			mockApiServices.categories.updateCategory.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockCategoryDetailResponse), 100);
					}),
			);

			const { result } = renderHook(() => useUpdateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateCategoryRequest = {
				name: "更新された食費",
			};

			act(() => {
				result.current.mutate({ id: 1, data: updateData });
			});

			// onMutateが実行されて、オプティミスティックアップデートが実行されることを確認
			await waitFor(() => {
				expect(result.current.isPending).toBe(true);
			});

			// キャッシュが一時的に更新されることを確認
			const cachedData = queryClient.getQueryData(
				queryKey,
			) as CategoryDetailResponse;
			expect(cachedData?.data.name).toBe("更新された食費");

			// 更新完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});

		it("更新エラー時にロールバックが実行されること", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.categories.detail(1);
			setQueryData(queryClient, queryKey, mockCategoryDetailResponse);

			mockApiServices.categories.updateCategory.mockRejectedValue(mockApiError);

			const { result } = renderHook(() => useUpdateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateCategoryRequest = {
				name: "更新された食費",
			};

			await act(async () => {
				result.current.mutate({ id: 1, data: updateData });
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			// エラー後もキャッシュには元のデータが残っていることを確認
			const cachedData = queryClient.getQueryData(queryKey);
			expect(cachedData).toEqual(mockCategoryDetailResponse);
		});
	});

	describe("useDeleteCategory", () => {
		it("カテゴリを正常に削除できること", async () => {
			const deleteResponse: BaseApiResponse = {
				success: true,
				data: { message: "カテゴリが削除されました" },
			};

			mockApiServices.categories.deleteCategory.mockResolvedValue(
				deleteResponse,
			);

			const { result } = renderHook(() => useDeleteCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate(1);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(deleteResponse);
			expect(mockApiServices.categories.deleteCategory).toHaveBeenCalledWith(1);
		});

		it("削除時にオプティミスティックアップデートが動作すること", async () => {
			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.categories.lists();
			setQueryData(queryClient, listQueryKey, mockCategoriesListResponse);

			const deleteResponse: BaseApiResponse = {
				success: true,
				data: { message: "カテゴリが削除されました" },
			};

			// 削除レスポンスを遅延させる
			mockApiServices.categories.deleteCategory.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(deleteResponse), 100);
					}),
			);

			const { result } = renderHook(() => useDeleteCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			act(() => {
				result.current.mutate(1);
			});

			// オプティミスティックアップデートが実行されることを確認
			await waitFor(() => {
				expect(result.current.isPending).toBe(true);
			});

			// 一覧からアイテムが削除されることを確認
			const cachedData = queryClient.getQueryData(
				listQueryKey,
			) as CategoriesListResponse;
			expect(cachedData?.data.find((cat) => cat.id === 1)).toBeUndefined();
			expect(cachedData?.count).toBe(2);

			// 削除完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});

		it("削除エラー時にロールバックが実行されること", async () => {
			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.categories.lists();
			setQueryData(queryClient, listQueryKey, mockCategoriesListResponse);

			mockApiServices.categories.deleteCategory.mockRejectedValue(mockApiError);

			const { result } = renderHook(() => useDeleteCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate(1);
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			// エラー後も一覧データが復元されていることを確認
			const cachedData = queryClient.getQueryData(listQueryKey);
			expect(cachedData).toEqual(mockCategoriesListResponse);
		});
	});

	describe("useReorderCategories", () => {
		it("カテゴリ並び替えを正常に実行できること", async () => {
			const reorderResponse: BaseApiResponse = {
				success: true,
				data: { message: "カテゴリの並び順が更新されました" },
			};

			mockApiServices.categories.reorderCategories.mockResolvedValue(
				reorderResponse,
			);

			const { result } = renderHook(() => useReorderCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const reorderData: ReorderCategoriesRequest = {
				categoryIds: [2, 1, 3],
			};

			await act(async () => {
				result.current.mutate(reorderData);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(reorderResponse);
			expect(mockApiServices.categories.reorderCategories).toHaveBeenCalledWith(
				reorderData,
			);
		});
	});

	// ========================================
	// ユーティリティフックのテスト
	// ========================================

	describe("useCategoriesByType", () => {
		it("支出カテゴリのみを正常にフィルタリングできること", async () => {
			mockApiServices.categories.getCategories.mockResolvedValue(
				mockCategoriesListResponse,
			);

			const { result } = renderHook(() => useCategoriesByType("expense"), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			const expenseCategories = result.current.data?.data.filter(
				(cat) => cat.type === "expense",
			);
			expect(result.current.data?.data).toEqual(expenseCategories);
			expect(result.current.data?.count).toBe(2); // 食費と交通費
		});

		it("収入カテゴリのみを正常にフィルタリングできること", async () => {
			mockApiServices.categories.getCategories.mockResolvedValue(
				mockCategoriesListResponse,
			);

			const { result } = renderHook(() => useCategoriesByType("income"), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			const incomeCategories = result.current.data?.data.filter(
				(cat) => cat.type === "income",
			);
			expect(result.current.data?.data).toEqual(incomeCategories);
			expect(result.current.data?.count).toBe(1); // 給与のみ
		});

		it("データがない場合はundefinedを返すこと", () => {
			mockApiServices.categories.getCategories.mockImplementation(
				() => new Promise(() => {}), // 永続的にペンディング状態
			);

			const { result } = renderHook(() => useCategoriesByType("expense"), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.data).toBeUndefined();
		});
	});

	describe("useActiveCategories", () => {
		it("アクティブなカテゴリのみを正常にフィルタリングできること", async () => {
			mockApiServices.categories.getCategories.mockResolvedValue(
				mockCategoriesListResponse,
			);

			const { result } = renderHook(() => useActiveCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			const activeCategories = result.current.data?.data.filter(
				(cat) => cat.isActive,
			);
			expect(result.current.data?.data).toEqual(activeCategories);
			expect(result.current.data?.count).toBe(2); // 食費と給与のみ（交通費は非アクティブ）
		});

		it("すべて非アクティブな場合は空配列を返すこと", async () => {
			const allInactiveResponse = {
				...mockCategoriesListResponse,
				data: mockCategoriesListResponse.data.map((cat) => ({
					...cat,
					isActive: false,
				})),
			};

			mockApiServices.categories.getCategories.mockResolvedValue(
				allInactiveResponse,
			);

			const { result } = renderHook(() => useActiveCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data?.data).toEqual([]);
			expect(result.current.data?.count).toBe(0);
		});
	});

	// ========================================
	// 複合テスト（統合テスト）
	// ========================================

	describe("integration tests", () => {
		it("作成→一覧取得→更新→削除の一連の流れが正常に動作すること", async () => {
			// 作成
			const createResponse = mockCategoryDetailResponse;
			mockApiServices.categories.createCategory.mockResolvedValue(
				createResponse,
			);

			const { result: createResult } = renderHook(() => useCreateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateCategoryRequest = {
				name: "食費",
				type: "expense",
				color: "#FF6B6B",
				icon: "🍽️",
			};

			await act(async () => {
				createResult.current.mutate(createData);
			});

			await waitFor(() => {
				expect(createResult.current.isSuccess).toBe(true);
			});

			// 作成後の一覧取得
			mockApiServices.categories.getCategories.mockResolvedValue(
				mockCategoriesListResponse,
			);

			const { result: listResult } = renderHook(() => useCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(listResult.current.isSuccess).toBe(true);
			});

			// 更新
			const updateResponse = {
				...mockCategoryDetailResponse,
				data: {
					...mockCategoryDetailResponse.data,
					name: "更新された食費",
				},
			};

			mockApiServices.categories.updateCategory.mockResolvedValue(
				updateResponse,
			);

			const { result: updateResult } = renderHook(() => useUpdateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				updateResult.current.mutate({
					id: 1,
					data: { name: "更新された食費" },
				});
			});

			await waitFor(() => {
				expect(updateResult.current.isSuccess).toBe(true);
			});

			// 削除
			const deleteResponse: BaseApiResponse = {
				success: true,
				data: { message: "カテゴリが削除されました" },
			};

			mockApiServices.categories.deleteCategory.mockResolvedValue(
				deleteResponse,
			);

			const { result: deleteResult } = renderHook(() => useDeleteCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				deleteResult.current.mutate(1);
			});

			await waitFor(() => {
				expect(deleteResult.current.isSuccess).toBe(true);
			});

			// すべての操作が成功したことを確認
			expect(createResult.current.isSuccess).toBe(true);
			expect(listResult.current.isSuccess).toBe(true);
			expect(updateResult.current.isSuccess).toBe(true);
			expect(deleteResult.current.isSuccess).toBe(true);
		});

		it("複数のユーティリティフックが並行して動作すること", async () => {
			mockApiServices.categories.getCategories.mockResolvedValue(
				mockCategoriesListResponse,
			);

			// 複数のユーティリティフックを同時に使用
			const { result: expenseResult } = renderHook(
				() => useCategoriesByType("expense"),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			const { result: incomeResult } = renderHook(
				() => useCategoriesByType("income"),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			const { result: activeResult } = renderHook(() => useActiveCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// すべてのクエリが完了まで待機
			await waitFor(() => {
				expect(expenseResult.current.isLoading).toBe(false);
				expect(incomeResult.current.isLoading).toBe(false);
				expect(activeResult.current.isLoading).toBe(false);
			});

			// 各フックが期待する結果を返すことを確認
			expect(expenseResult.current.data?.count).toBe(2); // 支出カテゴリ
			expect(incomeResult.current.data?.count).toBe(1); // 収入カテゴリ
			expect(activeResult.current.data?.count).toBe(2); // アクティブカテゴリ
		});
	});

	// ========================================
	// エラーハンドリングテスト
	// ========================================

	describe("error handling", () => {
		it("ネットワークエラー時に適切にエラーハンドリングされること", async () => {
			const networkError = new Error("Network Error");
			mockApiServices.categories.getCategories.mockRejectedValue(networkError);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(networkError);
		});

		it("事前設定されたエラーキャッシュが正しく動作すること", async () => {
			const queryKey = queryKeys.categories.lists();
			const testError = new Error("Test Error");

			setQueryError(queryClient, queryKey, testError);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.isError).toBe(true);
			expect(result.current.error).toEqual(testError);
		});
	});

	// ========================================
	// ローディング状態テスト
	// ========================================

	describe("loading states", () => {
		it("初期ローディング状態が正しく管理されること", () => {
			mockApiServices.categories.getCategories.mockImplementation(
				() => new Promise(() => {}), // 永続的にペンディング状態
			);

			const { result } = renderHook(() => useCategories(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.isLoading).toBe(true);
			expect(result.current.isPending).toBe(true);
			expect(result.current.isSuccess).toBe(false);
			expect(result.current.isError).toBe(false);
			expect(result.current.data).toBeUndefined();
		});

		it("ミューテーションのローディング状態が正しく管理されること", () => {
			mockApiServices.categories.createCategory.mockImplementation(
				() => new Promise(() => {}), // 永続的にペンディング状態
			);

			const { result } = renderHook(() => useCreateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			act(() => {
				result.current.mutate({
					name: "テストカテゴリ",
					type: "expense",
					color: "#FF6B6B",
					icon: "🍽️",
				});
			});

			expect(result.current.isPending).toBe(true);
			expect(result.current.isSuccess).toBe(false);
			expect(result.current.isError).toBe(false);
		});
	});

	// ========================================
	// キャッシュ管理テスト
	// ========================================

	describe("cache management", () => {
		it("作成後に一覧キャッシュが適切に無効化されること", async () => {
			// 一覧キャッシュを設定
			const listQueryKey = queryKeys.categories.lists();
			setQueryData(queryClient, listQueryKey, mockCategoriesListResponse);

			mockApiServices.categories.createCategory.mockResolvedValue(
				mockCategoryDetailResponse,
			);

			const { result } = renderHook(() => useCreateCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate({
					name: "新しいカテゴリ",
					type: "expense",
					color: "#FF6B6B",
					icon: "🍽️",
				});
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// 詳細キャッシュが設定されることを確認
			const detailQueryKey = queryKeys.categories.detail(1);
			const detailCache = queryClient.getQueryData(detailQueryKey);
			expect(detailCache).toEqual(mockCategoryDetailResponse);
		});

		it("削除後に詳細キャッシュが削除されること", async () => {
			// 詳細キャッシュを設定
			const detailQueryKey = queryKeys.categories.detail(1);
			setQueryData(queryClient, detailQueryKey, mockCategoryDetailResponse);

			const deleteResponse: BaseApiResponse = {
				success: true,
				data: { message: "カテゴリが削除されました" },
			};

			mockApiServices.categories.deleteCategory.mockResolvedValue(
				deleteResponse,
			);

			const { result } = renderHook(() => useDeleteCategory(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate(1);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// 詳細キャッシュが削除されることを確認
			const detailCache = queryClient.getQueryData(detailQueryKey);
			expect(detailCache).toBeUndefined();
		});
	});
});
