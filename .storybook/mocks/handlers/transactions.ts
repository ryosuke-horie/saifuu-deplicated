/**
 * 取引API用MSWハンドラー
 *
 * 設計方針:
 * - ページネーション・フィルタリング・ソート機能の完全サポート
 * - CRUD操作の全パターン対応
 * - リアルなデータバリデーションとエラーハンドリング
 * - パフォーマンステスト用の大量データ対応
 */

import { http, HttpResponse } from "msw";
import {
	filterTransactions,
	generateLargeTransactionDataset,
	getTransactionById,
	mockExpenseTransactions,
	mockIncomeTransactions,
	mockTransactions,
	paginateTransactions,
	sortTransactions,
} from "../data/transactions";

// ========================================
// 取引API ハンドラー群
// ========================================

export const transactionsHandlers = [
	// 取引一覧取得 GET /api/transactions
	http.get("/api/transactions", ({ request }) => {
		const url = new URL(request.url);
		const params = Object.fromEntries(url.searchParams);

		// パラメータ解析
		const page = Number(params.page) || 1;
		const limit = Number(params.limit) || 20;
		const sortBy = params.sort_by || "transactionDate";
		const sortOrder = params.sort_order || "desc";

		// フィルターパラメータ
		const filters = {
			type: params.type as "income" | "expense" | undefined,
			category_id: params.category_id ? Number(params.category_id) : undefined,
			from: params.from,
			to: params.to,
			search: params.search,
		};

		// バリデーション
		if (page <= 0 || limit <= 0 || limit > 100) {
			return HttpResponse.json(
				{
					error: "不正なページネーションパラメータです",
					details: "pageは1以上、limitは1-100の範囲で指定してください",
				},
				{ status: 400 },
			);
		}

		if (!["transactionDate", "amount", "createdAt"].includes(sortBy)) {
			return HttpResponse.json(
				{
					error: "不正なソートフィールドです",
					details:
						"sort_byはtransactionDate、amount、createdAtのいずれかを指定してください",
				},
				{ status: 400 },
			);
		}

		if (!["asc", "desc"].includes(sortOrder)) {
			return HttpResponse.json(
				{
					error: "不正なソート順序です",
					details: "sort_orderはascまたはdescを指定してください",
				},
				{ status: 400 },
			);
		}

		// 大量データセットのテスト
		let dataset = mockTransactions;
		if (params.large === "true") {
			dataset = generateLargeTransactionDataset(100);
		}

		// フィルタリング適用
		const filteredData = filterTransactions(dataset, filters);

		// ソート適用
		const sortedData = sortTransactions(filteredData, sortBy, sortOrder);

		// ページネーション適用
		const paginatedResult = paginateTransactions(sortedData, page, limit);

		return HttpResponse.json({
			success: true,
			data: paginatedResult.data,
			pagination: paginatedResult.pagination,
			filters: {
				type: filters.type || null,
				category_id: filters.category_id || null,
				from: filters.from || null,
				to: filters.to || null,
				search: filters.search || null,
			},
			sort: {
				sort_by: sortBy,
				sort_order: sortOrder,
			},
		});
	}),

	// 取引詳細取得 GET /api/transactions/:id
	http.get("/api/transactions/:id", ({ params }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正な取引IDです",
					details: "取引IDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const result = getTransactionById(id);

		if ("error" in result) {
			return HttpResponse.json(result, { status: 404 });
		}

		return HttpResponse.json(result);
	}),

	// 取引作成 POST /api/transactions
	http.post("/api/transactions", async ({ request }) => {
		try {
			const body = (await request.json()) as any;

			// 必須フィールドのバリデーション
			const requiredFields = [
				"amount",
				"type",
				"categoryId",
				"description",
				"transactionDate",
			];
			const missingFields = requiredFields.filter((field) => !body[field]);

			if (missingFields.length > 0) {
				return HttpResponse.json(
					{
						error: "必須フィールドが不足しています",
						details: `以下のフィールドが必要です: ${missingFields.join(", ")}`,
					},
					{ status: 400 },
				);
			}

			// データ型のバリデーション
			if (typeof body.amount !== "number" || body.amount <= 0) {
				return HttpResponse.json(
					{
						error: "不正な金額です",
						details: "金額は正の数値である必要があります",
					},
					{ status: 400 },
				);
			}

			if (!["income", "expense"].includes(body.type)) {
				return HttpResponse.json(
					{
						error: "不正な取引タイプです",
						details: "typeはincomeまたはexpenseである必要があります",
					},
					{ status: 400 },
				);
			}

			if (typeof body.categoryId !== "number" || body.categoryId <= 0) {
				return HttpResponse.json(
					{
						error: "不正なカテゴリIDです",
						details: "カテゴリIDは正の整数である必要があります",
					},
					{ status: 400 },
				);
			}

			// 日付フォーマットのバリデーション
			const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
			if (!dateRegex.test(body.transactionDate)) {
				return HttpResponse.json(
					{
						error: "不正な日付フォーマットです",
						details: "日付はYYYY-MM-DD形式で指定してください",
					},
					{ status: 400 },
				);
			}

			// 新しい取引を作成
			const newTransaction = {
				id: Math.max(...mockTransactions.map((t) => t.id), 0) + 1,
				amount: body.amount,
				type: body.type,
				categoryId: body.categoryId,
				description: body.description,
				transactionDate: body.transactionDate,
				paymentMethod: body.paymentMethod || null,
				tags: body.tags || null,
				receiptUrl: body.receiptUrl || null,
				isRecurring: body.isRecurring || false,
				recurringId: body.recurringId || null,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// モックデータに追加
			mockTransactions.unshift(newTransaction);

			return HttpResponse.json(
				{
					success: true,
					data: newTransaction,
				},
				{ status: 201 },
			);
		} catch (error) {
			return HttpResponse.json(
				{
					error: "取引の作成に失敗しました",
					details: "リクエストボディの解析に失敗しました",
				},
				{ status: 400 },
			);
		}
	}),

	// 取引更新 PUT /api/transactions/:id
	http.put("/api/transactions/:id", async ({ params, request }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正な取引IDです",
					details: "取引IDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const transactionIndex = mockTransactions.findIndex((t) => t.id === id);

		if (transactionIndex === -1) {
			return HttpResponse.json(
				{
					error: "取引が見つかりません",
					details: `ID: ${id} の取引は存在しません`,
				},
				{ status: 404 },
			);
		}

		try {
			const body = (await request.json()) as any;
			const existingTransaction = mockTransactions[transactionIndex];

			// データ型のバリデーション（指定されたフィールドのみ）
			if (body.amount !== undefined) {
				if (typeof body.amount !== "number" || body.amount <= 0) {
					return HttpResponse.json(
						{
							error: "不正な金額です",
							details: "金額は正の数値である必要があります",
						},
						{ status: 400 },
					);
				}
			}

			if (body.categoryId !== undefined) {
				if (typeof body.categoryId !== "number" || body.categoryId <= 0) {
					return HttpResponse.json(
						{
							error: "不正なカテゴリIDです",
							details: "カテゴリIDは正の整数である必要があります",
						},
						{ status: 400 },
					);
				}
			}

			if (body.transactionDate !== undefined) {
				const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
				if (!dateRegex.test(body.transactionDate)) {
					return HttpResponse.json(
						{
							error: "不正な日付フォーマットです",
							details: "日付はYYYY-MM-DD形式で指定してください",
						},
						{ status: 400 },
					);
				}
			}

			// 取引更新
			const updatedTransaction = {
				...existingTransaction,
				...body,
				id, // IDは変更不可
				type: existingTransaction.type, // タイプは変更不可（業務ルール）
				updatedAt: new Date().toISOString(),
			};

			mockTransactions[transactionIndex] = updatedTransaction;

			return HttpResponse.json({
				success: true,
				data: updatedTransaction,
			});
		} catch (error) {
			return HttpResponse.json(
				{
					error: "取引の更新に失敗しました",
					details: "リクエストボディの解析に失敗しました",
				},
				{ status: 400 },
			);
		}
	}),

	// 取引削除 DELETE /api/transactions/:id
	http.delete("/api/transactions/:id", ({ params }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正な取引IDです",
					details: "取引IDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const transactionIndex = mockTransactions.findIndex((t) => t.id === id);

		if (transactionIndex === -1) {
			return HttpResponse.json(
				{
					error: "取引が見つかりません",
					details: `ID: ${id} の取引は存在しません`,
				},
				{ status: 404 },
			);
		}

		// 定期取引の削除制約チェック
		const transaction = mockTransactions[transactionIndex];
		if (transaction.isRecurring && transaction.recurringId) {
			const relatedTransactions = mockTransactions.filter(
				(t) => t.recurringId === transaction.recurringId && t.id !== id,
			);

			if (relatedTransactions.length > 0) {
				return HttpResponse.json(
					{
						error: "定期取引の削除には注意が必要です",
						details:
							"この取引は定期取引の一部です。関連する取引も削除されます。",
						warning: true,
						relatedCount: relatedTransactions.length,
					},
					{ status: 409 },
				);
			}
		}

		// 取引削除
		const deletedTransaction = mockTransactions.splice(transactionIndex, 1)[0];

		return HttpResponse.json({
			success: true,
			data: {
				message: "取引が削除されました",
				deletedTransaction,
			},
		});
	}),

	// ========================================
	// 特殊なエンドポイント
	// ========================================

	// 統計情報取得 GET /api/transactions/stats
	http.get("/api/transactions/stats", ({ request }) => {
		const url = new URL(request.url);
		const from = url.searchParams.get("from");
		const to = url.searchParams.get("to");

		let dataset = mockTransactions;

		// 日付範囲フィルター
		if (from || to) {
			dataset = filterTransactions(dataset, {
				from: from || undefined,
				to: to || undefined,
			});
		}

		const totalIncome = dataset
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);

		const totalExpense = dataset
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);

		const balance = totalIncome - totalExpense;

		// カテゴリ別集計
		const categoryBreakdown: Record<number, { amount: number; count: number }> =
			{};
		dataset.forEach((t) => {
			if (!categoryBreakdown[t.categoryId]) {
				categoryBreakdown[t.categoryId] = { amount: 0, count: 0 };
			}
			categoryBreakdown[t.categoryId].amount += t.amount;
			categoryBreakdown[t.categoryId].count += 1;
		});

		return HttpResponse.json({
			success: true,
			data: {
				totalIncome,
				totalExpense,
				balance,
				transactionCount: dataset.length,
				categoryBreakdown: Object.entries(categoryBreakdown).map(
					([categoryId, stats]) => ({
						categoryId: Number(categoryId),
						amount: stats.amount,
						count: stats.count,
						percentage:
							dataset.length > 0 ? (stats.count / dataset.length) * 100 : 0,
					}),
				),
				dateRange: {
					from: from || null,
					to: to || null,
				},
			},
		});
	}),

	// 一括削除 DELETE /api/transactions/batch
	http.delete("/api/transactions/batch", async ({ request }) => {
		try {
			const body = (await request.json()) as any;

			if (!body.ids || !Array.isArray(body.ids)) {
				return HttpResponse.json(
					{
						error: "不正なリクエストです",
						details: "ids配列が必要です",
					},
					{ status: 400 },
				);
			}

			const deletedIds: number[] = [];
			const notFoundIds: number[] = [];

			body.ids.forEach((id: number) => {
				const index = mockTransactions.findIndex((t) => t.id === id);
				if (index !== -1) {
					mockTransactions.splice(index, 1);
					deletedIds.push(id);
				} else {
					notFoundIds.push(id);
				}
			});

			return HttpResponse.json({
				success: true,
				data: {
					deletedCount: deletedIds.length,
					deletedIds,
					notFoundIds,
					message: `${deletedIds.length}件の取引が削除されました`,
				},
			});
		} catch (error) {
			return HttpResponse.json(
				{
					error: "一括削除に失敗しました",
					details: "リクエストボディの解析に失敗しました",
				},
				{ status: 400 },
			);
		}
	}),

	// ========================================
	// エラーシミュレーション用ハンドラー
	// ========================================

	// サーバーエラー
	http.get("/api/transactions/error/server", () => {
		return HttpResponse.json(
			{
				error: "内部サーバーエラーが発生しました",
				details: "データベース接続に失敗しました",
			},
			{ status: 500 },
		);
	}),

	// タイムアウト
	http.get("/api/transactions/error/timeout", async () => {
		await new Promise(() => {}); // 無限待機
		return HttpResponse.json({ data: [] });
	}),

	// 遅延レスポンス
	http.get("/api/transactions/slow", async ({ request }) => {
		await new Promise((resolve) => setTimeout(resolve, 2000));

		// 通常のレスポンスを返す
		const url = new URL(request.url);
		const params = Object.fromEntries(url.searchParams);
		const page = Number(params.page) || 1;
		const limit = Number(params.limit) || 20;

		const paginatedResult = paginateTransactions(mockTransactions, page, limit);

		return HttpResponse.json({
			success: true,
			data: paginatedResult.data,
			pagination: paginatedResult.pagination,
			filters: {},
			sort: { sort_by: "transactionDate", sort_order: "desc" },
		});
	}),
];

