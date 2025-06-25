/**
 * カスタムフックの統合エクスポート
 *
 * 設計方針:
 * - 全てのカスタムフックを一元管理
 * - 型安全な再エクスポート
 * - 便利なユーティリティフックの提供
 */

// カテゴリ関連フック
export {
	useCategories,
	useCategory,
	useCreateCategory,
	useUpdateCategory,
	useDeleteCategory,
	useReorderCategories,
	useCategoriesByType,
	useActiveCategories,
} from "./use-categories";

// サブスクリプション関連フック
export {
	useSubscriptions,
	useSubscription,
	useCreateSubscription,
	useUpdateSubscription,
	useDeleteSubscription,
	useDeactivateSubscription,
	useActivateSubscription,
	useActiveSubscriptions,
	useInactiveSubscriptions,
	useCurrentMonthSubscriptions,
	useSubscriptionsTotalCost,
} from "./use-subscriptions";
