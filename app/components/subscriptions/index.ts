/**
 * サブスクリプション管理関連コンポーネントの集約エクスポート
 *
 * 設計方針:
 * - サブスクリプション管理機能の全コンポーネントを統一的にエクスポート
 * - 他のモジュールからの簡潔なインポートを提供
 * - コンポーネント間の依存関係を明確化
 * - 将来の機能拡張に対応した拡張可能な構造
 */

// サブスクリプション一覧・カード表示コンポーネント
export { SubscriptionCards } from "./subscription-cards";

// サブスクリプション登録・編集フォームコンポーネント
export { SubscriptionForm } from "./subscription-form";

// サブスクリプション操作アクションコンポーネント
export {
	SubscriptionActions,
	DeleteConfirmDialog,
} from "./subscription-actions";

// 将来実装予定のコンポーネント（プレースホルダー）
// export { SubscriptionCalendar } from "./subscription-calendar";
// export { SubscriptionAnalytics } from "./subscription-analytics";
// export { SubscriptionFilters } from "./subscription-filters";
