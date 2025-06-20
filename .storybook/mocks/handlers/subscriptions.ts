/**
 * サブスクリプションAPI用MSWハンドラー
 *
 * 設計方針:
 * - サブスクリプション管理の全機能をサポート
 * - 有効化・無効化の状態管理
 * - フィルタリング・検索機能対応
 * - 統計情報とレポート機能
 */

import { http, HttpResponse } from "msw";
import {
	calculateMonthlyTotal,
	calculateYearlyTotal,
	filterSubscriptions,
	generateLargeSubscriptionDataset,
	getSubscriptionById,
	getSubscriptionStatsByCategory,
	getUpcomingPayments,
	mockActiveSubscriptions,
	mockInactiveSubscriptions,
	mockMonthlySubscriptions,
	mockSubscriptions,
	mockSubscriptionsByCategory,
	mockYearlySubscriptions,
} from "../data/subscriptions";

// ========================================
// サブスクリプションAPI ハンドラー群
// ========================================

export const subscriptionsHandlers = [
	// サブスクリプション一覧取得 GET /api/subscriptions
	http.get("/api/subscriptions", ({ request }) => {
		const url = new URL(request.url);
		const params = Object.fromEntries(url.searchParams);

		// フィルターパラメータ
		const filters = {
			isActive:
				params.is_active !== undefined
					? params.is_active === "true"
					: undefined,
			frequency: params.frequency as "monthly" | "yearly" | undefined,
			category_id: params.category_id ? Number(params.category_id) : undefined,
			search: params.search,
		};

		// 大量データセットのテスト
		let dataset = mockSubscriptions;
		if (params.large === "true") {
			dataset = generateLargeSubscriptionDataset(50);
		}

		// フィルタリング適用
		const filteredData = filterSubscriptions(dataset, filters);

		// ソート適用（名前順または金額順）
		const sortBy = params.sort_by || "name";
		const sortOrder = params.sort_order || "asc";

		const sortedData = [...filteredData].sort((a, b) => {
			let aVal: number | string;
			let bVal: number | string;

			switch (sortBy) {
				case "amount":
					aVal = a.amount;
					bVal = b.amount;
					break;
				case "startDate":
					aVal = new Date(a.startDate).getTime();
					bVal = new Date(b.startDate).getTime();
					break;
				case "nextPaymentDate":
					aVal = new Date(a.nextPaymentDate || "2099-12-31").getTime();
					bVal = new Date(b.nextPaymentDate || "2099-12-31").getTime();
					break;
				default: // name
					aVal = a.name.toLowerCase();
					bVal = b.name.toLowerCase();
			}

			if (typeof aVal === "number" && typeof bVal === "number") {
				const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
				return sortOrder === "desc" ? -result : result;
			}
			if (typeof aVal === "string" && typeof bVal === "string") {
				const result = aVal.localeCompare(bVal);
				return sortOrder === "desc" ? -result : result;
			}

			return 0;
		});

		return HttpResponse.json({
			success: true,
			data: sortedData,
			count: sortedData.length,
			filters: {
				is_active: filters.isActive,
				frequency: filters.frequency || null,
				category_id: filters.category_id || null,
				search: filters.search || null,
			},
			sort: {
				sort_by: sortBy,
				sort_order: sortOrder,
			},
		});
	}),

	// サブスクリプション詳細取得 GET /api/subscriptions/:id
	http.get("/api/subscriptions/:id", ({ params }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なサブスクリプションIDです",
					details: "サブスクリプションIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const result = getSubscriptionById(id);

		if ("error" in result) {
			return HttpResponse.json(result, { status: 404 });
		}

		return HttpResponse.json(result);
	}),

	// サブスクリプション作成 POST /api/subscriptions
	http.post("/api/subscriptions", async ({ request }) => {
		try {
			const body = (await request.json()) as any;

			// 必須フィールドのバリデーション
			const requiredFields = [
				"name",
				"amount",
				"categoryId",
				"frequency",
				"startDate",
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

			if (!["monthly", "yearly"].includes(body.frequency)) {
				return HttpResponse.json(
					{
						error: "不正な頻度です",
						details: "frequencyはmonthlyまたはyearlyである必要があります",
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
			if (!dateRegex.test(body.startDate)) {
				return HttpResponse.json(
					{
						error: "不正な開始日フォーマットです",
						details: "開始日はYYYY-MM-DD形式で指定してください",
					},
					{ status: 400 },
				);
			}

			// 名前の重複チェック
			const existingSubscription = mockSubscriptions.find(
				(sub) =>
					sub.name.toLowerCase() === body.name.toLowerCase() && sub.isActive,
			);

			if (existingSubscription) {
				return HttpResponse.json(
					{
						error: "サブスクリプション名が重複しています",
						details: `「${body.name}」は既に存在します`,
					},
					{ status: 409 },
				);
			}

			// 次回支払日を計算
			const startDate = new Date(body.startDate);
			const nextPaymentDate = new Date(startDate);
			if (body.frequency === "monthly") {
				nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
			} else {
				nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
			}

			// 新しいサブスクリプションを作成
			const newSubscription = {
				id: Math.max(...mockSubscriptions.map((s) => s.id), 0) + 1,
				name: body.name,
				amount: body.amount,
				categoryId: body.categoryId,
				frequency: body.frequency,
				startDate: body.startDate,
				endDate: body.endDate || null,
				description: body.description || "",
				isActive: true,
				nextPaymentDate: nextPaymentDate.toISOString().split("T")[0],
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// モックデータに追加
			mockSubscriptions.push(newSubscription);

			return HttpResponse.json(
				{
					success: true,
					data: newSubscription,
				},
				{ status: 201 },
			);
		} catch (error) {
			return HttpResponse.json(
				{
					error: "サブスクリプションの作成に失敗しました",
					details: "リクエストボディの解析に失敗しました",
				},
				{ status: 400 },
			);
		}
	}),

	// サブスクリプション更新 PUT /api/subscriptions/:id
	http.put("/api/subscriptions/:id", async ({ params, request }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なサブスクリプションIDです",
					details: "サブスクリプションIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const subscriptionIndex = mockSubscriptions.findIndex((s) => s.id === id);

		if (subscriptionIndex === -1) {
			return HttpResponse.json(
				{
					error: "サブスクリプションが見つかりません",
					details: `ID: ${id} のサブスクリプションは存在しません`,
				},
				{ status: 404 },
			);
		}

		try {
			const body = (await request.json()) as any;
			const existingSubscription = mockSubscriptions[subscriptionIndex];

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

			if (
				body.frequency !== undefined &&
				!["monthly", "yearly"].includes(body.frequency)
			) {
				return HttpResponse.json(
					{
						error: "不正な頻度です",
						details: "frequencyはmonthlyまたはyearlyである必要があります",
					},
					{ status: 400 },
				);
			}

			// 名前の重複チェック（自分以外）
			if (body.name && body.name !== existingSubscription.name) {
				const duplicateSubscription = mockSubscriptions.find(
					(sub) =>
						sub.name.toLowerCase() === body.name.toLowerCase() &&
						sub.isActive &&
						sub.id !== id,
				);

				if (duplicateSubscription) {
					return HttpResponse.json(
						{
							error: "サブスクリプション名が重複しています",
							details: `「${body.name}」は既に存在します`,
						},
						{ status: 409 },
					);
				}
			}

			// 次回支払日の再計算（頻度が変更された場合）
			let nextPaymentDate = existingSubscription.nextPaymentDate;
			if (body.frequency && body.frequency !== existingSubscription.frequency) {
				const startDate = new Date(existingSubscription.startDate);
				const newNextPaymentDate = new Date(startDate);
				if (body.frequency === "monthly") {
					newNextPaymentDate.setMonth(newNextPaymentDate.getMonth() + 1);
				} else {
					newNextPaymentDate.setFullYear(newNextPaymentDate.getFullYear() + 1);
				}
				nextPaymentDate = newNextPaymentDate.toISOString().split("T")[0];
			}

			// サブスクリプション更新
			const updatedSubscription = {
				...existingSubscription,
				...body,
				id, // IDは変更不可
				nextPaymentDate,
				updatedAt: new Date().toISOString(),
			};

			mockSubscriptions[subscriptionIndex] = updatedSubscription;

			return HttpResponse.json({
				success: true,
				data: updatedSubscription,
			});
		} catch (error) {
			return HttpResponse.json(
				{
					error: "サブスクリプションの更新に失敗しました",
					details: "リクエストボディの解析に失敗しました",
				},
				{ status: 400 },
			);
		}
	}),

	// サブスクリプション削除 DELETE /api/subscriptions/:id
	http.delete("/api/subscriptions/:id", ({ params }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なサブスクリプションIDです",
					details: "サブスクリプションIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const subscriptionIndex = mockSubscriptions.findIndex((s) => s.id === id);

		if (subscriptionIndex === -1) {
			return HttpResponse.json(
				{
					error: "サブスクリプションが見つかりません",
					details: `ID: ${id} のサブスクリプションは存在しません`,
				},
				{ status: 404 },
			);
		}

		// サブスクリプション削除（実際には無効化）
		const subscription = mockSubscriptions[subscriptionIndex];
		mockSubscriptions[subscriptionIndex] = {
			...subscription,
			isActive: false,
			endDate: new Date().toISOString().split("T")[0],
			nextPaymentDate: null,
			updatedAt: new Date().toISOString(),
		};

		return HttpResponse.json({
			success: true,
			data: { message: "サブスクリプションが削除されました" },
		});
	}),

	// サブスクリプション有効化 POST /api/subscriptions/:id/activate
	http.post("/api/subscriptions/:id/activate", ({ params }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なサブスクリプションIDです",
					details: "サブスクリプションIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const subscriptionIndex = mockSubscriptions.findIndex((s) => s.id === id);

		if (subscriptionIndex === -1) {
			return HttpResponse.json(
				{
					error: "サブスクリプションが見つかりません",
					details: `ID: ${id} のサブスクリプションは存在しません`,
				},
				{ status: 404 },
			);
		}

		const subscription = mockSubscriptions[subscriptionIndex];

		if (subscription.isActive) {
			return HttpResponse.json(
				{
					error: "既に有効化されています",
					details: "このサブスクリプションは既に有効です",
				},
				{ status: 409 },
			);
		}

		// 次回支払日を再計算
		const today = new Date();
		const nextPaymentDate = new Date(today);
		if (subscription.frequency === "monthly") {
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
		} else {
			nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
		}

		// サブスクリプション有効化
		const updatedSubscription = {
			...subscription,
			isActive: true,
			endDate: null,
			nextPaymentDate: nextPaymentDate.toISOString().split("T")[0],
			updatedAt: new Date().toISOString(),
		};

		mockSubscriptions[subscriptionIndex] = updatedSubscription;

		return HttpResponse.json({
			success: true,
			data: updatedSubscription,
		});
	}),

	// サブスクリプション無効化 POST /api/subscriptions/:id/deactivate
	http.post("/api/subscriptions/:id/deactivate", ({ params }) => {
		const id = Number(params.id);

		if (Number.isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なサブスクリプションIDです",
					details: "サブスクリプションIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const subscriptionIndex = mockSubscriptions.findIndex((s) => s.id === id);

		if (subscriptionIndex === -1) {
			return HttpResponse.json(
				{
					error: "サブスクリプションが見つかりません",
					details: `ID: ${id} のサブスクリプションは存在しません`,
				},
				{ status: 404 },
			);
		}

		const subscription = mockSubscriptions[subscriptionIndex];

		if (!subscription.isActive) {
			return HttpResponse.json(
				{
					error: "既に無効化されています",
					details: "このサブスクリプションは既に無効です",
				},
				{ status: 409 },
			);
		}

		// サブスクリプション無効化
		const updatedSubscription = {
			...subscription,
			isActive: false,
			endDate: new Date().toISOString().split("T")[0],
			nextPaymentDate: null,
			updatedAt: new Date().toISOString(),
		};

		mockSubscriptions[subscriptionIndex] = updatedSubscription;

		return HttpResponse.json({
			success: true,
			data: updatedSubscription,
		});
	}),

	// ========================================
	// 統計・レポート系エンドポイント
	// ========================================

	// サブスクリプション統計取得 GET /api/subscriptions/stats
	http.get("/api/subscriptions/stats", () => {
		const activeSubscriptions = mockSubscriptions.filter((s) => s.isActive);
		const monthlyTotal = calculateMonthlyTotal(activeSubscriptions);
		const yearlyTotal = calculateYearlyTotal(activeSubscriptions);
		const categoryStats = getSubscriptionStatsByCategory(activeSubscriptions);

		return HttpResponse.json({
			success: true,
			data: {
				totalCount: activeSubscriptions.length,
				monthlyTotal,
				yearlyTotal,
				averageMonthly:
					activeSubscriptions.length > 0
						? Math.round(monthlyTotal / activeSubscriptions.length)
						: 0,
				categoryBreakdown: Object.entries(categoryStats).map(
					([categoryId, stats]) => ({
						categoryId: Number(categoryId),
						count: stats.count,
						monthlyTotal: stats.monthlyTotal,
						yearlyTotal: stats.yearlyTotal,
						percentage:
							activeSubscriptions.length > 0
								? (stats.count / activeSubscriptions.length) * 100
								: 0,
					}),
				),
				frequencyBreakdown: {
					monthly: activeSubscriptions.filter((s) => s.frequency === "monthly")
						.length,
					yearly: activeSubscriptions.filter((s) => s.frequency === "yearly")
						.length,
				},
			},
		});
	}),

	// 今月の支払い予定 GET /api/subscriptions/upcoming
	http.get("/api/subscriptions/upcoming", ({ request }) => {
		const url = new URL(request.url);
		const month = url.searchParams.get("month");

		const upcomingPayments = getUpcomingPayments(
			mockSubscriptions,
			month || undefined,
		);

		return HttpResponse.json({
			success: true,
			data: upcomingPayments,
			count: upcomingPayments.length,
			totalAmount: upcomingPayments.reduce((sum, sub) => sum + sub.amount, 0),
			targetMonth: month || new Date().toISOString().substr(0, 7),
		});
	}),

	// ========================================
	// エラーシミュレーション用ハンドラー
	// ========================================

	// サーバーエラー
	http.get("/api/subscriptions/error/server", () => {
		return HttpResponse.json(
			{
				error: "内部サーバーエラーが発生しました",
				details: "データベース接続に失敗しました",
			},
			{ status: 500 },
		);
	}),

	// 遅延レスポンス
	http.get("/api/subscriptions/slow", async () => {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		return HttpResponse.json({
			success: true,
			data: mockSubscriptions,
			count: mockSubscriptions.length,
		});
	}),
];

// ========================================
// 特定ユースケース用の便利ハンドラー
// ========================================

// 空データ
export const emptySubscriptionsHandler = http.get("/api/subscriptions", () => {
	return HttpResponse.json({
		success: true,
		data: [],
		count: 0,
	});
});

// アクティブのみ
export const activeSubscriptionsOnlyHandler = http.get(
	"/api/subscriptions",
	() => {
		return HttpResponse.json({
			success: true,
			data: mockActiveSubscriptions,
			count: mockActiveSubscriptions.length,
		});
	},
);

// 非アクティブのみ
export const inactiveSubscriptionsOnlyHandler = http.get(
	"/api/subscriptions",
	() => {
		return HttpResponse.json({
			success: true,
			data: mockInactiveSubscriptions,
			count: mockInactiveSubscriptions.length,
		});
	},
);

// 月額のみ
export const monthlySubscriptionsOnlyHandler = http.get(
	"/api/subscriptions",
	() => {
		return HttpResponse.json({
			success: true,
			data: mockMonthlySubscriptions,
			count: mockMonthlySubscriptions.length,
		});
	},
);

// エラーハンドラー
export const subscriptionErrorHandler = http.get("/api/subscriptions", () => {
	return HttpResponse.json(
		{
			error: "サブスクリプションデータの取得に失敗しました",
			details: "データベース接続エラーが発生しました",
		},
		{ status: 500 },
	);
});

export default subscriptionsHandlers;
