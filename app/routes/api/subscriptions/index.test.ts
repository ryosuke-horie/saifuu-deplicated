/**
 * GET /api/subscriptions エンドポイントのテスト
 *
 * 機能:
 * - サブスクリプション一覧取得のローダー関数テスト
 * - active絞り込みクエリパラメータのテスト
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
	type CloudflareMockLoaderArgs,
} from "../../../../tests/mocks/cloudflare";
import { resetMockDataStore } from "../../../../__mocks__/db";
import type { SelectSubscription, SelectCategory } from "../../../../db/schema";

// DBクエリ関数をモック
vi.mock("../../../../db/connection", () => ({
	createDb: vi.fn(() => mockDb),
}));

vi.mock("../../../../db/queries/subscriptions", () => ({
	getSubscriptionsList: vi.fn(),
}));

// モックオブジェクトの取得
const mockDb = {} as any;
const mockGetSubscriptionsList = vi.mocked(
	await import("../../../../db/queries/subscriptions").then(
		(m) => m.getSubscriptionsList,
	),
);

describe("GET /api/subscriptions", () => {
	beforeEach(() => {
		resetMockDataStore();
		vi.clearAllMocks();
		setupMockCloudflareEnvironment();
	});

	describe("正常系テスト", () => {
		it("全サブスクリプションを取得できること", async () => {
			// テストデータの準備
			const mockSubscriptions = [
				{
					id: 1,
					name: "Netflix",
					amount: 1500,
					frequency: "monthly" as const,
					categoryId: 1,
					nextPaymentDate: "2024-02-01",
					description: "動画配信サービス",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: {
						id: 1,
						name: "エンターテイメント",
						type: "expense" as const,
						color: "#FF0000",
						icon: "entertainment",
						displayOrder: 1,
						isActive: true,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				},
				{
					id: 2,
					name: "定期預金利息",
					amount: 100,
					frequency: "monthly" as const,
					categoryId: 2,
					nextPaymentDate: "2024-02-01",
					description: "銀行利息",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: {
						id: 2,
						name: "利息収入",
						type: "income" as const,
						color: "#00FF00",
						icon: "bank",
						displayOrder: 1,
						isActive: true,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				},
				{
					id: 3,
					name: "旧プラン",
					amount: 500,
					frequency: "monthly" as const,
					categoryId: null,
					nextPaymentDate: "2024-02-01",
					description: "停止済みサービス",
					isActive: false,
					autoGenerate: false,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: null,
				},
			];

			mockGetSubscriptionsList.mockResolvedValue(mockSubscriptions);

			// テスト実行
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			// レスポンス検証
			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toEqual({
				success: true,
				data: mockSubscriptions,
				count: 3,
				filters: {
					active: undefined,
				},
			});

			// モック関数の呼出し検証（activeフィルタなし）
			expect(mockGetSubscriptionsList).toHaveBeenCalledWith(mockDb, {
				isActive: undefined,
			});
		});

		it("アクティブなサブスクリプションのみを取得できること", async () => {
			const mockActiveSubscriptions = [
				{
					id: 1,
					name: "Spotify",
					amount: 980,
					frequency: "monthly" as const,
					categoryId: 1,
					nextPaymentDate: "2024-02-01",
					description: "音楽配信サービス",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: {
						id: 1,
						name: "エンターテイメント",
						type: "expense" as const,
						color: "#FF0000",
						icon: "entertainment",
						displayOrder: 1,
						isActive: true,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				},
				{
					id: 2,
					name: "給与振込",
					amount: 250000,
					frequency: "monthly" as const,
					categoryId: 2,
					nextPaymentDate: "2024-02-25",
					description: "月給",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: {
						id: 2,
						name: "給与",
						type: "income" as const,
						color: "#00FF00",
						icon: "salary",
						displayOrder: 1,
						isActive: true,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				},
			];

			mockGetSubscriptionsList.mockResolvedValue(mockActiveSubscriptions);

			// activeパラメータ付きでテスト実行
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=true",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData).toEqual({
				success: true,
				data: mockActiveSubscriptions,
				count: 2,
				filters: {
					active: true,
				},
			});

			// activeフィルタが適用されることを確認
			expect(mockGetSubscriptionsList).toHaveBeenCalledWith(mockDb, {
				isActive: true,
			});
		});

		it("非アクティブなサブスクリプションのみを取得できること", async () => {
			const mockInactiveSubscriptions = [
				{
					id: 3,
					name: "解約済みサービス",
					amount: 1200,
					frequency: "monthly" as const,
					categoryId: 1,
					nextPaymentDate: "2024-01-01",
					description: "解約済み",
					isActive: false,
					autoGenerate: false,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: {
						id: 1,
						name: "エンターテイメント",
						type: "expense" as const,
						color: "#FF0000",
						icon: "entertainment",
						displayOrder: 1,
						isActive: true,
						createdAt: "2024-01-01T00:00:00.000Z",
						updatedAt: "2024-01-01T00:00:00.000Z",
					},
				},
			];

			mockGetSubscriptionsList.mockResolvedValue(mockInactiveSubscriptions);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=false",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			const responseData = await response.json();
			expect(responseData.filters.active).toBe(false);
			expect(responseData.count).toBe(1);

			// 非アクティブフィルタが適用されることを確認
			expect(mockGetSubscriptionsList).toHaveBeenCalledWith(mockDb, {
				isActive: false,
			});
		});

		it("空の結果を正常に返せること", async () => {
			mockGetSubscriptionsList.mockResolvedValue([]);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.data).toEqual([]);
			expect(responseData.count).toBe(0);
		});

		it("カテゴリなしのサブスクリプションを取得できること", async () => {
			const mockSubscriptionsWithoutCategory = [
				{
					id: 4,
					name: "その他サービス",
					amount: 800,
					frequency: "monthly" as const,
					categoryId: null,
					nextPaymentDate: "2024-02-01",
					description: "カテゴリ未設定",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: null,
				},
			];

			mockGetSubscriptionsList.mockResolvedValue(
				mockSubscriptionsWithoutCategory,
			);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.data[0].category).toBe(null);
		});

		it("様々な頻度のサブスクリプションを取得できること", async () => {
			const mockVariousFrequencySubscriptions = [
				{
					id: 1,
					name: "日次サービス",
					amount: 100,
					frequency: "daily" as const,
					categoryId: null,
					nextPaymentDate: "2024-01-02",
					description: "毎日課金",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: null,
				},
				{
					id: 2,
					name: "週次サービス",
					amount: 500,
					frequency: "weekly" as const,
					categoryId: null,
					nextPaymentDate: "2024-01-08",
					description: "毎週課金",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: null,
				},
				{
					id: 3,
					name: "年次サービス",
					amount: 12000,
					frequency: "yearly" as const,
					categoryId: null,
					nextPaymentDate: "2025-01-01",
					description: "年払い",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: null,
				},
			];

			mockGetSubscriptionsList.mockResolvedValue(
				mockVariousFrequencySubscriptions,
			);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.count).toBe(3);
			
			// 各頻度のサブスクリプションが含まれることを確認
			const frequencies = responseData.data.map((sub: any) => sub.frequency);
			expect(frequencies).toContain("daily");
			expect(frequencies).toContain("weekly");
			expect(frequencies).toContain("yearly");
		});
	});

	describe("バリデーションエラーテスト", () => {
		it("無効なactiveパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=invalid",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
			const responseData = await response.json();
			expect(responseData.error).toBe("無効なクエリパラメータです");
			expect(responseData.details).toBeDefined();

			// データベースクエリは実行されないこと
			expect(mockGetSubscriptionsList).not.toHaveBeenCalled();
		});

		it("数値のactiveパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=1",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
		});

		it("空のactiveパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
		});

		it("大文字小文字が正しくないactiveパラメータで400エラーを返すこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=TRUE",
			);
			const response = await loader(args);

			expect(response.status).toBe(400);
		});
	});

	describe("エラーハンドリングテスト", () => {
		it("データベースエラー時に500エラーを返すこと", async () => {
			mockGetSubscriptionsList.mockRejectedValue(
				new Error("Database connection failed"),
			);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"サブスクリプション一覧の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("Database connection failed");
		});

		it("予期しないエラー時に500エラーを返すこと", async () => {
			mockGetSubscriptionsList.mockRejectedValue("Unexpected error");

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.error).toBe(
				"サブスクリプション一覧の取得中にエラーが発生しました",
			);
			expect(responseData.details).toBe("不明なエラー");
		});

		it("タイムアウトエラー時に500エラーを返すこと", async () => {
			mockGetSubscriptionsList.mockRejectedValue(new Error("Timeout"));

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			expect(response.status).toBe(500);
			const responseData = await response.json();
			expect(responseData.details).toBe("Timeout");
		});
	});

	describe("複数クエリパラメータテスト", () => {
		it("有効なactiveと無関係なパラメータを適切に処理すること", async () => {
			const mockSubscriptions = [
				{
					id: 1,
					name: "テストサービス",
					amount: 1000,
					frequency: "monthly" as const,
					categoryId: null,
					nextPaymentDate: "2024-02-01",
					description: "テスト",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: null,
				},
			];

			mockGetSubscriptionsList.mockResolvedValue(mockSubscriptions);

			// 無関係なパラメータも含む
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=true&ignore=this&other=param",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);
			const responseData = await response.json();
			expect(responseData.filters.active).toBe(true);

			// activeパラメータのみが使用されることを確認
			expect(mockGetSubscriptionsList).toHaveBeenCalledWith(mockDb, {
				isActive: true,
			});
		});

		it("複数のactiveパラメータが指定された場合最初の値を使用すること", async () => {
			mockGetSubscriptionsList.mockResolvedValue([]);

			// URLSearchParamsは最初の値を取得するため、trueが使われる
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=true&active=false",
			);
			const response = await loader(args);

			expect(response.status).toBe(200);

			// 最初のactive値（true）が使用されることを確認
			expect(mockGetSubscriptionsList).toHaveBeenCalledWith(mockDb, {
				isActive: true,
			});
		});
	});

	describe("レスポンス形式テスト", () => {
		it("正常なレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			mockGetSubscriptionsList.mockResolvedValue([]);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("エラーレスポンスが正しいContent-Typeヘッダーを持つこと", async () => {
			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions?active=invalid",
			);
			const response = await loader(args);

			expect(response.headers.get("Content-Type")).toBe("application/json");
		});

		it("正常なレスポンスがAPI形式に準拠していること", async () => {
			const mockSubscriptions = [
				{
					id: 1,
					name: "テスト",
					amount: 1000,
					frequency: "monthly" as const,
					categoryId: null,
					nextPaymentDate: "2024-02-01",
					description: "テスト",
					isActive: true,
					autoGenerate: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
					category: null,
				},
			];

			mockGetSubscriptionsList.mockResolvedValue(mockSubscriptions);

			const args = createMockLoaderArgs(
				"http://localhost:3000/api/subscriptions",
			);
			const response = await loader(args);

			const responseData = await response.json();

			// API形式に準拠していることを確認
			expect(responseData).toHaveProperty("success", true);
			expect(responseData).toHaveProperty("data");
			expect(responseData).toHaveProperty("count");
			expect(responseData).toHaveProperty("filters");
			expect(Array.isArray(responseData.data)).toBe(true);
			expect(typeof responseData.count).toBe("number");
			expect(typeof responseData.filters).toBe("object");
		});
	});
});