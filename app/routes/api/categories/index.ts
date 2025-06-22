import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getActiveCategories } from "../../../../db/queries/categories";
// import type { Route } from "./+types/index";

/**
 * GET /api/categories エンドポイント
 *
 * 機能:
 * - アクティブなカテゴリ一覧を取得
 * - クエリパラメータで type による絞り込みに対応
 * - 表示順序でソート済みの結果を返す
 *
 * クエリパラメータ:
 * - type: 'income' | 'expense' (オプション)
 */

// クエリパラメータのバリデーションスキーマ
const queryParamsSchema = z.object({
	type: z.enum(["income", "expense"]).optional(),
});

export async function loader({ request, context }: any) {
	try {
		// Cloudflare Workersの環境からDBバインディングを取得
		const db = createDb(context.cloudflare.env.DB);

		// クエリパラメータを解析・バリデーション
		const url = new URL(request.url);
		const queryParams = Object.fromEntries(url.searchParams.entries());

		const parsedParams = queryParamsSchema.safeParse(queryParams);
		if (!parsedParams.success) {
			return new Response(
				JSON.stringify({
					error: "無効なクエリパラメータです",
					details: parsedParams.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// カテゴリ一覧を取得
		const categories = await getActiveCategories(db, parsedParams.data.type);

		return new Response(
			JSON.stringify({
				success: true,
				data: categories,
				count: categories.length,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("カテゴリ一覧取得エラー:", error);

		return new Response(
			JSON.stringify({
				error: "カテゴリ一覧の取得中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
