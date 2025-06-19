/**
 * POST /api/subscriptions エンドポイントのテスト
 *
 * 機能:
 * - 新規サブスクリプション作成のアクション関数テスト
 * - リクエストボディバリデーションのテスト
 * - カテゴリ存在チェックとタイプ検証のテスト
 * - HTTPメソッドチェックのテスト
 * - データベース制約エラーハンドリングのテスト
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
import { resetMockDataStore } from "../../../../__mocks__/db";
import type { SelectSubscription, SelectCategory } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/subscriptions", () => ({
	createSubscription: vi.fn(),
	getSubscriptionById: vi.fn(),
}));

vi.mock("../../../../db/queries/categories", () => ({
	getCategoryById: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockCreateSubscription = vi.mocked(
	await import("../../../../db/queries/subscriptions").then(
		(m) => m.createSubscription,
	),
);
const mockGetSubscriptionById = vi.mocked(
	await import("../../../../db/queries/subscriptions").then(
		(m) => m.getSubscriptionById,
	),
);
const mockGetCategoryById = vi.mocked(
	await import("../../../../db/queries/categories").then(
		(m) => m.getCategoryById,
	),
);

describe("POST /api/subscriptions", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("有効なデータでサブスクリプションを作成できること", async () => {
			// テストデータの準備
			const requestBody = {
				name: "Netflix",
				amount: 1500,
				frequency: "monthly",
				categoryId: 1,
				nextPaymentDate: "2024-02-01",
				description: "動画配信サービス",
				isActive: true,
				autoGenerate: true,
			};

			const mockCategory: SelectCategory = {
				id: 1,
				name: "エンターテイメント",
				type: "expense",
				color: "#FF0000",
				icon: "entertainment",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockCreatedSubscription: SelectSubscription = {
				id: 1,
				name: "Netflix",
				amount: 1500,
				frequency: "monthly",
				categoryId: 1,
				nextPaymentDate: "2024-02-01",
				description: "動画配信サービス",
				isActive: true,
				autoGenerate: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockSubscriptionWithDetails = {
				...mockCreatedSubscription,
				category: mockCategory,
			};

			// モック設定
			mockGetCategoryById.mockResolvedValue(mockCategory);
			mockCreateSubscription.mockResolvedValue(mockCreatedSubscription);
			mockGetSubscriptionById.mockResolvedValue(mockSubscriptionWithDetails);

			// テスト実行
			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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
				data: mockSubscriptionWithDetails,
				message: "サブスクリプションが正常に作成されました",
			});

			// モック関数の呼出し検証
			expect(mockGetCategoryById).toHaveBeenCalledWith(mockDb, 1);
			expect(mockCreateSubscription).toHaveBeenCalledWith(mockDb, requestBody);
			expect(mockGetSubscriptionById).toHaveBeenCalledWith(mockDb, 1);
		});

		it("最小限の必須データでサブスクリプションを作成できること", async () => {
			const requestBody = {
				name: "基本サービス",
				amount: 500,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			const mockCreatedSubscription: SelectSubscription = {
				id: 2,
				name: "基本サービス",
				amount: 500,
				frequency: "monthly",
				categoryId: null,
				nextPaymentDate: "2024-02-01",
				description: null,
				isActive: true, // デフォルト値
				autoGenerate: true, // デフォルト値
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateSubscription.mockResolvedValue(mockCreatedSubscription);
			mockGetSubscriptionById.mockResolvedValue(mockCreatedSubscription);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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

		it("様々な頻度でサブスクリプションを作成できること", async () => {
			const frequencies = ["daily", "weekly", "monthly", "yearly"];

			for (const frequency of frequencies) {
				const requestBody = {
					name: `${frequency}サービス`,
					amount: 1000,
					frequency,
					nextPaymentDate: "2024-02-01",
				};

				const mockSubscription: SelectSubscription = {
					id: 1,
					name: `${frequency}サービス`,
					amount: 1000,
					frequency: frequency as any,
					categoryId: null,
					nextPaymentDate: "2024-02-01",
					description: null,
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				};

				mockCreateSubscription.mockResolvedValue(mockSubscription);
				mockGetSubscriptionById.mockResolvedValue(mockSubscription);

				const args = createMockActionArgs(
					"http://localhost:3000/api/subscriptions",
					{},
					"POST",
					JSON.stringify(requestBody),
				);
				const response = await action(args);

				expect(response.status).toBe(201);
				const responseData = await response.json();
				expect(responseData.data.frequency).toBe(frequency);

				vi.clearAllMocks();
			}
		});

		it("非アクティブサブスクリプションを作成できること", async () => {
			const requestBody = {
				name: "停止予定サービス",
				amount: 800,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				isActive: false,
				autoGenerate: false,
			};

			const mockSubscription: SelectSubscription = {
				id: 3,
				name: "停止予定サービス",
				amount: 800,
				frequency: "monthly",
				categoryId: null,
				nextPaymentDate: "2024-02-01",
				description: null,
				isActive: false,
				autoGenerate: false,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateSubscription.mockResolvedValue(mockSubscription);
			mockGetSubscriptionById.mockResolvedValue(mockSubscription);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.data.isActive).toBe(false);
			expect(responseData.data.autoGenerate).toBe(false);
		});
	});

	describe("HTTPメソッドチェックテスト", () => {
		it("POST以外のメソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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
				"http://localhost:3000/api/subscriptions",
				{},
				"PUT",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
		});

		it("DELETE メソッドで405エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"DELETE",
			);
			const response = await action(args);

			expect(response.status).toBe(405);
		});
	});

	describe("バリデーションエラーテスト", () => {
		it("必須フィールドなしで400エラーを返すこと", async () => {
			const requestBody = {}; // 必須フィールドなし

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("amountが不足で400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("無効なfrequencyで400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "invalid",
				nextPaymentDate: "2024-02-01",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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
				name: "テストサービス",
				amount: -1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("無効な日付形式で400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "invalid-date",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
		});

		it("空文字のnameで400エラーを返すこと", async () => {
			const requestBody = {
				name: "",
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				categoryId: 999,
				nextPaymentDate: "2024-02-01",
			};

			mockGetCategoryById.mockResolvedValue(null);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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

		it("収入カテゴリを指定した場合400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				categoryId: 1,
				nextPaymentDate: "2024-02-01",
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
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("カテゴリタイプが不適切です");
			expect(responseData.details).toContain("給与");
			expect(responseData.details).toContain("収入用");
		});

		it("支出カテゴリを指定した場合正常に作成できること", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				categoryId: 1,
				nextPaymentDate: "2024-02-01",
			};

			const mockExpenseCategory: SelectCategory = {
				id: 1,
				name: "エンターテイメント",
				type: "expense", // 支出カテゴリ
				color: "#FF0000",
				icon: "entertainment",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockCreatedSubscription: SelectSubscription = {
				id: 1,
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				categoryId: 1,
				nextPaymentDate: "2024-02-01",
				description: null,
				isActive: true,
				autoGenerate: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			const mockSubscriptionWithDetails = {
				...mockCreatedSubscription,
				category: mockExpenseCategory,
			};

			mockGetCategoryById.mockResolvedValue(mockExpenseCategory);
			mockCreateSubscription.mockResolvedValue(mockCreatedSubscription);
			mockGetSubscriptionById.mockResolvedValue(mockSubscriptionWithDetails);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.success).toBe(true);
		});
	});

	describe("データベース制約エラーテスト", () => {
		it("外部キー制約エラーで400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				categoryId: 1,
				nextPaymentDate: "2024-02-01",
			};

			const mockExpenseCategory: SelectCategory = {
				id: 1,
				name: "エンターテイメント",
				type: "expense",
				color: "#FF0000",
				icon: "entertainment",
				displayOrder: 1,
				isActive: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockGetCategoryById.mockResolvedValue(mockExpenseCategory);
			mockCreateSubscription.mockRejectedValue(
				new Error("FOREIGN KEY constraint failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
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
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			mockCreateSubscription.mockRejectedValue(
				new Error("NOT NULL constraint failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("必須項目が不足しています");
			expect(responseData.details).toContain("名前、金額、支払い頻度、次回支払日");
		});

		it("CHECK制約エラーで400エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			mockCreateSubscription.mockRejectedValue(
				new Error("CHECK constraint failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("データ形式エラー");
			expect(responseData.details).toBe("金額は正の整数で入力してください");
		});
	});

	describe("一般的なエラーハンドリングテスト", () => {
		it("データベース接続エラーで500エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			mockCreateSubscription.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"サブスクリプションの作成中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラーで500エラーを返すこと", async () => {
			const requestBody = {
				name: "テストサービス",
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			mockCreateSubscription.mockRejectedValue("Unexpected error");

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"サブスクリプションの作成中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});
	});

	describe("JSON解析エラーテスト", () => {
		it("無効なJSONで500エラーを返すこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				"invalid json",
			);

			const response = await action(args);
			expect(response.status).toBe(500);
		});
	});

	describe("特殊文字テスト", () => {
		it("特殊文字を含むサブスクリプション名で作成できること", async () => {
			const requestBody = {
				name: "Prime Video & Music",
				amount: 1200,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				description: "Amazon プライム（映像&音楽）",
			};

			const mockSubscription: SelectSubscription = {
				id: 4,
				name: "Prime Video & Music",
				amount: 1200,
				frequency: "monthly",
				categoryId: null,
				nextPaymentDate: "2024-02-01",
				description: "Amazon プライム（映像&音楽）",
				isActive: true,
				autoGenerate: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateSubscription.mockResolvedValue(mockSubscription);
			mockGetSubscriptionById.mockResolvedValue(mockSubscription);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.status).toBe(201);
			const responseData = await response.json();
			expect(responseData.data.name).toBe("Prime Video & Music");
			expect(responseData.data.description).toBe("Amazon プライム（映像&音楽）");
		});
	});

	describe("レスポンス形式テスト", () => {
		it("正常なレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const requestBody = {
				name: "テスト",
				amount: 1000,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			const mockSubscription: SelectSubscription = {
				id: 1,
				name: "テスト",
				amount: 1000,
				frequency: "monthly",
				categoryId: null,
				nextPaymentDate: "2024-02-01",
				description: null,
				isActive: true,
				autoGenerate: true,
				createdAt: "2024-01-01T00:00:00.000Z",
				updatedAt: "2024-01-01T00:00:00.000Z",
			};

			mockCreateSubscription.mockResolvedValue(mockSubscription);
			mockGetSubscriptionById.mockResolvedValue(mockSubscription);

			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"POST",
				JSON.stringify(requestBody),
			);
			const response = await action(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("エラーレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const args = createMockActionArgs(
				"http://localhost:3000/api/subscriptions",
				{},
				"GET",
			);
			const response = await action(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});
	});
});