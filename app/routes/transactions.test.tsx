import { describe, expect, it } from "vitest";

/**
 * 取引一覧ページ (/transactions) のルートテスト
 *
 * 目的:
 * - メタデータ設定の検証
 * - ローダー関数のクエリパラメータ処理テスト
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
				searchParams: {},
			});
		});

		it("単一のクエリパラメータを正常に処理すること", async () => {
			const request = new Request("http://localhost:5173/transactions?page=2");

			const result = await loader({ request } as any);

			expect(result).toEqual({
				searchParams: {
					page: "2",
				},
			});
		});

		it("複数のクエリパラメータを正常に処理すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?page=2&type=expense&search=食費",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				searchParams: {
					page: "2",
					type: "expense",
					search: "食費",
				},
			});
		});

		it("URLエンコードされたパラメータを正常に処理すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?search=%E9%A3%9F%E8%B2%BB", // "食費"のURLエンコード
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				searchParams: {
					search: "食費",
				},
			});
		});

		it("同名パラメータの最後の値を使用すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?page=1&page=2",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				searchParams: {
					page: "2",
				},
			});
		});

		it("空値のパラメータを正常に処理すること", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?search=&page=1",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				searchParams: {
					search: "",
					page: "1",
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
				searchParams: {
					type: "expense",
					category_id: "1",
					from: "2024-01-01",
					to: "2024-01-31",
				},
			});
		});

		it("ページネーションとソートのパラメータ", async () => {
			const request = new Request(
				"http://localhost:5173/transactions?page=3&limit=50&sort_by=amount&sort_order=desc",
			);

			const result = await loader({ request } as any);

			expect(result).toEqual({
				searchParams: {
					page: "3",
					limit: "50",
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
				searchParams: {
					search: "コンビニ",
					type: "expense",
				},
			});
		});
	});
});
