/**
 * ダッシュボードコンポーネントの統合エクスポート
 *
 * 設計方針:
 * - ダッシュボード関連コンポーネントを一元管理
 * - 名前付きエクスポートで型安全性を保持
 * - Tree Shakingに対応したモジュール構成
 */

export { SummaryCards } from "./summary-cards";
export type { SummaryCardsProps } from "./summary-cards";

export { SubscriptionWidget } from "./subscription-widget";
export type { SubscriptionWidgetProps } from "./subscription-widget";

export { BudgetPlaceholder } from "./budget-placeholder";
