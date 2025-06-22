import { z } from "zod";
import { createDb } from "../../../../db/connection";
import {
	deactivateSubscription,
	getSubscriptionById,
} from "../../../../db/queries/subscriptions";
import type { Route } from "./+types/deactivate";

/**
 * PUT /api/subscriptions/deactivate エンドポイント
 *
 * 機能:
 * - 指定されたIDのサブスクリプションを無効化
 * - isActive フラグを false に変更
 * - 存在チェックとバリデーション
 *
 * リクエストボディ:
 * - id: number (必須) - サブスクリプションID
 *
 * レスポンス:
 * - 無効化されたサブスクリプションの情報
 * - 成功メッセージ
 */

// リクエストボディのバリデーションスキーマ
const requestSchema = z.object({
	id: z.number().positive({
		message: "有効なIDを指定してください",
	}),
});

export async function action({ request, context }: any) {
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
		const parsedData = requestSchema.safeParse(body);
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

		const subscriptionId = parsedData.data.id;

		// サブスクリプションの存在チェック
		const existingSubscription = await getSubscriptionById(db, subscriptionId);
		if (!existingSubscription) {
			return new Response(
				JSON.stringify({
					error: "指定されたサブスクリプションが見つかりません",
				}),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// 既に非アクティブの場合は警告メッセージを返す
		if (!(existingSubscription as any).isActive) {
			return new Response(
				JSON.stringify({
					success: true,
					data: existingSubscription,
					message: "サブスクリプションは既に非アクティブです",
				}),
				{
					status: 200,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// サブスクリプションを無効化
		const deactivatedSubscription = await deactivateSubscription(
			db,
			subscriptionId,
		);

		// 無効化後のサブスクリプションを詳細情報付きで取得
		const fullDeactivatedSubscription = await getSubscriptionById(
			db,
			subscriptionId,
		);

		return new Response(
			JSON.stringify({
				success: true,
				data: fullDeactivatedSubscription,
				message: "サブスクリプションが正常に無効化されました",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("サブスクリプション無効化エラー:", error);

		return new Response(
			JSON.stringify({
				error: "サブスクリプションの無効化中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
