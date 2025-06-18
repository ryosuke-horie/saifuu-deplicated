import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getSubscriptionById } from "../../../../db/queries/subscriptions";
import type { Route } from "./+types/$id";

/**
 * GET /api/subscriptions/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDのサブスクリプションを取得
 * - カテゴリ情報を含む詳細データを返す
 * - 存在チェック
 *
 * パラメータ:
 * - id: number (必須) - サブスクリプションID
 *
 * レスポンス:
 * - サブスクリプションデータ（カテゴリ情報含む）
 * - アクティブ状態やサイクル情報を含む
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

		const subscriptionId = parsedParams.data.id;

		// データベースからサブスクリプションデータを取得（カテゴリ情報含む）
		const subscription = await getSubscriptionById(db, subscriptionId);

		// サブスクリプションが存在しない場合は404を返す
		if (!subscription) {
			return new Response(
				JSON.stringify({
					error: "指定されたサブスクリプションが見つかりません",
					subscriptionId,
				}),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// レスポンス用のデータ構造を構築
		// 他のAPIパターンに従って success, data 形式で返す
		return new Response(
			JSON.stringify({
				success: true,
				data: subscription,
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("サブスクリプション詳細取得エラー:", error);

		return new Response(
			JSON.stringify({
				error: "サブスクリプション詳細の取得中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
