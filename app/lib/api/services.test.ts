/**
 * APIサービス層のユニットテスト
 *
 * テスト対象:
 * - categoryService（カテゴリAPI操作）
 * - transactionService（取引API操作）
 * - subscriptionService（サブスクリプションAPI操作）
 * - APIクライアントとの統合
 * - Zodスキーマバリデーション
 * - エラーハンドリング
 * - パラメータ構築とクエリ処理
 *
 * 設計方針:
 * - APIクライアントをモック化してサービス層のロジックを独立してテスト
 * - 各サービスの全メソッドを網羅的にテスト
 * - リクエストデータバリデーションとレスポンス処理をテスト
 * - エラーケースを含む包括的なテストカバレッジ
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { ZodError } from "zod";
import type {
	BaseApiResponse,
	CategoriesListResponse,
	CategoryDetailResponse,
	CreateCategoryRequest,
	CreateSubscriptionRequest,
	CreateTransactionRequest,
	ReorderCategoriesRequest,
	SubscriptionDetailResponse,
	SubscriptionsListResponse,
	TransactionDetailResponse,
	TransactionFilters,
	TransactionSort,
	TransactionsListResponse,
	UpdateCategoryRequest,
	UpdateSubscriptionRequest,
	UpdateTransactionRequest,
} from "../schemas/api-responses";
import { ApiError } from "./client";
import {
	type CategoryService,
	type SubscriptionService,
	type TransactionService,
	apiServices,
	categoryService,
	subscriptionService,
	transactionService,
} from "./services";

// ========================================
// APIクライアントのモック化
// ========================================

vi.mock("./client", async () => {
	const actual = await vi.importActual("./client");
	return {
		...actual,
		apiClient: {
			get: vi.fn(),
			post: vi.fn(),
			put: vi.fn(),
			delete: vi.fn(),
		},
	};
});

// モックしたapiClientを取得
const mockApiClient = vi.mocked(
	await import("./client").then((m) => m.apiClient),
);

// ========================================
// テストデータ
// ========================================

const mockCategory = {
	id: 1,
	name: "食費",
	type: "expense" as const,
	color: "#FF0000",
	icon: "food",
	displayOrder: 1,
	isActive: true,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockCategoriesListResponse: CategoriesListResponse = {
	success: true,
	data: [mockCategory],
	count: 1,
};

const mockCategoryDetailResponse: CategoryDetailResponse = {
	success: true,
	data: mockCategory,
};

const mockTransaction = {
	id: 1,
	amount: 1000,
	type: "expense" as const,
	categoryId: 1,
	description: "テスト支出",
	transactionDate: "2024-01-01",
	paymentMethod: "現金",
	tags: "テスト",
	receiptUrl: null,
	isRecurring: false,
	recurringId: null,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockTransactionsListResponse: TransactionsListResponse = {
	success: true,
	data: [mockTransaction],
	count: 1,
	pagination: {
		currentPage: 1,
		totalPages: 1,
		totalCount: 1,
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
	data: mockTransaction,
};

const mockSubscription = {
	id: 1,
	name: "Netflix",
	amount: 1500,
	categoryId: 1,
	frequency: "monthly" as const,
	nextPaymentDate: "2024-02-01",
	description: "動画配信サービス",
	autoGenerate: true,
	isActive: true,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockSubscriptionsListResponse: SubscriptionsListResponse = {
	success: true,
	data: [mockSubscription],
	count: 1,
};

const mockSubscriptionDetailResponse: SubscriptionDetailResponse = {
	success: true,
	data: mockSubscription,
};

const mockBaseApiResponse: BaseApiResponse = {
	success: true,
	data: {},
};

// ========================================
// テストスイート
// ========================================

describe("API Services", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	// ========================================
	// カテゴリサービスのテスト
	// ========================================

	describe("categoryService", () => {
		describe("getCategories", () => {
			it("カテゴリ一覧を正常に取得できること", async () => {
				mockApiClient.get.mockResolvedValue(mockCategoriesListResponse);

				const result = await categoryService.getCategories();

				expect(result).toEqual(mockCategoriesListResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/categories",
					expect.any(Object), // categoriesListResponseSchema
				);
			});

			it("APIエラー時に適切にエラーを伝播すること", async () => {
				const apiError = new ApiError("Network Error", 500);
				mockApiClient.get.mockRejectedValue(apiError);

				await expect(categoryService.getCategories()).rejects.toThrow(ApiError);
			});
		});

		describe("getCategory", () => {
			it("カテゴリ詳細を正常に取得できること", async () => {
				mockApiClient.get.mockResolvedValue(mockCategoryDetailResponse);

				const result = await categoryService.getCategory(1);

				expect(result).toEqual(mockCategoryDetailResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/categories/1",
					expect.any(Object), // categoryDetailResponseSchema
				);
			});
		});

		describe("createCategory", () => {
			it("カテゴリを正常に作成できること", async () => {
				const createData: CreateCategoryRequest = {
					name: "新しいカテゴリ",
					type: "expense",
					color: "#00FF00",
					icon: "new",
					displayOrder: 2,
				};

				mockApiClient.post.mockResolvedValue(mockCategoryDetailResponse);

				const result = await categoryService.createCategory(createData);

				expect(result).toEqual(mockCategoryDetailResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith(
					"/categories/create",
					createData,
					expect.any(Object), // categoryDetailResponseSchema
				);
			});

			it("無効なデータでZodエラーが発生すること", async () => {
				const invalidData = {
					name: "", // 空文字列は無効
					type: "invalid", // 無効なタイプ
				} as any;

				await expect(
					categoryService.createCategory(invalidData),
				).rejects.toThrow(ZodError);
			});
		});

		describe("updateCategory", () => {
			it("カテゴリを正常に更新できること", async () => {
				const updateData: UpdateCategoryRequest = {
					name: "更新されたカテゴリ",
					color: "#0000FF",
				};

				mockApiClient.put.mockResolvedValue(mockCategoryDetailResponse);

				const result = await categoryService.updateCategory(1, updateData);

				expect(result).toEqual(mockCategoryDetailResponse);
				expect(mockApiClient.put).toHaveBeenCalledWith(
					"/categories/1/update",
					updateData,
					expect.any(Object), // categoryDetailResponseSchema
				);
			});
		});

		describe("deleteCategory", () => {
			it("カテゴリを正常に削除できること", async () => {
				mockApiClient.delete.mockResolvedValue(mockBaseApiResponse);

				const result = await categoryService.deleteCategory(1);

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.delete).toHaveBeenCalledWith(
					"/categories/1/delete",
					expect.any(Object), // baseApiResponseSchema
				);
			});
		});

		describe("reorderCategories", () => {
			it("カテゴリの並び順を正常に変更できること", async () => {
				const reorderData: ReorderCategoriesRequest = {
					categoryIds: [2, 1, 3],
				};

				mockApiClient.post.mockResolvedValue(mockBaseApiResponse);

				const result = await categoryService.reorderCategories(reorderData);

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith(
					"/categories/reorder",
					reorderData,
					expect.any(Object), // baseApiResponseSchema
				);
			});
		});
	});

	// ========================================
	// 取引サービスのテスト
	// ========================================

	describe("transactionService", () => {
		describe("getTransactions", () => {
			it("パラメータなしで取引一覧を取得できること", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactionsListResponse);

				const result = await transactionService.getTransactions();

				expect(result).toEqual(mockTransactionsListResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions",
					expect.any(Object), // transactionsListResponseSchema
				);
			});

			it("フィルターパラメータ付きで取引を取得できること", async () => {
				const params = {
					filters: {
						type: "expense" as const,
						category_id: 1,
						from: "2024-01-01",
						to: "2024-01-31",
						search: "テスト",
					},
					sort: {
						sort_by: "amount" as const,
						sort_order: "asc" as const,
					},
					page: 2,
					limit: 10,
				};

				mockApiClient.get.mockResolvedValue(mockTransactionsListResponse);

				const result = await transactionService.getTransactions(params);

				expect(result).toEqual(mockTransactionsListResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions?type=expense&category_id=1&from=2024-01-01&to=2024-01-31&search=%E3%83%86%E3%82%B9%E3%83%88&sort_by=amount&sort_order=asc&page=2&limit=10",
					expect.any(Object),
				);
			});

			it("undefined値を含むパラメータを正しく処理できること", async () => {
				const params = {
					filters: {
						type: "expense" as const,
						category_id: undefined, // undefined値は除外される
					},
					page: 1,
				};

				mockApiClient.get.mockResolvedValue(mockTransactionsListResponse);

				await transactionService.getTransactions(params);

				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions?type=expense&page=1",
					expect.any(Object),
				);
			});
		});

		describe("getTransaction", () => {
			it("取引詳細を正常に取得できること", async () => {
				mockApiClient.get.mockResolvedValue(mockTransactionDetailResponse);

				const result = await transactionService.getTransaction(1);

				expect(result).toEqual(mockTransactionDetailResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions/1",
					expect.any(Object),
				);
			});
		});

		describe("createTransaction", () => {
			it("取引を正常に作成できること", async () => {
				const createData: CreateTransactionRequest = {
					amount: 1500,
					type: "expense",
					categoryId: 1,
					description: "新しい取引",
					transactionDate: "2024-01-01",
					paymentMethod: "クレジットカード",
					tags: ["新規", "テスト"],
				};

				mockApiClient.post.mockResolvedValue(mockTransactionDetailResponse);

				const result = await transactionService.createTransaction(createData);

				expect(result).toEqual(mockTransactionDetailResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith(
					"/transactions/create",
					createData,
					expect.any(Object),
				);
			});

			it("無効なデータでZodエラーが発生すること", async () => {
				const invalidData = {
					amount: -100, // 負の値は無効
					type: "invalid", // 無効なタイプ
				} as any;

				await expect(
					transactionService.createTransaction(invalidData),
				).rejects.toThrow(ZodError);
			});
		});

		describe("updateTransaction", () => {
			it("取引を正常に更新できること", async () => {
				const updateData: UpdateTransactionRequest = {
					description: "更新された取引",
					amount: 2000,
				};

				mockApiClient.put.mockResolvedValue(mockTransactionDetailResponse);

				const result = await transactionService.updateTransaction(
					1,
					updateData,
				);

				expect(result).toEqual(mockTransactionDetailResponse);
				expect(mockApiClient.put).toHaveBeenCalledWith(
					"/transactions/1/update",
					updateData,
					expect.any(Object),
				);
			});
		});

		describe("deleteTransaction", () => {
			it("取引を正常に削除できること", async () => {
				mockApiClient.delete.mockResolvedValue(mockBaseApiResponse);

				const result = await transactionService.deleteTransaction(1);

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.delete).toHaveBeenCalledWith(
					"/transactions/1/delete",
					expect.any(Object),
				);
			});
		});

		describe("getTransactionStats", () => {
			it("取引統計を正常に取得できること", async () => {
				const params = {
					startDate: "2024-01-01",
					endDate: "2024-01-31",
					groupBy: "category" as const,
				};

				mockApiClient.get.mockResolvedValue(mockBaseApiResponse);

				const result = await transactionService.getTransactionStats(params);

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions/stats?startDate=2024-01-01&endDate=2024-01-31&groupBy=category",
					expect.any(Object),
				);
			});

			it("パラメータなしで統計を取得できること", async () => {
				mockApiClient.get.mockResolvedValue(mockBaseApiResponse);

				const result = await transactionService.getTransactionStats();

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/transactions/stats",
					expect.any(Object),
				);
			});
		});
	});

	// ========================================
	// サブスクリプションサービスのテスト
	// ========================================

	describe("subscriptionService", () => {
		describe("getSubscriptions", () => {
			it("サブスクリプション一覧を正常に取得できること", async () => {
				mockApiClient.get.mockResolvedValue(mockSubscriptionsListResponse);

				const result = await subscriptionService.getSubscriptions();

				expect(result).toEqual(mockSubscriptionsListResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/subscriptions",
					expect.any(Object),
				);
			});
		});

		describe("getSubscription", () => {
			it("サブスクリプション詳細を正常に取得できること", async () => {
				mockApiClient.get.mockResolvedValue(mockSubscriptionDetailResponse);

				const result = await subscriptionService.getSubscription(1);

				expect(result).toEqual(mockSubscriptionDetailResponse);
				expect(mockApiClient.get).toHaveBeenCalledWith(
					"/subscriptions/1",
					expect.any(Object),
				);
			});
		});

		describe("createSubscription", () => {
			it("サブスクリプションを正常に作成できること", async () => {
				const createData: CreateSubscriptionRequest = {
					name: "新しいサブスク",
					amount: 1000,
					categoryId: 1,
					frequency: "monthly",
					nextPaymentDate: "2024-02-01",
					description: "テストサブスク",
					autoGenerate: true,
				};

				mockApiClient.post.mockResolvedValue(mockSubscriptionDetailResponse);

				const result = await subscriptionService.createSubscription(createData);

				expect(result).toEqual(mockSubscriptionDetailResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith(
					"/subscriptions/create",
					createData,
					expect.any(Object),
				);
			});

			it("無効なデータでZodエラーが発生すること", async () => {
				const invalidData = {
					name: "", // 空文字列は無効
					amount: -100, // 負の値は無効
					frequency: "invalid", // 無効な頻度
				} as any;

				await expect(
					subscriptionService.createSubscription(invalidData),
				).rejects.toThrow(ZodError);
			});
		});

		describe("updateSubscription", () => {
			it("サブスクリプションを正常に更新できること", async () => {
				const updateData: UpdateSubscriptionRequest = {
					name: "更新されたサブスク",
					amount: 1500,
				};

				mockApiClient.put.mockResolvedValue(mockSubscriptionDetailResponse);

				const result = await subscriptionService.updateSubscription(
					1,
					updateData,
				);

				expect(result).toEqual(mockSubscriptionDetailResponse);
				expect(mockApiClient.put).toHaveBeenCalledWith(
					"/subscriptions/1/update",
					updateData,
					expect.any(Object),
				);
			});
		});

		describe("deleteSubscription", () => {
			it("サブスクリプションを正常に削除できること", async () => {
				mockApiClient.delete.mockResolvedValue(mockBaseApiResponse);

				const result = await subscriptionService.deleteSubscription(1);

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.delete).toHaveBeenCalledWith(
					"/subscriptions/1/delete",
					expect.any(Object),
				);
			});
		});

		describe("deactivateSubscription", () => {
			it("サブスクリプションを正常に一時停止できること", async () => {
				mockApiClient.post.mockResolvedValue(mockBaseApiResponse);

				const result = await subscriptionService.deactivateSubscription(1);

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith(
					"/subscriptions/1/deactivate",
					{},
					expect.any(Object),
				);
			});
		});

		describe("activateSubscription", () => {
			it("サブスクリプションを正常に再開できること", async () => {
				mockApiClient.post.mockResolvedValue(mockBaseApiResponse);

				const result = await subscriptionService.activateSubscription(1);

				expect(result).toEqual(mockBaseApiResponse);
				expect(mockApiClient.post).toHaveBeenCalledWith(
					"/subscriptions/1/activate",
					{},
					expect.any(Object),
				);
			});
		});
	});

	// ========================================
	// 統合APIサービスのテスト
	// ========================================

	describe("apiServices", () => {
		it("全てのサービスが正しく統合されていること", () => {
			expect(apiServices.categories).toBe(categoryService);
			expect(apiServices.transactions).toBe(transactionService);
			expect(apiServices.subscriptions).toBe(subscriptionService);
		});

		it("各サービスが期待するメソッドを持っていること", () => {
			// カテゴリサービス
			expect(typeof apiServices.categories.getCategories).toBe("function");
			expect(typeof apiServices.categories.getCategory).toBe("function");
			expect(typeof apiServices.categories.createCategory).toBe("function");
			expect(typeof apiServices.categories.updateCategory).toBe("function");
			expect(typeof apiServices.categories.deleteCategory).toBe("function");
			expect(typeof apiServices.categories.reorderCategories).toBe("function");

			// 取引サービス
			expect(typeof apiServices.transactions.getTransactions).toBe("function");
			expect(typeof apiServices.transactions.getTransaction).toBe("function");
			expect(typeof apiServices.transactions.createTransaction).toBe(
				"function",
			);
			expect(typeof apiServices.transactions.updateTransaction).toBe(
				"function",
			);
			expect(typeof apiServices.transactions.deleteTransaction).toBe(
				"function",
			);
			expect(typeof apiServices.transactions.getTransactionStats).toBe(
				"function",
			);

			// サブスクリプションサービス
			expect(typeof apiServices.subscriptions.getSubscriptions).toBe(
				"function",
			);
			expect(typeof apiServices.subscriptions.getSubscription).toBe("function");
			expect(typeof apiServices.subscriptions.createSubscription).toBe(
				"function",
			);
			expect(typeof apiServices.subscriptions.updateSubscription).toBe(
				"function",
			);
			expect(typeof apiServices.subscriptions.deleteSubscription).toBe(
				"function",
			);
			expect(typeof apiServices.subscriptions.deactivateSubscription).toBe(
				"function",
			);
			expect(typeof apiServices.subscriptions.activateSubscription).toBe(
				"function",
			);
		});
	});

	// ========================================
	// エラーハンドリングの統合テスト
	// ========================================

	describe("Error handling integration", () => {
		it("ネットワークエラーが全てのサービスで適切に処理されること", async () => {
			const networkError = new ApiError("Network Error", 0);
			mockApiClient.get.mockRejectedValue(networkError);

			await expect(categoryService.getCategories()).rejects.toThrow(ApiError);
			await expect(transactionService.getTransactions()).rejects.toThrow(
				ApiError,
			);
			await expect(subscriptionService.getSubscriptions()).rejects.toThrow(
				ApiError,
			);
		});

		it("HTTPエラーが全てのサービスで適切に処理されること", async () => {
			const httpError = new ApiError("Internal Server Error", 500);
			mockApiClient.post.mockRejectedValue(httpError);

			const createCategoryData: CreateCategoryRequest = {
				name: "テスト",
				type: "expense",
				color: "#FF0000",
				icon: "test",
				displayOrder: 1,
			};

			const createTransactionData: CreateTransactionRequest = {
				amount: 1000,
				type: "expense",
				description: "テスト",
				transactionDate: "2024-01-01",
			};

			const createSubscriptionData: CreateSubscriptionRequest = {
				name: "テスト",
				amount: 1000,
				categoryId: 1,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				autoGenerate: false,
			};

			await expect(
				categoryService.createCategory(createCategoryData),
			).rejects.toThrow(ApiError);
			await expect(
				transactionService.createTransaction(createTransactionData),
			).rejects.toThrow(ApiError);
			await expect(
				subscriptionService.createSubscription(createSubscriptionData),
			).rejects.toThrow(ApiError);
		});
	});

	// ========================================
	// 日時フィールド処理のテスト（Issue #30関連）
	// ========================================

	describe("Timestamp field handling", () => {
		describe("createTransaction", () => {
			it("リクエストにcreatedAt/updatedAtフィールドが含まれないこと", async () => {
				mockApiClient.post.mockResolvedValue({
					success: true,
					data: {
						...mockTransaction,
						// データベースで自動設定される値
						createdAt: "2024-01-01T12:00:00.000Z",
						updatedAt: "2024-01-01T12:00:00.000Z",
					},
				});

				const createData: CreateTransactionRequest = {
					amount: 1000,
					type: "expense",
					categoryId: 1,
					description: "日時フィールドテスト",
					transactionDate: "2024-01-01",
					paymentMethod: "credit",
					tags: ["テスト"],
					isRecurring: false,
				};

				await transactionService.createTransaction(createData);

				// リクエストボディにcreatedAt/updatedAtが含まれていないことを確認
				const requestBody = mockApiClient.post.mock.calls[0][1];
				expect(requestBody).not.toHaveProperty("createdAt");
				expect(requestBody).not.toHaveProperty("updatedAt");
				expect(requestBody).toEqual(createData);
			});

			it("レスポンスのcreatedAt/updatedAtが正しく処理されること", async () => {
				const mockResponse = {
					success: true,
					data: {
						...mockTransaction,
						createdAt: "2024-01-01T12:00:00.000Z",
						updatedAt: "2024-01-01T12:00:00.000Z",
					},
				};

				mockApiClient.post.mockResolvedValue(mockResponse);

				const result = await transactionService.createTransaction({
					amount: 1000,
					type: "expense",
					categoryId: 1,
					description: "テスト",
					transactionDate: "2024-01-01",
				});

				expect(result.data.createdAt).toBe("2024-01-01T12:00:00.000Z");
				expect(result.data.updatedAt).toBe("2024-01-01T12:00:00.000Z");
			});
		});

		describe("updateTransaction", () => {
			it("更新時にupdatedAtが正しく更新されること", async () => {
				const originalCreatedAt = "2024-01-01T10:00:00.000Z";
				const updatedTime = "2024-01-01T12:00:00.000Z";

				const mockResponse = {
					success: true,
					data: {
						...mockTransaction,
						description: "更新されたテスト",
						createdAt: originalCreatedAt, // 変更されない
						updatedAt: updatedTime, // 更新される
					},
				};

				mockApiClient.put.mockResolvedValue(mockResponse);

				const result = await transactionService.updateTransaction(1, {
					description: "更新されたテスト",
				});

				// createdAtは変更されず、updatedAtのみ更新される
				expect(result.data.createdAt).toBe(originalCreatedAt);
				expect(result.data.updatedAt).toBe(updatedTime);
				expect(result.data.updatedAt).not.toBe(result.data.createdAt);
			});
		});

		describe("createSubscription", () => {
			it("リクエストにcreatedAt/updatedAtフィールドが含まれないこと", async () => {
				mockApiClient.post.mockResolvedValue({
					success: true,
					data: {
						...mockSubscription,
						createdAt: "2024-01-01T12:00:00.000Z",
						updatedAt: "2024-01-01T12:00:00.000Z",
					},
				});

				const createData: CreateSubscriptionRequest = {
					name: "日時フィールドテストサブスク",
					amount: 980,
					categoryId: 1,
					frequency: "monthly",
					nextPaymentDate: "2024-02-01",
					description: "テスト用",
					autoGenerate: true,
				};

				await subscriptionService.createSubscription(createData);

				// リクエストボディにcreatedAt/updatedAtが含まれていないことを確認
				const requestBody = mockApiClient.post.mock.calls[0][1];
				expect(requestBody).not.toHaveProperty("createdAt");
				expect(requestBody).not.toHaveProperty("updatedAt");
				expect(requestBody).toEqual(createData);
			});
		});

		describe("timestamp format validation", () => {
			it("ISO 8601形式の日時フィールドが正しく処理されること", async () => {
				const isoTimestamp = "2024-01-01T12:30:45.123Z";
				
				const mockResponse = {
					success: true,
					data: {
						...mockTransaction,
						createdAt: isoTimestamp,
						updatedAt: isoTimestamp,
					},
				};

				mockApiClient.post.mockResolvedValue(mockResponse);

				const result = await transactionService.createTransaction({
					amount: 1000,
					type: "expense",
					categoryId: 1,
					description: "ISO形式テスト",
					transactionDate: "2024-01-01",
				});

				// ISO 8601形式の検証
				expect(result.data.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
				expect(result.data.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/);
				
				// 有効な日付として解析できる
				expect(new Date(result.data.createdAt).getTime()).not.toBeNaN();
				expect(new Date(result.data.updatedAt).getTime()).not.toBeNaN();
			});
		});
	});

	// ========================================
	// パフォーマンステスト
	// ========================================

	describe("Performance tests", () => {
		it("並行リクエストが正常に処理されること", async () => {
			mockApiClient.get.mockResolvedValue(mockCategoriesListResponse);

			const promises = Array.from({ length: 10 }, () =>
				categoryService.getCategories(),
			);

			const results = await Promise.all(promises);

			expect(results).toHaveLength(10);
			expect(
				results.every((result) => result === mockCategoriesListResponse),
			).toBe(true);
			expect(mockApiClient.get).toHaveBeenCalledTimes(10);
		});

		it("異なるサービスの並行リクエストが正常に処理されること", async () => {
			mockApiClient.get
				.mockResolvedValueOnce(mockCategoriesListResponse)
				.mockResolvedValueOnce(mockTransactionsListResponse)
				.mockResolvedValueOnce(mockSubscriptionsListResponse);

			const [categories, transactions, subscriptions] = await Promise.all([
				categoryService.getCategories(),
				transactionService.getTransactions(),
				subscriptionService.getSubscriptions(),
			]);

			expect(categories).toEqual(mockCategoriesListResponse);
			expect(transactions).toEqual(mockTransactionsListResponse);
			expect(subscriptions).toEqual(mockSubscriptionsListResponse);
		});
	});
});
