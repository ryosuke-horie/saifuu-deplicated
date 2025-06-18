import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getCategoryById } from "../../../../db/queries/categories";
import {
	getSubscriptionById,
	updateSubscription,
} from "../../../../db/queries/subscriptions";
import { insertSubscriptionSchema } from "../../../../db/schema";
import type { Route } from "./+types/$id.update";

/**
 * PUT /api/subscriptions/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDのサブスクリプションを更新
 * - 部分更新に対応（指定されたフィールドのみ更新）
 * - 存在チェックとバリデーション
 *
 * パラメータ:
 * - id: number (必須) - サブスクリプションID
 *
 * リクエストボディ:
 * - name: string (オプション) - サービス名
 * - amount: number (オプション) - 金額（正の整数）
 * - categoryId: number (オプション) - カテゴリID
 * - frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' (オプション) - 支払い頻度
 * - nextPaymentDate: string (オプション) - 次回支払日（YYYY-MM-DD形式）
 * - description: string (オプション) - 説明・メモ
 * - isActive: boolean (オプション) - アクティブフラグ
 * - autoGenerate: boolean (オプション) - 自動取引生成フラグ
 */

// 更新可能なフィールドのスキーマ（作成・更新日時、IDは除外）
const updateSubscriptionSchema = insertSubscriptionSchema
	.omit({
		createdAt: true,
		updatedAt: true,
	})
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

export async function action({ request, params, context }: Route.ActionArgs) {
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

		// リクエストボディを解析・バリデーション
		const body = await request.json();
		const parsedData = updateSubscriptionSchema.safeParse(body);
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

		// カテゴリIDが指定されている場合、存在チェック
		if (parsedData.data.categoryId !== undefined) {
			if (
				parsedData.data.categoryId !== null &&
				typeof parsedData.data.categoryId === "number"
			) {
				const category = await getCategoryById(db, parsedData.data.categoryId);
				if (!category) {
					return new Response(
						JSON.stringify({
							error: "指定されたカテゴリが見つかりません",
						}),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}

				// サブスクリプションは支出のみなので、支出カテゴリかチェック
				if (category.type !== "expense") {
					return new Response(
						JSON.stringify({
							error: "サブスクリプションには支出カテゴリを指定してください",
						}),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			}
		}

		// サブスクリプションを更新
		const updatedSubscription = await updateSubscription(
			db,
			subscriptionId,
			parsedData.data,
		);

		// 更新後のサブスクリプションを詳細情報付きで取得
		const fullUpdatedSubscription = await getSubscriptionById(
			db,
			subscriptionId,
		);

		return new Response(
			JSON.stringify({
				success: true,
				data: fullUpdatedSubscription,
				message: "サブスクリプションが正常に更新されました",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("サブスクリプション更新エラー:", error);

		return new Response(
			JSON.stringify({
				error: "サブスクリプションの更新中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
