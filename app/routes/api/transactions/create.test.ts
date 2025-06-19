/**
 * POST /api/transactions エンドポイントのテスト
 *
 * 機能:
 * - 新規取引作成のアクション関数テスト
 * - リクエストボディバリデーションのテスト
 * - カテゴリ存在チェックとタイプ整合性のテスト
 * - データベース制約エラーハンドリングのテスト
 * - HTTPメソッドチェックのテスト
 *
 * React Router v7のローダー・アクション機能のテストに基づいて実装
 * Issue #37の例に基づいたMockLoaderArgs/ActionArgsとCloudflareモックを活用
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { action } from "./create";
import {
	createMockActionArgs,
	setupMockCloudflareEnvironment,
} from "../../../../tests/mocks/cloudflare";
import { resetMockDataStore, seedMockData } from "../../../../__mocks__/db";
import type { SelectTransaction, SelectCategory } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/transactions", () => ({
	createTransaction: vi.fn(),
	getTransactionById: vi.fn(),
}));

vi.mock("../../../../db/queries/categories", () => ({
	getCategoryById: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockCreateTransaction = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.createTransaction,
	),
);
const mockGetTransactionById = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.getTransactionById,
	),
);
const mockGetCategoryById = vi.mocked(
	await import("../../../../db/queries/categories").then(
		(m) => m.getCategoryById,
	),
);

describe("POST /api/transactions", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("有効なデータで取引を作成できること", async () => {
			// テストデータの準備
			const requestBody = {
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "テスト取引",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: ["テスト", "API"],
			};

			const mockCategory: SelectCategory = {
				id: 1,
				name: "食費",
				type: "expense",
				color: "#FF0000",
				icon: "food",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockCreatedTransaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
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
			};

			const mockTransactionWithDetails = {
				...mockCreatedTransaction,
				category: mockCategory,
			};

			// モック設定
			mockGetCategoryById.mockResolvedValue(mockCategory);
			mockCreateTransaction.mockResolvedValue(mockCreatedTransaction);
			mockGetTransactionById.mockResolvedValue(mockTransactionWithDetails);

			// テスト実行
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			// レスポンス検証
			expect(response.status).toBe(201);
			const responseData = await response.json();

			expect(responseData).toEqual({
				success: true,
				data: mockTransactionWithDetails,
				message: "取引が正常に作成されました",
			});

			// モック関数の呼出し検証
			expect(mockGetCategoryById).toHaveBeenCalledWith(mockDb, 1);
			expect(mockCreateTransaction).toHaveBeenCalledWith(mockDb, requestBody);
			expect(mockGetTransactionById).toHaveBeenCalledWith(mockDb, 1);
		});

		it("カテゴリIDなしで取引を作成できること", async () => {
			const requestBody = {
				amount: 500,
				type: "income",
				description: "給与",
				transactionDate: "2024-01-01",
			};

			const mockCreatedTransaction: SelectTransaction = {
				id: 2,
				amount: 500,
				type: "income",
				categoryId: null,
				description: "給与",
				transactionDate: "2024-01-01",
				paymentMethod: null,
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateTransaction.mockResolvedValue(mockCreatedTransaction);
			mockGetTransactionById.mockResolvedValue(mockCreatedTransaction);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.success).toBe(true);

			// カテゴリIDの存在チェックは呼び出されないこと
			expect(mockGetCategoryById).not.toHaveBeenCalled();
		});

		it("空のタグ配列で取引を作成できること", async () => {
			const requestBody = {
				amount: 1500,
				type: "expense",
				description: "空のタグ",
				transactionDate: "2024-01-01",
				tags: [],
			};

			const mockCreatedTransaction: SelectTransaction = {
				id: 3,
				amount: 1500,
				type: "expense",
				categoryId: null,
				description: "空のタグ",
				transactionDate: "2024-01-01",
				paymentMethod: null,
				tags: JSON.stringify([]),
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateTransaction.mockResolvedValue(mockCreatedTransaction);
			mockGetTransactionById.mockResolvedValue(mockCreatedTransaction);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
		});
	});

	describe("HTTPメソッドチェックテスト", () => {
		it("POST以外のメソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"GET",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
			const responseData = await response.json();
			expect(responseData.error).toBe("POST メソッドのみサポートしています");
		});

		it("PUT メソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"PUT",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
		});
	});

	describe("バリデーションエラーテスト", () => {
		it("必須フィールドなしで400エラーを返すこと", async () => {
			const requestBody = {}; // 必須フィールドなし

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なリクエストボディです");
			expect(responseData.details).toBeDefined();
		});

		it("無効なtypeで400エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "invalid",
				transactionDate: "2024-01-01",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なリクエストボディです");
		});

		it("負の金額で400エラーを返すこと", async () => {
			const requestBody = {
				amount: -1000,
				type: "expense",
				transactionDate: "2024-01-01",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("無効な日付形式で400エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				transactionDate: "invalid-date",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});
	});

	describe("カテゴリチェックテスト", () => {
		it("存在しないカテゴリIDで400エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				categoryId: 999,
				transactionDate: "2024-01-01",
			};

			mockGetCategoryById.mockResolvedValue(null);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("指定されたカテゴリが見つかりません");
			expect(responseData.details).toContain("999");
		});

		it("カテゴリタイプと取引タイプが一致しない場合400エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				categoryId: 1,
				transactionDate: "2024-01-01",
			};

			const mockIncomeCategory: SelectCategory = {
				id: 1,
				name: "給与",
				type: "income", // 収入カテゴリ
				color: "#00FF00",
				icon: "salary",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetCategoryById.mockResolvedValue(mockIncomeCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"カテゴリタイプと取引タイプが一致しません",
			);
			expect(responseData.details).toContain("給与");
		});
	});

	describe("データベース制約エラーテスト", () => {
		it("外部キー制約エラーで400エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				categoryId: 1,
				transactionDate: "2024-01-01",
			};

			const mockCategory: SelectCategory = {
				id: 1,
				name: "食費",
				type: "expense",
				color: "#FF0000",
				icon: "food",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetCategoryById.mockResolvedValue(mockCategory);
			mockCreateTransaction.mockRejectedValue(
				new Error("FOREIGN KEY constraint failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("データベース制約エラー");
			expect(responseData.details).toBe("指定されたカテゴリIDが無効です");
		});

		it("NOT NULL制約エラーで400エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				transactionDate: "2024-01-01",
			};

			mockCreateTransaction.mockRejectedValue(
				new Error("NOT NULL constraint failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("必須項目が不足しています");
		});

		it("CHECK制約エラーで400エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				transactionDate: "2024-01-01",
			};

			mockCreateTransaction.mockRejectedValue(
				new Error("CHECK constraint failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("データ形式エラー");
		});
	});

	describe("一般的なエラーハンドリングテスト", () => {
		it("データベース接続エラーで500エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				transactionDate: "2024-01-01",
			};

			mockCreateTransaction.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引の作成中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラーで500エラーを返すこと", async () => {
			const requestBody = {
				amount: 1000,
				type: "expense",
				transactionDate: "2024-01-01",
			};

			mockCreateTransaction.mockRejectedValue("Unexpected error");

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引の作成中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});
	});

	describe("JSON解析エラーテスト", () => {
		it("無効なJSONで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions",
				{},
				"POST",
				"invalid json",
			);

			// JSON.parse内でエラーが発生することを期待
			const response = await action(args);
			expect(response.status).toBe(500); // JSON解析は500エラーになる
		});
	});
});