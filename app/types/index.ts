/**
 * 型定義の統合エクスポート
 *
 * 設計方針:
 * - 全ての型定義を一元管理
 * - 既存のDB型定義との整合性を保つ
 * - APIクライアント用の型を再エクスポート
 */

// ========================================
// DB Schema 型定義の再エクスポート
// ========================================

export type {
	SelectCategory,
	InsertCategory,
	CreateTransaction,
	SelectTransaction,
	InsertTransaction,
	SelectSubscription,
	InsertSubscription,
	SelectBudget,
	InsertBudget,
} from "../../db/schema";

// ========================================
// APIクライアント 型定義の再エクスポート
// ========================================

export type {
	// 基本API型
	BaseApiResponse,
	ErrorApiResponse,
	ApiResponse,
	Pagination,
	ValidationError,
	DetailedErrorResponse,
	// カテゴリ関連型
	CreateCategoryRequest,
	UpdateCategoryRequest,
	ReorderCategoriesRequest,
	CategoriesListResponse,
	CategoryDetailResponse,
	// 取引関連型
	CreateTransactionRequest,
	UpdateTransactionRequest,
	TransactionFilters,
	TransactionSort,
	TransactionsListResponse,
	TransactionDetailResponse,
	// サブスクリプション関連型
	CreateSubscriptionRequest,
	UpdateSubscriptionRequest,
	SubscriptionsListResponse,
	SubscriptionDetailResponse,
} from "../lib/schemas/api-responses";

// ========================================
// コンテキスト 型定義の再エクスポート
// ========================================

export type {
	AppState,
	AppActions,
	AppContextValue,
} from "../contexts/app-context";

// ========================================
// APIクライアント関連型の再エクスポート
// ========================================

export { ApiError } from "../lib/api/client";
export type {
	ApiServices,
	CategoryService,
	TransactionService,
	SubscriptionService,
} from "../lib/api/services";

// ========================================
// カスタムフック関連型の再エクスポート
// ========================================

export type { UseTransactionsParams } from "../lib/hooks/use-transactions";

// ========================================
// 追加のユーティリティ型定義
// ========================================

/**
 * 取引タイプの型定義
 */
export type TransactionType = "income" | "expense";

/**
 * サブスクリプション頻度の型定義
 */
export type SubscriptionFrequency = "daily" | "weekly" | "monthly" | "yearly";

/**
 * 予算期間の型定義
 */
export type BudgetPeriod = "monthly" | "yearly";

/**
 * ソート順序の型定義
 */
export type SortOrder = "asc" | "desc";

/**
 * ソート対象の型定義（取引用）
 */
export type TransactionSortBy = "transactionDate" | "amount" | "createdAt";

/**
 * テーマの型定義
 */
export type Theme = "light" | "dark" | "system";

/**
 * フォーム状態の共通型定義
 */
export interface FormState<T> {
	data: T;
	errors: Partial<Record<keyof T, string>>;
	isSubmitting: boolean;
	isDirty: boolean;
}

/**
 * ページネーション用のパラメータ型
 */
export interface PaginationParams {
	page: number;
	limit: number;
}

/**
 * 日付範囲の型定義
 */
export interface DateRange {
	startDate?: string;
	endDate?: string;
}

/**
 * 検索パラメータの型定義
 */
export interface SearchParams {
	search?: string;
	sortBy?: string;
	sortOrder?: SortOrder;
}

/**
 * APIエラーレスポンスの詳細型
 */
export interface ApiErrorDetails {
	field: string;
	message: string;
	code: string;
}

/**
 * 統計データの型定義
 */
export interface StatsData {
	totalIncome: number;
	totalExpense: number;
	balance: number;
	transactionCount: number;
	categoryBreakdown: Array<{
		categoryId: number;
		categoryName: string;
		amount: number;
		percentage: number;
	}>;
}
