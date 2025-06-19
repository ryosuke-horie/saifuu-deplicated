/**
 * PUT /api/transactions/:id エンドポイントのテスト
 *
 * 機能:
 * - 取引更新のアクション関数テスト
 * - 部分更新機能のテスト
 * - パラメータとリクエストボディのバリデーションテスト
 * - 存在チェックとカテゴリ整合性チェックのテスト
 * - HTTPメソッドチェックのテスト
 * - エラーハンドリングのテスト
 *
 * React Router v7のローダー・アクション機能のテストに基づいて実装
 * Issue #37の例に基づいたMockLoaderArgs/ActionArgsとCloudflareモックを活用
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { action } from "./$id.update";
import {
	createMockActionArgs,
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
	updateTransaction: vi.fn(),
}));

vi.mock("../../../../db/queries/categories", () => ({
	getCategoryById: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockGetTransactionById = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.getTransactionById,
	),
);
const mockUpdateTransaction = vi.mocked(
	await import("../../../../db/queries/transactions").then(
		(m) => m.updateTransaction,
	),
);
const mockGetCategoryById = vi.mocked(
	await import("../../../../db/queries/categories").then(
		(m) => m.getCategoryById,
	),
);

describe("PUT /api/transactions/:id", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("有効なデータで取引を更新できること", async () => {
			// テストデータの準備
			const existingTransaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "更新前取引",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: JSON.stringify(["古いタグ"]),
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const requestBody = {
				amount: 1500,
				description: "更新後取引",
				tags: ["新しいタグ"],
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

			const updatedTransaction = {
				...existingTransaction,
				amount: 1500,
				description: "更新後取引",
				tags: JSON.stringify(["新しいタグ"]),
				updatedAt: "2024-01-01T01:00:00.000Z",
			};

			const fullUpdatedTransaction = {
				...updatedTransaction,
				category: mockCategory,
			};

			// モック設定
			mockGetTransactionById
				.mockResolvedValueOnce(existingTransaction) // 存在チェック用
				.mockResolvedValueOnce(fullUpdatedTransaction); // 更新後データ取得用
			mockUpdateTransaction.mockResolvedValue(updatedTransaction);

			// テスト実行
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			// レスポンス検証
			expect(response.status).toBe(200);
			const responseData = await response.json();

			expect(responseData).toEqual({
				success: true,
				data: fullUpdatedTransaction,
				message: "取引が正常に更新されました",
			});

			// モック関数の呼出し検証
			expect(mockGetTransactionById).toHaveBeenNthCalledWith(1, mockDb, 1);
			expect(mockUpdateTransaction).toHaveBeenCalledWith(
				mockDb,
				1,
				requestBody,
			);
			expect(mockGetTransactionById).toHaveBeenNthCalledWith(2, mockDb, 1);
		});

		it("カテゴリIDを更新できること", async () => {
			const existingTransaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "カテゴリ変更前",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const requestBody = {
				categoryId: 2,
			};

			const mockNewCategory: SelectCategory = {
				id: 2,
				name: "交通費",
				type: "expense",
				color: "#00FF00",
				icon: "transport",
				displayOrder: 2,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const updatedTransaction = {
				...existingTransaction,
				categoryId: 2,
			};

			mockGetTransactionById.mockResolvedValueOnce(existingTransaction);
			mockGetCategoryById.mockResolvedValue(mockNewCategory);
			mockUpdateTransaction.mockResolvedValue(updatedTransaction);
			mockGetTransactionById.mockResolvedValueOnce(updatedTransaction);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(200);

			// カテゴリ存在チェックが実行されることを確認
			expect(mockGetCategoryById).toHaveBeenCalledWith(mockDb, 2);
		});

		it("カテゴリIDをnullに更新できること", async () => {
			const existingTransaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "カテゴリ削除",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const requestBody = {
				categoryId: null,
			};

			const updatedTransaction = {
				...existingTransaction,
				categoryId: null,
			};

			mockGetTransactionById.mockResolvedValueOnce(existingTransaction);
			mockUpdateTransaction.mockResolvedValue(updatedTransaction);
			mockGetTransactionById.mockResolvedValueOnce(updatedTransaction);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(200);

			// nullの場合はカテゴリ存在チェックが実行されないことを確認
			expect(mockGetCategoryById).not.toHaveBeenCalled();
		});

		it("取引タイプとカテゴリを同時に更新できること", async () => {
			const existingTransaction: SelectTransaction = {
				id: 1,
				amount: 1000,
				type: "expense",
				categoryId: 1,
				description: "タイプ・カテゴリ変更",
				transactionDate: "2024-01-01",
				paymentMethod: "現金",
				tags: null,
				receiptUrl: null,
				isRecurring: false,
				recurringId: null,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const requestBody = {
				type: "income",
				categoryId: 2,
			};

			const mockIncomeCategory: SelectCategory = {
				id: 2,
				name: "給与",
				type: "income",
				color: "#0000FF",
				icon: "salary",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const updatedTransaction = {
				...existingTransaction,
				type: "income" as const,
				categoryId: 2,
			};

			mockGetTransactionById.mockResolvedValueOnce(existingTransaction);
			mockGetCategoryById.mockResolvedValue(mockIncomeCategory);
			mockUpdateTransaction.mockResolvedValue(updatedTransaction);
			mockGetTransactionById.mockResolvedValueOnce(updatedTransaction);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(200);

			// 新しいtypeとカテゴリタイプの整合性がチェックされることを確認
			expect(mockGetCategoryById).toHaveBeenCalledWith(mockDb, 2);
		});
	});

	describe("HTTPメソッドチェックテスト", () => {
		it("PUT以外のメソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"POST",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
			const responseData = await response.json();
			expect(responseData.error).toBe("PUT メソッドのみサポートしています");
		});
	});

	describe("パラメータバリデーションテスト", () => {
		it("無効なIDで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/invalid",
				{ id: "invalid" },
				"PUT",
				JSON.stringify({ amount: 1000 }),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なパラメータです");
		});

		it("負のIDで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/-1",
				{ id: "-1" },
				"PUT",
				JSON.stringify({ amount: 1000 }),
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
				"PUT",
				JSON.stringify({ amount: 1000 }),
			);
			const response = await action(args);

			expect(response.status).toBe(404);
			const responseData = await response.json();
			expect(responseData.error).toBe("指定された取引が見つかりません");
		});
	});

	describe("リクエストボディバリデーションテスト", () => {
		const existingTransaction: SelectTransaction = {
			id: 1,
			amount: 1000,
			type: "expense",
			categoryId: 1,
			description: "既存取引",
			transactionDate: "2024-01-01",
			paymentMethod: "現金",
			tags: null,
			receiptUrl: null,
			isRecurring: false,
			recurringId: null,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		beforeEach(() => {
			mockGetTransactionById.mockResolvedValueOnce(existingTransaction);
		});

		it("空のリクエストボディで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({}),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"更新するフィールドが指定されていません",
			);
		});

		it("無効なtypeで400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ type: "invalid" }),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なリクエストボディです");
		});

		it("負の金額で400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ amount: -1000 }),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("無効な日付形式で400エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ transactionDate: "invalid-date" }),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});
	});

	describe("カテゴリ整合性チェックテスト", () => {
		const existingTransaction: SelectTransaction = {
			id: 1,
			amount: 1000,
			type: "expense",
			categoryId: 1,
			description: "既存取引",
			transactionDate: "2024-01-01",
			paymentMethod: "現金",
			tags: null,
			receiptUrl: null,
			isRecurring: false,
			recurringId: null,
			createdAt: "2024-01-01T00:00:00.000Z",
			updatedAt: "2024-01-01T00:00:00.000Z",
		};

		beforeEach(() => {
			mockGetTransactionById.mockResolvedValueOnce(existingTransaction);
		});

		it("存在しないカテゴリIDで400エラーを返すこと", async () => {
			mockGetCategoryById.mockResolvedValue(null);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ categoryId: 999 }),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("指定されたカテゴリが見つかりません");
		});

		it("既存取引タイプと新カテゴリタイプが一致しない場合400エラーを返すこと", async () => {
			const mockIncomeCategory: SelectCategory = {
				id: 2,
				name: "給与",
				type: "income",
				color: "#0000FF",
				icon: "salary",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetCategoryById.mockResolvedValue(mockIncomeCategory);

			// 既存のexpense取引にincomeカテゴリを設定しようとする
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ categoryId: 2 }),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toContain("支出取引には支出カテゴリを");
		});

		it("新取引タイプと新カテゴリタイプが一致しない場合400エラーを返すこと", async () => {
			const mockExpenseCategory: SelectCategory = {
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

			mockGetCategoryById.mockResolvedValue(mockExpenseCategory);

			// typeをincomeに変更しつつexpenseカテゴリを設定しようとする
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ type: "income", categoryId: 1 }),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toContain("収入取引には収入カテゴリを");
		});
	});

	describe("エラーハンドリングテスト", () => {
		it("データベースエラー時に500エラーを返すこと", async () => {
			mockGetTransactionById.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ amount: 1000 }),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"取引の更新中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラー時に500エラーを返すこと", async () => {
			mockGetTransactionById.mockRejectedValue("Unexpected error");

			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				JSON.stringify({ amount: 1000 }),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.details).toBe("不明なエラー");
		});
	});

	describe("JSON解析エラーテスト", () => {
		it("無効なJSONで500エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/transactions/1",
				{ id: "1" },
				"PUT",
				"invalid json",
			);

			const response = await action(args);
			expect(response.status).toBe(500);
		});
	});
});