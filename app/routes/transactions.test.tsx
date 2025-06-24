import { describe, expect, it } from "vitest";

/**
 * 取引一覧ページ (/transactions) のルートテスト
 *
 * 目的:
 * - メタデータ設定の検証
 * - ローダー関数のフィルター・ソートパラメータ処理テスト
 * - React Router v7統合の基本動作確認
 */

// 実際のルートファイルからエクスポートされた関数をテスト対象とする
import { loader, meta } from "./transactions";

describe("取引一覧ページルート", () => {
	describe("meta関数", () => {
		it("正しいメタデータを返すこと", () => {
			const result = meta({} as any);

			expect(result).toEqual([
				{ title: "取引一覧 | Saifuu" },
				{
					name: "description",
					content: "収入・支出の取引一覧を表示・管理するページです。",
				},
			]);
		});
	});

	describe("loader関数", () => {
		it("空のクエリパラメータを正常に処理すること", async () => {
			const request = new Request("http://localhost:5173/transactions");

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {},
				sort: {
					sort_by: "transactionDate",
					sort_order: "desc",
				},
			});
		});

		it("from フィルターパラメータを正常に処理すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?from=2024-01-01",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {
					from: "2024-01-01",
				},
				sort: {
					sort_by: "transactionDate",
					sort_order: "desc",
				},
			});
		});

		it("複数のフィルターパラメータを正常に処理すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?type=expense&search=食費",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {
					type: "expense",
					search: "食費",
				},
				sort: {
					sort_by: "transactionDate",
					sort_order: "desc",
				},
			});
		});

		it("URLエンコードされたパラメータを正常に処理すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?search=%E9%A3%9F%E8%B2%BB", // "食費"のURLエンコード
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {
					search: "食費",
				},
				sort: {
					sort_by: "transactionDate",
					sort_order: "desc",
				},
			});
		});

		it("カスタムソートパラメータを正常に処理すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?sort_by=amount&sort_order=asc",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {},
				sort: {
					sort_by: "amount",
					sort_order: "asc",
				},
			});
		});

		it("category_idを数値に変換すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?category_id=123",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {
					category_id: 123,
				},
				sort: {
					sort_by: "transactionDate",
					sort_order: "desc",
				},
			});
		});
	});

	describe("実際の使用パターン", () => {
		it("FilterPanelからの典型的なフィルターパラメータ", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?type=expense&category_id=1&from=2024-01-01&to=2024-01-31",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {
					type: "expense",
					category_id: 1,
					from: "2024-01-01",
					to: "2024-01-31",
				},
				sort: {
					sort_by: "transactionDate",
					sort_order: "desc",
				},
			});
		});

		it("ソートパラメータの組み合わせ", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?sort_by=amount&sort_order=desc",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {},
				sort: {
					sort_by: "amount",
					sort_order: "desc",
				},
			});
		});

		it("検索機能の使用パターン", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?search=コンビニ&type=expense",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {
					search: "コンビニ",
					type: "expense",
				},
				sort: {
					sort_by: "transactionDate",
					sort_order: "desc",
				},
			});
		});

		it("フィルターとソートの組み合わせ", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?type=income&from=2024-01-01&sort_by=amount&sort_order=asc",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				filters: {
					type: "income",
					from: "2024-01-01",
				},
				sort: {
					sort_by: "amount",
					sort_order: "asc",
				},
			});
		});
	});
});
