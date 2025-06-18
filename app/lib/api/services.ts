import {
	type BaseApiResponse,
	type CategoriesListResponse,
	type CategoryDetailResponse,
	type CreateCategoryRequest,
	type CreateSubscriptionRequest,
	type CreateTransactionRequest,
	type ReorderCategoriesRequest,
	type SubscriptionDetailResponse,
	type SubscriptionsListResponse,
	type TransactionDetailResponse,
	type TransactionFilters,
	type TransactionSort,
	type TransactionsListResponse,
	type UpdateCategoryRequest,
	type UpdateSubscriptionRequest,
	type UpdateTransactionRequest,
	baseApiResponseSchema,
	categoriesListResponseSchema,
	categoryDetailResponseSchema,
	createCategoryRequestSchema,
	createSubscriptionRequestSchema,
	createTransactionRequestSchema,
	reorderCategoriesRequestSchema,
	subscriptionDetailResponseSchema,
	subscriptionsListResponseSchema,
	transactionDetailResponseSchema,
	transactionsListResponseSchema,
	updateCategoryRequestSchema,
	updateSubscriptionRequestSchema,
	updateTransactionRequestSchema,
} from "../schemas/api-responses";
import { apiClient, buildQueryParams } from "./client";

/**
 * APIサービス層の実装
 *
 * 設計方針:
 * - 各リソース（カテゴリ、取引、サブスクリプション）に特化したサービス
 * - APIクライアントをラップして型安全な操作を提供
 * - TanStack Queryとの連携を考慮したメソッド設計
 * - 一貫性のあるエラーハンドリング
 */

// ========================================
// カテゴリAPI サービス
// ========================================

export const categoryService = {
	/**
	 * カテゴリ一覧を取得
	 */
	async getCategories(): Promise<CategoriesListResponse> {
		return apiClient.get("/categories", categoriesListResponseSchema);
	},

	/**
	 * カテゴリ詳細を取得
	 */
	async getCategory(id: number): Promise<CategoryDetailResponse> {
		return apiClient.get(`/categories/${id}`, categoryDetailResponseSchema);
	},

	/**
	 * 新しいカテゴリを作成
	 */
	async createCategory(
		data: CreateCategoryRequest,
	): Promise<CategoryDetailResponse> {
		// リクエストデータをバリデーション
		const validatedData = createCategoryRequestSchema.parse(data);
		return apiClient.post(
			"/categories/create",
			validatedData,
			categoryDetailResponseSchema,
		);
	},

	/**
	 * カテゴリを更新
	 */
	async updateCategory(
		id: number,
		data: UpdateCategoryRequest,
	): Promise<CategoryDetailResponse> {
		// リクエストデータをバリデーション
		const validatedData = updateCategoryRequestSchema.parse(data);
		return apiClient.put(
			`/categories/${id}/update`,
			validatedData,
			categoryDetailResponseSchema,
		);
	},

	/**
	 * カテゴリを削除
	 */
	async deleteCategory(id: number): Promise<BaseApiResponse> {
		return apiClient.delete(`/categories/${id}/delete`, baseApiResponseSchema);
	},

	/**
	 * カテゴリの並び順を変更
	 */
	async reorderCategories(
		data: ReorderCategoriesRequest,
	): Promise<BaseApiResponse> {
		// リクエストデータをバリデーション
		const validatedData = reorderCategoriesRequestSchema.parse(data);
		return apiClient.post(
			"/categories/reorder",
			validatedData,
			baseApiResponseSchema,
		);
	},
};

// ========================================
// 取引API サービス
// ========================================

