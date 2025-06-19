/**
 * GET /api/transactions エンドポイントのテスト
 *
 * 機能:
 * - 取引一覧取得のローダー関数テスト
 * - クエリパラメータバリデーションのテスト
 * - ページネーション機能のテスト
 * - フィルタリング機能のテスト
 * - ソート機能のテスト
 * - エラーハンドリングのテスト
 *
 * React Router v7のローダー・アクション機能のテストに基づいて実装
 * Issue #37の例に基づいたMockLoaderArgs/ActionArgsとCloudflareモックを活用
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { loader } from "./index";
import {
	createMockLoaderArgs,
	setupMockCloudflareEnvironment,
} from "../../../../tests/mocks/cloudflare";
import { resetMockDataStore, seedMockData } from "../../../../__mocks__/db";
import type { SelectTransaction, SelectCategory } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/transactions", () => ({
	getTransactionsList: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockGetTransactionsList = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.getTransactionsList,
	),
);

describe("GET /api/transactions", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("デフォルトパラメータで取引一覧を取得できること", async () => {
			// テストデータの準備
			const mockTransactions: SelectTransaction[] = [
				{
					id: 1,
					amount: 1000,
					type: "expense",
					categoryId: 1,
					description: "テスト取引1",
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
					description: "テスト取引2",
					transactionDate: "2024-01-02",
					paymentMethod: "銀行振込",
					tags: null,
					receiptUrl: null,
					isRecurring: false,
					recurringId: null,
					createdAt: "2024-01-02T00:00:00.000Z",
					updatedAt: "2024-01-02T00:00:00.000Z",
				},
			];

			const mockResult = {
				transactions: mockTransactions,
				currentPage: 1,
				totalPages: 1,
				totalCount: 2,
				hasNextPage: false,
				hasPrevPage: false,
			};

			mockGetTransactionsList.mockResolvedValue(mockResult);

			// テスト実行
			const args = createMockLoaderArgs("http://localhost:3000/api/transactions");
			const response = await loader(args);

			// レスポンス検証
			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toEqual({
				success: true,
				data: mockTransactions,
				count: 2,
				pagination: {
					currentPage: 1,
					totalPages: 1,
					totalCount: 2,
					hasNextPage: false,
					hasPrevPage: false,
					limit: 20, // デフォルト値
				},
				filters: {
					from: undefined,
					to: undefined,
					type: undefined,
					category_id: undefined,
					search: undefined,
				},
				sort: {
					sort_by: "transactionDate", // デフォルト値
					sort_order: "desc", // デフォルト値
				},
			});

			// モック関数の呼出し検証
			expect(mockGetTransactionsList).toHaveBeenCalledWith(mockDb, {
				startDate: undefined,
				endDate: undefined,
				type: undefined,
				categoryId: undefined,
				search: undefined,
				page: 1,
				limit: 20,
				sortBy: "transactionDate",
				sortOrder: "desc",
			});
		});

		it("クエリパラメータ付きで取引一覧を取得できること", async () => {
			const mockResult = {
				transactions: [],
				currentPage: 2,
				totalPages: 5,
				totalCount: 100,
				hasNextPage: true,
				hasPrevPage: true,
			};

			mockGetTransactionsList.mockResolvedValue(mockResult);

			// クエリパラメータ付きのURL
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?from=2024-01-01&to=2024-01-31&type=expense&category_id=1&search=テスト&page=2&limit=10&sort_by=amount&sort_order=asc",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.pagination).toEqual({
				currentPage: 2,
				totalPages: 5,
				totalCount: 100,
				hasNextPage: true,
				hasPrevPage: true,
				limit: 10,
			});

			expect(responseData.filters).toEqual({
				from: "2024-01-01",
				to: "2024-01-31",
				type: "expense",
				category_id: 1,
				search: "テスト",
			});

			expect(responseData.sort).toEqual({
				sort_by: "amount",
				sort_order: "asc",
			});

			// モック関数の呼出し検証
			expect(mockGetTransactionsList).toHaveBeenCalledWith(mockDb, {
				startDate: "2024-01-01",
				endDate: "2024-01-31",
				type: "expense",
				categoryId: 1,
				search: "テスト",
				page: 2,
				limit: 10,
				sortBy: "amount",
				sortOrder: "asc",
			});
		});

		it("空の結果を正常に返せること", async () => {
			const mockResult = {
				transactions: [],
				currentPage: 1,
				totalPages: 0,
				totalCount: 0,
				hasNextPage: false,
				hasPrevPage: false,
			};

			mockGetTransactionsList.mockResolvedValue(mockResult);

			const args = createMockLoaderArgs("http://localhost:3000/api/transactions");
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.data).toEqual([]);
			expect(responseData.count).toBe(0);
		});
	});

	describe("バリデーションエラーテスト", () => {
		it("無効な日付形式でエラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?from=invalid-date",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
			expect(responseData.details).toBeDefined();
		});

		it("無効なtypeでエラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?type=invalid",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
		});

		it("無効なcategory_idでエラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?category_id=invalid",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
		});

		it("pageが1未満でエラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?page=0",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
		});

		it("limitが範囲外でエラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?limit=101",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
		});

		it("無効なsort_byでエラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?sort_by=invalid",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
		});
	});

	describe("エラーハンドリングテスト", () => {
		it("データベースエラー時に500エラーを返すこと", async () => {
			mockGetTransactionsList.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockLoaderArgs("http://localhost:3000/api/transactions");
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引一覧の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラー時に500エラーを返すこと", async () => {
			mockGetTransactionsList.mockRejectedValue("Unexpected error");

			const args = createMockLoaderArgs("http://localhost:3000/api/transactions");
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引一覧の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});
	});

	describe("境界値テスト", () => {
		it("pageが1のときhasNextPageとhasPrevPageが正しく設定されること", async () => {
			const mockResult = {
				transactions: [],
				currentPage: 1,
				totalPages: 3,
				totalCount: 60,
				hasNextPage: true,
				hasPrevPage: false,
			};

			mockGetTransactionsList.mockResolvedValue(mockResult);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?page=1",
			);
			const response = await loader(args);

			const responseData = await response.json();
			expect(responseData.pagination.hasNextPage).toBe(true);
			expect(responseData.pagination.hasPrevPage).toBe(false);
		});

		it("最後のページでhasNextPageがfalseになること", async () => {
			const mockResult = {
				transactions: [],
				currentPage: 3,
				totalPages: 3,
				totalCount: 60,
				hasNextPage: false,
				hasPrevPage: true,
			};

			mockGetTransactionsList.mockResolvedValue(mockResult);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?page=3",
			);
			const response = await loader(args);

			const responseData = await response.json();
			expect(responseData.pagination.hasNextPage).toBe(false);
			expect(responseData.pagination.hasPrevPage).toBe(true);
		});

		it("空文字のsearchパラメータを正しく処理すること", async () => {
			const mockResult = {
				transactions: [],
				currentPage: 1,
				totalPages: 0,
				totalCount: 0,
				hasNextPage: false,
				hasPrevPage: false,
			};

			mockGetTransactionsList.mockResolvedValue(mockResult);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions?search=",
			);
			const response = await loader(args);

			expect(response.status).toBe(400); // searchは最小1文字の制約がある
		});
	});
});