// ========================================
// 特定ユースケース用の便利ハンドラー
// ========================================

// 空データ
export const emptyTransactionsHandler = http.get("/api/transactions", () => {
	return HttpResponse.json({
		success: true,
		data: [],
		pagination: {
			currentPage: 1,
			totalPages: 0,
			totalCount: 0,
			hasNextPage: false,
			hasPrevPage: false,
			limit: 20,
		},
		filters: {},
		sort: { sort_by: "transactionDate", sort_order: "desc" },
	});
});

// 収入のみ
export const incomeOnlyHandler = http.get(
	"/api/transactions",
	({ request }) => {
		const url = new URL(request.url);
		const page = Number(url.searchParams.get("page")) || 1;
		const limit = Number(url.searchParams.get("limit")) || 20;

		const paginatedResult = paginateTransactions(
			mockIncomeTransactions,
			page,
			limit,
		);

		return HttpResponse.json({
			success: true,
			data: paginatedResult.data,
			pagination: paginatedResult.pagination,
			filters: { type: "income" },
			sort: { sort_by: "transactionDate", sort_order: "desc" },
		});
	},
);

// 支出のみ
export const expenseOnlyHandler = http.get(
	"/api/transactions",
	({ request }) => {
		const url = new URL(request.url);
		const page = Number(url.searchParams.get("page")) || 1;
		const limit = Number(url.searchParams.get("limit")) || 20;

		const paginatedResult = paginateTransactions(
			mockExpenseTransactions,
			page,
			limit,
		);

		return HttpResponse.json({
			success: true,
			data: paginatedResult.data,
			pagination: paginatedResult.pagination,
			filters: { type: "expense" },
			sort: { sort_by: "transactionDate", sort_order: "desc" },
		});
	},
);

// エラーハンドラー
export const transactionErrorHandler = http.get("/api/transactions", () => {
	return HttpResponse.json(
		{
			error: "取引データの取得に失敗しました",
			details: "データベース接続エラーが発生しました",
		},
		{ status: 500 },
	);
});

export default transactionsHandlers;
