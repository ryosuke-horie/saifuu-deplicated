import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 取引詳細ページ (/transactions/:id) のルートテスト
 *
 * 目的:
 * - メタデータ設定の検証
 * - ローダー関数のAPI呼び出しとエラーハンドリングテスト
 * - アクション関数の削除・更新処理テスト
 */

// 実際のルートファイルからエクスポートされた関数をテスト対象とする
import { action, loader, meta } from "./$id";

// fetchをモック化
global.fetch = vi.fn();

describe("取引詳細ページルート", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("meta関数", () => {
		it("取引データありで正しいメタデータを返すこと", () => {
			const data = {
				transaction: {
					id: 1,
					description: "テスト取引",
					amount: 1000,
					type: "expense",
				},
			};

			const result = meta({ data } as any);

			expect(result).toEqual([
				{ title: "取引詳細: テスト取引 | Saifuu" },
				{
					name: "description",
					content: "取引の詳細情報を表示・編集するページです。",
				},
			]);
		});

		it("取引データなしで基本メタデータを返すこと", () => {
			const data = null;

			const result = meta({ data } as any);

			expect(result).toEqual([
				{ title: "取引詳細: 取引 | Saifuu" },
				{
					name: "description",
					content: "取引の詳細情報を表示・編集するページです。",
				},
			]);
		});

		it("descriptionが空の場合デフォルト値を使用すること", () => {
			const data = {
				transaction: {
					id: 1,
					description: null,
					amount: 1000,
					type: "expense",
				},
			};

			const result = meta({ data } as any);

			expect(result).toEqual([
				{ title: "取引詳細: 取引 | Saifuu" },
				{
					name: "description",
					content: "取引の詳細情報を表示・編集するページです。",
				},
			]);
		});
	});

	describe("loader関数", () => {
		it("有効なIDで取引詳細を正常に取得すること", async () => {
			const mockTransactionData = {
				data: {
					id: 1,
					description: "テスト取引",
					amount: 1000,
					type: "expense",
					transactionDate: "2024-06-23",
					categoryId: 1,
					paymentMethod: "cash",
				},
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockTransactionData),
			});

			const params = { id: "1" };
			const result = await loader({ params } as any);

			// テスト環境では本番環境扱いになるため相対URLが使用される
			expect(fetch).toHaveBeenCalledWith("/api/transactions/1");
			expect(result).toEqual({
				transaction: mockTransactionData.data,
			});
		});

		it("IDが未指定で400エラーを返すこと", async () => {
			const params = {};

			try {
				await loader({ params } as any);
				expect.fail("エラーが発生するべき");
			} catch (error) {
				expect(error).toBeInstanceOf(Response);
				expect((error as Response).status).toBe(400);
			}
		});

		it("存在しないIDで500エラーを返すこと", async () => {
			(fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: () => Promise.resolve({}), // json メソッドを追加
			});

			const params = { id: "999" };

			try {
				await loader({ params } as any);
				expect.fail("エラーが発生するべき");
			} catch (error) {
				expect(error).toBeInstanceOf(Response);
				// 実装では404エラーをthrowしてもcatchブロックで500に変換される
				expect((error as Response).status).toBe(500);
			}
		});

		it("API通信エラーで500エラーを返すこと", async () => {
			(fetch as any).mockRejectedValueOnce(new Error("Network error"));

			const params = { id: "1" };

			try {
				await loader({ params } as any);
				expect.fail("エラーが発生するべき");
			} catch (error) {
				expect(error).toBeInstanceOf(Response);
				expect((error as Response).status).toBe(500);
			}
		});

		it("開発環境でローカルホスト付きURLを使用すること", async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "development";

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ data: { transaction: {} } }),
			});

			const params = { id: "1" };
			await loader({ params } as any);

			expect(fetch).toHaveBeenCalledWith(
				"http://localhost:5173/api/transactions/1",
			);

			process.env.NODE_ENV = originalEnv;
		});

		it("本番環境で相対URLを使用すること", async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = "production";

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ data: { transaction: {} } }),
			});

			const params = { id: "1" };
			await loader({ params } as any);

			expect(fetch).toHaveBeenCalledWith("/api/transactions/1");

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe("action関数", () => {
		it("削除アクションで正常にリダイレクトすること", async () => {
			(fetch as any).mockResolvedValueOnce({
				ok: true,
			});

			const formData = new FormData();
			formData.append("intent", "delete");

			const request = new Request("http://localhost:5173/transactions/1", {
				method: "POST",
				body: formData,
			});

			const params = { id: "1" };
			const result = await action({ request, params } as any);

			// テスト環境では本番環境扱いになるため相対URLが使用される
			expect(fetch).toHaveBeenCalledWith("/api/transactions/1/delete", {
				method: "DELETE",
			});
			expect(result).toBeInstanceOf(Response);
			expect(result.status).toBe(302);
			expect(result.headers.get("Location")).toBe("/transactions");
		});

		it("削除失敗で詳細ページにリダイレクトすること", async () => {
			(fetch as any).mockResolvedValueOnce({
				ok: false,
			});

			const formData = new FormData();
			formData.append("intent", "delete");

			const request = new Request("http://localhost:5173/transactions/1", {
				method: "POST",
				body: formData,
			});

			const params = { id: "1" };
			const result = await action({ request, params } as any);

			expect(result).toBeInstanceOf(Response);
			expect(result.status).toBe(302);
			expect(result.headers.get("Location")).toBe("/transactions/1");
		});

		it("削除でネットワークエラーが発生した場合詳細ページにリダイレクトすること", async () => {
			(fetch as any).mockRejectedValueOnce(new Error("Network error"));

			const formData = new FormData();
			formData.append("intent", "delete");

			const request = new Request("http://localhost:5173/transactions/1", {
				method: "POST",
				body: formData,
			});

			const params = { id: "1" };
			const result = await action({ request, params } as any);

			expect(result).toBeInstanceOf(Response);
			expect(result.status).toBe(302);
			expect(result.headers.get("Location")).toBe("/transactions/1");
		});

		it("編集アクション（intent未設定）で詳細ページにリダイレクトすること", async () => {
			const formData = new FormData();
			formData.append("amount", "1500");
			formData.append("description", "更新されたテスト取引");

			const request = new Request("http://localhost:5173/transactions/1", {
				method: "POST",
				body: formData,
			});

			const params = { id: "1" };
			const result = await action({ request, params } as any);

			expect(result).toBeInstanceOf(Response);
			expect(result.status).toBe(302);
			expect(result.headers.get("Location")).toBe("/transactions/1");
		});

		it("無効なintentで詳細ページにリダイレクトすること", async () => {
			const formData = new FormData();
			formData.append("intent", "invalid-action");

			const request = new Request("http://localhost:5173/transactions/1", {
				method: "POST",
				body: formData,
			});

			const params = { id: "1" };
			const result = await action({ request, params } as any);

			expect(result).toBeInstanceOf(Response);
			expect(result.status).toBe(302);
			expect(result.headers.get("Location")).toBe("/transactions/1");
		});
	});

	describe("実際の使用パターン", () => {
		it("TransactionFormからの編集データ送信", async () => {
			const formData = new FormData();
			formData.append("type", "expense");
			formData.append("amount", "1200");
			formData.append("description", "編集後のランチ代");
			formData.append("categoryId", "2");
			formData.append("paymentMethod", "credit_card");
			formData.append("transactionDate", "2024-06-23");

			const request = new Request("http://localhost:5173/transactions/1", {
				method: "POST",
				body: formData,
			});

			const params = { id: "1" };
			const result = await action({ request, params } as any);

			expect(result).toBeInstanceOf(Response);
			expect(result.status).toBe(302);
			expect(result.headers.get("Location")).toBe("/transactions/1");
		});

		it("削除確認ダイアログからの削除アクション", async () => {
			(fetch as any).mockResolvedValueOnce({
				ok: true,
			});

			const formData = new FormData();
			formData.append("intent", "delete");

			const request = new Request("http://localhost:5173/transactions/1", {
				method: "POST",
				body: formData,
			});

			const params = { id: "1" };
			const result = await action({ request, params } as any);

			// テスト環境では本番環境扱いになるため相対URLが使用される
			expect(fetch).toHaveBeenCalledWith("/api/transactions/1/delete", {
				method: "DELETE",
			});
			expect(result).toBeInstanceOf(Response);
			expect(result.status).toBe(302);
			expect(result.headers.get("Location")).toBe("/transactions");
		});

		it("大きなIDでの正常処理", async () => {
			const mockTransactionData = {
				data: {
					id: 999999,
					description: "大きなID",
					amount: 10000,
					type: "income",
				},
			};

			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve(mockTransactionData),
			});

			const params = { id: "999999" };
			const result = await loader({ params } as any);

			// テスト環境では本番環境扱いになるため相対URLが使用される
			expect(fetch).toHaveBeenCalledWith("/api/transactions/999999");
			expect(result.transaction.id).toBe(999999);
		});
	});
});
