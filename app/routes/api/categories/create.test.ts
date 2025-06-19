/**
 * POST /api/categories エンドポイントのテスト
 *
 * 機能:
 * - 新規カテゴリ作成のアクション関数テスト
 * - リクエストボディバリデーションのテスト
 * - HTTPメソッドチェックのテスト
 * - 表示順序自動設定のテスト
 * - エラーハンドリングのテスト
 *
 * React Router v7のローダー・アクション機能のテストに基づいて実装
 * Issue #37の例に基づいたMockLoaderArgs/ActionArgsとCloudflareモックを活用
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import * as createModule from "./create";
const { action } = createModule;
import {
	createMockActionArgs,
	setupMockCloudflareEnvironment,
} from "../../../../tests/mocks/cloudflare";
import { resetMockDataStore } from "../../../../__mocks__/db";
import type { SelectCategory } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/categories", () => ({
	createCategory: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockCreateCategory = vi.mocked(
	await import("../../../../db/queries/categories").then(
		(m) => m.createCategory,
	),
);

describe("POST /api/categories", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("最小限の必須データでカテゴリを作成できること", async () => {
			// テストデータの準備
			const requestBody = {
				name: "食費",
				type: "expense",
			};

			const mockCreatedCategory: SelectCategory = {
				id: 1,
				name: "食費",
				type: "expense",
				color: null,
				icon: null,
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockCreatedCategory);

			// テスト実行
			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
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
				data: mockCreatedCategory,
				message: "カテゴリが正常に作成されました",
			});

			// モック関数の呼出し検証
			expect(mockCreateCategory).toHaveBeenCalledWith(mockDb, requestBody);
		});

		it("全フィールド指定でカテゴリを作成できること", async () => {
			const requestBody = {
				name: "交通費",
				type: "expense",
				color: "#00FF00",
				icon: "transport",
				displayOrder: 5,
			};

			const mockCreatedCategory: SelectCategory = {
				id: 2,
				name: "交通費",
				type: "expense",
				color: "#00FF00",
				icon: "transport",
				displayOrder: 5,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockCreatedCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.data).toEqual(mockCreatedCategory);

			expect(mockCreateCategory).toHaveBeenCalledWith(mockDb, requestBody);
		});

		it("incomeタイプのカテゴリを作成できること", async () => {
			const requestBody = {
				name: "給与",
				type: "income",
				color: "#0000FF",
				icon: "salary",
			};

			const mockIncomeCategory: SelectCategory = {
				id: 3,
				name: "給与",
				type: "income",
				color: "#0000FF",
				icon: "salary",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockIncomeCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.data.type).toBe("income");
		});

		it("カラーコードの形式が正しいカテゴリを作成できること", async () => {
			const requestBody = {
				name: "エンターテイメント",
				type: "expense",
				color: "#FF5733", // 6桁の16進数カラーコード
			};

			const mockCategory: SelectCategory = {
				id: 4,
				name: "エンターテイメント",
				type: "expense",
				color: "#FF5733",
				icon: null,
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
		});

		it("displayOrderが0のカテゴリを作成できること", async () => {
			const requestBody = {
				name: "優先カテゴリ",
				type: "expense",
				displayOrder: 0,
			};

			const mockCategory: SelectCategory = {
				id: 5,
				name: "優先カテゴリ",
				type: "expense",
				color: null,
				icon: null,
				displayOrder: 0,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.data.displayOrder).toBe(0);
		});
	});

	describe("HTTPメソッドチェックテスト", () => {
		it("POST以外のメソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
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
				"http://localhost:3000/api/categories",
				{},
				"PUT",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
		});

		it("DELETE メソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
		});
	});

	describe("バリデーションエラーテスト", () => {
		it("必須フィールドなしで400エラーを返すこと", async () => {
			const requestBody = {}; // name, typeが不足

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
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

		it("nameが不足で400エラーを返すこと", async () => {
			const requestBody = {
				type: "expense",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なリクエストボディです");
		});

		it("typeが不足で400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("無効なtypeで400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
				type: "invalid",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なリクエストボディです");
		});

		it("空文字のnameで400エラーを返すこと", async () => {
			const requestBody = {
				name: "",
				type: "expense",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("無効なカラーコード形式で400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
				type: "expense",
				color: "invalid-color",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("#なしのカラーコードで400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
				type: "expense",
				color: "FF0000", // #が不足
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("負のdisplayOrderで400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
				type: "expense",
				displayOrder: -1,
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("非整数のdisplayOrderで400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
				type: "expense",
				displayOrder: 1.5,
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});
	});

	describe("エラーハンドリングテスト", () => {
		it("データベースエラー時に500エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
				type: "expense",
			};

			mockCreateCategory.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"カテゴリの作成中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラー時に500エラーを返すこと", async () => {
			const requestBody = {
				name: "テストカテゴリ",
				type: "expense",
			};

			mockCreateCategory.mockRejectedValue("Unexpected error");

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"カテゴリの作成中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});

		it("ユニーク制約エラー時に500エラーを返すこと", async () => {
			const requestBody = {
				name: "重複カテゴリ",
				type: "expense",
			};

			mockCreateCategory.mockRejectedValue(
				new Error("UNIQUE constraint failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.details).toBe("UNIQUE constraint failed");
		});
	});

	describe("JSON解析エラーテスト", () => {
		it("無効なJSONで500エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				"invalid json",
			);

			// JSON.parse内でエラーが発生することを期待
			const response = await action(args);
			expect(response.status).toBe(500);
		});

		it("空のリクエストボディで500エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				"",
			);

			const response = await action(args);
			expect(response.status).toBe(500);
		});
	});

	describe("特殊文字テスト", () => {
		it("特殊文字を含むカテゴリ名で作成できること", async () => {
			const requestBody = {
				name: "カフェ&レストラン (食事代)",
				type: "expense",
			};

			const mockCategory: SelectCategory = {
				id: 6,
				name: "カフェ&レストラン (食事代)",
				type: "expense",
				color: null,
				icon: null,
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.data.name).toBe("カフェ&レストラン (食事代)");
		});

		it("絵文字を含むカテゴリ名で作成できること", async () => {
			const requestBody = {
				name: "🍕 食費",
				type: "expense",
				icon: "🍕",
			};

			const mockCategory: SelectCategory = {
				id: 7,
				name: "🍕 食費",
				type: "expense",
				color: null,
				icon: "🍕",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.data.name).toBe("🍕 食費");
			expect(responseData.data.icon).toBe("🍕");
		});
	});

	describe("レスポンス形式テスト", () => {
		it("正常なレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const requestBody = {
				name: "テスト",
				type: "expense",
			};

			const mockCategory: SelectCategory = {
				id: 1,
				name: "テスト",
				type: "expense",
				color: null,
				icon: null,
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateCategory.mockResolvedValue(mockCategory);

			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("エラーレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/categories",
				{},
				"GET",
			);
			const response = await action(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});
	});
});