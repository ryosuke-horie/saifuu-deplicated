import { z } from "zod";
import { createDb } from "../../../../db/connection";
import {
	deleteCategory,
	getCategoryById,
	isCategoryInUse,
} from "../../../../db/queries/categories";
// // import type { Route } from "./+types/$id.delete";

/**
 * DELETE /api/categories/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDのカテゴリを論理削除
 * - 使用中チェック（将来的にトランザクションやサブスクリプションで参照されている場合の警告）
 * - 存在チェック
 *
 * パラメータ:
 * - id: number (必須) - カテゴリID
 *
 * 注意:
 * - 物理削除ではなく論理削除（isActive = false）を実行
 * - 将来的にトランザクションで使用されているカテゴリは削除不可にする予定
 */

// パラメータのバリデーションスキーマ
const paramsSchema = z.object({
	id: z.string().transform((val) => {
		const num = Number.parseInt(val, 10);
		if (Number.isNaN(num) || num <= 0) {
			throw new Error("有効なIDを指定してください");
		}
		return num;
	}),
});

export async function action({ request, params, context }: any) {
	try {
		// HTTPメソッドのチェック
		if (request.method !== "DELETE") {
			return new Response(
				JSON.stringify({
					error: "DELETE メソッドのみサポートしています",
				}),
				{
					status: 405,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// Cloudflare Workersの環境からDBバインディングを取得
		const db = createDb(context.cloudflare.env.DB);

		// パラメータのバリデーション
		const parsedParams = paramsSchema.safeParse(params);
		if (!parsedParams.success) {
			return new Response(
				JSON.stringify({
					error: "無効なパラメータです",
					details: parsedParams.error.errors,
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		const categoryId = parsedParams.data.id;

		// カテゴリの存在チェック
		const existingCategory = await getCategoryById(db, categoryId);
		if (!existingCategory) {
			return new Response(
				JSON.stringify({
					error: "指定されたカテゴリが見つかりません",
				}),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 使用中チェック（将来的な機能拡張用）
		const isInUse = await isCategoryInUse(db, categoryId);
		if (isInUse) {
			return new Response(
				JSON.stringify({
					error: "このカテゴリは使用中のため削除できません",
					message:
						"カテゴリを削除するには、関連する取引やサブスクリプションを先に削除してください",
				}),
				{
					status: 409, // Conflict
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// カテゴリを論理削除
		const deletedCategory = await deleteCategory(db, categoryId);

		return new Response(
			JSON.stringify({
				success: true,
				data: deletedCategory,
				message: "カテゴリが正常に削除されました",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("カテゴリ削除エラー:", error);

		return new Response(
			JSON.stringify({
				error: "カテゴリの削除中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
