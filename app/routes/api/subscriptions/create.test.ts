/**
 * サブスクリプション作成API統合テスト
 *
 * テスト対象:
 * - サブスクリプション作成の正常系・異常系
 * - カテゴリタイプ制限の動作（Issue #31対応）
 * - 収入カテゴリでの警告ログ出力
 * - バリデーションエラーハンドリング
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDb } from "../../../../db/connection";
import { action } from "./create";

// データベースモック
const mockDb = {
	select: vi.fn(),
	insert: vi.fn(),
};

// カテゴリクエリのモック
const mockGetCategoryById = vi.fn();

vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/categories", () => ({
	getCategoryById: mockGetCategoryById,
}));

vi.mock("../../../../db/queries/subscriptions", () => ({
	createSubscription: vi.fn().mockResolvedValue({ id: 1 }),
	getSubscriptionById: vi.fn().mockResolvedValue({
		id: 1,
		name: "テストサブスク",
		amount: 1000,
		frequency: "monthly",
		category: { id: 1, name: "テストカテゴリ", type: "expense" },
	}),
}));

describe("サブスクリプション作成API", () => {
	const mockRequest = (body: any) => ({
		method: "POST",
		json: () => Promise.resolve(body),
	});

	const mockContext = {
		cloudflare: {
			env: {
				DB: "mock-db",
			},
		},
	};

	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("収入カテゴリでのサブスクリプション作成（Issue #31）", () => {
		it("収入カテゴリでサブスクリプション作成時に警告ログを出力し、作成を許可すること", async () => {
			// 警告ログのスパイを設定
			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			// 収入カテゴリをモック
			const incomeCategory = {
				id: 100,
				name: "給与",
				type: "income",
			};
			mockGetCategoryById.mockResolvedValue(incomeCategory);

			const requestBody = {
				name: "給与サブスク",
				amount: 250000,
				categoryId: 100,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				description: "給与・定期契約収入",
				autoGenerate: true,
			};

			const request = mockRequest(requestBody) as any;
			const response = await action({ request, context: mockContext } as any);

			// 作成が成功することを確認
			expect(response.status).toBe(201);
			const responseData = (await response.json()) as any;
			expect(responseData.success).toBe(true);

			// 警告ログが出力されることを確認
			expect(consoleWarnSpy).toHaveBeenCalledWith(
				`収入カテゴリでサブスクリプション作成: カテゴリ「${incomeCategory.name}」(ID: ${incomeCategory.id}), サブスクリプション「${requestBody.name}」`,
			);

			consoleWarnSpy.mockRestore();
		});

		it("支出カテゴリでは警告ログが出力されないこと", async () => {
			// 警告ログのスパイを設定
			const consoleWarnSpy = vi
				.spyOn(console, "warn")
				.mockImplementation(() => {});

			// 支出カテゴリをモック
			const expenseCategory = {
				id: 1,
				name: "食費",
				type: "expense",
			};
			mockGetCategoryById.mockResolvedValue(expenseCategory);

			const requestBody = {
				name: "Netflix",
				amount: 1000,
				categoryId: 1,
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
				description: "動画配信サービス",
				autoGenerate: true,
			};

			const request = mockRequest(requestBody) as any;
			const response = await action({ request, context: mockContext } as any);

			// 作成が成功することを確認
			expect(response.status).toBe(201);

			// 警告ログが出力されないことを確認
			expect(consoleWarnSpy).not.toHaveBeenCalled();

			consoleWarnSpy.mockRestore();
		});
	});

	describe("エラーハンドリング", () => {
		it("存在しないカテゴリIDで400エラーを返すこと", async () => {
			mockGetCategoryById.mockResolvedValue(null);

			const requestBody = {
				name: "テストサブスク",
				amount: 1000,
				categoryId: 999, // 存在しないID
				frequency: "monthly",
				nextPaymentDate: "2024-02-01",
			};

			const request = mockRequest(requestBody) as any;
			const response = await action({ request, context: mockContext } as any);

			expect(response.status).toBe(400);
			const responseData = (await response.json()) as any;
			expect(responseData.error).toBe("指定されたカテゴリが見つかりません");
		});

		it("POSTメソッド以外で405エラーを返すこと", async () => {
			const request = {
				method: "GET",
				json: () => Promise.resolve({}),
			} as any;

			const response = await action({ request, context: mockContext } as any);

			expect(response.status).toBe(405);
			const responseData = (await response.json()) as any;
			expect(responseData.error).toBe("POST メソッドのみサポートしています");
		});
	});
});
