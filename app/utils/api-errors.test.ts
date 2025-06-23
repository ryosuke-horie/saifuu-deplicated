/**
 * API エラーハンドリングユーティリティのテスト
 *
 * 設計方針:
 * - 各種データベースエラーパターンの診断機能をテスト
 * - 本番環境と開発環境での異なるレスポンス形式を検証
 * - D1バインディング関連エラーの正確な診断をテスト
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	checkDatabaseHealth,
	createErrorResponse,
	createSuccessResponse,
	diagnoseError,
} from "./api-errors";

// モックD1データベース
const createMockD1 = (
	options: {
		shouldPrepareThrow?: boolean;
		shouldQueryFail?: boolean;
		shouldMissingTables?: boolean;
	} = {},
) => {
	const mockD1 = {
		prepare: vi.fn().mockImplementation((query: string) => {
			if (options.shouldPrepareThrow) {
				throw new Error("D1 prepare failed");
			}

			return {
				first: vi.fn().mockImplementation(async () => {
					if (options.shouldQueryFail) {
						throw new Error("Query execution failed");
					}

					if (query.includes("SELECT 1")) {
						return { test: 1 };
					}

					return null;
				}),
				all: vi.fn().mockImplementation(async () => {
					if (options.shouldQueryFail) {
						throw new Error("Query execution failed");
					}

					if (query.includes("sqlite_master")) {
						if (options.shouldMissingTables) {
							return { results: [] }; // テーブルが存在しない
						}
						return {
							results: [
								{ name: "categories" },
								{ name: "transactions" },
								{ name: "subscriptions" },
							],
						};
					}

					return { results: [] };
				}),
			};
		}),
	};

	return mockD1 as unknown as D1Database;
};

describe("API Error Handling", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		// 環境変数をクリア
		vi.stubEnv("NODE_ENV", undefined);
	});

	describe("diagnoseError", () => {
		it("D1バインディングが存在しない場合のエラー診断", () => {
			const error = new Error("Database connection failed");
			const result = diagnoseError(error);

			expect(result.errorType).toBe("D1_BINDING_MISSING");
			expect(result.userMessage).toBe("データベース接続の設定に問題があります");
			expect(result.suggestions).toContain(
				"wrangler.toml または wrangler.jsonc でD1バインディングが正しく設定されているか確認してください",
			);
			expect(result.healthStatus).toBe("unhealthy");
			expect(result.technicalDetails?.bindingExists).toBe(false);
		});

		it("D1バインディングが無効な場合のエラー診断", () => {
			const invalidD1 = {} as D1Database; // prepareメソッドがない
			const error = new Error("Invalid binding");
			const result = diagnoseError(error, invalidD1);

			expect(result.errorType).toBe("D1_BINDING_INVALID");
			expect(result.debugMessage).toContain("prepareメソッドが存在しません");
			expect(result.suggestions).toContain(
				"D1バインディングが正しい型で設定されているか確認してください",
			);
			expect(result.healthStatus).toBe("unhealthy");
		});

		it("テーブル不存在エラーの診断", () => {
			const mockD1 = createMockD1();
			const error = new Error("no such table: transactions");
			const result = diagnoseError(error, mockD1);

			expect(result.errorType).toBe("MIGRATION_FAILED");
			expect(result.debugMessage).toContain("必要なテーブルが存在しません");
			expect(result.suggestions).toContain(
				"データベースマイグレーションが正しく実行されているか確認してください",
			);
			expect(result.healthStatus).toBe("degraded");
		});

		it("データベースロックエラーの診断", () => {
			const mockD1 = createMockD1();
			const error = new Error("database is locked");
			const result = diagnoseError(error, mockD1);

			expect(result.errorType).toBe("DATABASE_LOCKED");
			expect(result.userMessage).toBe("データベースが一時的に利用できません");
			expect(result.suggestions).toContain(
				"少し時間をおいて再試行してください",
			);
			expect(result.technicalDetails?.retryable).toBe(true);
			expect(result.healthStatus).toBe("degraded");
		});

		it("一般的なSQLエラーの診断", () => {
			const mockD1 = createMockD1();
			const error = new Error("SQLITE_CONSTRAINT: UNIQUE constraint failed");
			const result = diagnoseError(error, mockD1);

			expect(result.errorType).toBe("QUERY_EXECUTION_FAILED");
			expect(result.debugMessage).toContain("SQLクエリの実行に失敗しました");
			expect(result.suggestions).toContain(
				"データベーススキーマが最新の状態か確認してください",
			);
			expect(result.healthStatus).toBe("degraded");
		});

		it("不明なエラーの診断", () => {
			const mockD1 = createMockD1();
			const error = new Error("Unknown error occurred");
			const result = diagnoseError(error, mockD1);

			expect(result.errorType).toBe("UNKNOWN_DATABASE_ERROR");
			expect(result.userMessage).toBe(
				"データベース処理中に予期しないエラーが発生しました",
			);
			expect(result.suggestions).toContain("エラーログを確認してください");
			expect(result.healthStatus).toBe("unhealthy");
		});
	});

	describe("checkDatabaseHealth", () => {
		it("健全なデータベースの場合", async () => {
			const mockD1 = createMockD1();
			const result = await checkDatabaseHealth(mockD1);

			expect(result.isHealthy).toBe(true);
			expect(result.status).toBe("healthy");
			expect(result.diagnostics).toContain("データベース接続正常");
		});

		it("D1バインディングが存在しない場合", async () => {
			const result = await checkDatabaseHealth();

			expect(result.isHealthy).toBe(false);
			expect(result.status).toBe("unhealthy");
			expect(result.diagnostics).toContain(
				"D1バインディングが見つかりません（開発環境またはバインディング設定エラー）",
			);
		});

		it("D1バインディングが無効な場合", async () => {
			const invalidD1 = {} as D1Database;
			const result = await checkDatabaseHealth(invalidD1);

			expect(result.isHealthy).toBe(false);
			expect(result.status).toBe("unhealthy");
			expect(result.diagnostics).toContain(
				"D1バインディングが無効です（prepareメソッドが存在しません）",
			);
		});

		it("基本クエリが失敗する場合", async () => {
			const mockD1 = createMockD1({ shouldQueryFail: true });
			const result = await checkDatabaseHealth(mockD1);

			expect(result.isHealthy).toBe(false);
			expect(result.status).toBe("unhealthy");
			expect(
				result.diagnostics.some((d) =>
					d.includes("データベース健全性チェック中にエラー"),
				),
			).toBe(true);
		});

		it("必要なテーブルが存在しない場合", async () => {
			const mockD1 = createMockD1({ shouldMissingTables: true });
			const result = await checkDatabaseHealth(mockD1);

			expect(result.isHealthy).toBe(false);
			expect(result.status).toBe("degraded");
			expect(result.diagnostics).toContain(
				"必要なテーブルが見つかりません: categories, transactions, subscriptions",
			);
			expect(result.diagnostics).toContain(
				"マイグレーションが未実行の可能性があります",
			);
		});
	});

	describe("createErrorResponse", () => {
		it("開発環境では詳細な診断情報を含む", async () => {
			process.env.NODE_ENV = "development";
			const mockD1 = createMockD1();
			const error = new Error("Test error");

			const response = await createErrorResponse(error, "テストエラー", mockD1);
			const body = JSON.parse(await response.text());

			expect(response.status).toBe(500);
			expect(body.error).toBe("テストエラー");
			expect(body.errorType).toBe("UNKNOWN_DATABASE_ERROR");
			expect(body.debugInfo).toBeDefined();
			expect(body.debugInfo.debugMessage).toContain("不明なエラー: Test error");
			expect(body.debugInfo.suggestions).toBeDefined();
			expect(body.debugInfo.databaseHealth).toBeDefined();
			expect(body.debugInfo.databaseHealth.isHealthy).toBe(true);
		});

		it("本番環境では機密情報を除外", async () => {
			process.env.NODE_ENV = "production";
			const mockD1 = createMockD1();
			const error = new Error("Sensitive error information");

			const response = await createErrorResponse(error, "本番エラー", mockD1);
			const body = JSON.parse(await response.text());

			expect(response.status).toBe(500);
			expect(body.error).toBe("本番エラー");
			expect(body.errorType).toBe("UNKNOWN_DATABASE_ERROR");
			expect(body.debugInfo).toBeUndefined();
			expect(JSON.stringify(body)).not.toContain("Sensitive error information");
		});

		it("D1バインディングエラーの場合は503ステータスを返す", async () => {
			const error = new Error("D1 binding error");

			const response = await createErrorResponse(error, "バインディングエラー");
			const body = JSON.parse(await response.text());

			expect(response.status).toBe(503); // Service Unavailable
			expect(body.errorType).toBe("D1_BINDING_MISSING");
		});
	});

	describe("createSuccessResponse", () => {
		it("成功レスポンスの正しいフォーマット", async () => {
			const testData = [{ id: 1, name: "test" }];
			const additionalFields = { count: 1, total: 100 };

			const response = createSuccessResponse(testData, additionalFields);
			const body = JSON.parse(await response.text());

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.data).toEqual(testData);
			expect(body.count).toBe(1);
			expect(body.total).toBe(100);
		});

		it("追加フィールドなしでも正常に動作", async () => {
			const testData = { message: "success" };

			const response = createSuccessResponse(testData);
			const body = JSON.parse(await response.text());

			expect(response.status).toBe(200);
			expect(body.success).toBe(true);
			expect(body.data).toEqual(testData);
		});
	});
});
