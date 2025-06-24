import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * 取引登録ページ (/transactions/new) のルートテスト
 *
 * 目的:
 * - メタデータ設定の検証
 * - アクション関数のフォーム処理テスト
 * - リダイレクト動作の確認
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
import { action, meta } from "./new";

describe("取引登録ページルート", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe("meta関数", () => {
		it("正しいメタデータを返すこと", () => {
			const result = meta({} as any);

			expect(result).toEqual([
				{ title: "取引登録 | Saifuu" },
				{
					name: "description",
					content: "新しい収入・支出を登録するページです。",
				},
			]);
		});
	});

	describe("action関数", () => {
		it("支出タイプのフォームデータで正常にリダイレクトすること", async () => {
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

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// redirectが正しく呼ばれたことを確認
			expect(redirect).toHaveBeenCalledWith("/transactions");
			expect(result).toBe(mockRedirectResponse);
		});

		it("収入タイプのフォームデータで正常にリダイレクトすること", async () => {
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

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// redirectが正しく呼ばれたことを確認
			expect(redirect).toHaveBeenCalledWith("/transactions");
			expect(result).toBe(mockRedirectResponse);
		});

		it("typeパラメータが未設定でもリダイレクトすること", async () => {
			// バリデーションエラーをモック（typeが未設定の場合）
			const mockErrorResponse = { errors: { type: ["Required"] } };
			(data as any).mockReturnValue(mockErrorResponse);

			const formData = new FormData();
			formData.append("amount", "2000");
			formData.append("description", "買い物");

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// dataが正しく呼ばれたことを確認（バリデーションエラー）
			expect(data).toHaveBeenCalledWith(
				expect.objectContaining({ errors: expect.any(Object) }),
				{ status: 400 },
			);
			expect(result).toBe(mockErrorResponse);
		});

		it("空のフォームデータでバリデーションエラーを返すこと", async () => {
			// バリデーションエラーをモック
			const mockErrorResponse = {
				errors: { type: ["Required"], amount: ["Required"] },
			};
			(data as any).mockReturnValue(mockErrorResponse);

			const formData = new FormData();

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// dataが正しく呼ばれたことを確認（バリデーションエラー）
			expect(data).toHaveBeenCalledWith(
				expect.objectContaining({ errors: expect.any(Object) }),
				{ status: 400 },
			);
			expect(result).toBe(mockErrorResponse);
		});

		it("複数のフォームフィールドを含む完全なデータ", async () => {
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
			formData.append("amount", "1500");
			formData.append("description", "スーパーマーケット");
			formData.append("categoryId", "1");
			formData.append("paymentMethod", "cash");
			formData.append("transactionDate", "2024-06-23");

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// redirectが正しく呼ばれたことを確認
			expect(redirect).toHaveBeenCalledWith("/transactions");
			expect(result).toBe(mockRedirectResponse);
		});
	});

	describe("実際の使用パターン", () => {
		it("TransactionFormからの典型的な支出登録", async () => {
			// APIレスポンスをモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			// redirectモックを設定
			const mockRedirectResponse = new Response(null, { status: 302 });
			(redirect as any).mockReturnValue(mockRedirectResponse);

			// TransactionFormコンポーネントが送信する可能性のあるデータ
			const formData = new FormData();
			formData.append("type", "expense");
			formData.append("amount", "800");
			formData.append("description", "コンビニ弁当");
			formData.append("categoryId", "2");
			formData.append("paymentMethod", "credit_card");
			formData.append("transactionDate", "2024-06-23");

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// redirectが正しく呼ばれたことを確認
			expect(redirect).toHaveBeenCalledWith("/transactions");
			expect(result).toBe(mockRedirectResponse);
		});

		it("TransactionFormからの典型的な収入登録", async () => {
			// APIレスポンスをモック
			(fetch as any).mockResolvedValueOnce({
				ok: true,
				json: () => Promise.resolve({ success: true }),
			});

			// redirectモックを設定
			const mockRedirectResponse = new Response(null, { status: 302 });
			(redirect as any).mockReturnValue(mockRedirectResponse);

			// TransactionFormコンポーネントが送信する可能性のあるデータ
			const formData = new FormData();
			formData.append("type", "income");
			formData.append("amount", "50000");
			formData.append("description", "給与");
			formData.append("categoryId", "10");
			formData.append("paymentMethod", "bank_transfer");
			formData.append("transactionDate", "2024-06-25");

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// redirectが正しく呼ばれたことを確認
			expect(redirect).toHaveBeenCalledWith("/transactions");
			expect(result).toBe(mockRedirectResponse);
		});

		it("最小限の必須データでの登録", async () => {
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

			const request = new Request("http://localhost:5173/transactions/new", {
				method: "POST",
				body: formData,
			});

			const result = await action({ request } as any);

			// redirectが正しく呼ばれたことを確認
			expect(redirect).toHaveBeenCalledWith("/transactions");
			expect(result).toBe(mockRedirectResponse);
		});
	});
});
