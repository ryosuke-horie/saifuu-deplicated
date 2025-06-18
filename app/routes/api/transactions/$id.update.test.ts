import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockContext,
	createMockDatabase,
	createMockPutRequest,
	generateCreateTransactionData,
	mockCategory,
	mockTransaction,
	mockTransactionWithCategory,
	validateApiResponse,
} from "../../../__tests__/utils/test-helpers";
import { action } from "./$id.update";

// データベースクエリ関数をモック
vi.mock("../../../../db/queries/transactions", () => ({
	getTransactionById: vi.fn(),
	updateTransaction: vi.fn(),
}));

vi.mock("../../../../db/queries/categories", () => ({
	getCategoryById: vi.fn(),
}));

vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(),
}));

vi.mock("../../../../db/schema", () => ({
	createTransactionSchema: {
		omit: vi.fn().mockReturnValue({
			partial: vi.fn().mockReturnValue({
				safeParse: vi.fn(),
			}),
		}),
	},
}));

import { createDb } from "../../../../db/connection";
import { getCategoryById } from "../../../../db/queries/categories";
// モック関数のインポート
import {
	getTransactionById,
	updateTransaction,
} from "../../../../db/queries/transactions";

const mockGetTransactionById = vi.mocked(getTransactionById);
const mockUpdateTransaction = vi.mocked(updateTransaction);
const mockGetCategoryById = vi.mocked(getCategoryById);
const mockCreateDb = vi.mocked(createDb);

/**
 * PUT /api/transactions/:id エンドポイントの単体テスト
 *
 * テスト対象:
 * - 取引更新機能（完全更新・部分更新）
 * - パラメータのバリデーション
 * - 存在チェック（404エラー）
 * - リクエストボディのバリデーション
 * - カテゴリ存在チェックと整合性チェック
 * - エラーハンドリング（不正データ、データベースエラー）
 */
