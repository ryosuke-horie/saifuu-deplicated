import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getActiveCategories } from "../../../../db/queries/categories";
import {
	createErrorResponse,
	createSuccessResponse,
} from "../../../utils/api-errors";
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
	// D1バインディングを早期に取得してエラー診断に使用
	const d1 = context?.cloudflare?.env?.DB;

	try {
		// データベース接続の作成（ここでD1バインディングのエラーが発生する可能性）
		const db = createDb(d1);

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

		// カテゴリ一覧を取得（データベースクエリエラーが発生する可能性）
		const categories = await getActiveCategories(db, parsedParams.data.type);

		// 成功レスポンスを統一フォーマットで返す
		return createSuccessResponse(categories, {
			count: categories.length,
			// デバッグ情報（開発環境のみ）
			...(process.env.NODE_ENV !== "production" && {
				debugInfo: {
					requestUrl: request.url,
					appliedFilters: parsedParams.data,
					databaseConnection: d1 ? "D1" : "SQLite (fallback)",
				},
			}),
		});
	} catch (error) {
		// 詳細なエラー診断と適切なレスポンス生成
		return await createErrorResponse(
			error,
			"カテゴリ一覧の取得中にエラーが発生しました",
			d1,
			true, // データベース健全性チェックを含める
		);
	}
}
