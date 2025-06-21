import { describe, expect, it } from "vitest";
import { z } from "zod";

/**
 * 取引API (/api/transactions) のクエリパラメータバリデーションテスト
 *
 * 目的:
 * - 文字列・数値混在パラメータの正常処理を検証
 * - クエリパラメータのバリデーションエラーケースを網羅
 * - フロントエンドとAPIの型不整合による問題を予防
 */

// APIエンドポイントと同じバリデーションスキーマを再定義
// 実際のエンドポイントファイルから切り出して独立性を保つ
const queryParamsSchema = z.object({
	// 日付範囲フィルタ
	from: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	to: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),

	// カテゴリ・タイプフィルタ
	type: z.enum(["income", "expense"]).optional(),
	category_id: z
		.union([z.string(), z.number()])
		.transform((val) =>
			typeof val === "string" ? Number.parseInt(val, 10) : val,
		)
		.refine((val) => !Number.isNaN(val), {
			message: "category_idは有効な数値である必要があります",
		})
		.optional(),

	// 検索フィルタ
	search: z.string().min(1).optional(),

	// ページネーション
	page: z
		.union([z.string(), z.number()])
		.transform((val) =>
			typeof val === "string" ? Number.parseInt(val, 10) : val,
		)
		.refine((val) => !Number.isNaN(val) && val >= 1, {
			message: "pageは1以上の数値である必要があります",
		})
		.default(1),
	limit: z
		.union([z.string(), z.number()])
		.transform((val) =>
			typeof val === "string" ? Number.parseInt(val, 10) : val,
		)
		.refine((val) => !Number.isNaN(val) && val >= 1 && val <= 1000, {
			message: "limitは1以上1000以下の数値である必要があります",
		})
		.default(20),

	// ソート
	sort_by: z
		.enum(["transactionDate", "amount", "createdAt"])
		.default("transactionDate"),
	sort_order: z.enum(["asc", "desc"]).default("desc"),
});

