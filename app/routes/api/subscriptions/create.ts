import { createDb } from "../../../../db/connection";
import { createSubscription } from "../../../../db/queries/subscriptions";
import { insertSubscriptionSchema } from "../../../../db/schema";
import type { Route } from "./+types/create";

/**
 * POST /api/subscriptions エンドポイント
 *
 * 機能:
 * - 新しいサブスクリプションを作成
 * - リクエストボディのバリデーション
 * - カテゴリIDの存在確認とタイプ検証
 *
 * リクエストボディ:
 * - name: string (必須) - サブスクリプション名
 * - amount: number (必須) - 金額（正の整数）
 * - frequency: 'daily' | 'weekly' | 'monthly' | 'yearly' (必須) - 支払い頻度
 * - categoryId: number (オプション) - カテゴリID
 * - nextPaymentDate: string (必須) - 次回支払日（YYYY-MM-DD形式）
 * - description: string (オプション) - 説明・メモ
 * - isActive: boolean (オプション) - アクティブフラグ（デフォルト: true）
 * - autoGenerate: boolean (オプション) - 自動取引生成フラグ（デフォルト: true）
 */

export async function action({ request, context }: Route.ActionArgs) {
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
		const parsedData = insertSubscriptionSchema.safeParse(body);
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

		// カテゴリIDが指定されている場合、存在確認を行う
		if (parsedData.data.categoryId) {
			const { getCategoryById } = await import(
				"../../../../db/queries/categories"
			);
			const category = await getCategoryById(db, parsedData.data.categoryId);

			if (!category) {
				return new Response(
					JSON.stringify({
						error: "指定されたカテゴリが見つかりません",
						details: `カテゴリID ${parsedData.data.categoryId} は存在しないか、無効です`,
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// 収入タイプのサブスクリプションは珍しいが許可（給与、定期収入等のユースケース）
			// 警告をログに出力して管理者が把握できるようにする
			if (category.type === "income") {
				console.warn(
					`収入カテゴリでサブスクリプション作成: カテゴリ「${category.name}」(ID: ${category.id}), サブスクリプション「${parsedData.data.name}」`,
				);
			}
		}

		// サブスクリプションを作成
		const newSubscription = await createSubscription(db, parsedData.data);

		// 作成されたサブスクリプションの詳細情報を取得（カテゴリ情報を含む）
		const { getSubscriptionById } = await import(
			"../../../../db/queries/subscriptions"
		);
		const subscriptionWithDetails = await getSubscriptionById(
			db,
			newSubscription.id,
		);

		return new Response(
			JSON.stringify({
				success: true,
				data: subscriptionWithDetails,
				message: "サブスクリプションが正常に作成されました",
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("サブスクリプション作成エラー:", error);

		// データベース制約エラーの詳細なハンドリング
		if (error instanceof Error) {
			// 外部キー制約エラー（カテゴリIDが無効）
			if (error.message.includes("FOREIGN KEY constraint failed")) {
				return new Response(
					JSON.stringify({
						error: "データベース制約エラー",
						details: "指定されたカテゴリIDが無効です",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// NOT NULL制約エラー
			if (error.message.includes("NOT NULL constraint failed")) {
				return new Response(
					JSON.stringify({
						error: "必須項目が不足しています",
						details: "名前、金額、支払い頻度、次回支払日は必須項目です",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}

			// CHECK制約エラー（金額が負の値など）
			if (error.message.includes("CHECK constraint failed")) {
				return new Response(
					JSON.stringify({
						error: "データ形式エラー",
						details: "金額は正の整数で入力してください",
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// その他の予期しないエラー
		return new Response(
			JSON.stringify({
				error: "サブスクリプションの作成中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
