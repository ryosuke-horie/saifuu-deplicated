import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getCategoryById } from "../../../../db/queries/categories";
import {
	getTransactionById,
	updateTransaction,
} from "../../../../db/queries/transactions";
import { createTransactionSchema } from "../../../../db/schema";
import type { Route } from "./+types/$id.update";

/**
 * PUT /api/transactions/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDの取引を更新
 * - 部分更新に対応（指定されたフィールドのみ更新）
 * - 存在チェックとバリデーション
 *
 * パラメータ:
 * - id: number (必須) - 取引ID
 *
 * リクエストボディ:
 * - amount: number (オプション) - 金額（正の整数）
 * - type: 'income' | 'expense' (オプション) - 取引タイプ
 * - categoryId: number (オプション) - カテゴリID
 * - description: string (オプション) - 取引の説明・メモ
 * - transactionDate: string (オプション) - 取引日（YYYY-MM-DD形式）
 * - paymentMethod: string (オプション) - 支払い方法
 * - tags: string[] (オプション) - タグの配列
 * - receiptUrl: string (オプション) - レシート画像のURL
 */

// 更新可能なフィールドのスキーマ（作成・更新日時、ID、定期取引関連は除外）
const updateTransactionSchema = createTransactionSchema
	.omit({
		createdAt: true,
		updatedAt: true,
		isRecurring: true,
		recurringId: true,
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

		const transactionId = parsedParams.data.id;

		// 取引の存在チェック
		const existingTransaction = await getTransactionById(db, transactionId);
		if (!existingTransaction) {
			return new Response(
				JSON.stringify({
					error: "指定された取引が見つかりません",
				}),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				},
			);
		}

		// リクエストボディを解析・バリデーション
		const body = await request.json();
		const parsedData = updateTransactionSchema.safeParse(body);
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

				// 取引タイプとカテゴリタイプの整合性チェック
				// 新しい取引タイプを決定（更新されるタイプまたは既存のタイプ）
				const newTransactionType =
					parsedData.data.type ?? existingTransaction.type;
				if (category.type !== newTransactionType) {
					return new Response(
						JSON.stringify({
							error: "カテゴリタイプと取引タイプが一致しません",
							details: `取引を「${newTransactionType === "income" ? "収入" : "支出"}」に変更するには、${newTransactionType === "income" ? "収入" : "支出"}用のカテゴリを選択してください`,
						}),
						{
							status: 400,
							headers: { "Content-Type": "application/json" },
						},
					);
				}
			}
		}

		// タイプのみ変更の場合の検証
		// カテゴリが指定されておらず、タイプが変更され、既存の取引にカテゴリが設定されている場合
		if (
			parsedData.data.type &&
			parsedData.data.categoryId === undefined &&
			existingTransaction.category
		) {
			if (existingTransaction.category.type !== parsedData.data.type) {
				return new Response(
					JSON.stringify({
						error: "取引タイプとカテゴリタイプが一致しません",
						details: `現在のカテゴリ「${existingTransaction.category.name}」は${existingTransaction.category.type === "income" ? "収入" : "支出"}用です。取引タイプを「${parsedData.data.type === "income" ? "収入" : "支出"}」に変更するには、対応するカテゴリも変更してください`,
					}),
					{
						status: 400,
						headers: { "Content-Type": "application/json" },
					},
				);
			}
		}

		// 取引を更新
		const updatedTransaction = await updateTransaction(
			db,
			transactionId,
			parsedData.data,
		);

		// 更新後の取引を詳細情報付きで取得
		const fullUpdatedTransaction = await getTransactionById(db, transactionId);

		return new Response(
			JSON.stringify({
				success: true,
				data: fullUpdatedTransaction,
				message: "取引が正常に更新されました",
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("取引更新エラー:", error);

		return new Response(
			JSON.stringify({
				error: "取引の更新中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
