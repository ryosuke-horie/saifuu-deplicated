import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getSubscriptionsList } from "../../../../db/queries/subscriptions";
import type { Route } from "./+types/index";

/**
 * GET /api/subscriptions エンドポイント
 *
 * 機能:
 * - サブスクリプション一覧を取得
 * - アクティブ・非アクティブのフィルタリング機能
 * - デフォルトは全件取得
 * - 作成日時の降順でソート
 * - 既存のAPIパターンに準拠したレスポンス形式
 *
 * クエリパラメータ:
 * - active: boolean (オプション) - アクティブなサブスクリプションのみ取得
 *   - true: アクティブなサブスクリプションのみ
 *   - false: 非アクティブなサブスクリプションのみ
 *   - 指定なし: 全件取得
 */

// クエリパラメータのバリデーションスキーマ
const queryParamsSchema = z.object({
	active: z
		.string()
		.transform((val) => {
			if (val === "true") return true;
			if (val === "false") return false;
			return undefined;
		})
		.optional(),
});

export async function loader({ request, context }: Route.LoaderArgs) {
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

		const { active } = parsedParams.data;

		// サブスクリプション一覧を取得（フィルタリング対応）
		const subscriptions = await getSubscriptionsList(db, {
			isActive: active,
		});

		// 既存のAPIパターンに合わせたレスポンス構造
		return new Response(
			JSON.stringify({
				success: true,
				data: subscriptions,
				count: subscriptions.length,
				filters: {
					active,
				},
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("サブスクリプション一覧取得エラー:", error);

		return new Response(
			JSON.stringify({
				error: "サブスクリプション一覧の取得中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
