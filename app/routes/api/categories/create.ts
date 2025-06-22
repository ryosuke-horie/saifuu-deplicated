import { createDb } from "../../../../db/connection";
import { createCategory } from "../../../../db/queries/categories";
import { insertCategorySchema } from "../../../../db/schema";
// import type { Route } from "./+types/create";

/**
 * POST /api/categories エンドポイント
 *
 * 機能:
 * - 新しいカテゴリを作成
 * - リクエストボディのバリデーション
 * - 表示順序の自動設定（未指定の場合は末尾に追加）
 *
 * リクエストボディ:
 * - name: string (必須) - カテゴリ名
 * - type: 'income' | 'expense' (必須) - カテゴリタイプ
 * - color: string (オプション) - 色コード (#RRGGBB形式)
 * - icon: string (オプション) - アイコン名
 * - displayOrder: number (オプション) - 表示順序
 */

export async function action({ request, context }: any) {
	try {
		// HTTPメソッドのチェック
		if (request.method !== "POST") {
			return new Response(
				JSON.stringify({
					error: "POST メソッドのみサポートしています",
				}),
				{
					status: 405,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Cloudflare Workersの環境からDBバインディングを取得
		const db = createDb(context.cloudflare.env.DB);

		// リクエストボディを解析
		const body = await request.json();

		// バリデーション
		const parsedData = insertCategorySchema.safeParse(body);
		if (!parsedData.success) {
			return new Response(
				JSON.stringify({
					error: "無効なリクエストボディです",
					details: parsedData.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// カテゴリを作成
		const newCategory = await createCategory(db, parsedData.data);

		return new Response(
			JSON.stringify({
				success: true,
				data: newCategory,
				message: "カテゴリが正常に作成されました",
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("カテゴリ作成エラー:", error);

		return new Response(
			JSON.stringify({
				error: "カテゴリの作成中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
