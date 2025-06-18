import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockContext,
	createMockDatabase,
	createMockGetRequest,
	mockTransactionWithCategory,
	validateApiResponse,
} from "../../../__tests__/utils/test-helpers";
import { loader } from "./$id";

// データベースクエリ関数をモック
vi.mock("../../../../db/queries/transactions", () => ({
	getTransactionById: vi.fn(),
}));

vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(),
}));

import { createDb } from "../../../../db/connection";
// モック関数のインポート
import { getTransactionById } from "../../../../db/queries/transactions";

const mockGetTransactionById = vi.mocked(getTransactionById);
const mockCreateDb = vi.mocked(createDb);

/**
 * GET /api/transactions/:id エンドポイントの単体テスト
 *
 * テスト対象:
 * - 指定されたIDの取引詳細取得機能
 * - カテゴリ情報を含む詳細データの返却
 * - パラメータのバリデーション
 * - 存在チェック（404エラー）
 * - タグのJSON解析処理
 * - エラーハンドリング（不正ID、データベースエラー）
 */
describe("GET /api/transactions/:id", () => {
	const mockDb = createMockDatabase();
	const mockContext = createMockContext(mockDb);

	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateDb.mockReturnValue(mockDb);
	});

	describe("成功ケース", () => {
		it("有効なIDで取引詳細を取得できる", async () => {
			// モックデータの設定
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			// レスポンスの検証
			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data).toEqual({
				...mockTransactionWithCategory,
				tags: ["外食", "会社"], // JSON解析後の配列
			});

			// データベース関数の呼び出し検証
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 1);
		});

		it("カテゴリ情報なしの取引詳細を取得できる", async () => {
			const transactionWithoutCategory = {
				...mockTransactionWithCategory,
				categoryId: null,
				category: null,
			};
			mockGetTransactionById.mockResolvedValue(transactionWithoutCategory);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.categoryId).toBe(null);
			expect(json.data.category).toBe(null);
		});

		it("タグなしの取引詳細を取得できる", async () => {
			const transactionWithoutTags = {
				...mockTransactionWithCategory,
				tags: null,
			};
			mockGetTransactionById.mockResolvedValue(transactionWithoutTags);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.tags).toBe(null);
		});

		it("空のタグ配列の取引詳細を取得できる", async () => {
			const transactionWithEmptyTags = {
				...mockTransactionWithCategory,
				tags: "[]",
			};
			mockGetTransactionById.mockResolvedValue(transactionWithEmptyTags);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.tags).toEqual([]);
		});

		it("大きなIDでも正しく処理される", async () => {
			const largeId = 999999;
			mockGetTransactionById.mockResolvedValue({
				...mockTransactionWithCategory,
				id: largeId,
			});

			const request = createMockGetRequest(
				`http://localhost/api/transactions/${largeId}`,
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: largeId.toString() },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.id).toBe(largeId);
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, largeId);
		});
	});

	describe("パラメータバリデーションエラーケース", () => {
		it("非数値IDで400エラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions/invalid",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "invalid" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
			expect(json.details).toBeDefined();
		});

		it("負の数値IDで400エラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions/-1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "-1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});

		it("0のIDで400エラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions/0",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "0" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});

		it("小数点を含むIDで400エラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions/1.5",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1.5" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});

		it("空のIDで400エラーが返される", async () => {
			const request = createMockGetRequest(
				"http://localhost/api/transactions/",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});
	});

	describe("404エラーケース", () => {
		it("存在しない取引IDで404エラーが返される", async () => {
			// 存在しない取引をシミュレート
			mockGetTransactionById.mockResolvedValue(null as any);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/999",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "999" },
			});

			expect(response.status).toBe(404);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("指定された取引が見つかりません");
			expect(json.transactionId).toBe(999);

			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 999);
		});

		it("削除済み取引IDで404エラーが返される", async () => {
			// 削除済み取引（データベースからnullが返される）をシミュレート
			mockGetTransactionById.mockResolvedValue(null as any);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(404);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("指定された取引が見つかりません");
		});
	});

	describe("タグJSON解析のエラーハンドリング", () => {
		it("不正なJSONタグが含まれていても正常に処理される", async () => {
			const transactionWithInvalidTags = {
				...mockTransactionWithCategory,
				tags: "invalid-json",
			};
			mockGetTransactionById.mockResolvedValue(transactionWithInvalidTags);

			// console.warn のモック
			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			// JSON解析に失敗した場合はnullが設定される
			expect(json.data.tags).toBe(null);

			// 警告がログ出力されることを確認
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				"取引ID 1 のタグJSON解析に失敗:",
				expect.any(Error),
			);

			consoleWarnSpy.mockRestore();
		});

		it("部分的に壊れたJSONタグでも処理される", async () => {
			const transactionWithPartiallyBrokenTags = {
				...mockTransactionWithCategory,
				tags: '["外食", "会社"', // 閉じ括弧が不足
			};
			mockGetTransactionById.mockResolvedValue(
				transactionWithPartiallyBrokenTags,
			);

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.tags).toBe(null);
			expect(consoleWarnSpy).toHaveBeenCalled();

			consoleWarnSpy.mockRestore();
		});
	});

	describe("データベースエラーハンドリング", () => {
		it("データベースエラー時に500エラーが返される", async () => {
			// データベースエラーをシミュレート
			mockGetTransactionById.mockRejectedValue(
				new Error("データベース接続エラー"),
			);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引詳細の取得中にエラーが発生しました");
			expect(json.details).toBe("データベース接続エラー");
		});

		it("予期しないエラー時に500エラーが返される", async () => {
			// 予期しないエラーをシミュレート
			mockGetTransactionById.mockRejectedValue("予期しないエラー");

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引詳細の取得中にエラーが発生しました");
			expect(json.details).toBe("不明なエラー");
		});

		it("タイムアウトエラー時に500エラーが返される", async () => {
			// タイムアウトエラーをシミュレート
			mockGetTransactionById.mockRejectedValue(new Error("Query timeout"));

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引詳細の取得中にエラーが発生しました");
			expect(json.details).toBe("Query timeout");
		});
	});

	describe("レスポンス構造の検証", () => {
		it("成功レスポンスが正しい構造を持つ", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			// 必須フィールドの存在確認
			expect(json).toHaveProperty("success", true);
			expect(json).toHaveProperty("data");

			// データ構造の確認
			const { data } = json;
			expect(data).toHaveProperty("id");
			expect(data).toHaveProperty("amount");
			expect(data).toHaveProperty("type");
			expect(data).toHaveProperty("transactionDate");
			expect(data).toHaveProperty("createdAt");
			expect(data).toHaveProperty("updatedAt");

			// カテゴリ構造の確認
			if (data.category) {
				expect(data.category).toHaveProperty("id");
				expect(data.category).toHaveProperty("name");
				expect(data.category).toHaveProperty("type");
			}
		});

		it("Content-Typeヘッダーが正しく設定される", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});
	});

	describe("境界値テスト", () => {
		it("最小有効ID（1）で正しく処理される", async () => {
			mockGetTransactionById.mockResolvedValue({
				...mockTransactionWithCategory,
				id: 1,
			});

			const request = createMockGetRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			expect(json.data.id).toBe(1);
		});

		it("非常に長いIDでも処理される", async () => {
			const veryLargeId = Number.MAX_SAFE_INTEGER;
			mockGetTransactionById.mockResolvedValue(undefined as any); // 存在しない想定

			const request = createMockGetRequest(
				`http://localhost/api/transactions/${veryLargeId}`,
			);
			const response = await loader({
				request,
				context: mockContext,
				params: { id: veryLargeId.toString() },
			});

			// 存在しないので404が返される
			expect(response.status).toBe(404);
			const json = await validateApiResponse(response);
			expect(json.transactionId).toBe(veryLargeId);
		});
	});
});
