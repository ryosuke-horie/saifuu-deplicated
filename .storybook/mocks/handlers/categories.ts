/**
 * カテゴリAPI用MSWハンドラー
 *
 * 設計方針:
 * - 実際のAPIエンドポイントと同じパス・パラメータ構造
 * - CRUD操作の完全サポート
 * - エラーケースの網羅
 * - リアルな応答時間とデータバリデーション
 */

import { http, HttpResponse } from "msw";
import {
	generateLargeCategoryDataset,
	getCategoryById,
	mockCategories,
	mockCategoriesApiResponse,
	mockCategoryErrorResponse,
	mockExpenseCategories,
	mockExpenseCategoriesApiResponse,
	mockIncomeCategories,
	mockIncomeCategoriesApiResponse,
} from "../data/categories";

// ========================================
// カテゴリAPI ハンドラー群
// ========================================

export const categoriesHandlers = [
	// カテゴリ一覧取得 GET /api/categories
	http.get("/api/categories", ({ request }) => {
		const url = new URL(request.url);
		const type = url.searchParams.get("type");
		const includeInactive = url.searchParams.get("include_inactive") === "true";
		const large = url.searchParams.get("large") === "true";

		// 大量データセットのテスト
		if (large) {
			const largeDataset = generateLargeCategoryDataset();
			return HttpResponse.json({
				success: true,
				data: largeDataset,
				count: largeDataset.length,
			});
		}

		// タイプフィルター適用
		if (type === "income") {
			return HttpResponse.json(mockIncomeCategoriesApiResponse);
		}

		if (type === "expense") {
			return HttpResponse.json(mockExpenseCategoriesApiResponse);
		}

		// 非アクティブなカテゴリを含むかどうか
		let categories = mockCategories;
		if (!includeInactive) {
			categories = categories.filter((cat) => cat.isActive);
		}

		return HttpResponse.json({
			success: true,
			data: categories,
			count: categories.length,
		});
	}),

	// カテゴリ詳細取得 GET /api/categories/:id
	http.get("/api/categories/:id", ({ params }) => {
		const id = Number(params.id);

		if (isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なカテゴリIDです",
					details: "カテゴリIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const result = getCategoryById(id);

		if ("error" in result) {
			return HttpResponse.json(result, { status: 404 });
		}

		return HttpResponse.json(result);
	}),

	// カテゴリ作成 POST /api/categories
	http.post("/api/categories", async ({ request }) => {
		try {
			const body = (await request.json()) as any;

			// 必須フィールドのバリデーション
			const requiredFields = ["name", "type", "color", "icon"];
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

			// 名前の重複チェック
			const existingCategory = mockCategories.find(
				(cat) => cat.name === body.name && cat.type === body.type,
			);

			if (existingCategory) {
				return HttpResponse.json(
					{
						error: "カテゴリ名が重複しています",
						details: `${body.type}タイプで「${body.name}」は既に存在します`,
					},
					{ status: 409 },
				);
			}

			// 新しいカテゴリを作成
			const newCategory = {
				id: Math.max(...mockCategories.map((c) => c.id)) + 1,
				name: body.name,
				type: body.type,
				color: body.color,
				icon: body.icon,
				displayOrder: body.displayOrder || mockCategories.length + 1,
				isActive: true,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			};

			// モックデータに追加（実際の実装では永続化される）
			mockCategories.push(newCategory);

			return HttpResponse.json(
				{
					success: true,
					data: newCategory,
				},
				{ status: 201 },
			);
		} catch (error) {
			return HttpResponse.json(
				{
					error: "カテゴリの作成に失敗しました",
					details: "リクエストボディの解析に失敗しました",
				},
				{ status: 400 },
			);
		}
	}),

	// カテゴリ更新 PUT /api/categories/:id
	http.put("/api/categories/:id", async ({ params, request }) => {
		const id = Number(params.id);

		if (isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なカテゴリIDです",
					details: "カテゴリIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const categoryIndex = mockCategories.findIndex((cat) => cat.id === id);

		if (categoryIndex === -1) {
			return HttpResponse.json(
				{
					error: "カテゴリが見つかりません",
					details: `ID: ${id} のカテゴリは存在しません`,
				},
				{ status: 404 },
			);
		}

		try {
			const body = (await request.json()) as any;
			const existingCategory = mockCategories[categoryIndex];

			// 名前の重複チェック（自分以外）
			if (body.name && body.name !== existingCategory.name) {
				const duplicateCategory = mockCategories.find(
					(cat) =>
						cat.name === body.name &&
						cat.type === existingCategory.type &&
						cat.id !== id,
				);

				if (duplicateCategory) {
					return HttpResponse.json(
						{
							error: "カテゴリ名が重複しています",
							details: `${existingCategory.type}タイプで「${body.name}」は既に存在します`,
						},
						{ status: 409 },
					);
				}
			}

			// カテゴリ更新
			const updatedCategory = {
				...existingCategory,
				...body,
				id, // IDは変更不可
				type: existingCategory.type, // タイプは変更不可
				updatedAt: new Date().toISOString(),
			};

			mockCategories[categoryIndex] = updatedCategory;

			return HttpResponse.json({
				success: true,
				data: updatedCategory,
			});
		} catch (error) {
			return HttpResponse.json(
				{
					error: "カテゴリの更新に失敗しました",
					details: "リクエストボディの解析に失敗しました",
				},
				{ status: 400 },
			);
		}
	}),

	// カテゴリ削除 DELETE /api/categories/:id
	http.delete("/api/categories/:id", ({ params }) => {
		const id = Number(params.id);

		if (isNaN(id) || id <= 0) {
			return HttpResponse.json(
				{
					error: "不正なカテゴリIDです",
					details: "カテゴリIDは正の整数である必要があります",
				},
				{ status: 400 },
			);
		}

		const categoryIndex = mockCategories.findIndex((cat) => cat.id === id);

		if (categoryIndex === -1) {
			return HttpResponse.json(
				{
					error: "カテゴリが見つかりません",
					details: `ID: ${id} のカテゴリは存在しません`,
				},
				{ status: 404 },
			);
		}

		// 関連する取引がある場合の制約チェック（簡易版）
		// 実際の実装では、取引テーブルとの整合性をチェック
		const hasRelatedTransactions = Math.random() < 0.3; // 30%の確率で関連取引あり

		if (hasRelatedTransactions) {
			return HttpResponse.json(
				{
					error: "カテゴリを削除できません",
					details:
						"このカテゴリを使用している取引が存在します。先に関連する取引を削除または他のカテゴリに移動してください。",
				},
				{ status: 409 },
			);
		}

		// カテゴリ削除（実際には非アクティブ化）
		const deletedCategory = mockCategories[categoryIndex];
		mockCategories[categoryIndex] = {
			...deletedCategory,
			isActive: false,
			updatedAt: new Date().toISOString(),
		};

		return HttpResponse.json({
			success: true,
			data: { message: "カテゴリが削除されました" },
		});
	}),

	// カテゴリ並び替え POST /api/categories/reorder
	http.post("/api/categories/reorder", async ({ request }) => {
		try {
			const body = (await request.json()) as any;

			if (!body.categoryIds || !Array.isArray(body.categoryIds)) {
				return HttpResponse.json(
					{
						error: "不正なリクエストです",
						details: "categoryIds配列が必要です",
					},
					{ status: 400 },
				);
			}

			// IDの存在チェック
			const invalidIds = body.categoryIds.filter(
				(id: number) => !mockCategories.find((cat) => cat.id === id),
			);

			if (invalidIds.length > 0) {
				return HttpResponse.json(
					{
						error: "存在しないカテゴリIDが含まれています",
						details: `以下のIDが見つかりません: ${invalidIds.join(", ")}`,
					},
					{ status: 400 },
				);
			}

			// 並び順更新
			body.categoryIds.forEach((id: number, index: number) => {
				const categoryIndex = mockCategories.findIndex((cat) => cat.id === id);
				if (categoryIndex !== -1) {
					mockCategories[categoryIndex] = {
						...mockCategories[categoryIndex],
						displayOrder: index + 1,
						updatedAt: new Date().toISOString(),
					};
				}
			});

			// 更新されたカテゴリを返す
			const reorderedCategories = mockCategories
				.filter((cat) => body.categoryIds.includes(cat.id))
				.sort((a, b) => a.displayOrder - b.displayOrder);

			return HttpResponse.json({
				success: true,
				data: reorderedCategories,
			});
		} catch (error) {
			return HttpResponse.json(
				{
					error: "並び替えに失敗しました",
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
	http.get("/api/categories/error/server", () => {
		return HttpResponse.json(
			{
				error: "内部サーバーエラーが発生しました",
				details: "データベース接続に失敗しました",
			},
			{ status: 500 },
		);
	}),

	// タイムアウト
	http.get("/api/categories/error/timeout", async () => {
		// 10秒待機してタイムアウトをシミュレート
		await new Promise((resolve) => setTimeout(resolve, 10000));
		return HttpResponse.json({ data: [] });
	}),

	// ネットワークエラー
	http.get("/api/categories/error/network", () => {
		return HttpResponse.error();
	}),

	// 遅延レスポンス
	http.get("/api/categories/slow", async () => {
		await new Promise((resolve) => setTimeout(resolve, 2000));
		return HttpResponse.json(mockCategoriesApiResponse);
	}),
];

// ========================================
// 特定ユースケース用の便利ハンドラー
// ========================================

// 空データ
export const emptyCategoriesHandler = http.get("/api/categories", () => {
	return HttpResponse.json({
		success: true,
		data: [],
		count: 0,
	});
});

// 単一カテゴリのみ
export const singleCategoryHandler = http.get("/api/categories", () => {
	return HttpResponse.json({
		success: true,
		data: [mockCategories[0]],
		count: 1,
	});
});

// 収入カテゴリのみ
export const incomeCategoriesOnlyHandler = http.get("/api/categories", () => {
	return HttpResponse.json(mockIncomeCategoriesApiResponse);
});

// 支出カテゴリのみ
export const expenseCategoriesOnlyHandler = http.get("/api/categories", () => {
	return HttpResponse.json(mockExpenseCategoriesApiResponse);
});

// エラーハンドラー
export const categoryErrorHandler = http.get("/api/categories", () => {
	return HttpResponse.json(mockCategoryErrorResponse, { status: 500 });
});

export default categoriesHandlers;
