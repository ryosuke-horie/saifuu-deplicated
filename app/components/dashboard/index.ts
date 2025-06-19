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

export { RecentTransactions } from "./recent-transactions";
export type { RecentTransactionsProps } from "./recent-transactions";

export { SubscriptionWidget } from "./subscription-widget";
export type { SubscriptionWidgetProps } from "./subscription-widget";

export { MonthlyTrendChart } from "./monthly-trend-chart";
export type { MonthlyTrendChartProps } from "./monthly-trend-chart";

export { CategoryBreakdownChart } from "./category-breakdown-chart";
export type { CategoryBreakdownChartProps } from "./category-breakdown-chart";
