import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockContext,
	createMockDatabase,
	createMockGetRequest,
	generateQueryParamTestCases,
	mockTransactionsList,
	validateApiResponse,
	validatePaginatedResponse,
} from "../../../__tests__/utils/test-helpers";
import { loader } from "./index";

// データベースクエリ関数をモック
vi.mock("../../../../db/queries/transactions", () => ({
	getTransactionsList: vi.fn(),
}));

vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(),
}));

// Zodのスキーマをモック（必要に応じて）
vi.mock("zod", () => ({
	z: {
		object: vi.fn().mockReturnValue({
			safeParse: vi.fn(),
			default: vi.fn(),
		}),
		string: vi.fn().mockReturnValue({
			regex: vi.fn().mockReturnValue({
				optional: vi.fn(),
			}),
			transform: vi.fn().mockReturnValue({
				refine: vi.fn().mockReturnValue({
					default: vi.fn(),
					optional: vi.fn(),
				}),
				default: vi.fn(),
				optional: vi.fn(),
			}),
			min: vi.fn().mockReturnValue({
				optional: vi.fn(),
			}),
			optional: vi.fn(),
		}),
		enum: vi.fn().mockReturnValue({
			default: vi.fn(),
			optional: vi.fn(),
		}),
	},
}));

import { createDb } from "../../../../db/connection";
// モック関数のインポート
import { getTransactionsList } from "../../../../db/queries/transactions";

const mockGetTransactionsList = vi.mocked(getTransactionsList);
const mockCreateDb = vi.mocked(createDb);

/**
 * GET /api/transactions エンドポイントの単体テスト
 *
 * テスト対象:
 * - 基本的な取引一覧取得機能
 * - フィルタリング機能（日付範囲、タイプ、カテゴリ、検索）
 * - ページネーション機能（ページ番号、件数制限）
 * - ソート機能（取引日、金額、作成日時）
 * - クエリパラメータのバリデーション
 * - エラーハンドリング（不正パラメータ、データベースエラー）
 */