export const transactionService = {
	/**
	 * 取引一覧を取得（フィルタリング・ページネーション対応）
	 */
	async getTransactions(
		params: {
			filters?: Partial<TransactionFilters>;
			sort?: Partial<TransactionSort>;
			page?: number;
			limit?: number;
		} = {},
	): Promise<TransactionsListResponse> {
		const queryParams = buildQueryParams({
			...params.filters,
			...params.sort,
			page: params.page,
			limit: params.limit,
		});

		return apiClient.get(
			`/transactions${queryParams}`,
			transactionsListResponseSchema,
		);
	},

	/**
	 * 取引詳細を取得
	 */
	async getTransaction(id: number): Promise<TransactionDetailResponse> {
		return apiClient.get(
			`/transactions/${id}`,
			transactionDetailResponseSchema,
		);
	},

	/**
	 * 新しい取引を作成
	 */
	async createTransaction(
		data: CreateTransactionRequest,
	): Promise<TransactionDetailResponse> {
		// リクエストデータをバリデーション
		const validatedData = createTransactionRequestSchema.parse(data);
		return apiClient.post(
			"/transactions/create",
			validatedData,
			transactionDetailResponseSchema,
		);
	},

	/**
	 * 取引を更新
	 */
	async updateTransaction(
		id: number,
		data: UpdateTransactionRequest,
	): Promise<TransactionDetailResponse> {
		// リクエストデータをバリデーション
		const validatedData = updateTransactionRequestSchema.parse(data);
		return apiClient.put(
			`/transactions/${id}/update`,
			validatedData,
			transactionDetailResponseSchema,
		);
	},

	/**
	 * 取引を削除
	 */
	async deleteTransaction(id: number): Promise<BaseApiResponse> {
		return apiClient.delete(
			`/transactions/${id}/delete`,
			baseApiResponseSchema,
		);
	},

	/**
	 * 取引の統計情報を取得（月次サマリーなど）
	 * 注：この機能はバックエンドAPIの実装が必要
	 */
	async getTransactionStats(
		params: {
			startDate?: string;
			endDate?: string;
			groupBy?: "month" | "category" | "type";
		} = {},
	): Promise<BaseApiResponse> {
		const queryParams = buildQueryParams(params);
		return apiClient.get(
			`/transactions/stats${queryParams}`,
			baseApiResponseSchema,
		);
	},
};

// ========================================
// サブスクリプションAPI サービス
// ========================================

export const subscriptionService = {
	/**
	 * サブスクリプション一覧を取得
	 */
	async getSubscriptions(): Promise<SubscriptionsListResponse> {
		return apiClient.get("/subscriptions", subscriptionsListResponseSchema);
	},

	/**
	 * サブスクリプション詳細を取得
	 */
	async getSubscription(id: number): Promise<SubscriptionDetailResponse> {
		return apiClient.get(
			`/subscriptions/${id}`,
			subscriptionDetailResponseSchema,
		);
	},

	/**
	 * 新しいサブスクリプションを作成
	 */
	async createSubscription(
		data: CreateSubscriptionRequest,
	): Promise<SubscriptionDetailResponse> {
		// リクエストデータをバリデーション
		const validatedData = createSubscriptionRequestSchema.parse(data);
		return apiClient.post(
			"/subscriptions/create",
			validatedData,
			subscriptionDetailResponseSchema,
		);
	},

	/**
	 * サブスクリプションを更新
	 */
	async updateSubscription(
		id: number,
		data: UpdateSubscriptionRequest,
	): Promise<SubscriptionDetailResponse> {
		// リクエストデータをバリデーション
		const validatedData = updateSubscriptionRequestSchema.parse(data);
		return apiClient.put(
			`/subscriptions/${id}/update`,
			validatedData,
			subscriptionDetailResponseSchema,
		);
	},

	/**
	 * サブスクリプションを削除
	 */
	async deleteSubscription(id: number): Promise<BaseApiResponse> {
		return apiClient.delete(
			`/subscriptions/${id}/delete`,
			baseApiResponseSchema,
		);
	},

	/**
	 * サブスクリプションを一時停止
	 */
	async deactivateSubscription(id: number): Promise<BaseApiResponse> {
		return apiClient.post(
			`/subscriptions/${id}/deactivate`,
			{},
			baseApiResponseSchema,
		);
	},

	/**
	 * サブスクリプションを再開
	 */
	async activateSubscription(id: number): Promise<BaseApiResponse> {
		return apiClient.post(
			`/subscriptions/${id}/activate`,
			{},
			baseApiResponseSchema,
		);
	},
};

// ========================================
// 統合APIサービス
// ========================================

/**
 * 全てのAPIサービスを統合したオブジェクト
 * TanStack Queryのカスタムフックから利用される
 */
export const apiServices = {
	categories: categoryService,
	transactions: transactionService,
	subscriptions: subscriptionService,
} as const;

// ========================================
// 型エクスポート
// ========================================

export type ApiServices = typeof apiServices;
export type CategoryService = typeof categoryService;
export type TransactionService = typeof transactionService;
export type SubscriptionService = typeof subscriptionService;
