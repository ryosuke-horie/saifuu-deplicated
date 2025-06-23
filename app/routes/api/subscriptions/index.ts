import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getSubscriptionsList } from "../../../../db/queries/subscriptions";
import {
	createErrorResponse,
	createSuccessResponse,
} from "../../../utils/api-errors";
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

export async function loader({ request, context }: any) {
	// D1バインディングを早期に取得してエラー診断に使用
	const d1 = context?.cloudflare?.env?.DB;

	try {
		// データベース接続の作成（ここでD1バインディングのエラーが発生する可能性）
		const db = createDb(d1);

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

		// 成功レスポンスを統一フォーマットで返す
		return createSuccessResponse(subscriptions, {
			count: subscriptions.length,
			filters: {
				active,
			},
			// デバッグ情報（開発環境のみ）
			...(process.env.NODE_ENV !== "production" && {
				debugInfo: {
					requestUrl: request.url,
					appliedFilters: { active },
					databaseConnection: d1 ? "D1" : "SQLite (fallback)",
					subscriptionSummary: {
						total: subscriptions.length,
						activeCount: subscriptions.filter((sub: any) => sub.isActive)
							.length,
						inactiveCount: subscriptions.filter((sub: any) => !sub.isActive)
							.length,
					},
				},
			}),
		});
	} catch (error) {
		// 詳細なエラー診断と適切なレスポンス生成
		return await createErrorResponse(
			error,
			"サブスクリプション一覧の取得中にエラーが発生しました",
			d1,
			true, // データベース健全性チェックを含める
		);
	}
}
