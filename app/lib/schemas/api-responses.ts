import { z } from "zod";
import {
	selectCategorySchema,
	selectTransactionSchema,
	selectSubscriptionSchema,
	selectBudgetSchema,
	createTransactionSchema,
	insertCategorySchema,
	insertSubscriptionSchema,
	insertBudgetSchema,
} from "../../../db/schema";

/**
 * APIレスポンス用のZodスキーマ定義
 *
 * 設計方針:
 * - 既存のDBスキーマを再利用し、APIクライアント用にラップ
 * - 統一されたAPIレスポンス形式を定義
 * - エラーハンドリングと型安全性を重視
 * - ページネーション、フィルタリング、ソート機能に対応
 */

// ========================================
// 基本的なAPIレスポンス構造
// ========================================

// 成功レスポンスの基本構造
export const baseApiResponseSchema = z.object({
	success: z.literal(true),
	data: z.unknown(),
	count: z.number().int().min(0).optional(),
});

// エラーレスポンスの構造
export const errorApiResponseSchema = z.object({
	error: z.string(),
	details: z.union([z.string(), z.array(z.unknown())]).optional(),
});

// 統合されたAPIレスポンス型
export const apiResponseSchema = z.union([
	baseApiResponseSchema,
	errorApiResponseSchema,
]);

// ========================================
// ページネーション共通スキーマ
// ========================================
export const paginationSchema = z.object({
	currentPage: z.number().int().min(1),
	totalPages: z.number().int().min(0),
	totalCount: z.number().int().min(0),
	hasNextPage: z.boolean(),
	hasPrevPage: z.boolean(),
	limit: z.number().int().min(1),
});

// ========================================
// カテゴリAPI用スキーマ
// ========================================

// カテゴリ作成リクエスト
export const createCategoryRequestSchema = insertCategorySchema.pick({
	name: true,
	type: true,
	color: true,
	icon: true,
	displayOrder: true,
});

// カテゴリ更新リクエスト
export const updateCategoryRequestSchema = insertCategorySchema
	.pick({
		name: true,
		color: true,
		icon: true,
		displayOrder: true,
	})
	.partial();

// カテゴリ並び替えリクエスト
export const reorderCategoriesRequestSchema = z.object({
	categoryIds: z.array(z.number().int().positive()),
});

// カテゴリ一覧レスポンス
export const categoriesListResponseSchema = baseApiResponseSchema.extend({
	data: z.array(selectCategorySchema),
});

// カテゴリ詳細レスポンス
export const categoryDetailResponseSchema = baseApiResponseSchema.extend({
	data: selectCategorySchema,
});

// ========================================
// 取引API用スキーマ
// ========================================

// 取引作成リクエスト（フロントエンド用）
export const createTransactionRequestSchema = createTransactionSchema;

// 取引更新リクエスト
export const updateTransactionRequestSchema = createTransactionSchema
	.omit({ type: true })
	.partial();

// 取引フィルタリングパラメータ
export const transactionFiltersSchema = z.object({
	from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
	type: z.enum(["income", "expense"]).optional(),
	category_id: z.number().int().positive().optional(),
	search: z.string().min(1).optional(),
});

// 取引ソートパラメータ
export const transactionSortSchema = z.object({
	sort_by: z.enum(["transactionDate", "amount", "createdAt"]),
	sort_order: z.enum(["asc", "desc"]),
});

// 取引一覧レスポンス（ページネーション対応）
export const transactionsListResponseSchema = baseApiResponseSchema.extend({
	data: z.array(selectTransactionSchema),
	pagination: paginationSchema,
	filters: transactionFiltersSchema,
	sort: transactionSortSchema,
});

// 取引詳細レスポンス
export const transactionDetailResponseSchema = baseApiResponseSchema.extend({
	data: selectTransactionSchema,
});

// ========================================
// サブスクリプションAPI用スキーマ
// ========================================

// サブスクリプション作成リクエスト
export const createSubscriptionRequestSchema = insertSubscriptionSchema.pick({
	name: true,
	amount: true,
	categoryId: true,
	frequency: true,
	nextPaymentDate: true,
	description: true,
	autoGenerate: true,
});

// サブスクリプション更新リクエスト
export const updateSubscriptionRequestSchema = insertSubscriptionSchema
	.pick({
		name: true,
		amount: true,
		categoryId: true,
		frequency: true,
		nextPaymentDate: true,
		description: true,
		autoGenerate: true,
	})
	.partial();

// サブスクリプション一覧レスポンス
export const subscriptionsListResponseSchema = baseApiResponseSchema.extend({
	data: z.array(selectSubscriptionSchema),
});

// サブスクリプション詳細レスポンス
export const subscriptionDetailResponseSchema = baseApiResponseSchema.extend({
	data: selectSubscriptionSchema,
});

// ========================================
// 共通エラーハンドリング
// ========================================

// バリデーションエラー詳細
export const validationErrorSchema = z.object({
	field: z.string(),
	message: z.string(),
	code: z.string(),
});

// 詳細なエラーレスポンス
export const detailedErrorResponseSchema = z.object({
	error: z.string(),
	details: z.array(validationErrorSchema).optional(),
	timestamp: z.string().optional(),
	path: z.string().optional(),
});

// ========================================
// 型エクスポート
// ========================================

// 基本型
export type BaseApiResponse = z.infer<typeof baseApiResponseSchema>;
export type ErrorApiResponse = z.infer<typeof errorApiResponseSchema>;
export type ApiResponse = z.infer<typeof apiResponseSchema>;
export type Pagination = z.infer<typeof paginationSchema>;

// カテゴリ関連型
export type CreateCategoryRequest = z.infer<typeof createCategoryRequestSchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategoryRequestSchema>;
export type ReorderCategoriesRequest = z.infer<
	typeof reorderCategoriesRequestSchema
>;
export type CategoriesListResponse = z.infer<typeof categoriesListResponseSchema>;
export type CategoryDetailResponse = z.infer<typeof categoryDetailResponseSchema>;

// 取引関連型
export type CreateTransactionRequest = z.infer<
	typeof createTransactionRequestSchema
>;
export type UpdateTransactionRequest = z.infer<
	typeof updateTransactionRequestSchema
>;
export type TransactionFilters = z.infer<typeof transactionFiltersSchema>;
export type TransactionSort = z.infer<typeof transactionSortSchema>;
export type TransactionsListResponse = z.infer<
	typeof transactionsListResponseSchema
>;
export type TransactionDetailResponse = z.infer<
	typeof transactionDetailResponseSchema
>;

// サブスクリプション関連型
export type CreateSubscriptionRequest = z.infer<
	typeof createSubscriptionRequestSchema
>;
export type UpdateSubscriptionRequest = z.infer<
	typeof updateSubscriptionRequestSchema
>;
export type SubscriptionsListResponse = z.infer<
	typeof subscriptionsListResponseSchema
>;
export type SubscriptionDetailResponse = z.infer<
	typeof subscriptionDetailResponseSchema
>;

// エラー関連型
export type ValidationError = z.infer<typeof validationErrorSchema>;
export type DetailedErrorResponse = z.infer<typeof detailedErrorResponseSchema>;