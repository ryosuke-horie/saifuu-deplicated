import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { reorderCategories } from "../../../../db/queries/categories";
import type { Route } from "./+types/reorder";

/**
 * PUT /api/categories/reorder エンドポイント
 *
 * 機能:
 * - カテゴリの表示順序を一括更新
 * - ドラッグ&ドロップによる並び順変更に対応
 * - バリデーションによる整合性チェック
 *
 * リクエストボディ:
 * - categories: Array<{id: number, displayOrder: number}> (必須)
 *   - 更新対象のカテゴリIDと新しい表示順序の配列
 *
 * 注意:
 * - 全てのカテゴリを一度に更新することを推奨
 * - displayOrderの重複は許可（同一順序の場合はIDでソート）
 */

// リクエストボディのバリデーションスキーマ
const reorderRequestSchema = z.object({
	categories: z
		.array(
			z.object({
				id: z.number().int().positive(),
				displayOrder: z.number().int().min(0),
			}),
		)
		.min(1, "最低1つのカテゴリを指定してください"),
});

export async function action({ request, context }: Route.ActionArgs) {
	try {
		// HTTPメソッドのチェック
		if (request.method !== "PUT") {
			return new Response(
				JSON.stringify({
					error: "PUT メソッドのみサポートしています",
				}),
				{
					status: 405,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Cloudflare Workersの環境からDBバインディングを取得
		const db = createDb(context.cloudflare.env.DB);

		// リクエストボディを解析・バリデーション
		const body = await request.json();
		const parsedData = reorderRequestSchema.safeParse(body);
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

		const { categories } = parsedData.data;

		// IDの重複チェック
		const categoryIds = categories.map((c) => c.id);
		const uniqueIds = new Set(categoryIds);
		if (categoryIds.length !== uniqueIds.size) {
			return new Response(
				JSON.stringify({
					error: "カテゴリIDに重複があります",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 表示順序を更新
		const updatedCategories = await reorderCategories(
			db,
			categories.map(({ id, displayOrder }) => ({ id, displayOrder })),
		);

		// 更新されたカテゴリ数が期待値と一致するかチェック
		if (updatedCategories.length !== categories.length) {
			console.warn(
				`期待された更新数: ${categories.length}, 実際の更新数: ${updatedCategories.length}`,
			);
		}

		return new Response(
			JSON.stringify({
				success: true,
				data: updatedCategories,
				message: `${updatedCategories.length}件のカテゴリの表示順序が更新されました`,
				updatedCount: updatedCategories.length,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("カテゴリ並び順更新エラー:", error);

		return new Response(
			JSON.stringify({
				error: "カテゴリの並び順更新中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
