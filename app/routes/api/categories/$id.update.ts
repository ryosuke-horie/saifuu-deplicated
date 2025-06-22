import { z } from "zod";
import { createDb } from "../../../../db/connection";
import {
	getCategoryById,
	updateCategory,
} from "../../../../db/queries/categories";
import { insertCategorySchema } from "../../../../db/schema";
// // import type { Route } from "./+types/$id.update";

/**
 * PUT /api/categories/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDのカテゴリを更新
 * - 部分更新に対応（指定されたフィールドのみ更新）
 * - 存在チェックとバリデーション
 *
 * パラメータ:
 * - id: number (必須) - カテゴリID
 *
 * リクエストボディ:
 * - name: string (オプション) - カテゴリ名
 * - color: string (オプション) - 色コード (#RRGGBB形式)
 * - icon: string (オプション) - アイコン名
 * - displayOrder: number (オプション) - 表示順序
 * 注意: type と isActive は更新不可（セキュリティとデータ整合性のため）
 */

// 更新可能なフィールドのスキーマ（typeとisActiveは除外）
const updateCategorySchema = insertCategorySchema
	.omit({ type: true, isActive: true, createdAt: true, updatedAt: true })
	.partial();

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

		// リクエストボディを解析・バリデーション
		const body = await request.json();
		const parsedData = updateCategorySchema.safeParse(body);
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

		// 更新するフィールドが存在するかチェック
		if (Object.keys(parsedData.data).length === 0) {
			return new Response(
				JSON.stringify({
					error: "更新するフィールドが指定されていません",
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// カテゴリを更新
		const updatedCategory = await updateCategory(
			db,
			categoryId,
			parsedData.data,
		);

		return new Response(
			JSON.stringify({
				success: true,
				data: updatedCategory,
				message: "カテゴリが正常に更新されました",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("カテゴリ更新エラー:", error);

		return new Response(
			JSON.stringify({
				error: "カテゴリの更新中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
