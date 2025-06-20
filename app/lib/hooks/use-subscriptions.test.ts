/**
 * use-subscriptions.ts カスタムフックのテスト
 *
 * テスト対象:
 * - クエリフック（useSubscriptions、useSubscription）
 * - ミューテーションフック（useCreateSubscription、useUpdateSubscription、useDeleteSubscription）
 * - ステータス管理フック（useDeactivateSubscription、useActivateSubscription）
 * - ユーティリティフック（useActiveSubscriptions、useInactiveSubscriptions、useCurrentMonthSubscriptions、useSubscriptionsTotalCost）
 * - オプティミスティックアップデート機能
 * - エラー時のロールバック機能
 * - ローディング状態の管理
 *
 * React QueryとReact Router v7の統合テスト
 * Issue #37の例に基づいたテスト実装
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// queryKeysをモック

vi.mock("../query/provider", () => {
	// 実際の実装と完全に一致するqueryKeysファクトリーモック（spread演算子使用）
	const mockQueryKeys = {
		subscriptions: {
			all: ["subscriptions"] as const,
			lists: () => [...mockQueryKeys.subscriptions.all, "list"] as const,
			list: (filters?: Record<string, unknown>) =>
				[...mockQueryKeys.subscriptions.lists(), { filters }] as const,
			details: () => [...mockQueryKeys.subscriptions.all, "detail"] as const,
			detail: (id: number) =>
				[...mockQueryKeys.subscriptions.details(), id] as const,
		},
	};
	return { queryKeys: mockQueryKeys };
});

vi.mock("../api/services", () => ({
	apiServices: {
		subscriptions: {
			getSubscriptions: vi.fn(),
			getSubscription: vi.fn(),
			createSubscription: vi.fn(),
			updateSubscription: vi.fn(),
			deleteSubscription: vi.fn(),
			deactivateSubscription: vi.fn(),
			activateSubscription: vi.fn(),
		},
	},
}));

// モックした後にimportを行う
import { apiServices } from "../api/services";
import { queryKeys } from "../query/provider";

// vi.mockedで正しく型付けされたmockApiServicesを取得
const mockApiServices = vi.mocked(apiServices, true);

// React Router v7の問題を回避するため、直接実装
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
}
import type { ApiError } from "../api/client";
import type {
	BaseApiResponse,
	CreateSubscriptionRequest,
	SubscriptionDetailResponse,
	SubscriptionsListResponse,
	UpdateSubscriptionRequest,
} from "../schemas/api-responses";
import {
	useActivateSubscription,
	useActiveSubscriptions,
	useCreateSubscription,
	useCurrentMonthSubscriptions,
	useDeactivateSubscription,
	useDeleteSubscription,
	useInactiveSubscriptions,
	useSubscription,
	useSubscriptions,
	useSubscriptionsTotalCost,
	useUpdateSubscription,
} from "./use-subscriptions";

// ========================================
// モックセットアップ
// ========================================

// ========================================
// テストデータ
// ========================================

const mockSubscriptionsListResponse: SubscriptionsListResponse = {
	success: true,
	data: [
		{
			id: 1,
			name: "Netflix",
			amount: 1980,
			frequency: "monthly",
			categoryId: 1,
			autoGenerate: true,
			nextPaymentDate: "2024-02-01",
			description: "動画配信サービス",
			isActive: true,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
		{
			id: 2,
			name: "Spotify",
			amount: 980,
			frequency: "monthly",
			categoryId: 1,
			autoGenerate: true,
			nextPaymentDate: "2024-02-15",
			description: "音楽配信サービス",
			isActive: true,
			createdAt: "2024-01-15T00:00:00.000Z",
			updatedAt: "2024-01-15T00:00:00.000Z",
		},
		{
			id: 3,
			name: "Adobe Creative Cloud",
			amount: 5680,
			frequency: "monthly",
			categoryId: 2,
			autoGenerate: false,
			nextPaymentDate: "2024-01-01",
			description: "デザインソフトウェア（停止中）",
			isActive: false,
			createdAt: "2023-12-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		},
	],
	count: 3,
};

const mockSubscriptionDetailResponse: SubscriptionDetailResponse = {
	success: true,
	data: {
		id: 1,
		name: "Netflix",
		amount: 1980,
		frequency: "monthly",
		categoryId: 1,
		autoGenerate: true,
		nextPaymentDate: "2024-02-01",
		description: "動画配信サービス",
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
};

const mockApiError: ApiError = {
	name: "API Error",
	message: "API Error",
	status: 400,
};

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

// 現在の月を取得（テスト用）
function getCurrentMonth() {
	const now = new Date();
	return {
		month: now.getMonth(),
		year: now.getFullYear(),
	};
}

// ========================================
// テストスイート
// ========================================

describe("use-subscriptions hooks", () => {
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

	describe("useSubscriptions", () => {
		it("サブスクリプション一覧を正常に取得できること", async () => {
			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				mockSubscriptionsListResponse,
			);

			const { result } = renderHook(() => useSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// 初期状態はローディング
			expect(result.current.isLoading).toBe(true);
			expect(result.current.data).toBeUndefined();

			// データ取得完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockSubscriptionsListResponse);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();

			// APIが正しく呼ばれること
			expect(
				mockApiServices.subscriptions.getSubscriptions,
			).toHaveBeenCalledWith();
		});

		it("API エラー時にエラー状態を返すこと", async () => {
			mockApiServices.subscriptions.getSubscriptions.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useSubscriptions(), {
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
			const queryKey = queryKeys.subscriptions.lists();
			setQueryData(
				queryClient,
				[...queryKey] as unknown[],
				mockSubscriptionsListResponse,
			);

			const { result } = renderHook(() => useSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// キャッシュからすぐにデータが取得される
			expect(result.current.data).toEqual(mockSubscriptionsListResponse);
			expect(result.current.isLoading).toBe(false);
		});
	});

	describe("useSubscription", () => {
		it("サブスクリプション詳細を正常に取得できること", async () => {
			mockApiServices.subscriptions.getSubscription.mockResolvedValue(
				mockSubscriptionDetailResponse,
			);

			const { result } = renderHook(() => useSubscription(1), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockSubscriptionDetailResponse);
			expect(
				mockApiServices.subscriptions.getSubscription,
			).toHaveBeenCalledWith(1);
		});

		it("IDが無効な場合はクエリを実行しないこと", () => {
			const { result } = renderHook(() => useSubscription(0), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.fetchStatus).toBe("idle");
			expect(
				mockApiServices.subscriptions.getSubscription,
			).not.toHaveBeenCalled();
		});
	});

	// ========================================
	// ミューテーションフックのテスト
	// ========================================

	describe("useCreateSubscription", () => {
		it("サブスクリプションを正常に作成できること", async () => {
			mockApiServices.subscriptions.createSubscription.mockResolvedValue(
				mockSubscriptionDetailResponse,
			);

			const { result } = renderHook(() => useCreateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateSubscriptionRequest = {
				name: "Netflix",
				amount: 1980,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				categoryId: 1,
				autoGenerate: true,
				description: "動画配信サービス",
			};

			await act(async () => {
				result.current.mutate(createData);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(mockSubscriptionDetailResponse);
			expect(
				mockApiServices.subscriptions.createSubscription,
			).toHaveBeenCalledWith(createData);
		});

		it("作成成功時にキャッシュが適切に更新されること", async () => {
			mockApiServices.subscriptions.createSubscription.mockResolvedValue(
				mockSubscriptionDetailResponse,
			);

			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.subscriptions.lists();
			setQueryData(
				queryClient,
				[...listQueryKey] as unknown[],
				mockSubscriptionsListResponse,
			);

			const { result } = renderHook(() => useCreateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateSubscriptionRequest = {
				name: "Netflix",
				amount: 1980,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				categoryId: 1,
				autoGenerate: true,
				description: "動画配信サービス",
			};

			await act(async () => {
				result.current.mutate(createData);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			// 新しいサブスクリプションの詳細がキャッシュに追加されることを確認
			const detailQueryKey = queryKeys.subscriptions.detail(1);
			const cachedDetail = queryClient.getQueryData(detailQueryKey);
			expect(cachedDetail).toEqual(mockSubscriptionDetailResponse);
		});

		it("作成エラー時にエラー状態を返すこと", async () => {
			mockApiServices.subscriptions.createSubscription.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useCreateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const createData: CreateSubscriptionRequest = {
				name: "Netflix",
				amount: 1980,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				categoryId: 1,
				autoGenerate: true,
				description: "動画配信サービス",
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

	describe("useUpdateSubscription", () => {
		it("サブスクリプションを正常に更新できること", async () => {
			const updatedResponse = {
				...mockSubscriptionDetailResponse,
				data: {
					...mockSubscriptionDetailResponse.data,
					name: "Netflix Premium",
					amount: 2190,
				},
			};

			mockApiServices.subscriptions.updateSubscription.mockResolvedValue(
				updatedResponse,
			);

			const { result } = renderHook(() => useUpdateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateSubscriptionRequest = {
				name: "Netflix Premium",
				amount: 2190,
			};

			await act(async () => {
				result.current.mutate({ id: 1, data: updateData });
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(updatedResponse);
			expect(
				mockApiServices.subscriptions.updateSubscription,
			).toHaveBeenCalledWith(1, updateData);
		});

		it("オプティミスティックアップデートが動作すること", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.subscriptions.detail(1);
			setQueryData(
				queryClient,
				[...queryKey] as unknown[],
				mockSubscriptionDetailResponse,
			);

			// 更新レスポンスを遅延させる
			mockApiServices.subscriptions.updateSubscription.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(mockSubscriptionDetailResponse), 100);
					}),
			);

			const { result } = renderHook(() => useUpdateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateSubscriptionRequest = {
				name: "Netflix Premium",
				amount: 2190,
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
			) as SubscriptionDetailResponse;
			expect(cachedData?.data.name).toBe("Netflix Premium");
			expect(cachedData?.data.amount).toBe(2190);

			// 更新完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});

		it("更新エラー時にロールバックが実行されること", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.subscriptions.detail(1);
			setQueryData(
				queryClient,
				[...queryKey] as unknown[],
				mockSubscriptionDetailResponse,
			);

			mockApiServices.subscriptions.updateSubscription.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useUpdateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			const updateData: UpdateSubscriptionRequest = {
				name: "Netflix Premium",
				amount: 2190,
			};

			await act(async () => {
				result.current.mutate({ id: 1, data: updateData });
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			// エラー後もキャッシュには元のデータが残っていることを確認
			const cachedData = queryClient.getQueryData(queryKey);
			expect(cachedData).toEqual(mockSubscriptionDetailResponse);
		});
	});

	describe("useDeleteSubscription", () => {
		it("サブスクリプションを正常に削除できること", async () => {
			const deleteResponse: BaseApiResponse = {
				success: true,
			};

			mockApiServices.subscriptions.deleteSubscription.mockResolvedValue(
				deleteResponse,
			);

			const { result } = renderHook(() => useDeleteSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate(1);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(deleteResponse);
			expect(
				mockApiServices.subscriptions.deleteSubscription,
			).toHaveBeenCalledWith(1);
		});

		it("削除時にオプティミスティックアップデートが動作すること", async () => {
			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.subscriptions.lists();
			setQueryData(
				queryClient,
				[...listQueryKey] as unknown[],
				mockSubscriptionsListResponse,
			);

			const deleteResponse: BaseApiResponse = {
				success: true,
			};

			// 削除レスポンスを遅延させる
			mockApiServices.subscriptions.deleteSubscription.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(deleteResponse), 100);
					}),
			);

			const { result } = renderHook(() => useDeleteSubscription(), {
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
			) as SubscriptionsListResponse;
			expect(cachedData?.data.find((sub) => sub.id === 1)).toBeUndefined();
			expect(cachedData?.count).toBe(2);

			// 削除完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});

		it("削除エラー時にロールバックが実行されること", async () => {
			// 事前に一覧データをキャッシュに設定
			const listQueryKey = queryKeys.subscriptions.lists();
			setQueryData(
				queryClient,
				[...listQueryKey] as unknown[],
				mockSubscriptionsListResponse,
			);

			mockApiServices.subscriptions.deleteSubscription.mockRejectedValue(
				mockApiError,
			);

			const { result } = renderHook(() => useDeleteSubscription(), {
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
			expect(cachedData).toEqual(mockSubscriptionsListResponse);
		});
	});

	// ========================================
	// ステータス管理フックのテスト
	// ========================================

	describe("useDeactivateSubscription", () => {
		it("サブスクリプションを正常に一時停止できること", async () => {
			const deactivateResponse: BaseApiResponse = {
				success: true,
			};

			mockApiServices.subscriptions.deactivateSubscription.mockResolvedValue(
				deactivateResponse,
			);

			const { result } = renderHook(() => useDeactivateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate(1);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(deactivateResponse);
			expect(
				mockApiServices.subscriptions.deactivateSubscription,
			).toHaveBeenCalledWith(1);
		});

		it("一時停止時にオプティミスティックアップデートが動作すること", async () => {
			// 事前にキャッシュを設定
			const queryKey = queryKeys.subscriptions.detail(1);
			setQueryData(
				queryClient,
				[...queryKey] as unknown[],
				mockSubscriptionDetailResponse,
			);

			const deactivateResponse: BaseApiResponse = {
				success: true,
			};

			// レスポンスを遅延させる
			mockApiServices.subscriptions.deactivateSubscription.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(deactivateResponse), 100);
					}),
			);

			const { result } = renderHook(() => useDeactivateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			act(() => {
				result.current.mutate(1);
			});

			// オプティミスティックアップデートが実行されることを確認
			await waitFor(() => {
				expect(result.current.isPending).toBe(true);
			});

			// isActiveがfalseに更新されることを確認
			const cachedData = queryClient.getQueryData(
				queryKey,
			) as SubscriptionDetailResponse;
			expect(cachedData?.data.isActive).toBe(false);

			// 完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});
	});

	describe("useActivateSubscription", () => {
		it("サブスクリプションを正常に再開できること", async () => {
			const activateResponse: BaseApiResponse = {
				success: true,
			};

			mockApiServices.subscriptions.activateSubscription.mockResolvedValue(
				activateResponse,
			);

			const { result } = renderHook(() => useActivateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await act(async () => {
				result.current.mutate(1);
			});

			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});

			expect(result.current.data).toEqual(activateResponse);
			expect(
				mockApiServices.subscriptions.activateSubscription,
			).toHaveBeenCalledWith(1);
		});

		it("再開時にオプティミスティックアップデートが動作すること", async () => {
			// 非アクティブな状態でキャッシュを設定
			const inactiveSubscription = {
				...mockSubscriptionDetailResponse,
				data: {
					...mockSubscriptionDetailResponse.data,
					isActive: false,
				},
			};

			const queryKey = queryKeys.subscriptions.detail(1);
			setQueryData(
				queryClient,
				[...queryKey] as unknown[],
				inactiveSubscription,
			);

			const activateResponse: BaseApiResponse = {
				success: true,
			};

			// レスポンスを遅延させる
			mockApiServices.subscriptions.activateSubscription.mockImplementation(
				() =>
					new Promise((resolve) => {
						setTimeout(() => resolve(activateResponse), 100);
					}),
			);

			const { result } = renderHook(() => useActivateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			act(() => {
				result.current.mutate(1);
			});

			// オプティミスティックアップデートが実行されることを確認
			await waitFor(() => {
				expect(result.current.isPending).toBe(true);
			});

			// isActiveがtrueに更新されることを確認
			const cachedData = queryClient.getQueryData(
				queryKey,
			) as SubscriptionDetailResponse;
			expect(cachedData?.data.isActive).toBe(true);

			// 完了まで待機
			await waitFor(() => {
				expect(result.current.isSuccess).toBe(true);
			});
		});
	});

	// ========================================
	// ユーティリティフックのテスト
	// ========================================

	describe("useActiveSubscriptions", () => {
		it("アクティブなサブスクリプションのみを正常にフィルタリングできること", async () => {
			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				mockSubscriptionsListResponse,
			);

			const { result } = renderHook(() => useActiveSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			const activeSubscriptions = result.current.data?.data.filter(
				(sub) => sub.isActive,
			);
			expect(result.current.data?.data).toEqual(activeSubscriptions);
			expect(result.current.data?.count).toBe(2); // NetflixとSpotifyのみ
		});

		it("すべて非アクティブな場合は空配列を返すこと", async () => {
			const allInactiveResponse = {
				...mockSubscriptionsListResponse,
				data: mockSubscriptionsListResponse.data.map((sub) => ({
					...sub,
					isActive: false,
				})),
			};

			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				allInactiveResponse,
			);

			const { result } = renderHook(() => useActiveSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data?.data).toEqual([]);
			expect(result.current.data?.count).toBe(0);
		});
	});

	describe("useInactiveSubscriptions", () => {
		it("非アクティブなサブスクリプションのみを正常にフィルタリングできること", async () => {
			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				mockSubscriptionsListResponse,
			);

			const { result } = renderHook(() => useInactiveSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			const inactiveSubscriptions = result.current.data?.data.filter(
				(sub) => !sub.isActive,
			);
			expect(result.current.data?.data).toEqual(inactiveSubscriptions);
			expect(result.current.data?.count).toBe(1); // Adobe Creative Cloudのみ
		});
	});

	describe("useCurrentMonthSubscriptions", () => {
		it("今月支払予定のサブスクリプションを正常にフィルタリングできること", async () => {
			const currentMonth = getCurrentMonth();

			// 今月の支払予定にする
			const thisMonthResponse = {
				...mockSubscriptionsListResponse,
				data: mockSubscriptionsListResponse.data.map((sub) => ({
					...sub,
					nextPaymentDate: `${currentMonth.year}-${String(currentMonth.month + 1).padStart(2, "0")}-15`,
					isActive: true,
				})),
			};

			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				thisMonthResponse,
			);

			const { result } = renderHook(() => useCurrentMonthSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			// アクティブかつ今月支払予定のサブスクリプションがフィルタリングされることを確認
			expect(result.current.data?.count).toBe(3);
		});

		it("今月支払予定がない場合は空配列を返すこと", async () => {
			// 来月の支払予定にする
			const nextMonth = new Date();
			nextMonth.setMonth(nextMonth.getMonth() + 1);

			const nextMonthResponse = {
				...mockSubscriptionsListResponse,
				data: mockSubscriptionsListResponse.data.map((sub) => ({
					...sub,
					nextPaymentDate: `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, "0")}-15`,
					isActive: true,
				})),
			};

			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				nextMonthResponse,
			);

			const { result } = renderHook(() => useCurrentMonthSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isLoading).toBe(false);
			});

			expect(result.current.data?.data).toEqual([]);
			expect(result.current.data?.count).toBe(0);
		});
	});

	describe("useSubscriptionsTotalCost", () => {
		it("月間・年間の総額を正しく計算できること", () => {
			// 事前にアクティブなサブスクリプションをキャッシュに設定
			const activeSubscriptionsResponse = {
				...mockSubscriptionsListResponse,
				data: mockSubscriptionsListResponse.data.filter((sub) => sub.isActive),
			};

			const listQueryKey = queryKeys.subscriptions.lists();
			setQueryData(
				queryClient,
				[...listQueryKey] as unknown[],
				activeSubscriptionsResponse,
			);

			const { result } = renderHook(() => useSubscriptionsTotalCost(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// Netflix: 1980円/月, Spotify: 980円/月
			// 月間合計: 2960円, 年間合計: 35520円
			expect(result.current.monthlyTotal).toBe(2960);
			expect(result.current.yearlyTotal).toBe(35520);
		});

		it("異なる頻度のサブスクリプションを正しく計算できること", () => {
			// 週次・年次・日次のサブスクリプションを含むテストデータ
			const mixedFrequencyResponse = {
				...mockSubscriptionsListResponse,
				data: [
					{
						...mockSubscriptionsListResponse.data[0],
						amount: 1200, // 月次
						frequency: "monthly" as const,
					},
					{
						...mockSubscriptionsListResponse.data[1],
						amount: 100, // 週次
						frequency: "weekly" as const,
					},
					{
						id: 4,
						name: "Annual Service",
						amount: 12000, // 年次
						frequency: "yearly" as const,
						categoryId: 1,
						autoGenerate: true,
						nextPaymentDate: "2025-01-01",
						description: "年次サービス",
						isActive: true,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				],
			};

			const listQueryKey = queryKeys.subscriptions.lists();
			setQueryData(
				queryClient,
				[...listQueryKey] as unknown[],
				mixedFrequencyResponse,
			);

			const { result } = renderHook(() => useSubscriptionsTotalCost(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			// 月次: 1200円/月
			// 週次: 100円/週 = (100 * 52) / 12 = 約433円/月
			// 年次: 12000円/年 = 1000円/月
			// 月間合計: 1200 + 433 + 1000 = 2633円
			// 年間合計: 2633 * 12 = 31596円
			expect(result.current.monthlyTotal).toBe(2633);
			expect(result.current.yearlyTotal).toBe(31596);
		});

		it("サブスクリプションがない場合は0を返すこと", () => {
			const emptyResponse = {
				...mockSubscriptionsListResponse,
				data: [],
				count: 0,
			};

			const listQueryKey = queryKeys.subscriptions.lists();
			setQueryData(queryClient, [...listQueryKey] as unknown[], emptyResponse);

			const { result } = renderHook(() => useSubscriptionsTotalCost(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.monthlyTotal).toBe(0);
			expect(result.current.yearlyTotal).toBe(0);
		});

		it("データがロード中の場合は0を返すこと", () => {
			const { result } = renderHook(() => useSubscriptionsTotalCost(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.monthlyTotal).toBe(0);
			expect(result.current.yearlyTotal).toBe(0);
		});
	});

	// ========================================
	// 複合テスト（統合テスト）
	// ========================================

	describe("integration tests", () => {
		it("作成→一覧取得→更新→一時停止→再開→削除の一連の流れが正常に動作すること", async () => {
			// 作成
			const createResponse = mockSubscriptionDetailResponse;
			mockApiServices.subscriptions.createSubscription.mockResolvedValue(
				createResponse,
			);

			const { result: createResult } = renderHook(
				() => useCreateSubscription(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			const createData: CreateSubscriptionRequest = {
				name: "Netflix",
				amount: 1980,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				categoryId: 1,
				autoGenerate: true,
				description: "動画配信サービス",
			};

			await act(async () => {
				createResult.current.mutate(createData);
			});

			await waitFor(() => {
				expect(createResult.current.isSuccess).toBe(true);
			});

			// 作成後の一覧取得
			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				mockSubscriptionsListResponse,
			);

			const { result: listResult } = renderHook(() => useSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(listResult.current.isSuccess).toBe(true);
			});

			// 更新
			const updateResponse = {
				...mockSubscriptionDetailResponse,
				data: {
					...mockSubscriptionDetailResponse.data,
					amount: 2190,
				},
			};

			mockApiServices.subscriptions.updateSubscription.mockResolvedValue(
				updateResponse,
			);

			const { result: updateResult } = renderHook(
				() => useUpdateSubscription(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await act(async () => {
				updateResult.current.mutate({
					id: 1,
					data: { amount: 2190 },
				});
			});

			await waitFor(() => {
				expect(updateResult.current.isSuccess).toBe(true);
			});

			// 一時停止
			const deactivateResponse: BaseApiResponse = {
				success: true,
			};

			mockApiServices.subscriptions.deactivateSubscription.mockResolvedValue(
				deactivateResponse,
			);

			const { result: deactivateResult } = renderHook(
				() => useDeactivateSubscription(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await act(async () => {
				deactivateResult.current.mutate(1);
			});

			await waitFor(() => {
				expect(deactivateResult.current.isSuccess).toBe(true);
			});

			// 再開
			const activateResponse: BaseApiResponse = {
				success: true,
			};

			mockApiServices.subscriptions.activateSubscription.mockResolvedValue(
				activateResponse,
			);

			const { result: activateResult } = renderHook(
				() => useActivateSubscription(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			await act(async () => {
				activateResult.current.mutate(1);
			});

			await waitFor(() => {
				expect(activateResult.current.isSuccess).toBe(true);
			});

			// 削除
			const deleteResponse: BaseApiResponse = {
				success: true,
			};

			mockApiServices.subscriptions.deleteSubscription.mockResolvedValue(
				deleteResponse,
			);

			const { result: deleteResult } = renderHook(
				() => useDeleteSubscription(),
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
			expect(deactivateResult.current.isSuccess).toBe(true);
			expect(activateResult.current.isSuccess).toBe(true);
			expect(deleteResult.current.isSuccess).toBe(true);
		});

		it("複数のユーティリティフックが並行して動作すること", async () => {
			mockApiServices.subscriptions.getSubscriptions.mockResolvedValue(
				mockSubscriptionsListResponse,
			);

			// 複数のユーティリティフックを同時に使用
			const { result: activeResult } = renderHook(
				() => useActiveSubscriptions(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			const { result: inactiveResult } = renderHook(
				() => useInactiveSubscriptions(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			const { result: totalCostResult } = renderHook(
				() => useSubscriptionsTotalCost(),
				{
					wrapper: createWrapperWithQueryClient(queryClient),
				},
			);

			// すべてのクエリが完了まで待機
			await waitFor(() => {
				expect(activeResult.current.isLoading).toBe(false);
				expect(inactiveResult.current.isLoading).toBe(false);
			});

			// 各フックが期待する結果を返すことを確認
			expect(activeResult.current.data?.count).toBe(2); // アクティブ
			expect(inactiveResult.current.data?.count).toBe(1); // 非アクティブ
			expect(totalCostResult.current.monthlyTotal).toBeGreaterThan(0); // 総額計算
		});
	});

	// ========================================
	// エラーハンドリングテスト
	// ========================================

	describe("error handling", () => {
		it("ネットワークエラー時に適切にエラーハンドリングされること", async () => {
			const networkError = new Error("Network Error");
			mockApiServices.subscriptions.getSubscriptions.mockRejectedValue(
				networkError,
			);

			const { result } = renderHook(() => useSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			await waitFor(() => {
				expect(result.current.isError).toBe(true);
			});

			expect(result.current.error).toEqual(networkError);
		});

		it("事前設定されたエラーキャッシュが正しく動作すること", async () => {
			const queryKey = queryKeys.subscriptions.lists();
			const testError = new Error("Test Error");

			setQueryError(queryClient, [...queryKey] as unknown[], testError);

			const { result } = renderHook(() => useSubscriptions(), {
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
			mockApiServices.subscriptions.getSubscriptions.mockImplementation(
				() => new Promise(() => {}), // 永続的にペンディング状態
			);

			const { result } = renderHook(() => useSubscriptions(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			expect(result.current.isLoading).toBe(true);
			expect(result.current.isPending).toBe(true);
			expect(result.current.isSuccess).toBe(false);
			expect(result.current.isError).toBe(false);
			expect(result.current.data).toBeUndefined();
		});

		it("ミューテーションのローディング状態が正しく管理されること", () => {
			mockApiServices.subscriptions.createSubscription.mockImplementation(
				() => new Promise(() => {}), // 永続的にペンディング状態
			);

			const { result } = renderHook(() => useCreateSubscription(), {
				wrapper: createWrapperWithQueryClient(queryClient),
			});

			act(() => {
				result.current.mutate({
					name: "テストサブスクリプション",
					amount: 1000,
					frequency: "monthly",
					categoryId: 1,
					autoGenerate: true,
					nextPaymentDate: "2024-02-01",
				});
			});

			expect(result.current.isPending).toBe(true);
			expect(result.current.isSuccess).toBe(false);
			expect(result.current.isError).toBe(false);
		});
	});
});
