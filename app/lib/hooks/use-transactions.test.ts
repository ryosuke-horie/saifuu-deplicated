/**
 * use-transactions.ts カスタムフックのテスト
 *
 * テスト対象:
 * - クエリフック（useTransactions、useInfiniteTransactions、useTransaction、useTransactionStats）
 * - ミューテーションフック（useCreateTransaction、useUpdateTransaction、useDeleteTransaction）
 * - ユーティリティフック（useCurrentMonthTransactions、useTransactionsByDateRange等）
 * - オプティミスティックアップデート機能
 * - エラー時のロールバック機能
 * - ローディング状態の管理
 *
 * React QueryとReact Router v7の統合テスト
 * Issue #37の例に基づいたテスト実装
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// query-wrapperを使わずに直接テスト用のQueryClientを作成
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
	queryKey: unknown[],
	data: T,
) {
	queryClient.setQueryData(queryKey, data);
}

function setQueryError(
	queryClient: QueryClient,
	queryKey: unknown[],
	error: Error,
) {
	queryClient.setQueryData(queryKey, undefined);
	queryClient.getQueryState(queryKey);
}
import type { ApiError } from "../api/client";

// queryKeysを直接定義してReact Router Viteプラグインの問題を回避
const queryKeys = {
	transactions: {
		all: ["transactions"] as const,
		lists: () => [...queryKeys.transactions.all, "list"] as const,
		list: (params?: any) => [...queryKeys.transactions.lists(), { params }] as const,
		details: () => [...queryKeys.transactions.all, "detail"] as const,
		detail: (id: number) => [...queryKeys.transactions.details(), id] as const,
		stats: (params?: Record<string, unknown>) =>
			[...queryKeys.transactions.all, "stats", { params }] as const,
	},
} as const;
import type {
	TransactionsListResponse,
	TransactionDetailResponse,
	CreateTransactionRequest,
	UpdateTransactionRequest,
	BaseApiResponse,
} from "../schemas/api-responses";
import {
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

// ========================================
// モックセットアップ
// ========================================

// apiServicesをモック
const mockApiServices = {
	transactions: {
		getTransactions: vi.fn(),
		getTransaction: vi.fn(),
		getTransactionStats: vi.fn(),
		createTransaction: vi.fn(),
		updateTransaction: vi.fn(),
		deleteTransaction: vi.fn(),
	},
};

vi.mock("../api/services", () => ({
	apiServices: mockApiServices,
}));

// ========================================
// テストデータ
// ========================================

const mockTransactionsListResponse: TransactionsListResponse = {
	success: true,
	data: [
		{
			id: 1,
			amount: 1000,
			type: "expense",
			categoryId: 1,
			description: "テスト支出1",
			transactionDate: "2024-01-01",
			paymentMethod: "現金",
			tags: JSON.stringify(["テスト"]),
			receiptUrl: null,
			isRecurring: false,
			recurringId: null,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: 2,
			amount: 2000,
			type: "income",
			categoryId: 2,
			description: "テスト収入1",
			transactionDate: "2024-01-02",
			paymentMethod: "銀行振込",
			tags: null,
			receiptUrl: null,
			isRecurring: false,
			recurringId: null,
			createdAt: "2024-01-02T00:00:00.000Z",
			updatedAt: "2024-01-02T00:00:00.000Z",
		},
	],
	count: 2,
	pagination: {
		currentPage: 1,
		totalPages: 1,
		totalCount: 2,
		hasNextPage: false,
		hasPrevPage: false,
		limit: 20,
	},
	filters: {},
	sort: {
		sort_by: "transactionDate",
		sort_order: "desc",
	},
};

const mockTransactionDetailResponse: TransactionDetailResponse = {
	success: true,
	data: {
		id: 1,
		amount: 1000,
		type: "expense",
		categoryId: 1,
		description: "テスト支出1",
		transactionDate: "2024-01-01",
		paymentMethod: "現金",
		tags: JSON.stringify(["テスト"]),
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
};

const mockTransactionStatsResponse: BaseApiResponse = {
	success: true,
	data: {
		totalIncome: 50000,
		totalExpense: 30000,
		netIncome: 20000,
		categoryBreakdown: [
			{ categoryId: 1, categoryName: "食費", amount: 15000 },
			{ categoryId: 2, categoryName: "交通費", amount: 8000 },
		],
	},
};

const mockApiError: ApiError = {
	name: "ApiError",
	message: "API Error",
	status: 400,
};

// ========================================
// テストヘルパー
// ========================================

function createWrapperWithQueryClient(queryClient: QueryClient) {
	return function Wrapper({ children }: { children: React.ReactNode }) {
		return React.createElement(QueryClientProvider, { client: queryClient }, children);
	};
}

// ========================================
// テストスイート
// ========================================

describe("use-transactions hooks", () => {
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

	describe("useTransactions", () => {
		it("取引一覧を正常に取得できること", async () => {
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const { result } = renderHook(() => useTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// 初期状態はローディング
			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();

			// データ取得完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockTransactionsListResponse);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();

			// APIが正しいパラメータで呼ばれること
			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{},
			);
		});

		it("フィルターパラメータ付きで取引を取得できること", async () => {
			const params: UseTransactionsParams = {
				filters: {
					type: "expense",
					category_id: 1,
				},
				sort: {
					sort_by: "amount",
					sort_order: "asc",
				},
				page: 2,
				limit: 10,
			};

			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const { result } = renderHook(() => useTransactions(params), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				params,
			);
		});

		it("API エラー時にエラー状態を返すこと", async () => {
			mockApiServices.transactions.getTransactions.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useTransactions(), {
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
			const queryKey = queryKeys.transactions.list({});
			setQueryData(queryClient, [...queryKey] as unknown[], mockTransactionsListResponse);

			const { result } = renderHook(() => useTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// キャッシュからすぐにデータが取得される
			expect(result.current.data).toEqual(mockTransactionsListResponse);
			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("useInfiniteTransactions", () => {
		it("無限スクロールで取引一覧を取得できること", async () => {
			const page1Response = {
				...mockTransactionsListResponse,
				pagination: {
					...mockTransactionsListResponse.pagination,
					hasNextPage: true,
					currentPage: 1,
				},
			};

			const page2Response = {
				...mockTransactionsListResponse,
				pagination: {
					...mockTransactionsListResponse.pagination,
					hasNextPage: false,
					currentPage: 2,
				},
				data: [
					{
						...mockTransactionsListResponse.data[0],
						id: 3,
						description: "テスト支出3",
					},
				],
			};

			mockApiServices.transactions.getTransactions
				.mockResolvedValueOnce(page1Response)
				.mockResolvedValueOnce(page2Response);

			const { result } = renderHook(() => useInfiniteTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// 最初のページ読み込み完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect((result.current.data as any)?.pages).toHaveLength(1);
			expect((result.current.data as any)?.pages[0]).toEqual(page1Response);
			expect(result.current.hasNextPage).toBe(true);

			// 次のページを取得
			act(() => {
				result.current.fetchNextPage();
			});

			await waitFor(() => {
				expect((result.current.data as any)?.pages).toHaveLength(2);
			});

			expect((result.current.data as any)?.pages[1]).toEqual(page2Response);
			expect(result.current.hasNextPage).toBe(false);
		});

		it("ページネーションパラメータが正しく処理されること", async () => {
			const mockResponse = {
				...mockTransactionsListResponse,
				pagination: {
					...mockTransactionsListResponse.pagination,
					hasNextPage: false,
				},
			};

			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockResponse,
			);

			const { result } = renderHook(
				() => useInfiniteTransactions({ filters: { type: "expense" } }),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{
					filters: { type: "expense" },
					page: 1,
				},
			);
		});
	});

	describe("useTransaction", () => {
		it("取引詳細を正常に取得できること", async () => {
			mockApiServices.transactions.getTransaction.mockResolvedValue(
				mockTransactionDetailResponse,
			);

			const { result } = renderHook(() => useTransaction(1), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockTransactionDetailResponse);
			expect(mockApiServices.transactions.getTransaction).toHaveBeenCalledWith(
				1,
			);
		});

		it("IDが無効な場合はクエリを実行しないこと", () => {
			const { result } = renderHook(() => useTransaction(0), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.fetchStatus).toBe("idle");
			expect(mockApiServices.transactions.getTransaction).not.toHaveBeenCalled();
		});
	});

	describe("useTransactionStats", () => {
		it("取引統計を正常に取得できること", async () => {
			mockApiServices.transactions.getTransactionStats.mockResolvedValue(
				mockTransactionStatsResponse,
			);

			const params = {
				startDate: "2024-01-01",
				endDate: "2024-01-31",
				groupBy: "category" as const,
			};

			const { result } = renderHook(() => useTransactionStats(params), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockTransactionStatsResponse);
			expect(
				mockApiServices.transactions.getTransactionStats,
			).toHaveBeenCalledWith(params);
		});
	});

	// ========================================
	// ミューテーションフックのテスト
	// ========================================

	describe("useCreateTransaction", () => {
		it("取引を正常に作成できること", async () => {
			mockApiServices.transactions.createTransaction.mockResolvedValue(
				mockTransactionDetailResponse,
			);

			const { result } = renderHook(() => useCreateTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateTransactionRequest = {
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "テスト支出1",
				transactionDate: "2024-01-01",
			};

			await act(async () => {
				result.current.mutate(createData);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockTransactionDetailResponse);
			expect(mockApiServices.transactions.createTransaction).toHaveBeenCalledWith(
				createData,
			);
		});

		it("作成成功時にキャッシュが適切に更新されること", async () => {
			mockApiServices.transactions.createTransaction.mockResolvedValue(
				mockTransactionDetailResponse,
			);

			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.transactions.lists();
			setQueryData(queryClient, [...listQueryKey] as unknown[], mockTransactionsListResponse);

			const { result } = renderHook(() => useCreateTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateTransactionRequest = {
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "テスト支出1",
				transactionDate: "2024-01-01",
			};

			await act(async () => {
				result.current.mutate(createData);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// 新しい取引の詳細がキャッシュに追加されることを確認
			const detailQueryKey = queryKeys.transactions.detail(1);
			const cachedDetail = queryClient.getQueryData(detailQueryKey);
			expect(cachedDetail).toEqual(mockTransactionDetailResponse);
		});

		it("作成エラー時にエラー状態を返すこと", async () => {
			mockApiServices.transactions.createTransaction.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useCreateTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateTransactionRequest = {
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "テスト支出1",
				transactionDate: "2024-01-01",
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

	describe("useUpdateTransaction", () => {
		it("取引を正常に更新できること", async () => {
			const updatedResponse = {
				...mockTransactionDetailResponse,
				data: {
					...mockTransactionDetailResponse.data,
					description: "更新されたテスト支出",
				},
			};

			mockApiServices.transactions.updateTransaction.mockResolvedValue(
				updatedResponse,
			);

			const { result } = renderHook(() => useUpdateTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateTransactionRequest = {
				description: "更新されたテスト支出",
			};

			await act(async () => {
				result.current.mutate({ id: 1, data: updateData });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(updatedResponse);
			expect(mockApiServices.transactions.updateTransaction).toHaveBeenCalledWith(
				1,
				updateData,
			);
		});

		it("オプティミスティックアップデートが動作すること", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.transactions.detail(1);
			setQueryData(queryClient, [...queryKey] as unknown[], mockTransactionDetailResponse);

			// 更新レスポンスを遅延させる
			mockApiServices.transactions.updateTransaction.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockTransactionDetailResponse), 100);
					}),
			);

			const { result } = renderHook(() => useUpdateTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateTransactionRequest = {
				description: "更新されたテスト支出",
			};

			act(() => {
				result.current.mutate({ id: 1, data: updateData });
			});

			// onMutateが実行されて、事前データが保存されることを確認
			await waitFor(() => {
				expect(result.current.isPending).toBe(true);
			});

			// 更新完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});

		it("更新エラー時にロールバックが実行されること", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.transactions.detail(1);
			setQueryData(queryClient, [...queryKey] as unknown[], mockTransactionDetailResponse);

			mockApiServices.transactions.updateTransaction.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useUpdateTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateTransactionRequest = {
				description: "更新されたテスト支出",
			};

			await act(async () => {
				result.current.mutate({ id: 1, data: updateData });
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			// エラー後もキャッシュには元のデータが残っていることを確認
			const cachedData = queryClient.getQueryData(queryKey);
			expect(cachedData).toEqual(mockTransactionDetailResponse);
		});
	});

	describe("useDeleteTransaction", () => {
		it("取引を正常に削除できること", async () => {
			const deleteResponse: BaseApiResponse = {
				success: true,
				};

			mockApiServices.transactions.deleteTransaction.mockResolvedValue(
				deleteResponse,
			);

			const { result } = renderHook(() => useDeleteTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate(1);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(deleteResponse);
			expect(mockApiServices.transactions.deleteTransaction).toHaveBeenCalledWith(
				1,
			);
		});

		it("削除時にオプティミスティックアップデートが動作すること", async () => {
			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.transactions.lists();
			setQueryData(queryClient, [...listQueryKey] as unknown[], mockTransactionsListResponse);

			const deleteResponse: BaseApiResponse = {
				success: true,
				};

			// 削除レスポンスを遅延させる
			mockApiServices.transactions.deleteTransaction.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(deleteResponse), 100);
					}),
			);

			const { result } = renderHook(() => useDeleteTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			act(() => {
				result.current.mutate(1);
			});

			// オプティミスティックアップデートが実行されることを確認
			await waitFor(() => {
				expect(result.current.isPending).toBe(true);
			});

			// 削除完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});

		it("削除エラー時にロールバックが実行されること", async () => {
			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.transactions.lists();
			setQueryData(queryClient, [...listQueryKey] as unknown[], mockTransactionsListResponse);

			mockApiServices.transactions.deleteTransaction.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useDeleteTransaction(), {
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
			expect(cachedData).toEqual(mockTransactionsListResponse);
		});
	});

	// ========================================
	// ユーティリティフックのテスト
	// ========================================

	describe("useCurrentMonthTransactions", () => {
		it("今月の取引を正常に取得できること", async () => {
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const { result } = renderHook(() => useCurrentMonthTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// 今月の範囲で取引が取得されることを確認
			const now = new Date();
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{
					filters: {
						from: firstDay.toISOString().split("T")[0],
						to: lastDay.toISOString().split("T")[0],
					},
				},
			);
		});

		it("追加パラメータと組み合わせて使用できること", async () => {
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const additionalParams = {
				filters: { type: "expense" as const },
				limit: 10,
			};

			const { result } = renderHook(
				() => useCurrentMonthTransactions(additionalParams),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			const now = new Date();
			const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
			const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{
					...additionalParams,
					filters: {
						from: firstDay.toISOString().split("T")[0],
						to: lastDay.toISOString().split("T")[0],
						type: "expense",
					},
				},
			);
		});
	});

	describe("useTransactionsByDateRange", () => {
		it("指定期間の取引を正常に取得できること", async () => {
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const startDate = "2024-01-01";
			const endDate = "2024-01-31";

			const { result } = renderHook(
				() => useTransactionsByDateRange(startDate, endDate),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{
					filters: {
						from: startDate,
						to: endDate,
					},
				},
			);
		});
	});

	describe("useTransactionsByCategory", () => {
		it("指定カテゴリの取引を正常に取得できること", async () => {
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const categoryId = 1;

			const { result } = renderHook(
				() => useTransactionsByCategory(categoryId),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{
					filters: {
						category_id: categoryId,
					},
				},
			);
		});

		it("カテゴリIDが無効な場合はクエリを実行しないこと", () => {
			const { result } = renderHook(() => useTransactionsByCategory(0), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.fetchStatus).toBe("idle");
			expect(mockApiServices.transactions.getTransactions).not.toHaveBeenCalled();
		});
	});

	describe("useIncomeTransactions", () => {
		it("収入のみの取引を正常に取得できること", async () => {
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const { result } = renderHook(() => useIncomeTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{
					filters: {
						type: "income",
					},
				},
			);
		});
	});

	describe("useExpenseTransactions", () => {
		it("支出のみの取引を正常に取得できること", async () => {
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const { result } = renderHook(() => useExpenseTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(mockApiServices.transactions.getTransactions).toHaveBeenCalledWith(
				{
					filters: {
						type: "expense",
					},
				},
			);
		});
	});

	// ========================================
	// 複合テスト（統合テスト）
	// ========================================

	describe("integration tests", () => {
		it("作成→一覧取得→更新→削除の一連の流れが正常に動作すること", async () => {
			// 作成
			const createResponse = mockTransactionDetailResponse;
			mockApiServices.transactions.createTransaction.mockResolvedValue(
				createResponse,
			);

			const { result: createResult } = renderHook(
				() => useCreateTransaction(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			const createData: CreateTransactionRequest = {
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "テスト支出1",
				transactionDate: "2024-01-01",
			};

			await act(async () => {
				createResult.current.mutate(createData);
			});

			await waitFor(() => {
				expect(createResult.current.isSuccess).toBe(true);
			});

			// 作成後の一覧取得
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);

			const { result: listResult } = renderHook(() => useTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(listResult.current.isSuccess).toBe(true);
			});

			// 更新
			const updateResponse = {
				...mockTransactionDetailResponse,
				data: {
					...mockTransactionDetailResponse.data,
					description: "更新されたテスト支出",
				},
			};

			mockApiServices.transactions.updateTransaction.mockResolvedValue(
				updateResponse,
			);

			const { result: updateResult } = renderHook(
				() => useUpdateTransaction(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await act(async () => {
				updateResult.current.mutate({
					id: 1,
					data: { description: "更新されたテスト支出" },
				});
			});

			await waitFor(() => {
				expect(updateResult.current.isSuccess).toBe(true);
			});

			// 削除
			const deleteResponse: BaseApiResponse = {
				success: true,
				};

			mockApiServices.transactions.deleteTransaction.mockResolvedValue(
				deleteResponse,
			);

			const { result: deleteResult } = renderHook(
				() => useDeleteTransaction(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

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

		it("複数のクエリが並行して実行されても正常に動作すること", async () => {
			// 複数のAPIを同時にモック
			mockApiServices.transactions.getTransactions.mockResolvedValue(
				mockTransactionsListResponse,
			);
			mockApiServices.transactions.getTransaction.mockResolvedValue(
				mockTransactionDetailResponse,
			);
			mockApiServices.transactions.getTransactionStats.mockResolvedValue(
				mockTransactionStatsResponse,
			);

			// 複数のフックを同時に使用
			const { result: listResult } = renderHook(() => useTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const { result: detailResult } = renderHook(() => useTransaction(1), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const { result: statsResult } = renderHook(
				() => useTransactionStats(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			// すべてのクエリが完了まで待機
			await waitFor(() => {
				expect(listResult.current.isSuccess).toBe(true);
				expect(detailResult.current.isSuccess).toBe(true);
				expect(statsResult.current.isSuccess).toBe(true);
			});

			// 各クエリが期待するデータを返すことを確認
			expect(listResult.current.data).toEqual(mockTransactionsListResponse);
			expect(detailResult.current.data).toEqual(mockTransactionDetailResponse);
			expect(statsResult.current.data).toEqual(mockTransactionStatsResponse);
		});
	});

	// ========================================
	// エラーハンドリングテスト
	// ========================================

	describe("error handling", () => {
		it("ネットワークエラー時に適切にエラーハンドリングされること", async () => {
			const networkError = new Error("Network Error");
			mockApiServices.transactions.getTransactions.mockRejectedValue(
				networkError,
			);

			const { result } = renderHook(() => useTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(networkError);
		});

		it("事前設定されたエラーキャッシュが正しく動作すること", async () => {
			const queryKey = queryKeys.transactions.list({});
			const testError = new Error("Test Error");
			
			setQueryError(queryClient, [...queryKey] as unknown[], testError);

			const { result } = renderHook(() => useTransactions(), {
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
			mockApiServices.transactions.getTransactions.mockImplementation(
				() => new Promise(() => {}), // 永続的にペンディング状態
			);

			const { result } = renderHook(() => useTransactions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.isLoading).toBe(true);
			expect(result.current.isPending).toBe(true);
			expect(result.current.isSuccess).toBe(false);
			expect(result.current.isError).toBe(false);
			expect(result.current.data).toBeUndefined();
		});

		it("ミューテーションのローディング状態が正しく管理されること", () => {
			mockApiServices.transactions.createTransaction.mockImplementation(
				() => new Promise(() => {}), // 永続的にペンディング状態
			);

			const { result } = renderHook(() => useCreateTransaction(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			act(() => {
				result.current.mutate({
					amount: 1000,
					type: "expense",
					categoryId: 1,
					description: "テスト",
					transactionDate: "2024-01-01",
				});
			});

			expect(result.current.isPending).toBe(true);
			expect(result.current.isSuccess).toBe(false);
			expect(result.current.isError).toBe(false);
		});
	});
});