import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockContext,
	createMockDatabase,
	createMockPostRequest,
	generateCreateTransactionData,
	generateInvalidTransactionData,
	mockCategory,
	mockTransaction,
	mockTransactionWithCategory,
	validateApiResponse,
} from "../../../__tests__/utils/test-helpers";
import { action } from "./create";

// データベースクエリ関数をモック
vi.mock("../../../../db/queries/transactions", () => ({
	createTransaction: vi.fn(),
	getTransactionById: vi.fn(),
}));

vi.mock("../../../../db/queries/categories", () => ({
	getCategoryById: vi.fn(),
}));

vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(),
}));

vi.mock("../../../../db/schema", () => ({
	createTransactionSchema: {
		safeParse: vi.fn(),
	},
}));

import { createDb } from "../../../../db/connection";
import { getCategoryById } from "../../../../db/queries/categories";
// モック関数のインポート
import {
	createTransaction,
	getTransactionById,
} from "../../../../db/queries/transactions";

const mockCreateTransaction = vi.mocked(createTransaction);
const mockGetTransactionById = vi.mocked(getTransactionById);
const mockGetCategoryById = vi.mocked(getCategoryById);
const mockCreateDb = vi.mocked(createDb);

/**
 * POST /api/transactions エンドポイントの単体テスト
 *
 * テスト対象:
 * - 取引作成機能
 * - リクエストボディのバリデーション
 * - カテゴリ存在チェック
 * - カテゴリタイプと取引タイプの整合性チェック
 * - タグの配列形式での受け取りとJSON形式での保存
 * - エラーハンドリング（バリデーションエラー、データベースエラー）
 */
