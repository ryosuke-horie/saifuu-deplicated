import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 取引登録デモページ (/transaction-form-demo) のルートテスト
 *
 * 目的:
 * - メタデータ設定の検証
 * - アクション関数のフォーム処理テスト
 * - デモページ特有のリダイレクト動作の確認
 */

// React Routerのモック設定
vi.mock("react-router", async (importOriginal) => {
	const actual = await importOriginal<typeof import("react-router")>();
	return {
		...actual,
		data: vi.fn(),
		redirect: vi.fn(),
	};
});

// fetchをモック化
global.fetch = vi.fn();

import { data, redirect } from "react-router";
// 実際のルートファイルからエクスポートされた関数をテスト対象とする
import { action, meta } from "./transaction-form-demo";

describe("取引登録デモページルート", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("meta関数", () => {
		it("正しいメタデータを返すこと", () => {
			const result = meta({} as any);

			expect(result).toEqual([
				{ title: "取引登録デモ | Saifuu" },
				{
					name: "description",
					content:
						"取引登録フォームのデモページです。実際にD1データベースに保存されます。",
				},
			]);
		});
	});

	describe("action関数", () => {
		it("支出タイプのフォームデータで正常にデモページにリダイレクトすること", async () => {
			// APIレスポンスをモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			// redirectモックを設定
			const mockRedirectResponse = new Response(null, { status: 302 });
			(redirect as any).mockReturnValue(mockRedirectResponse);

			const formData = new FormData();
			formData.append("type", "expense");
			formData.append("amount", "1000");
			formData.append("description", "ランチ代");
			formData.append("categoryId", "1");
			formData.append("transactionDate", "2024-06-23");
			formData.append("paymentMethod", "cash");

			const request = new Request(
				"http://localhost:5173/transaction-form-demo",
				{
					method: "POST",
					body: formData,
				},
			);

			const result = await action({ request } as any);

			// デモページ特有のリダイレクト先を確認
			expect(redirect).toHaveBeenCalledWith(
				"/transaction-form-demo?success=true",
			);
			expect(result).toBe(mockRedirectResponse);
		});

		it("収入タイプのフォームデータで正常にデモページにリダイレクトすること", async () => {
			// APIレスポンスをモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			// redirectモックを設定
			const mockRedirectResponse = new Response(null, { status: 302 });
			(redirect as any).mockReturnValue(mockRedirectResponse);

			const formData = new FormData();
			formData.append("type", "income");
			formData.append("amount", "5000");
			formData.append("description", "副業収入");
			formData.append("categoryId", "1");
			formData.append("transactionDate", "2024-06-23");
			formData.append("paymentMethod", "bank_transfer");

			const request = new Request(
				"http://localhost:5173/transaction-form-demo",
				{
					method: "POST",
					body: formData,
				},
			);

			const result = await action({ request } as any);

			// デモページ特有のリダイレクト先を確認
			expect(redirect).toHaveBeenCalledWith(
				"/transaction-form-demo?success=true",
			);
			expect(result).toBe(mockRedirectResponse);
		});

		it("バリデーションエラーの場合エラー情報を返すこと", async () => {
			// バリデーションエラーをモック
			const mockErrorResponse = {
				errors: { type: ["Required"], amount: ["Required"] },
			};
			(data as any).mockReturnValue(mockErrorResponse);

			const formData = new FormData();
			// 必須フィールドを空で送信

			const request = new Request(
				"http://localhost:5173/transaction-form-demo",
				{
					method: "POST",
					body: formData,
				},
			);

			const result = await action({ request } as any);

			// dataが正しく呼ばれたことを確認（バリデーションエラー）
			expect(data).toHaveBeenCalledWith(
				expect.objectContaining({ errors: expect.any(Object) }),
				{ status: 400 },
			);
			expect(result).toBe(mockErrorResponse);
		});

		it("API呼び出しが失敗した場合エラーを返すこと", async () => {
			// API失敗レスポンスをモック
			(fetch as any).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: () => Promise.resolve({ error: "Server error" }),
			});

			// dataモックを設定
			const mockErrorResponse = {
				errors: { general: ["取引の作成に失敗しました"] },
			};
			(data as any).mockReturnValue(mockErrorResponse);

			const formData = new FormData();
			formData.append("type", "expense");
			formData.append("amount", "1000");
			formData.append("categoryId", "1");
			formData.append("transactionDate", "2024-06-23");

			const request = new Request(
				"http://localhost:5173/transaction-form-demo",
				{
					method: "POST",
					body: formData,
				},
			);

			const result = await action({ request } as any);

			// エラーレスポンスが正しく返されることを確認
			expect(data).toHaveBeenCalledWith(
				{ errors: { general: ["取引の作成に失敗しました"] } },
				{ status: 500 },
			);
			expect(result).toBe(mockErrorResponse);
		});

		it("ネットワークエラーの場合エラーを返すこと", async () => {
			// fetchがネットワークエラーを投げるモック
			(fetch as any).mockRejectedValueOnce(new Error("Network error"));

			// dataモックを設定
			const mockErrorResponse = {
				errors: { general: ["ネットワークエラーが発生しました"] },
			};
			(data as any).mockReturnValue(mockErrorResponse);

			const formData = new FormData();
			formData.append("type", "expense");
			formData.append("amount", "1000");
			formData.append("categoryId", "1");
			formData.append("transactionDate", "2024-06-23");

			const request = new Request(
				"http://localhost:5173/transaction-form-demo",
				{
					method: "POST",
					body: formData,
				},
			);

			const result = await action({ request } as any);

			// ネットワークエラーが正しく処理されることを確認
			expect(data).toHaveBeenCalledWith(
				{ errors: { general: ["ネットワークエラーが発生しました"] } },
				{ status: 500 },
			);
			expect(result).toBe(mockErrorResponse);
		});
	});

	describe("デモページ特有の動作", () => {
		it("成功時にクエリパラメータ付きで同じページにリダイレクトすること", async () => {
			// APIレスポンスをモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			// redirectモックを設定
			const mockRedirectResponse = new Response(null, { status: 302 });
			(redirect as any).mockReturnValue(mockRedirectResponse);

			const formData = new FormData();
			formData.append("type", "expense");
			formData.append("amount", "800");
			formData.append("description", "コンビニ弁当");
			formData.append("categoryId", "2");
			formData.append("paymentMethod", "credit_card");
			formData.append("transactionDate", "2024-06-23");

			const request = new Request(
				"http://localhost:5173/transaction-form-demo",
				{
					method: "POST",
					body: formData,
				},
			);

			const result = await action({ request } as any);

			// デモページでは同じページにsuccess=trueパラメータ付きでリダイレクト
			expect(redirect).toHaveBeenCalledWith(
				"/transaction-form-demo?success=true",
			);
			expect(result).toBe(mockRedirectResponse);
		});

		it("最小限の必須データでの登録が成功すること", async () => {
			// APIレスポンスをモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			// redirectモックを設定
			const mockRedirectResponse = new Response(null, { status: 302 });
			(redirect as any).mockReturnValue(mockRedirectResponse);

			// 最小限の必須フィールドのみ
			const formData = new FormData();
			formData.append("type", "expense");
			formData.append("amount", "500");
			formData.append("categoryId", "1");
			formData.append("transactionDate", "2024-06-23");

			const request = new Request(
				"http://localhost:5173/transaction-form-demo",
				{
					method: "POST",
					body: formData,
				},
			);

			const result = await action({ request } as any);

			// 正常にリダイレクトされることを確認
			expect(redirect).toHaveBeenCalledWith(
				"/transaction-form-demo?success=true",
			);
			expect(result).toBe(mockRedirectResponse);
		});
	});
});
