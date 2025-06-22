import { z } from "zod";
import { createDb } from "../../../../db/connection";
import {
	deleteTransaction,
	getTransactionById,
} from "../../../../db/queries/transactions";
import type { Route } from "./+types/$id.delete";

/**
 * DELETE /api/transactions/:id エンドポイント
 *
 * 機能:
 * - 指定されたIDの取引を削除
 * - 物理削除（取引データは完全に削除される）
 * - 存在チェック
 *
 * パラメータ:
 * - id: number (必須) - 取引ID
 *
 * 注意:
 * - カテゴリとは異なり、取引は物理削除を実行
 * - 削除された取引は復旧できないため、削除前の確認が重要
 * - 定期取引（サブスクリプション）から生成された取引の場合は注意が必要
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

export async function action({ request, params, context }: any) {
	try {
		// HTTPメソッドのチェック
		if (request.method !== "DELETE") {
			return new Response(
				JSON.stringify({
					error: "DELETE メソッドのみサポートしています",
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

		// 定期取引チェック（サブスクリプションから生成された取引の場合の警告）
		// 注意: 定期取引として生成された取引を削除する場合、次回の自動生成には影響しない
		// サブスクリプション自体を停止したい場合は、サブスクリプション管理画面から操作する必要がある
		if ((existingTransaction as any).isRecurring) {
			console.warn(
				`定期取引ID ${transactionId} を削除します。サブスクリプション設定は変更されません。`,
			);
		}

		// 取引を物理削除（完全削除）
		// カテゴリとは異なり、取引データは物理削除を実行
		// 削除された取引は復旧できないため、慎重な操作が必要
		const deletedTransaction = await deleteTransaction(db, transactionId);

		return new Response(
			JSON.stringify({
				success: true,
				data: deletedTransaction,
				message: "取引が正常に削除されました",
				// 削除された取引の情報を返却（ログや確認用）
				deletedInfo: {
					id: deletedTransaction.id,
					amount: deletedTransaction.amount,
					type: deletedTransaction.type,
					description: deletedTransaction.description,
					transactionDate: deletedTransaction.transactionDate,
					isRecurring: deletedTransaction.isRecurring,
				},
			}),
			{
				status: 200,
				headers: { "Content-Type": "application/json" },
			},
		);
	} catch (error) {
		console.error("取引削除エラー:", error);

		return new Response(
			JSON.stringify({
				error: "取引の削除中にエラーが発生しました",
				details: error instanceof Error ? error.message : "不明なエラー",
			}),
			{
				status: 500,
				headers: { "Content-Type": "application/json" },
			},
		);
	}
}
