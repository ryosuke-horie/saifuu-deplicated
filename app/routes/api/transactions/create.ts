import { createDb } from "../../../../db/connection";
import { createTransaction } from "../../../../db/queries/transactions";
import { createTransactionSchema } from "../../../../db/schema";
import type { Route } from "./+types/create";

/**
 * POST /api/transactions エンドポイント
 *
 * 機能:
 * - 新しい取引を作成
 * - リクエストボディのバリデーション
 * - タグの配列形式での受け取りとJSON形式での保存
 *
 * リクエストボディ:
 * - amount: number (必須) - 金額（正の整数）
 * - type: 'income' | 'expense' (必須) - 取引タイプ
 * - categoryId: number (オプション) - カテゴリID
 * - description: string (オプション) - 取引の説明・メモ
 * - transactionDate: string (必須) - 取引日（YYYY-MM-DD形式）
 * - paymentMethod: string (オプション) - 支払い方法
 * - tags: string[] (オプション) - タグの配列
 * - receiptUrl: string (オプション) - レシート画像のURL
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
		const parsedData = createTransactionSchema.safeParse(body);
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

			// カテゴリのタイプと取引のタイプが一致するかチェック
			if (category.type !== parsedData.data.type) {
				return new Response(
					JSON.stringify({
						error: "カテゴリタイプと取引タイプが一致しません",
						details: `カテゴリ「${category.name}」は${category.type === "income" ? "収入" : "支出"}用ですが、${parsedData.data.type === "income" ? "収入" : "支出"}として登録しようとしています`,
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// 取引を作成
		const newTransaction = await createTransaction(db, parsedData.data);

		// 作成された取引の詳細情報を取得（カテゴリ情報を含む）
		const { getTransactionById } = await import(
			"../../../../db/queries/transactions"
		);
		const transactionWithDetails = await getTransactionById(
			db,
			newTransaction.id,
		);

		return new Response(
			JSON.stringify({
				success: true,
				data: transactionWithDetails,
				message: "取引が正常に作成されました",
			}),
			{
				status: 201,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("取引作成エラー:", error);

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
						details: "金額、取引タイプ、取引日は必須項目です",
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
				error: "取引の作成中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
