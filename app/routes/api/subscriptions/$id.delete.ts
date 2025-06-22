import { z } from "zod";
import { createDb } from "../../../../db/connection";
import {
	deactivateSubscription,
	getSubscriptionById,
} from "../../../../db/queries/subscriptions";
import type { Route } from "./+types/$id.delete";

/**
 * DELETE /api/subscriptions/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDのサブスクリプションを論理削除（非アクティブ化）
 * - 物理削除ではなく isActive フラグを false に変更
 * - 存在チェックとバリデーション
 *
 * パラメータ:
 * - id: number (必須) - サブスクリプションID
 *
 * レスポンス:
 * - 削除されたサブスクリプションの情報
 * - 成功メッセージ
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

export async function action({ params, context }: any) {
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

		// サブスクリプションを論理削除（非アクティブ化）
		const deactivatedSubscription = await deactivateSubscription(
			db,
			subscriptionId,
		);

		// 削除後のサブスクリプションを詳細情報付きで取得
		const fullDeactivatedSubscription = await getSubscriptionById(
			db,
			subscriptionId,
		);

		return new Response(
			JSON.stringify({
				success: true,
				data: fullDeactivatedSubscription,
				message: "サブスクリプションが正常に削除されました（非アクティブ化）",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("サブスクリプション削除エラー:", error);

		return new Response(
			JSON.stringify({
				error: "サブスクリプションの削除中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
