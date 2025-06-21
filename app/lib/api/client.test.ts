/**
 * ApiClientクラスのユニットテスト
 *
 * テスト対象:
 * - ApiClientクラスの基本的なHTTPメソッド（GET、POST、PUT、DELETE）
 * - タイムアウト処理とAbortController機能
 * - エラーハンドリング（ネットワークエラー、HTTPエラー、バリデーションエラー）
 * - Zodスキーマによるレスポンスバリデーション
 * - リクエスト/レスポンスインターセプター機能
 * - クライアント設定の更新とカスタマイズ
 *
 * 設計方針:
 * - fetchAPIモックを使用してHTTPリクエストを制御
 * - 実際のネットワークを使わずに完全にユニットテスト化
 * - エラーケースを網羅的にテスト
 * - タイムアウトとAbortControllerの動作確認
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { mockFetch } from "../../../tests/setup";
import {
	ApiClient,
	type ApiClientConfig,
	ApiError,
	ValidationError,
	buildQueryParams,
	isApiError,
	isValidationError,
} from "./client";

// ========================================
// テスト用のスキーマ定義
// ========================================

const testResponseSchema = z.object({
	id: z.number(),
	name: z.string(),
	email: z.string().email(),
});

const testListResponseSchema = z.object({
	success: z.literal(true),
	data: z.array(testResponseSchema),
	count: z.number(),
});

const testErrorResponseSchema = z.object({
	error: z.string(),
	details: z.string().optional(),
});

type TestResponse = z.infer<typeof testResponseSchema>;
type TestListResponse = z.infer<typeof testListResponseSchema>;

// ========================================
// テストデータ
// ========================================

const mockUser: TestResponse = {
	id: 1,
	name: "Test User",
	email: "test@example.com",
};

const mockUserList: TestListResponse = {
	success: true,
	data: [mockUser],
	count: 1,
};

const mockErrorResponse = {
	error: "テストエラー",
	details: "エラーの詳細情報",
};

// ========================================
// テストスイート
// ========================================

describe("ApiClient", () => {
	let apiClient: ApiClient;

	beforeEach(() => {
		vi.clearAllMocks();
		apiClient = new ApiClient({
			baseUrl: "http://localhost:3000/api",
			timeout: 5000,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	// ========================================
	// 基本的なHTTPメソッドのテスト
	// ========================================

	describe("GET requests", () => {
		it("GET リクエストを正常に処理できること", async () => {
			mockFetch(mockUser);

			const result = await apiClient.get("/users/1", testResponseSchema);

			expect(result).toEqual(mockUser);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users/1",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		it("GET リクエストで配列データを正常に処理できること", async () => {
			mockFetch(mockUserList);

			const result = await apiClient.get("/users", testListResponseSchema);

			expect(result).toEqual(mockUserList);
		});

		it("GET リクエストでスキーマバリデーションエラーを処理できること", async () => {
			const invalidResponse = {
				id: "invalid", // 数値であるべき
				name: "Test User",
				email: "invalid-email", // 有効なメールアドレスではない
			};

			mockFetch(invalidResponse);

			await expect(
				apiClient.get("/users/1", testResponseSchema),
			).rejects.toThrow(ApiError);

			try {
				await apiClient.get("/users/1", testResponseSchema);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect((error as ApiError).status).toBe(500);
				expect((error as ApiError).message).toBe(
					"レスポンスの検証に失敗しました",
				);
				expect((error as ApiError).originalError).toBeInstanceOf(
					ValidationError,
				);
			}
		});
	});

	describe("POST requests", () => {
		it("POST リクエストを正常に処理できること", async () => {
			const requestData = {
				name: "New User",
				email: "new@example.com",
			};

			mockFetch(mockUser);

			const result = await apiClient.post(
				"/users",
				requestData,
				testResponseSchema,
			);

			expect(result).toEqual(mockUser);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify(requestData),
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
				}),
			);
		});

		it("POST リクエストで空のボディを送信できること", async () => {
			mockFetch(mockUser);

			const result = await apiClient.post("/users", {}, testResponseSchema);

			expect(result).toEqual(mockUser);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users",
				expect.objectContaining({
					method: "POST",
					body: JSON.stringify({}),
				}),
			);
		});
	});

	describe("PUT requests", () => {
		it("PUT リクエストを正常に処理できること", async () => {
			const updateData = {
				name: "Updated User",
				email: "updated@example.com",
			};

			mockFetch(mockUser);

			const result = await apiClient.put(
				"/users/1",
				updateData,
				testResponseSchema,
			);

			expect(result).toEqual(mockUser);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users/1",
				expect.objectContaining({
					method: "PUT",
					body: JSON.stringify(updateData),
				}),
			);
		});
	});

	describe("DELETE requests", () => {
		it("DELETE リクエストを正常に処理できること", async () => {
			const deleteResponse = { success: true };
			const deleteSchema = z.object({ success: z.boolean() });

			mockFetch(deleteResponse);

			const result = await apiClient.delete("/users/1", deleteSchema);

			expect(result).toEqual(deleteResponse);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users/1",
				expect.objectContaining({
					method: "DELETE",
				}),
			);
		});
	});

	// ========================================
	// エラーハンドリングのテスト
	// ========================================

	describe("Error handling", () => {
		it("404エラーを適切に処理できること", async () => {
			mockFetch(mockErrorResponse, { status: 404, ok: false });

			await expect(
				apiClient.get("/users/999", testResponseSchema),
			).rejects.toThrow(ApiError);

			try {
				await apiClient.get("/users/999", testResponseSchema);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect((error as ApiError).status).toBe(404);
				expect((error as ApiError).message).toBe("テストエラー");
			}
		});

		it("500エラーを適切に処理できること", async () => {
			mockFetch(mockErrorResponse, { status: 500, ok: false });

			await expect(
				apiClient.get("/users/1", testResponseSchema),
			).rejects.toThrow(ApiError);

			try {
				await apiClient.get("/users/1", testResponseSchema);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect((error as ApiError).status).toBe(500);
			}
		});

		it("ネットワークエラーを適切に処理できること", async () => {
			const networkError = new Error("Network Error");
			(global.fetch as any).mockRejectedValue(networkError);

			await expect(
				apiClient.get("/users/1", testResponseSchema),
			).rejects.toThrow(ApiError);

			try {
				await apiClient.get("/users/1", testResponseSchema);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect((error as ApiError).status).toBe(0);
				expect((error as ApiError).message).toBe(
					"ネットワークエラーが発生しました",
				);
			}
		});

		it("JSONパースエラーのあるHTTPエラーを処理できること", async () => {
			// JSONではないレスポンスボディを返すモック
			const mockResponse = {
				ok: false,
				status: 400,
				json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
				text: vi.fn().mockResolvedValue("Bad Request"),
				headers: new Headers(),
				redirected: false,
				statusText: "Bad Request",
				type: "basic" as ResponseType,
				url: "",
				clone: vi.fn(),
				body: null,
				bodyUsed: false,
				arrayBuffer: vi.fn(),
				blob: vi.fn(),
				formData: vi.fn(),
			};

			(global.fetch as any).mockResolvedValue(mockResponse);

			await expect(
				apiClient.get("/users/1", testResponseSchema),
			).rejects.toThrow(ApiError);

			try {
				await apiClient.get("/users/1", testResponseSchema);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect((error as ApiError).status).toBe(400);
				expect((error as ApiError).message).toBe("HTTPエラー: 400");
			}
		});

		it("バリデーションエラーがApiErrorに変換されること", async () => {
			const invalidResponse = {
				id: "invalid",
				name: "Test User",
				email: "invalid-email",
			};

			mockFetch(invalidResponse);

			await expect(
				apiClient.get("/users/1", testResponseSchema),
			).rejects.toThrow(ApiError);

			try {
				await apiClient.get("/users/1", testResponseSchema);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect((error as ApiError).status).toBe(500);
				expect((error as ApiError).message).toBe(
					"レスポンスの検証に失敗しました",
				);
				expect((error as ApiError).originalError).toBeInstanceOf(
					ValidationError,
				);
			}
		});
	});

	// ========================================
	// タイムアウト処理のテスト
	// ========================================

	describe("Timeout handling", () => {
		it("タイムアウト時にAbortErrorを処理できること", async () => {
			// AbortErrorをシミュレート
			const abortError = new Error("The operation was aborted");
			abortError.name = "AbortError";

			(global.fetch as any).mockRejectedValue(abortError);

			const shortTimeoutClient = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				timeout: 100, // 100ms でタイムアウト
			});

			await expect(
				shortTimeoutClient.get("/users/1", testResponseSchema),
			).rejects.toThrow(ApiError);

			try {
				await shortTimeoutClient.get("/users/1", testResponseSchema);
			} catch (error) {
				expect(error).toBeInstanceOf(ApiError);
				expect((error as ApiError).status).toBe(408);
				expect((error as ApiError).message).toBe(
					"リクエストがタイムアウトしました",
				);
			}
		});

		it("cancelRequestでリクエストをキャンセルできること", async () => {
			// AbortErrorをシミュレート
			const abortError = new Error("The operation was aborted");
			abortError.name = "AbortError";

			(global.fetch as any).mockRejectedValue(abortError);

			const promise = apiClient.get("/users/1", testResponseSchema);

			// キャンセル（実際にはfetchがAbortErrorで失敗する）
			apiClient.cancelRequest();

			await expect(promise).rejects.toThrow(ApiError);
		});
	});

	// ========================================
	// 設定とカスタマイズのテスト
	// ========================================

	describe("Configuration and customization", () => {
		it("カスタムヘッダーを設定できること", async () => {
			const customClient = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				headers: {
					Authorization: "Bearer token123",
					"X-Custom-Header": "custom-value",
				},
			});

			mockFetch(mockUser);

			await customClient.get("/users/1", testResponseSchema);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users/1",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						Authorization: "Bearer token123",
						"X-Custom-Header": "custom-value",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		it("updateConfigで設定を動的に更新できること", async () => {
			mockFetch(mockUser);

			// 初期設定で実行
			await apiClient.get("/users/1", testResponseSchema);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users/1",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
					}),
					signal: expect.any(AbortSignal),
				}),
			);

			// 設定を更新
			apiClient.updateConfig({
				headers: {
					Authorization: "Bearer updated-token",
				},
			});

			vi.clearAllMocks();
			mockFetch(mockUser);

			await apiClient.get("/users/1", testResponseSchema);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users/1",
				expect.objectContaining({
					method: "GET",
					headers: expect.objectContaining({
						"Content-Type": "application/json",
						Authorization: "Bearer updated-token",
					}),
					signal: expect.any(AbortSignal),
				}),
			);
		});

		it("リクエストインターセプターが正常に動作すること", async () => {
			const onRequest = vi.fn((request: RequestInit) => ({
				...request,
				headers: {
					...request.headers,
					"X-Intercepted": "true",
				},
			}));

			const interceptClient = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				onRequest,
			});

			mockFetch(mockUser);

			await interceptClient.get("/users/1", testResponseSchema);

			expect(onRequest).toHaveBeenCalledTimes(1);
			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:3000/api/users/1",
				expect.objectContaining({
					headers: expect.objectContaining({
						"X-Intercepted": "true",
					}),
				}),
			);
		});

		it("レスポンスインターセプターが正常に動作すること", async () => {
			const onResponse = vi.fn((response: Response) => response);

			const interceptClient = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				onResponse,
			});

			mockFetch(mockUser);

			await interceptClient.get("/users/1", testResponseSchema);

			expect(onResponse).toHaveBeenCalledTimes(1);
			expect(onResponse).toHaveBeenCalledWith(expect.any(Object));
		});

		it("エラーインターセプターが正常に動作すること", async () => {
			const onError = vi.fn();

			const interceptClient = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				onError,
			});

			mockFetch(mockErrorResponse, { status: 400, ok: false });

			await expect(
				interceptClient.get("/users/1", testResponseSchema),
			).rejects.toThrow();

			expect(onError).toHaveBeenCalledTimes(1);
			expect(onError).toHaveBeenCalledWith(expect.any(ApiError));
		});
	});

	// ========================================
	// 複合テスト
	// ========================================

	describe("Integration tests", () => {
		it("カスタム設定とエラーハンドリングの組み合わせテスト", async () => {
			const onError = vi.fn();
			const onRequest = vi.fn((req: RequestInit) => req);

			const complexClient = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				timeout: 1000,
				headers: {
					Authorization: "Bearer token",
				},
				onRequest,
				onError,
			});

			mockFetch(mockErrorResponse, { status: 401, ok: false });

			await expect(
				complexClient.get("/users/1", testResponseSchema),
			).rejects.toThrow(ApiError);

			expect(onRequest).toHaveBeenCalled();
			expect(onError).toHaveBeenCalledWith(expect.any(ApiError));
		});

		it("連続したリクエストが正常に処理されること", async () => {
			mockFetch(mockUser);

			const results = await Promise.all([
				apiClient.get("/users/1", testResponseSchema),
				apiClient.get("/users/2", testResponseSchema),
				apiClient.get("/users/3", testResponseSchema),
			]);

			expect(results).toHaveLength(3);
			expect(results.every((result) => result.id === mockUser.id)).toBe(true);
			expect(fetch).toHaveBeenCalledTimes(3);
		});
	});
});

// ========================================
// ユーティリティ関数のテスト
// ========================================

describe("Utility functions", () => {
	describe("buildQueryParams", () => {
		it("空のオブジェクトから空文字列を返すこと", () => {
			const result = buildQueryParams({});
			expect(result).toBe("");
		});

		it("基本的なパラメータを正しく構築できること", () => {
			const params = {
				name: "test",
				age: 25,
				active: true,
			};

			const result = buildQueryParams(params);
			expect(result).toBe("?name=test&age=25&active=true");
		});

		it("undefined値を無視すること", () => {
			const params = {
				name: "test",
				age: undefined,
				active: true,
			};

			const result = buildQueryParams(params);
			expect(result).toBe("?name=test&active=true");
		});

		it("特殊文字をエンコードできること", () => {
			const params = {
				search: "test with spaces",
				email: "user@example.com",
			};

			const result = buildQueryParams(params);
			expect(result).toBe("?search=test+with+spaces&email=user%40example.com");
		});
	});

	describe("isApiError", () => {
		it("ApiErrorインスタンスに対してtrueを返すこと", () => {
			const error = new ApiError("Test error", 400);
			expect(isApiError(error)).toBe(true);
		});

		it("特定のステータスコードをチェックできること", () => {
			const error = new ApiError("Test error", 404);
			expect(isApiError(error, 404)).toBe(true);
			expect(isApiError(error, 500)).toBe(false);
		});

		it("通常のErrorに対してfalseを返すこと", () => {
			const error = new Error("Regular error");
			expect(isApiError(error)).toBe(false);
		});
	});

	describe("isValidationError", () => {
		it("ValidationErrorインスタンスに対してtrueを返すこと", () => {
			const zodError = z.string().safeParse(123);
			if (!zodError.success) {
				const error = new ValidationError("Validation failed", zodError.error);
				expect(isValidationError(error)).toBe(true);
			}
		});

		it("通常のErrorに対してfalseを返すこと", () => {
			const error = new Error("Regular error");
			expect(isValidationError(error)).toBe(false);
		});
	});

	// ========================================
	// AbortController 修正後の新しいテスト
	// ========================================

	describe("Enhanced AbortController functionality", () => {
		it("複数の同時リクエストが独立したAbortControllerを使用すること", async () => {
			// 長時間のリクエストをシミュレート
			const longRequest = new Promise((resolve) => {
				setTimeout(() => resolve(mockUser), 1000);
			});
			(global.fetch as any).mockImplementation(() => longRequest);

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				timeout: 5000,
			});

			// 複数のリクエストを同時に開始
			const request1 = client.get("/users/1", testResponseSchema);
			const request2 = client.get("/users/2", testResponseSchema);
			const request3 = client.get("/users/3", testResponseSchema);

			// 同時リクエストが管理されていることを確認
			expect(client.getActiveRequestCount()).toBe(3);

			// すべてのリクエストをキャンセル
			client.cancelRequest();

			// キャンセル後、アクティブリクエストがクリアされていることを確認
			expect(client.getActiveRequestCount()).toBe(0);

			// リクエストがキャンセルされることを確認
			await expect(request1).rejects.toThrow();
			await expect(request2).rejects.toThrow();
			await expect(request3).rejects.toThrow();
		});

		it("リクエスト完了後にアクティブリクエストから自動削除されること", async () => {
			mockFetch(mockUser);

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
			});

			// リクエスト開始前はアクティブリクエストが0
			expect(client.getActiveRequestCount()).toBe(0);

			// リクエスト実行
			const result = await client.get("/users/1", testResponseSchema);

			// リクエスト完了後はアクティブリクエストが再び0
			expect(client.getActiveRequestCount()).toBe(0);
			expect(result).toEqual(mockUser);
		});

		it("エラー発生時もアクティブリクエストから削除されること", async () => {
			mockFetch(mockErrorResponse, { status: 500, ok: false });

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
			});

			// リクエスト開始前はアクティブリクエストが0
			expect(client.getActiveRequestCount()).toBe(0);

			// エラーが発生するリクエスト
			await expect(
				client.get("/users/1", testResponseSchema),
			).rejects.toThrow();

			// エラー後もアクティブリクエストが適切にクリアされている
			expect(client.getActiveRequestCount()).toBe(0);
		});

		it("タイムアウトIDが確実にクリアされること", async () => {
			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

			mockFetch(mockUser);

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				timeout: 1000,
			});

			await client.get("/users/1", testResponseSchema);

			// clearTimeoutが呼ばれていることを確認
			expect(clearTimeoutSpy).toHaveBeenCalled();

			clearTimeoutSpy.mockRestore();
		});

		it("タイムアウトエラー時もタイムアウトIDがクリアされること", async () => {
			const clearTimeoutSpy = vi.spyOn(global, "clearTimeout");

			// AbortErrorをシミュレート
			const abortError = new Error("The operation was aborted");
			abortError.name = "AbortError";
			(global.fetch as any).mockRejectedValue(abortError);

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				timeout: 100,
			});

			await expect(
				client.get("/users/1", testResponseSchema),
			).rejects.toThrow();

			// エラー時でもclearTimeoutが呼ばれていることを確認
			expect(clearTimeoutSpy).toHaveBeenCalled();

			clearTimeoutSpy.mockRestore();
		});

		it("個別リクエストIDによるキャンセルが機能すること", async () => {
			// 長時間のリクエストをシミュレート
			const longRequest = new Promise((resolve) => {
				setTimeout(() => resolve(mockUser), 1000);
			});
			(global.fetch as any).mockImplementation(() => longRequest);

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				timeout: 5000,
			});

			// 複数のリクエストを開始
			const request1 = client.get("/users/1", testResponseSchema);
			const request2 = client.get("/users/2", testResponseSchema);

			expect(client.getActiveRequestCount()).toBe(2);

			// 存在しないIDのキャンセルは失敗
			expect(client.cancelRequestById("non-existent")).toBe(false);

			// アクティブリクエスト数は変わらない
			expect(client.getActiveRequestCount()).toBe(2);

			// 全リクエストをキャンセル
			client.cancelRequest();
			expect(client.getActiveRequestCount()).toBe(0);
		});

		it("cancelRequestByIdが正しく動作し、アクティブリクエスト数が減ることを確認", async () => {
			// AbortErrorをシミュレートして、キャンセル動作を確認
			const abortError = new Error("The operation was aborted");
			abortError.name = "AbortError";

			// fetchが呼ばれた回数をカウント
			let fetchCallCount = 0;
			const mockFetchWithAbort = vi.fn().mockImplementation(() => {
				fetchCallCount++;
				if (fetchCallCount === 1) {
					// 最初のリクエストは中断される
					return Promise.reject(abortError);
				}
				// 2番目以降のリクエストは成功
				return Promise.resolve({
					ok: true,
					json: () => Promise.resolve(mockUser),
				});
			});
			(global.fetch as any) = mockFetchWithAbort;

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
				timeout: 5000,
			});

			// crypto.randomUUIDをモックして、予測可能なIDを返すようにする
			const originalRandomUUID = crypto.randomUUID;
			let idCounter = 0;
			// @ts-ignore - テスト用のモック
			crypto.randomUUID = vi.fn(() => `test-request-${++idCounter}`);

			try {
				// 複数のリクエストを開始
				const request1 = client.get("/users/1", testResponseSchema);
				const request2 = client.get("/users/2", testResponseSchema);

				// アクティブリクエスト数を確認
				expect(client.getActiveRequestCount()).toBe(2);

				// 予測可能なIDで最初のリクエストをキャンセル
				const cancelResult = client.cancelRequestById("test-request-1");
				expect(cancelResult).toBe(true);

				// アクティブリクエスト数が1つ減ることを確認
				expect(client.getActiveRequestCount()).toBe(1);

				// キャンセルされたリクエストはAbortErrorで失敗する
				await expect(request1).rejects.toThrow(ApiError);

				// 2番目のリクエストは正常に完了する可能性がある
				// (ただし、タイミングによってはAbortされる場合もある)
				try {
					await request2;
				} catch (error) {
					// リクエストがタイミングによってキャンセルされる場合があるため、エラーも許容
					expect(error).toBeInstanceOf(ApiError);
				}
			} finally {
				// crypto.randomUUIDを復元
				crypto.randomUUID = originalRandomUUID;
			}
		});

		it("crypto.randomUUIDが利用可能でない環境でも動作すること", async () => {
			// crypto.randomUUIDを一時的に無効にする
			const originalRandomUUID = crypto.randomUUID;
			// @ts-ignore
			crypto.randomUUID = undefined;

			mockFetch(mockUser);

			const client = new ApiClient({
				baseUrl: "http://localhost:3000/api",
			});

			// エラーなく実行できることを確認
			const result = await client.get("/users/1", testResponseSchema);
			expect(result).toEqual(mockUser);

			// crypto.randomUUIDを復元
			crypto.randomUUID = originalRandomUUID;
		});
	});
});
