/**
 * GET /api/categories エンドポイントのテスト
 *
 * 機能:
 * - カテゴリ一覧取得のローダー関数テスト
 * - type絞り込みクエリパラメータのテスト
 * - バリデーションエラーのテスト
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
import { resetMockDataStore } from "../../../../__mocks__/db";
import type { SelectCategory } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/categories", () => ({
	getActiveCategories: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockGetActiveCategories = vi.mocked(
	await import("../../../../db/queries/categories").then(
		(m) => m.getActiveCategories,
	),
);

describe("GET /api/categories", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("全カテゴリを取得できること", async () => {
			// テストデータの準備
			const mockCategories: SelectCategory[] = [
				{
					id: 1,
					name: "食費",
					type: "expense",
					color: "#FF0000",
					icon: "food",
					displayOrder: 1,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 2,
					name: "交通費",
					type: "expense",
					color: "#00FF00",
					icon: "transport",
					displayOrder: 2,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 3,
					name: "給与",
					type: "income",
					color: "#0000FF",
					icon: "salary",
					displayOrder: 1,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			];

			mockGetActiveCategories.mockResolvedValue(mockCategories);

			// テスト実行
			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			// レスポンス検証
			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toEqual({
				success: true,
				data: mockCategories,
				count: 3,
			});

			// モック関数の呼出し検証（typeフィルタなし）
			expect(mockGetActiveCategories).toHaveBeenCalledWith(mockDb, undefined);
		});

		it("expenseタイプでフィルタされたカテゴリを取得できること", async () => {
			const mockExpenseCategories: SelectCategory[] = [
				{
					id: 1,
					name: "食費",
					type: "expense",
					color: "#FF0000",
					icon: "food",
					displayOrder: 1,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 2,
					name: "交通費",
					type: "expense",
					color: "#00FF00",
					icon: "transport",
					displayOrder: 2,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			];

			mockGetActiveCategories.mockResolvedValue(mockExpenseCategories);

			// expenseタイプのクエリパラメータ付きでテスト実行
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=expense",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toEqual({
				success: true,
				data: mockExpenseCategories,
				count: 2,
			});

			// expenseタイプでフィルタされることを確認
			expect(mockGetActiveCategories).toHaveBeenCalledWith(mockDb, "expense");
		});

		it("incomeタイプでフィルタされたカテゴリを取得できること", async () => {
			const mockIncomeCategories: SelectCategory[] = [
				{
					id: 3,
					name: "給与",
					type: "income",
					color: "#0000FF",
					icon: "salary",
					displayOrder: 1,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 4,
					name: "副業収入",
					type: "income",
					color: "#FF00FF",
					icon: "business",
					displayOrder: 2,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			];

			mockGetActiveCategories.mockResolvedValue(mockIncomeCategories);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=income",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.data).toEqual(mockIncomeCategories);
			expect(responseData.count).toBe(2);

			// incomeタイプでフィルタされることを確認
			expect(mockGetActiveCategories).toHaveBeenCalledWith(mockDb, "income");
		});

		it("空の結果を正常に返せること", async () => {
			mockGetActiveCategories.mockResolvedValue([]);

			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.data).toEqual([]);
			expect(responseData.count).toBe(0);
		});

		it("表示順序でソートされたカテゴリを取得できること", async () => {
			const mockSortedCategories: SelectCategory[] = [
				{
					id: 2,
					name: "交通費",
					type: "expense",
					color: "#00FF00",
					icon: "transport",
					displayOrder: 1, // 表示順序が小さい
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
				{
					id: 1,
					name: "食費",
					type: "expense",
					color: "#FF0000",
					icon: "food",
					displayOrder: 2, // 表示順序が大きい
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			];

			mockGetActiveCategories.mockResolvedValue(mockSortedCategories);

			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			
			// 表示順序で並んでいることを確認
			expect(responseData.data[0].displayOrder).toBe(1);
			expect(responseData.data[1].displayOrder).toBe(2);
		});
	});

	describe("バリデーションエラーテスト", () => {
		it("無効なtypeパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=invalid",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
			expect(responseData.details).toBeDefined();

			// データベースクエリは実行されないこと
			expect(mockGetActiveCategories).not.toHaveBeenCalled();
		});

		it("空のtypeパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
		});

		it("大文字小文字が正しくないtypeパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=EXPENSE",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
		});

		it("数値のtypeパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=1",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
		});
	});

	describe("エラーハンドリングテスト", () => {
		it("データベースエラー時に500エラーを返すこと", async () => {
			mockGetActiveCategories.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"カテゴリ一覧の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラー時に500エラーを返すこと", async () => {
			mockGetActiveCategories.mockRejectedValue("Unexpected error");

			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"カテゴリ一覧の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});

		it("ネットワークエラー時に500エラーを返すこと", async () => {
			mockGetActiveCategories.mockRejectedValue(
				new Error("ECONNREFUSED"),
			);

			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.details).toBe("ECONNREFUSED");
		});
	});

	describe("複数クエリパラメータテスト", () => {
		it("有効なtypeと無関係なパラメータを適切に処理すること", async () => {
			const mockCategories: SelectCategory[] = [
				{
					id: 1,
					name: "食費",
					type: "expense",
					color: "#FF0000",
					icon: "food",
					displayOrder: 1,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			];

			mockGetActiveCategories.mockResolvedValue(mockCategories);

			// 無関係なパラメータも含む
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=expense&ignore=this&other=param",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.data).toEqual(mockCategories);

			// typeパラメータのみが使用されることを確認
			expect(mockGetActiveCategories).toHaveBeenCalledWith(mockDb, "expense");
		});

		it("複数のtypeパラメータが指定された場合最初の値を使用すること", async () => {
			const mockCategories: SelectCategory[] = [];
			mockGetActiveCategories.mockResolvedValue(mockCategories);

			// URLSearchParamsは最初の値を取得するため、expenseが使われる
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=expense&type=income",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			// 最初のtype値（expense）が使用されることを確認
			expect(mockGetActiveCategories).toHaveBeenCalledWith(mockDb, "expense");
		});
	});

	describe("レスポンス形式テスト", () => {
		it("正常なレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			mockGetActiveCategories.mockResolvedValue([]);

			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("エラーレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/categories?type=invalid",
			);
			const response = await loader(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("正常なレスポンスがAPI形式に準拠していること", async () => {
			const mockCategories: SelectCategory[] = [
				{
					id: 1,
					name: "テスト",
					type: "expense",
					color: "#FF0000",
					icon: "test",
					displayOrder: 1,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				},
			];

			mockGetActiveCategories.mockResolvedValue(mockCategories);

			const args = createMockLoaderArgs("http://localhost:3000/api/categories");
			const response = await loader(args);

			const responseData = await response.json();

			// API形式に準拠していることを確認
			expect(responseData).toHaveProperty("success", true);
			expect(responseData).toHaveProperty("data");
			expect(responseData).toHaveProperty("count");
			expect(Array.isArray(responseData.data)).toBe(true);
			expect(typeof responseData.count).toBe("number");
		});
	});
});