describe("GET /api/transactions", () => {
	const mockDb = createMockDatabase();
	const mockContext = createMockContext(mockDb);

	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateDb.mockReturnValue(mockDb);
	});

	describe("成功ケース", () => {
		it("デフォルトパラメータで取引一覧を取得できる", async () => {
			// モックデータの設定
			const mockResult = {
				transactions: mockTransactionsList,
				totalCount: 2,
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			// テスト対象の実行
			const request = createMockGetRequest("http://localhost/api/transactions");
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			// レスポンスの検証
			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			validatePaginatedResponse(json);

			// データベースクエリの呼び出し検証
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

			// レスポンスデータの検証
			expect(json.data).toEqual(mockTransactionsList);
			expect(json.count).toBe(2);
		});

		it("日付範囲フィルタが正しく動作する", async () => {
			const mockResult = {
				transactions: mockTransactionsList,
				totalCount: 2,
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?from=2024-01-01&to=2024-01-31",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					startDate: "2024-01-01",
					endDate: "2024-01-31",
				}),
			);

			expect(json.filters.from).toBe("2024-01-01");
			expect(json.filters.to).toBe("2024-01-31");
		});

		it("取引タイプフィルタが正しく動作する", async () => {
			const mockResult = {
				transactions: mockTransactionsList.filter((t) => t.type === "expense"),
				totalCount: 2,
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?type=expense",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					type: "expense",
				}),
			);

			expect(json.filters.type).toBe("expense");
		});

		it("カテゴリIDフィルタが正しく動作する", async () => {
			const mockResult = {
				transactions: mockTransactionsList.filter((t) => t.category?.id === 1),
				totalCount: 1,
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?category_id=1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					categoryId: 1,
				}),
			);

			expect(json.filters.category_id).toBe(1);
		});

		it("検索フィルタが正しく動作する", async () => {
			const mockResult = {
				transactions: mockTransactionsList.filter((t) =>
					t.description?.includes("ランチ"),
				),
				totalCount: 1,
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?search=ランチ",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					search: "ランチ",
				}),
			);

			expect(json.filters.search).toBe("ランチ");
		});

		it("ページネーションが正しく動作する", async () => {
			const mockResult = {
				transactions: mockTransactionsList.slice(0, 1),
				totalCount: 2,
				currentPage: 1,
				totalPages: 2,
				hasNextPage: true,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?page=1&limit=1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			validatePaginatedResponse(json);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					page: 1,
					limit: 1,
				}),
			);

			expect(json.pagination.currentPage).toBe(1);
			expect(json.pagination.totalPages).toBe(2);
			expect(json.pagination.hasNextPage).toBe(true);
			expect(json.pagination.hasPrevPage).toBe(false);
		});

		it("ソート機能が正しく動作する", async () => {
			const mockResult = {
				transactions: [...mockTransactionsList].sort(
					(a, b) => a.amount - b.amount,
				),
				totalCount: 2,
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?sort_by=amount&sort_order=asc",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					sortBy: "amount",
					sortOrder: "asc",
				}),
			);

			expect(json.sort.sort_by).toBe("amount");
			expect(json.sort.sort_order).toBe("asc");
		});

		it("複数のフィルタを組み合わせて使用できる", async () => {
			const mockResult = {
				transactions: [],
				totalCount: 0,
				currentPage: 1,
				totalPages: 0,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?from=2024-01-01&to=2024-01-31&type=expense&category_id=1&search=ランチ&page=1&limit=10&sort_by=amount&sort_order=desc",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					startDate: "2024-01-01",
					endDate: "2024-01-31",
					type: "expense",
					categoryId: 1,
					search: "ランチ",
					page: 1,
					limit: 10,
					sortBy: "amount",
					sortOrder: "desc",
				}),
			);
		});
	});

	describe("バリデーションエラーケース", () => {
		const { invalid } = generateQueryParamTestCases();

		it("不正な日付形式でエラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions?from=invalid-date",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
			expect(json.details).toBeDefined();
		});

		it("不正な取引タイプでエラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions?type=invalid-type",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
		});

		it("不正なカテゴリIDでエラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions?category_id=invalid-id",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
		});

		it("不正なページ番号でエラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions?page=0",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
		});

		it("不正な件数制限でエラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions?limit=101",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
		});

		it("不正なソート項目でエラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions?sort_by=invalid-field",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
		});

		it("不正なソート順序でエラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions?sort_order=invalid-order",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
		});
	});

	describe("エラーハンドリング", () => {
		it("データベースエラー時に500エラーが返される", async () => {
			// データベースエラーをシミュレート
			mockGetTransactionsList.mockRejectedValue(
				new Error("データベース接続エラー"),
			);

			const request = createMockGetRequest("http://localhost/api/transactions");
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引一覧の取得中にエラーが発生しました");
			expect(json.details).toBe("データベース接続エラー");
		});

		it("予期しないエラー時に500エラーが返される", async () => {
			// 予期しないエラーをシミュレート
			mockGetTransactionsList.mockRejectedValue("予期しないエラー");

			const request = createMockGetRequest("http://localhost/api/transactions");
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引一覧の取得中にエラーが発生しました");
			expect(json.details).toBe("不明なエラー");
		});
	});

	describe("境界値テスト", () => {
		it("検索クエリが空文字列の場合は無視される", async () => {
			const mockResult = {
				transactions: mockTransactionsList,
				totalCount: 2,
				currentPage: 1,
				totalPages: 1,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?search=",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なクエリパラメータです");
		});

		it("最大件数制限（100件）が正しく動作する", async () => {
			const mockResult = {
				transactions: [],
				totalCount: 0,
				currentPage: 1,
				totalPages: 0,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest(
				"http://localhost/api/transactions?limit=100",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockGetTransactionsList).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					limit: 100,
				}),
			);
		});

		it("結果が空の場合でも正しいレスポンス構造を返す", async () => {
			const mockResult = {
				transactions: [],
				totalCount: 0,
				currentPage: 1,
				totalPages: 0,
				hasNextPage: false,
				hasPrevPage: false,
			};
			mockGetTransactionsList.mockResolvedValue(mockResult);

			const request = createMockGetRequest("http://localhost/api/transactions");
			const response = await loader({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			validatePaginatedResponse(json);

			expect(json.data).toEqual([]);
			expect(json.count).toBe(0);
			expect(json.pagination.totalCount).toBe(0);
		});
	});
});
