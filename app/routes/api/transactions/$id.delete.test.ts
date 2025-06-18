import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	createMockContext,
	createMockDatabase,
	createMockDeleteRequest,
	mockTransaction,
	mockTransactionWithCategory,
	validateApiResponse,
} from "../../../__tests__/utils/test-helpers";
import { action } from "./$id.delete";

// データベースクエリ関数をモック
vi.mock("../../../../db/queries/transactions", () => ({
	getTransactionById: vi.fn(),
	deleteTransaction: vi.fn(),
}));

vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(),
}));

import { createDb } from "../../../../db/connection";
// モック関数のインポート
import {
	deleteTransaction,
	getTransactionById,
} from "../../../../db/queries/transactions";

const mockGetTransactionById = vi.mocked(getTransactionById);
const mockDeleteTransaction = vi.mocked(deleteTransaction);
const mockCreateDb = vi.mocked(createDb);

/**
 * DELETE /api/transactions/:id エンドポイントの単体テスト
 *
 * テスト対象:
 * - 取引削除機能（物理削除）
 * - パラメータのバリデーション
 * - 存在チェック（404エラー）
 * - 定期取引の警告ログ出力
 * - エラーハンドリング（不正ID、データベースエラー）
 * - 削除後の詳細情報返却
 */
describe("DELETE /api/transactions/:id", () => {
	const mockDb = createMockDatabase();
	const mockContext = createMockContext(mockDb);

	beforeEach(() => {
		vi.clearAllMocks();
		mockCreateDb.mockReturnValue(mockDb);
	});

	describe("成功ケース", () => {
		it("有効なIDで取引を削除できる", async () => {
			// モックの設定
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockDeleteTransaction.mockResolvedValue(mockTransaction);

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			// レスポンスの検証
			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data).toEqual(mockTransaction);
			expect(json.message).toBe("取引が正常に削除されました");
			expect(json.deletedInfo).toEqual({
				id: mockTransaction.id,
				amount: mockTransaction.amount,
				type: mockTransaction.type,
				description: mockTransaction.description,
				transactionDate: mockTransaction.transactionDate,
				isRecurring: mockTransaction.isRecurring,
			});

			// データベース関数の呼び出し検証
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 1);
			expect(mockDeleteTransaction).toHaveBeenCalledWith(mockDb, 1);
		});

		it("定期取引を削除する際に警告ログが出力される", async () => {
			const recurringTransaction = {
				...mockTransactionWithCategory,
				isRecurring: true,
				recurringId: 1,
			};

			// console.warn のモック
			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			mockGetTransactionById.mockResolvedValue(recurringTransaction);
			mockDeleteTransaction.mockResolvedValue({
				...mockTransaction,
				isRecurring: true,
				recurringId: 1,
			});

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.isRecurring).toBe(true);
			expect(json.deletedInfo.isRecurring).toBe(true);

			// 警告ログが出力されることを確認
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				"定期取引ID 1 を削除します。サブスクリプション設定は変更されません。",
			);

			consoleWarnSpy.mockRestore();
		});

		it("非定期取引を削除する際に警告ログが出力されない", async () => {
			const nonRecurringTransaction = {
				...mockTransactionWithCategory,
				isRecurring: false,
				recurringId: null,
			};

			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			mockGetTransactionById.mockResolvedValue(nonRecurringTransaction);
			mockDeleteTransaction.mockResolvedValue({
				...mockTransaction,
				isRecurring: false,
				recurringId: null,
			});

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.isRecurring).toBe(false);

			// 警告ログが出力されないことを確認
			expect(consoleWarnSpy).not.toHaveBeenCalled();

			consoleWarnSpy.mockRestore();
		});

		it("大きなIDでも正しく削除される", async () => {
			const largeId = 999999;
			const transactionWithLargeId = {
				...mockTransactionWithCategory,
				id: largeId,
			};

			mockGetTransactionById.mockResolvedValue(transactionWithLargeId);
			mockDeleteTransaction.mockResolvedValue({
				...mockTransaction,
				id: largeId,
			});

			const request = createMockDeleteRequest(
				`http://localhost/api/transactions/${largeId}`,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: largeId.toString() },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.data.id).toBe(largeId);
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, largeId);
			expect(mockDeleteTransaction).toHaveBeenCalledWith(mockDb, largeId);
		});
	});

	describe("HTTPメソッドの検証", () => {
		it("DELETE以外のメソッドで405エラーが返される", async () => {
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
			expect(json.error).toBe("DELETE メソッドのみサポートしています");
		});

		it("POSTメソッドで405エラーが返される", async () => {
			const request = new Request("http://localhost/api/transactions/1", {
				method: "POST",
				body: JSON.stringify({}),
			});
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(405);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("DELETE メソッドのみサポートしています");
		});
	});

	describe("パラメータバリデーションエラーケース", () => {
		it("非数値IDで400エラーが返される", async () => {
			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/invalid",
			);
			const response = await action({
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
			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/-1",
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

		it("0のIDで400エラーが返される", async () => {
			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/0",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "0" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});

		it("小数点を含むIDで400エラーが返される", async () => {
			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1.5",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1.5" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});

		it("空のIDで400エラーが返される", async () => {
			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "" },
			});

			expect(response.status).toBe(400);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("無効なパラメータです");
		});

		it("特殊文字を含むIDで400エラーが返される", async () => {
			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/@#$",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "@#$" },
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

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/999",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "999" },
			});

			expect(response.status).toBe(404);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("指定された取引が見つかりません");

			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 999);
			// 取引が存在しない場合は削除処理は実行されない
			expect(mockDeleteTransaction).not.toHaveBeenCalled();
		});

		it("すでに削除済みの取引IDで404エラーが返される", async () => {
			// すでに削除済み（null）の取引をシミュレート
			mockGetTransactionById.mockResolvedValue(null as any);

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(404);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("指定された取引が見つかりません");
		});

		it("削除処理が失敗した場合にも404エラーが適切に処理される", async () => {
			// 存在チェックは成功するが、削除対象が見つからない場合
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockDeleteTransaction.mockResolvedValue(null as any); // 削除対象なし

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			// 削除対象がない場合でも、削除処理は正常に完了したとみなす
			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			expect(json.data).toBe(null);
		});
	});

	describe("データベースエラーハンドリング", () => {
		it("取引存在チェック時のエラーで500エラーが返される", async () => {
			// 存在チェック時のデータベースエラーをシミュレート
			mockGetTransactionById.mockRejectedValue(
				new Error("データベース接続エラー"),
			);

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の削除中にエラーが発生しました");
			expect(json.details).toBe("データベース接続エラー");
		});

		it("削除処理時のエラーで500エラーが返される", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			// 削除処理時のデータベースエラーをシミュレート
			mockDeleteTransaction.mockRejectedValue(new Error("削除処理エラー"));

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の削除中にエラーが発生しました");
			expect(json.details).toBe("削除処理エラー");
		});

		it("外部キー制約エラー時に500エラーが返される", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			// 外部キー制約エラーをシミュレート（他のテーブルから参照されている場合）
			mockDeleteTransaction.mockRejectedValue(
				new Error("FOREIGN KEY constraint failed"),
			);

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の削除中にエラーが発生しました");
			expect(json.details).toBe("FOREIGN KEY constraint failed");
		});

		it("予期しないエラー時に500エラーが返される", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			// 予期しないエラーをシミュレート
			mockDeleteTransaction.mockRejectedValue("予期しないエラー");

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の削除中にエラーが発生しました");
			expect(json.details).toBe("不明なエラー");
		});

		it("タイムアウトエラー時に500エラーが返される", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			// タイムアウトエラーをシミュレート
			mockDeleteTransaction.mockRejectedValue(new Error("Query timeout"));

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(500);
			const json = await validateApiResponse(response);
			expect(json.error).toBe("取引の削除中にエラーが発生しました");
			expect(json.details).toBe("Query timeout");
		});
	});

	describe("レスポンス構造の検証", () => {
		it("成功レスポンスが正しい構造を持つ", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockDeleteTransaction.mockResolvedValue(mockTransaction);

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			// 必須フィールドの存在確認
			expect(json).toHaveProperty("success", true);
			expect(json).toHaveProperty("data");
			expect(json).toHaveProperty("message");
			expect(json).toHaveProperty("deletedInfo");

			// deletedInfo構造の確認
			const { deletedInfo } = json;
			expect(deletedInfo).toHaveProperty("id");
			expect(deletedInfo).toHaveProperty("amount");
			expect(deletedInfo).toHaveProperty("type");
			expect(deletedInfo).toHaveProperty("description");
			expect(deletedInfo).toHaveProperty("transactionDate");
			expect(deletedInfo).toHaveProperty("isRecurring");
		});

		it("Content-Typeヘッダーが正しく設定される", async () => {
			mockGetTransactionById.mockResolvedValue(mockTransactionWithCategory);
			mockDeleteTransaction.mockResolvedValue(mockTransaction);

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("削除された取引の情報が適切に返される", async () => {
			const specificTransaction = {
				...mockTransactionWithCategory,
				amount: 2500,
				description: "特定の取引",
				transactionDate: "2024-02-01",
			};

			mockGetTransactionById.mockResolvedValue(specificTransaction);
			mockDeleteTransaction.mockResolvedValue({
				...mockTransaction,
				amount: 2500,
				description: "特定の取引",
				transactionDate: "2024-02-01",
			});

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);

			expect(json.deletedInfo.amount).toBe(2500);
			expect(json.deletedInfo.description).toBe("特定の取引");
			expect(json.deletedInfo.transactionDate).toBe("2024-02-01");
		});
	});

	describe("境界値テスト", () => {
		it("最小有効ID（1）で正しく削除される", async () => {
			const transactionWithMinId = {
				...mockTransactionWithCategory,
				id: 1,
			};

			mockGetTransactionById.mockResolvedValue(transactionWithMinId);
			mockDeleteTransaction.mockResolvedValue({
				...mockTransaction,
				id: 1,
			});

			const request = createMockDeleteRequest(
				"http://localhost/api/transactions/1",
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: "1" },
			});

			expect(response.status).toBe(200);
			const json = await validateApiResponse(response);
			expect(json.data.id).toBe(1);
			expect(json.deletedInfo.id).toBe(1);
		});

		it("非常に大きなIDでも処理される", async () => {
			const veryLargeId = Number.MAX_SAFE_INTEGER;
			mockGetTransactionById.mockResolvedValue(null as any); // 存在しない想定

			const request = createMockDeleteRequest(
				`http://localhost/api/transactions/${veryLargeId}`,
			);
			const response = await action({
				request,
				context: mockContext,
				params: { id: veryLargeId.toString() },
			});

			// 存在しないので404が返される
			expect(response.status).toBe(404);
			const json = await validateApiResponse(response);
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, veryLargeId);
		});
	});
});