describe("取引API クエリパラメータバリデーション", () => {
	describe("基本的なパラメータ処理", () => {
		it("空のパラメータでデフォルト値が適用される", () => {
			const result = queryParamsSchema.safeParse({});

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.page).toBe(1);
				expect(result.data.limit).toBe(20);
				expect(result.data.sort_by).toBe("transactionDate");
				expect(result.data.sort_order).toBe("desc");
			}
		});

		it("全パラメータが正常に処理される", () => {
			const params = {
				from: "2024-01-01",
				to: "2024-01-31",
				type: "expense" as const,
				category_id: "1",
				search: "食費",
				page: "2",
				limit: "50",
				sort_by: "amount" as const,
				sort_order: "asc" as const,
			};

			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.from).toBe("2024-01-01");
				expect(result.data.to).toBe("2024-01-31");
				expect(result.data.type).toBe("expense");
				expect(result.data.category_id).toBe(1);
				expect(result.data.search).toBe("食費");
				expect(result.data.page).toBe(2);
				expect(result.data.limit).toBe(50);
				expect(result.data.sort_by).toBe("amount");
				expect(result.data.sort_order).toBe("asc");
			}
		});
	});

	describe("数値パラメータの型混在対応", () => {
		it("category_idが文字列形式で正常処理される", () => {
			const params = { category_id: "123" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.category_id).toBe(123);
				expect(typeof result.data.category_id).toBe("number");
			}
		});

		it("category_idが数値形式で正常処理される", () => {
			const params = { category_id: 456 };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.category_id).toBe(456);
				expect(typeof result.data.category_id).toBe("number");
			}
		});

		it("pageが文字列形式で正常処理される", () => {
			const params = { page: "5" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.page).toBe(5);
				expect(typeof result.data.page).toBe("number");
			}
		});

		it("pageが数値形式で正常処理される", () => {
			const params = { page: 10 };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.page).toBe(10);
				expect(typeof result.data.page).toBe("number");
			}
		});

		it("limitが文字列形式で正常処理される", () => {
			const params = { limit: "100" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.limit).toBe(100);
				expect(typeof result.data.limit).toBe("number");
			}
		});

		it("limitが数値形式で正常処理される", () => {
			const params = { limit: 500 };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.limit).toBe(500);
				expect(typeof result.data.limit).toBe("number");
			}
		});
	});

	describe("バリデーションエラーケース", () => {
		it("不正な日付形式でエラーになる", () => {
			const params = { from: "2024/01/01" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["from"]);
			}
		});

		it("不正なtypeでエラーになる", () => {
			const params = { type: "invalid" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["type"]);
			}
		});

		it("不正なcategory_idでエラーになる", () => {
			const params = { category_id: "invalid" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["category_id"]);
				expect(result.error.errors[0].message).toBe(
					"category_idは有効な数値である必要があります",
				);
			}
		});

		it("空文字のsearchでエラーになる", () => {
			const params = { search: "" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["search"]);
			}
		});

		it("pageが0以下でエラーになる", () => {
			const params = { page: "0" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["page"]);
				expect(result.error.errors[0].message).toBe(
					"pageは1以上の数値である必要があります",
				);
			}
		});

		it("limitが範囲外でエラーになる", () => {
			const params = { limit: "1001" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["limit"]);
				expect(result.error.errors[0].message).toBe(
					"limitは1以上1000以下の数値である必要があります",
				);
			}
		});

		it("不正なsort_byでエラーになる", () => {
			const params = { sort_by: "invalid" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["sort_by"]);
			}
		});

		it("不正なsort_orderでエラーになる", () => {
			const params = { sort_order: "invalid" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors[0].path).toEqual(["sort_order"]);
			}
		});
	});

	describe("境界値テスト", () => {
		it("limitの最小値1が正常処理される", () => {
			const params = { limit: "1" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.limit).toBe(1);
			}
		});

		it("limitの最大値1000が正常処理される", () => {
			const params = { limit: "1000" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.limit).toBe(1000);
			}
		});

		it("pageの最小値1が正常処理される", () => {
			const params = { page: "1" };
			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.page).toBe(1);
			}
		});
	});

	describe("現実的な使用パターン", () => {
		it("SummaryCardsコンポーネントからの典型的なリクエスト", () => {
			// useCurrentMonthTransactionsが送信する可能性のあるパラメータ
			const params = {
				from: "2024-06-01",
				to: "2024-06-30",
				limit: 1000, // 数値として送信される可能性
				sort_by: "transactionDate",
				sort_order: "desc",
			};

			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.from).toBe("2024-06-01");
				expect(result.data.to).toBe("2024-06-30");
				expect(result.data.limit).toBe(1000);
				expect(result.data.sort_by).toBe("transactionDate");
				expect(result.data.sort_order).toBe("desc");
			}
		});

		it("CategoryBreakdownChartコンポーネントからの典型的なリクエスト", () => {
			// useCurrentMonthTransactionsがtypeフィルタ付きで送信するパラメータ
			const params = {
				from: "2024-06-01",
				to: "2024-06-30",
				type: "expense",
				limit: 1000, // 数値として送信される可能性
			};

			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.from).toBe("2024-06-01");
				expect(result.data.to).toBe("2024-06-30");
				expect(result.data.type).toBe("expense");
				expect(result.data.limit).toBe(1000);
			}
		});

		it("URLQueryStringからの文字列パラメータ", () => {
			// ブラウザのURLクエリパラメータは全て文字列として送信される
			const params = {
				page: "3",
				limit: "50",
				category_id: "2",
				type: "income",
				search: "給与",
			};

			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(true);
			if (result.success) {
				expect(result.data.page).toBe(3);
				expect(result.data.limit).toBe(50);
				expect(result.data.category_id).toBe(2);
				expect(result.data.type).toBe("income");
				expect(result.data.search).toBe("給与");
			}
		});
	});

	describe("複数エラーの同時発生", () => {
		it("複数の不正パラメータで全てのエラーが報告される", () => {
			const params = {
				from: "invalid-date",
				type: "invalid-type",
				category_id: "not-a-number",
				page: "0",
				limit: "2000",
			};

			const result = queryParamsSchema.safeParse(params);

			expect(result.success).toBe(false);
			if (!result.success) {
				expect(result.error.errors.length).toBeGreaterThan(1);

				// 各エラーのパスを確認
				const errorPaths = result.error.errors.map((err) => err.path[0]);
				expect(errorPaths).toContain("from");
				expect(errorPaths).toContain("type");
				expect(errorPaths).toContain("category_id");
				expect(errorPaths).toContain("page");
				expect(errorPaths).toContain("limit");
			}
		});
	});
});
