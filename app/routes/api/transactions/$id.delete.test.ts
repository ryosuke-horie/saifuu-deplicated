/**
 * DELETE /api/transactions/:id エンドポイントのテスト
 *
 * 機能:
 * - 取引削除のアクション関数テスト
 * - パラメータバリデーションのテスト
 * - 存在チェックのテスト
 * - HTTPメソッドチェックのテスト
 * - 定期取引の警告ログのテスト
 * - エラーハンドリングのテスト
 *
 * React Router v7のローダー・アクション機能のテストに基づいて実装
 * Issue #37の例に基づいたMockLoaderArgs/ActionArgsとCloudflareモックを活用
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { action } from "./$id.delete";
import {
	createMockActionArgs,
	setupMockCloudflareEnvironment,
} from "../../../../tests/mocks/cloudflare";
import { resetMockDataStore } from "../../../../__mocks__/db";
import type { SelectTransaction } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/transactions", () => ({
	getTransactionById: vi.fn(),
	deleteTransaction: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockGetTransactionById = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.getTransactionById,
	),
);
const mockDeleteTransaction = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.deleteTransaction,
	),
);

describe("DELETE /api/transactions/:id", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("通常の取引を正常に削除できること", async () => {
			// テストデータの準備
			const existingTransaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "削除対象取引",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: JSON.stringify(["削除"]),
				receiptUrl: null,
				isRecurring: false, // 通常の取引
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			// モック設定
			mockGetTransactionById.mockResolvedValue(existingTransaction);
			mockDeleteTransaction.mockResolvedValue(existingTransaction);

			// テスト実行
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"DELETE",
			);
			const response = await action(args);

			// レスポンス検証
			expect(response.status).toBe(200);
			const responseData = await response.json();

			expect(responseData).toEqual({
				success: true,
				data: existingTransaction,
				message: "取引が正常に削除されました",
				deletedInfo: {
					id: 1,
					amount: 1000,
					type: "expense",
					description: "削除対象取引",
					transactionDate: "2024-01-01",
					isRecurring: false,
				},
			});

			// モック関数の呼出し検証
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 1);
			expect(mockDeleteTransaction).toHaveBeenCalledWith(mockDb, 1);
		});

		it("定期取引を削除する際に警告ログが出力されること", async () => {
			const recurringTransaction: SelectTransaction = {
				id: 2,
				amount: 5000,
				type: "expense",
				categoryId: 1,
				description: "サブスク料金",
				transactionDate: "2024-01-01",
				paymentMethod: "クレジットカード",
				tags: null,
				receiptUrl: null,
				isRecurring: true, // 定期取引
				recurringId: 123,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(recurringTransaction);
			mockDeleteTransaction.mockResolvedValue(recurringTransaction);

			// console.warnをモック
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/2",
				{ id: "2" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.deletedInfo.isRecurring).toBe(true);

			// 警告ログが出力されることを確認
			expect(consoleSpy).toHaveBeenCalledWith(
				"定期取引ID 2 を削除します。サブスクリプション設定は変更されません。",
			);

			consoleSpy.mockRestore();
		});

		it("レシートURLありの取引を削除できること", async () => {
			const transactionWithReceipt: SelectTransaction = {
				id: 3,
				amount: 2500,
				type: "expense",
				categoryId: 1,
				description: "レシートあり取引",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: null,
				receiptUrl: "https://example.com/receipt.jpg",
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(transactionWithReceipt);
			mockDeleteTransaction.mockResolvedValue(transactionWithReceipt);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/3",
				{ id: "3" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.data.receiptUrl).toBe(
				"https://example.com/receipt.jpg",
			);
		});
	});

	describe("HTTPメソッドチェックテスト", () => {
		it("DELETE以外のメソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"GET",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
			const responseData = await response.json();
			expect(responseData.error).toBe("DELETE メソッドのみサポートしています");
		});

		it("POST メソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"POST",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
		});

		it("PUT メソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
		});
	});

	describe("パラメータバリデーションテスト", () => {
		it("無効なIDフォーマットで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/invalid",
				{ id: "invalid" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なパラメータです");
			expect(responseData.details).toBeDefined();

			// データベースクエリは実行されないこと
			expect(mockGetTransactionById).not.toHaveBeenCalled();
		});

		it("負の数のIDで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/-1",
				{ id: "-1" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なパラメータです");
		});

		it("0のIDで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/0",
				{ id: "0" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("小数のIDで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1.5",
				{ id: "1.5" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("NaNになるIDで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/abc123",
				{ id: "abc123" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});
	});

	describe("存在チェックテスト", () => {
		it("存在しない取引IDで404エラーを返すこと", async () => {
			mockGetTransactionById.mockResolvedValue(null);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/999",
				{ id: "999" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(404);
			const responseData = await response.json();
			expect(responseData.error).toBe("指定された取引が見つかりません");

			// 削除処理は実行されないこと
			expect(mockDeleteTransaction).not.toHaveBeenCalled();
		});
	});

	describe("エラーハンドリングテスト", () => {
		it("存在チェックでデータベースエラー時に500エラーを返すこと", async () => {
			mockGetTransactionById.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引の削除中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("削除処理でデータベースエラー時に500エラーを返すこと", async () => {
			const existingTransaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "削除エラーテスト",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(existingTransaction);
			mockDeleteTransaction.mockRejectedValue(
				new Error("Failed to delete transaction"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引の削除中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Failed to delete transaction");
		});

		it("予期しないエラー時に500エラーを返すこと", async () => {
			mockGetTransactionById.mockRejectedValue("Unexpected error");

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引の削除中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});
	});

	describe("境界値テスト", () => {
		it("大きなIDでも正常に削除できること", async () => {
			const largeId = 2147483647; // 32bit intの最大値
			const largeIdTransaction: SelectTransaction = {
				id: largeId,
				amount: 100,
				type: "expense",
				categoryId: null,
				description: "大きなID削除テスト",
				transactionDate: "2024-01-01",
				paymentMethod: null,
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(largeIdTransaction);
			mockDeleteTransaction.mockResolvedValue(largeIdTransaction);

			const args = createMockActionArgs(
				`http://localhost:3000/api/transactions/${largeId}`,
				{ id: largeId.toString() },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.deletedInfo.id).toBe(largeId);

			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, largeId);
			expect(mockDeleteTransaction).toHaveBeenCalledWith(mockDb, largeId);
		});

		it("1桁のIDでも正常に削除できること", async () => {
			const singleDigitTransaction: SelectTransaction = {
				id: 5,
				amount: 500,
				type: "income",
				categoryId: null,
				description: "1桁ID削除テスト",
				transactionDate: "2024-01-01",
				paymentMethod: null,
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(singleDigitTransaction);
			mockDeleteTransaction.mockResolvedValue(singleDigitTransaction);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/5",
				{ id: "5" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(200);
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 5);
			expect(mockDeleteTransaction).toHaveBeenCalledWith(mockDb, 5);
		});
	});

	describe("レスポンス形式テスト", () => {
		it("正常なレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const transaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
				categoryId: null,
				description: "ヘッダーテスト",
				transactionDate: "2024-01-01",
				paymentMethod: null,
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(transaction);
			mockDeleteTransaction.mockResolvedValue(transaction);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("エラーレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			mockGetTransactionById.mockResolvedValue(null);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/999",
				{ id: "999" },
				"DELETE",
			);
			const response = await action(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});
	});
});