describe("POST /api/transactions", () => {
	const mockDb = createMockDatabase();
	const mockContext = createMockContext(mockDb);

	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateDb.mockReturnValue(mockDb);
	});

	describe("成功ケース", () => {
		it("有効なデータで取引を作成できる", async () => {
			const requestData = generateCreateTransactionData();

			// モックの設定
			mockCreateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			// レスポンスの検証
			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);

			expect(json.data).toEqual(mockTransactionWithCategory);
			expect(json.message).toBe("取引が正常に作成されました");

			// データベース関数の呼び出し検証
			expect(mockCreateTransaction).toHaveBeenCalledWith(mockDb, requestData);
			expect(mockGetTransactionById).toHaveBeenCalledWith(
				mockDb,
				mockTransaction.id,
			);
		});

		it("カテゴリIDを指定して取引を作成できる", async () => {
			const requestData = generateCreateTransactionData({
				categoryId: 1,
				type: "expense",
			});

			// モックの設定
			mockGetCategoryById.mockResolvedValue(mockCategory);
			mockCreateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);

			expect(json.data).toEqual(mockTransactionWithCategory);

			// カテゴリ存在チェックが実行されることを確認
			expect(mockGetCategoryById).toHaveBeenCalledWith(mockDb, 1);
		});

		it("タグを配列で指定して取引を作成できる", async () => {
			const requestData = generateCreateTransactionData({
				tags: ["外食", "会社", "ランチ"],
			});

			mockCreateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);

			// タグが正しく処理されることを確認
			expect(mockCreateTransaction).toHaveBeenCalledWith(mockDb, requestData);
		});

		it("オプションフィールドなしで取引を作成できる", async () => {
			const requestData = {
				amount: 1000,
				type: "expense",
				transactionDate: "2024-01-01",
			};

			mockCreateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValue({
				...mockTransactionWithCategory,
				category: null,
				description: null,
				paymentMethod: null,
				tags: null,
			});

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);

			expect(json.data.categoryId).toBe(null);
			expect(json.data.description).toBe(null);
		});

		it("収入取引を作成できる", async () => {
			const requestData = generateCreateTransactionData({
				type: "income",
				categoryId: 2,
			});

			const incomeCategory = {
				...mockCategory,
				id: 2,
				name: "給与",
				type: "income" as const,
			};

			mockGetCategoryById.mockResolvedValue(incomeCategory);
			mockCreateTransaction.mockResolvedValue({
				...mockTransaction,
				type: "income",
			});
			mockGetTransactionById.mockResolvedValue({
				...mockTransactionWithCategory,
				type: "income",
				category: {
					...mockTransactionWithCategory.category!,
					id: 2,
					name: "給与",
					type: "income",
				},
			});

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);

			expect(json.data.type).toBe("income");
		});
	});

	describe("HTTPメソッドの検証", () => {
		it("POST以外のメソッドで405エラーが返される", async () => {
			const request = new Request("http://localhost/api/transactions", {
				method: "GET",
			});
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(405);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("POST メソッドのみサポートしています");
		});
	});

	describe("バリデーションエラーケース", () => {
		const invalidDataSets = generateInvalidTransactionData();

		it.each(invalidDataSets)(
			"無効なデータでバリデーションエラーが返される: %o",
			async (invalidData) => {
				const request = createMockPostRequest(
					"http://localhost/api/transactions",
					invalidData,
				);
				const response = await action({
					request,
					context: mockContext,
					params: {},
				});

				expect(response.status).toBe(400);
				const json = await validateApiResponse(response);
				expect(json.error).toBe("無効なリクエストボディです");
				expect(json.details).toBeDefined();
			},
		);

		it("空のリクエストボディでバリデーションエラーが返される", async () => {
			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				{},
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なリクエストボディです");
		});

		it("JSONでないリクエストボディでエラーが返される", async () => {
			const request = new Request("http://localhost/api/transactions", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: "invalid-json",
			});

			const response = await action({
				request,
				context: mockContext,
				params: {},
			});
			expect(response.status).toBe(500);
		});
	});

	describe("カテゴリ関連のエラーケース", () => {
		it("存在しないカテゴリIDで400エラーが返される", async () => {
			const requestData = generateCreateTransactionData({
				categoryId: 999,
			});

			// 存在しないカテゴリをシミュレート
			mockGetCategoryById.mockResolvedValue(null as any);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("指定されたカテゴリが見つかりません");
			expect(json.details).toContain("カテゴリID 999");
		});

		it("カテゴリタイプと取引タイプが不一致で400エラーが返される", async () => {
			const requestData = generateCreateTransactionData({
				categoryId: 1,
				type: "income", // カテゴリは expense タイプ
			});

			// expense タイプのカテゴリを返す
			mockGetCategoryById.mockResolvedValue(mockCategory);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("カテゴリタイプと取引タイプが一致しません");
			expect(json.details).toContain("食費");
		});
	});

	describe("データベースエラーハンドリング", () => {
		it("外部キー制約エラー時に400エラーが返される", async () => {
			const requestData = generateCreateTransactionData();

			// 外部キー制約エラーをシミュレート
			mockCreateTransaction.mockRejectedValue(
				new Error("FOREIGN KEY constraint failed"),
			);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("データベース制約エラー");
			expect(json.details).toBe("指定されたカテゴリIDが無効です");
		});

		it("NOT NULL制約エラー時に400エラーが返される", async () => {
			const requestData = generateCreateTransactionData();

			// NOT NULL制約エラーをシミュレート
			mockCreateTransaction.mockRejectedValue(
				new Error("NOT NULL constraint failed"),
			);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("必須項目が不足しています");
			expect(json.details).toBe("金額、取引タイプ、取引日は必須項目です");
		});

		it("CHECK制約エラー時に400エラーが返される", async () => {
			const requestData = generateCreateTransactionData();

			// CHECK制約エラーをシミュレート
			mockCreateTransaction.mockRejectedValue(
				new Error("CHECK constraint failed"),
			);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("データ形式エラー");
			expect(json.details).toBe("金額は正の整数で入力してください");
		});

		it("その他のデータベースエラー時に500エラーが返される", async () => {
			const requestData = generateCreateTransactionData();

			// 一般的なデータベースエラーをシミュレート
			mockCreateTransaction.mockRejectedValue(
				new Error("データベース接続エラー"),
			);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の作成中にエラーが発生しました");
			expect(json.details).toBe("データベース接続エラー");
		});

		it("予期しないエラー時に500エラーが返される", async () => {
			const requestData = generateCreateTransactionData();

			// 予期しないエラーをシミュレート
			mockCreateTransaction.mockRejectedValue("予期しないエラー");

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の作成中にエラーが発生しました");
			expect(json.details).toBe("不明なエラー");
		});
	});

	describe("境界値テスト", () => {
		it("最小有効金額（1円）で取引を作成できる", async () => {
			const requestData = generateCreateTransactionData({
				amount: 1,
			});

			mockCreateTransaction.mockResolvedValue({
				...mockTransaction,
				amount: 1,
			});
			mockGetTransactionById.mockResolvedValue({
				...mockTransactionWithCategory,
				amount: 1,
			});

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);
			expect(json.data.amount).toBe(1);
		});

		it("大きな金額で取引を作成できる", async () => {
			const largeAmount = 1000000;
			const requestData = generateCreateTransactionData({
				amount: largeAmount,
			});

			mockCreateTransaction.mockResolvedValue({
				...mockTransaction,
				amount: largeAmount,
			});
			mockGetTransactionById.mockResolvedValue({
				...mockTransactionWithCategory,
				amount: largeAmount,
			});

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);
			expect(json.data.amount).toBe(largeAmount);
		});

		it("長い説明文で取引を作成できる", async () => {
			const longDescription = "非常に長い説明文".repeat(50);
			const requestData = generateCreateTransactionData({
				description: longDescription,
			});

			mockCreateTransaction.mockResolvedValue({
				...mockTransaction,
				description: longDescription,
			});
			mockGetTransactionById.mockResolvedValue({
				...mockTransactionWithCategory,
				description: longDescription,
			});

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);
			expect(json.data.description).toBe(longDescription);
		});

		it("多数のタグで取引を作成できる", async () => {
			const manyTags = Array.from({ length: 10 }, (_, i) => `タグ${i + 1}`);
			const requestData = generateCreateTransactionData({
				tags: manyTags,
			});

			mockCreateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPostRequest(
				"http://localhost/api/transactions",
				requestData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: {},
			});

			expect(response.status).toBe(201);
			const json = await validateApiResponse(response);

			expect(mockCreateTransaction).toHaveBeenCalledWith(
				mockDb,
				expect.objectContaining({
					tags: manyTags,
				}),
			);
		});
	});
});
