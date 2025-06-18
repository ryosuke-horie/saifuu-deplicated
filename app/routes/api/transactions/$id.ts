import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getTransactionById } from "../../../../db/queries/transactions";
import type { Route } from "./+types/$id";

/**
 * GET /api/transactions/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDの取引を取得
 * - カテゴリ情報を含む詳細データを返す
 * - 存在チェック
 *
 * パラメータ:
 * - id: number (必須) - 取引ID
 *
 * レスポンス:
 * - 取引データ（カテゴリ情報含む）
 * - タグはJSON配列として解析して返す
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

export async function loader({ params, context }: Route.LoaderArgs) {
	try {
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

		const transactionId = parsedParams.data.id;

		// データベースから取引データを取得（カテゴリ情報含む）
		const transaction = await getTransactionById(db, transactionId);

		// 取引が存在しない場合は404を返す
		if (!transaction) {
			return new Response(
				JSON.stringify({
					error: "指定された取引が見つかりません",
					transactionId,
				}),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// tagsがJSON文字列の場合は配列に変換
		// データベースではJSON文字列として保存されているため、クライアントには配列として返す
		let parsedTags: string[] | null = null;
		if (transaction.tags) {
			try {
				parsedTags = JSON.parse(transaction.tags);
			} catch (parseError) {
				// JSON解析に失敗した場合はログに記録し、nullを設定
				console.warn(
					`取引ID ${transactionId} のタグJSON解析に失敗:`,
					parseError,
				);
				parsedTags = null;
			}
		}

		// レスポンス用のデータ構造を構築
		// カテゴリAPIのパターンに従って success, data 形式で返す
		const responseData = {
			...transaction,
			tags: parsedTags,
		};

		return new Response(
			JSON.stringify({
				success: true,
				data: responseData,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("取引詳細取得エラー:", error);

		return new Response(
			JSON.stringify({
				error: "取引詳細の取得中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