describe("PUT /api/transactions/:id", () => {
	const mockDb = createMockDatabase();
	const mockContext = createMockContext(mockDb);

	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateDb.mockReturnValue(mockDb);
	});

	describe("成功ケース", () => {
		it("有効なデータで取引を更新できる", async () => {
			const updateData = {
				amount: 2000,
				description: "更新されたランチ代",
			};

			// モックの設定
			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory); // 存在チェック用
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				amount: 2000,
				description: "更新されたランチ代",
			}); // 更新後の取得用

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			// レスポンスの検証
			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.amount).toBe(2000);
			expect(json.data.description).toBe("更新されたランチ代");
			expect(json.message).toBe("取引が正常に更新されました");

			// データベース関数の呼び出し検証
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 1);
			expect(mockUpdateTransaction).toHaveBeenCalledWith(mockDb, 1, updateData);
		});

		it("単一フィールドのみの部分更新ができる", async () => {
			const updateData = { amount: 1800 };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				amount: 1800,
			});

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.amount).toBe(1800);
			expect(mockUpdateTransaction).toHaveBeenCalledWith(mockDb, 1, updateData);
		});

		it("カテゴリIDを変更できる", async () => {
			const newCategory = {
				...mockCategory,
				id: 2,
				name: "交通費",
			};
			const updateData = { categoryId: 2 };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockGetCategoryById.mockResolvedValue(newCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				category: {
					...mockTransactionWithCategory.category!,
					id: 2,
					name: "交通費",
				},
			} as any);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.categoryId).toBe(2);
			expect(mockGetCategoryById).toHaveBeenCalledWith(mockDb, 2);
		});

		it("カテゴリIDをnullに設定できる", async () => {
			const updateData = { categoryId: null };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				category: null,
			} as any);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.categoryId).toBe(null);
			expect(json.data.category).toBe(null);
		});

		it("取引タイプを変更できる", async () => {
			const updateData = { type: "income" };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				type: "income",
			});

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.type).toBe("income");
		});

		it("タグを更新できる", async () => {
			const updateData = { tags: ["外食", "会社", "昼食"] };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				tags: '["外食", "会社", "昼食"]',
			});

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockUpdateTransaction).toHaveBeenCalledWith(mockDb, 1, updateData);
		});

		it("複数フィールドを同時に更新できる", async () => {
			const updateData = {
				amount: 2500,
				description: "新しい説明",
				paymentMethod: "現金",
				transactionDate: "2024-01-02",
			};

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				...updateData,
			});

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.amount).toBe(2500);
			expect(json.data.description).toBe("新しい説明");
			expect(json.data.paymentMethod).toBe("現金");
			expect(json.data.transactionDate).toBe("2024-01-02");
		});
	});

	describe("HTTPメソッドの検証", () => {
		it("PUT以外のメソッドで405エラーが返される", async () => {
			const request = new Request("http://localhost/api/transactions/1", {
				method: "GET",
			});
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(405);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("PUT メソッドのみサポートしています");
		});
	});

	describe("パラメータバリデーションエラーケース", () => {
		it("非数値IDで400エラーが返される", async () => {
			const updateData = { amount: 2000 };

			const request = createMockPutRequest(
				"http://localhost/api/transactions/invalid",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "invalid" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});

		it("負の数値IDで400エラーが返される", async () => {
			const updateData = { amount: 2000 };

			const request = createMockPutRequest(
				"http://localhost/api/transactions/-1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "-1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});
	});

	describe("404エラーケース", () => {
		it("存在しない取引IDで404エラーが返される", async () => {
			const updateData = { amount: 2000 };

			// 存在しない取引をシミュレート
			mockGetTransactionById.mockResolvedValue(null as any);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/999",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "999" },
			});

			expect(response.status).toBe(404);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("指定された取引が見つかりません");
		});
	});

	describe("リクエストボディのバリデーションエラーケース", () => {
		it("無効なamountでバリデーションエラーが返される", async () => {
			const updateData = { amount: -100 };

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なリクエストボディです");
		});

		it("無効なtypeでバリデーションエラーが返される", async () => {
			const updateData = { type: "invalid-type" };

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なリクエストボディです");
		});

		it("無効な日付形式でバリデーションエラーが返される", async () => {
			const updateData = { transactionDate: "2024/01/01" };

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なリクエストボディです");
		});

		it("更新フィールドが指定されていない場合にエラーが返される", async () => {
			const updateData = {};

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("更新するフィールドが指定されていません");
		});
	});

	describe("カテゴリ関連のエラーケース", () => {
		it("存在しないカテゴリIDで400エラーが返される", async () => {
			const updateData = { categoryId: 999 };

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockGetCategoryById.mockResolvedValue(null as any); // 存在しないカテゴリ

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("指定されたカテゴリが見つかりません");
		});

		it("カテゴリタイプと取引タイプが不一致で400エラーが返される", async () => {
			const incomeCategory = {
				...mockCategory,
				id: 2,
				name: "給与",
				type: "income" as const,
			};
			const updateData = { categoryId: 2 }; // 既存取引は expense タイプ

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockGetCategoryById.mockResolvedValue(incomeCategory);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toContain(
				"支出取引には支出カテゴリを指定してください",
			);
		});

		it("取引タイプとカテゴリを同時に変更する際の整合性チェック", async () => {
			const incomeCategory = {
				...mockCategory,
				id: 2,
				name: "給与",
				type: "income" as const,
			};
			const updateData = {
				type: "income",
				categoryId: 2,
			};

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockGetCategoryById.mockResolvedValue(incomeCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				type: "income",
			} as any);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			expect(json.data.type).toBe("income");
			expect(json.data.categoryId).toBe(2);
		});
	});

	describe("データベースエラーハンドリング", () => {
		it("updateTransaction関数でエラーが発生した場合に500エラーが返される", async () => {
			const updateData = { amount: 2000 };

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockUpdateTransaction.mockRejectedValue(
				new Error("データベース更新エラー"),
			);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の更新中にエラーが発生しました");
			expect(json.details).toBe("データベース更新エラー");
		});

		it("更新後の取得でエラーが発生した場合に500エラーが返される", async () => {
			const updateData = { amount: 2000 };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockRejectedValueOnce(
				new Error("更新後取得エラー"),
			);

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の更新中にエラーが発生しました");
		});

		it("予期しないエラー時に500エラーが返される", async () => {
			const updateData = { amount: 2000 };

			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockUpdateTransaction.mockRejectedValue("予期しないエラー");

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の更新中にエラーが発生しました");
			expect(json.details).toBe("不明なエラー");
		});
	});

	describe("境界値テスト", () => {
		it("最小有効金額（1円）で更新できる", async () => {
			const updateData = { amount: 1 };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				amount: 1,
			});

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			expect(json.data.amount).toBe(1);
		});

		it("大きな金額で更新できる", async () => {
			const largeAmount = 1000000;
			const updateData = { amount: largeAmount };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				amount: largeAmount,
			});

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			expect(json.data.amount).toBe(largeAmount);
		});

		it("空のタグ配列で更新できる", async () => {
			const updateData = { tags: [] };

			mockGetTransactionById.mockResolvedValueOnce(mockTransactionWithCategory);
			mockUpdateTransaction.mockResolvedValue(mockTransaction);
			mockGetTransactionById.mockResolvedValueOnce({
				...mockTransactionWithCategory,
				tags: "[]",
			});

			const request = createMockPutRequest(
				"http://localhost/api/transactions/1",
				updateData,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(mockUpdateTransaction).toHaveBeenCalledWith(mockDb, 1, updateData);
		});
	});
});
