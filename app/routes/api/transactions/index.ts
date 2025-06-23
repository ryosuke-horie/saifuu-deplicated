import { z } from "zod";
import { createDb } from "../../../../db/connection";
import { getTransactionsList } from "../../../../db/queries/transactions";
import {
	createErrorResponse,
	createSuccessResponse,
} from "../../../utils/api-errors";
import { parseTransactionsWithTags } from "../../../utils/tags";
import type { Route } from "./+types/index";

/**
 * GET /api/transactions エンドポイント
 *
 * 機能:
 * - 取引一覧を取得
 * - 高度なフィルタリング機能：日付範囲、タイプ、カテゴリ、説明文検索
 * - ページネーション対応
 * - 柔軟なソート機能：取引日、金額、作成日時
 * - レスポンス形式はカテゴリAPIに準拠
 *
 * クエリパラメータ:
 * - from: string (YYYY-MM-DD形式) - 開始日
 * - to: string (YYYY-MM-DD形式) - 終了日
 * - type: 'income' | 'expense' (オプション) - 取引タイプ
 * - category_id: number (オプション) - カテゴリID
 * - search: string (オプション) - 説明文検索
 * - page: number (オプション) - ページ番号（デフォルト: 1）
 * - limit: number (オプション) - 1ページあたりの件数（デフォルト: 20）
 * - sort_by: 'transactionDate' | 'amount' | 'createdAt' (オプション) - ソート対象
 * - sort_order: 'asc' | 'desc' (オプション) - ソート順序（デフォルト: desc）
 */

// クエリパラメータのバリデーションスキーマ
// GitHubイシューの仕様に合わせてパラメータ名を統一
const queryParamsSchema = z.object({
	// 日付範囲フィルタ
	from: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),
	to: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/)
		.optional(),

	// カテゴリ・タイプフィルタ
	type: z.enum(["income", "expense"]).optional(),
	category_id: z
		.union([z.string(), z.number()])
		.transform((val) =>
			typeof val === "string" ? Number.parseInt(val, 10) : val,
		)
		.refine((val) => !Number.isNaN(val), {
			message: "category_idは有効な数値である必要があります",
		})
		.optional(),

	// 検索フィルタ
	search: z.string().min(1).optional(),

	// ページネーション
	page: z
		.union([z.string(), z.number()])
		.transform((val) =>
			typeof val === "string" ? Number.parseInt(val, 10) : val,
		)
		.refine((val) => !Number.isNaN(val) && val >= 1, {
			message: "pageは1以上の数値である必要があります",
		})
		.default(1),
	limit: z
		.union([z.string(), z.number()])
		.transform((val) =>
			typeof val === "string" ? Number.parseInt(val, 10) : val,
		)
		.refine((val) => !Number.isNaN(val) && val >= 1 && val <= 1000, {
			message: "limitは1以上1000以下の数値である必要があります",
		})
		.default(20),

	// ソート
	sort_by: z
		.enum(["transactionDate", "amount", "createdAt"])
		.default("transactionDate"),
	sort_order: z.enum(["asc", "desc"]).default("desc"),
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

		const {
			from,
			to,
			type,
			category_id,
			search,
			page,
			limit,
			sort_by,
			sort_order,
		} = parsedParams.data;

		// 取引一覧を取得（高度なフィルタリング・ページネーション・ソート対応）
		// 複雑なクエリのため、データベースエラーが発生しやすい
		const result = await getTransactionsList(db, {
			startDate: from,
			endDate: to,
			type,
			categoryId: category_id,
			search,
			page,
			limit,
			sortBy: sort_by,
			sortOrder: sort_order,
		});

		// タグのJSONパーシング処理を追加（詳細APIと同じ処理）
		// データベースではJSON文字列として保存されているため、クライアントには配列として返す
		const transactionsWithParsedTags = parseTransactionsWithTags(
			result.transactions,
		);

		// 成功レスポンスを統一フォーマットで返す
		return createSuccessResponse(transactionsWithParsedTags, {
			count: transactionsWithParsedTags.length,
			pagination: {
				currentPage: result.currentPage,
				totalPages: result.totalPages,
				totalCount: result.totalCount,
				hasNextPage: result.hasNextPage,
				hasPrevPage: result.hasPrevPage,
				limit,
			},
			filters: {
				from,
				to,
				type,
				category_id,
				search,
			},
			sort: {
				sort_by,
				sort_order,
			},
			// デバッグ情報（開発環境のみ）
			...(process.env.NODE_ENV !== "production" && {
				debugInfo: {
					requestUrl: request.url,
					appliedFilters: parsedParams.data,
					queryExecutionTime: Date.now(), // 簡易パフォーマンス測定
					databaseConnection: d1 ? "D1" : "SQLite (fallback)",
					recordsProcessed: {
						fetched: result.transactions.length,
						afterTagParsing: transactionsWithParsedTags.length,
					},
				},
			}),
		});
	} catch (error) {
		// 詳細なエラー診断と適切なレスポンス生成
		// 取引データは複雑な関連データを含むため、より詳細な診断を実行
		return await createErrorResponse(
			error,
			"取引一覧の取得中にエラーが発生しました",
			d1,
			true, // データベース健全性チェックを含める
		);
	}
}
