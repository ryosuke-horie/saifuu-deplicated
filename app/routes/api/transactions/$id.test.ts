/**
 * GET /api/transactions/:id エンドポイントのテスト
 *
 * 機能:
 * - 個別取引詳細取得のローダー関数テスト
 * - パラメータバリデーションのテスト
 * - 存在チェックのテスト
 * - タグJSON解析処理のテスト
 * - エラーハンドリングのテスト
 *
 * React Router v7のローダー・アクション機能のテストに基づいて実装
 * Issue #37の例に基づいたMockLoaderArgs/ActionArgsとCloudflareモックを活用
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { loader } from "./$id";
import {
	createMockLoaderArgs,
	setupMockCloudflareEnvironment,
} from "../../../../tests/mocks/cloudflare";
import { resetMockDataStore } from "../../../../__mocks__/db";
import type { SelectTransaction, SelectCategory } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/transactions", () => ({
	getTransactionById: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockGetTransactionById = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.getTransactionById,
	),
);

describe("GET /api/transactions/:id", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("有効なIDで取引詳細を取得できること", async () => {
			// テストデータの準備
			const mockTransaction = {
				id: 1,
				amount: 1000,
				type: "expense" as const,
				categoryId: 1,
				description: "テスト取引",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: JSON.stringify(["テスト", "API"]),
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
				category: {
					id: 1,
					name: "食費",
					type: "expense" as const,
					color: "#FF0000",
					icon: "food",
					displayOrder: 1,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			};

			mockGetTransactionById.mockResolvedValue(mockTransaction);

			// テスト実行
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
			);
			const response = await loader(args);

			// レスポンス検証
			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toEqual({
				success: true,
				data: {
					...mockTransaction,
					tags: ["テスト", "API"], // JSON文字列から配列に解析される
				},
			});

			// モック関数の呼出し検証
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 1);
		});

		it("tagsがnullの取引を正常に取得できること", async () => {
			const mockTransaction = {
				id: 2,
				amount: 2000,
				type: "income" as const,
				categoryId: null,
				description: "給与",
				transactionDate: "2024-01-01",
				paymentMethod: "銀行振込",
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(mockTransaction);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/2",
				{ id: "2" },
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.data.tags).toBe(null);
		});

		it("空の配列のtagsを正常に処理できること", async () => {
			const mockTransaction = {
				id: 3,
				amount: 1500,
				type: "expense" as const,
				categoryId: 1,
				description: "空のタグ",
				transactionDate: "2024-01-01",
				paymentMethod: "クレジットカード",
				tags: JSON.stringify([]),
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(mockTransaction);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/3",
				{ id: "3" },
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.data.tags).toEqual([]);
		});

		it("無効なJSONのtagsを適切に処理できること", async () => {
			const mockTransaction = {
				id: 4,
				amount: 800,
				type: "expense" as const,
				categoryId: 1,
				description: "無効なJSONタグ",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: "invalid json", // 無効なJSON
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(mockTransaction);

			// console.warnをモック
			const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/4",
				{ id: "4" },
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.data.tags).toBe(null); // JSON解析に失敗した場合はnull

			// 警告ログが出力されることを確認
			expect(consoleSpy).toHaveBeenCalledWith(
				expect.stringContaining("取引ID 4 のタグJSON解析に失敗"),
				expect.any(SyntaxError),
			);

			consoleSpy.mockRestore();
		});
	});

	describe("存在チェックテスト", () => {
		it("存在しない取引IDで404エラーを返すこと", async () => {
			mockGetTransactionById.mockResolvedValue(null);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/999",
				{ id: "999" },
			);
			const response = await loader(args);

			expect(response.status).toBe(404);

			const responseData = await response.json();
			expect(responseData).toEqual({
				error: "指定された取引が見つかりません",
				transactionId: 999,
			});

			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 999);
		});
	});

	describe("パラメータバリデーションテスト", () => {
		it("無効なIDフォーマットで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/invalid",
				{ id: "invalid" },
			);
			const response = await loader(args);

			expect(response.status).toBe(400);

			const responseData = await response.json();
			expect(responseData.error).toBe("無効なパラメータです");
			expect(responseData.details).toBeDefined();

			// データベースクエリは実行されないこと
			expect(mockGetTransactionById).not.toHaveBeenCalled();
		});

		it("負の数のIDで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/-1",
				{ id: "-1" },
			);
			const response = await loader(args);

			expect(response.status).toBe(400);

			const responseData = await response.json();
			expect(responseData.error).toBe("無効なパラメータです");
		});

		it("0のIDで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/0",
				{ id: "0" },
			);
			const response = await loader(args);

			expect(response.status).toBe(400);

			const responseData = await response.json();
			expect(responseData.error).toBe("無効なパラメータです");
		});

		it("小数のIDで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/1.5",
				{ id: "1.5" },
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
		});
	});

	describe("エラーハンドリングテスト", () => {
		it("データベースエラー時に500エラーを返すこと", async () => {
			mockGetTransactionById.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
			);
			const response = await loader(args);

			expect(response.status).toBe(500);

			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引詳細の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラー時に500エラーを返すこと", async () => {
			mockGetTransactionById.mockRejectedValue("Unexpected error");

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
			);
			const response = await loader(args);

			expect(response.status).toBe(500);

			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引詳細の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});
	});

	describe("境界値テスト", () => {
		it("大きなIDでも正常に処理できること", async () => {
			const largeId = 2147483647; // 32bit intの最大値
			const mockTransaction = {
				id: largeId,
				amount: 100,
				type: "expense" as const,
				categoryId: null,
				description: "大きなID",
				transactionDate: "2024-01-01",
				paymentMethod: null,
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(mockTransaction);

			const args = createMockLoaderArgs(
				`http://localhost:3000/api/transactions/${largeId}`,
				{ id: largeId.toString() },
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.data.id).toBe(largeId);

			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, largeId);
		});

		it("1桁のIDでも正常に処理できること", async () => {
			const mockTransaction = {
				id: 1,
				amount: 100,
				type: "expense" as const,
				categoryId: null,
				description: "1桁ID",
				transactionDate: "2024-01-01",
				paymentMethod: null,
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetTransactionById.mockResolvedValue(mockTransaction);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
			);
			const response = await loader(args);

			expect(response.status).toBe(200);
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 1);
		});
	});

	describe("レスポンス形式テスト", () => {
		it("正常なレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const mockTransaction = {
				id: 1,
				amount: 1000,
				type: "expense" as const,
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

			mockGetTransactionById.mockResolvedValue(mockTransaction);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
			);
			const response = await loader(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("エラーレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			mockGetTransactionById.mockResolvedValue(null);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/transactions/999",
				{ id: "999" },
			);
			const response = await loader(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});
	});
});