import { useMemo } from "react";
import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import {
	BudgetPlaceholder,
	CategoryBreakdownChart,
	SubscriptionWidget,
	SummaryCards,
	TrendWidget,
} from "../components/dashboard";
import { Header } from "../components/layout/header";
import { TransactionList } from "../components/transactions";
import { useCategories } from "../lib/hooks/use-categories";
import { useCurrentMonthTransactions } from "../lib/hooks/use-transactions";
import type {
	SelectCategory,
	TransactionFilters,
	TransactionSort,
} from "../types";

/**
 * ダッシュボードページ
 *
 * 設計方針:
 * - 家計管理アプリの中心となるダッシュボードページ
 * - 最近の取引一覧、統計情報、クイックアクションを提供
 * - レスポンシブデザインでモバイルファーストUI
 * - 既存のコンポーネントとパターンを再利用
 */

export const meta: MetaFunction = () => {
	return [
		{ title: "ダッシュボード | Saifuu - 家計管理アプリ" },
		{
			name: "description",
			content:
				"支出・収入の概要と最近の取引を確認できるダッシュボード。家計管理の全体像を把握しましょう。",
		},
		// robots meta タグとviewportは root.tsx で設定済み
	];
};

export default function Dashboard() {
	// 最近の取引を表示するためのデフォルトフィルター（過去7日間）
	const recentTransactionsFilters: Partial<TransactionFilters> = {
		from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0],
		to: new Date().toISOString().split("T")[0],
	};

	// デフォルトソート（取引日降順）
	const defaultSort: Partial<TransactionSort> = {
		sort_by: "transactionDate",
		sort_order: "desc",
	};

	// クイックアクション
	const headerActions = (
		<div className="flex flex-wrap gap-3">
			<Link
				to="/transactions/new"
				className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
			>
				取引を登録
			</Link>
			<Link
				to="/transactions"
				className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
			>
				全ての取引を見る
			</Link>
		</div>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* ページヘッダー */}
			<Header
				title="ダッシュボード"
				description="家計の概要と最近の取引を確認できます"
				actions={headerActions}
			/>

			{/* メインコンテンツ */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* サマリーカード */}
				<div className="mb-8">
					<SummaryCards />
				</div>

				{/* カテゴリ別円グラフ */}
				<div className="mb-8">
					<CategoryBreakdownChart />
				</div>

				{/* 2カラムレイアウト */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* 最近の取引一覧 (メインコンテンツ) */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-lg shadow-sm border">
							<div className="px-6 py-4 border-b border-gray-200">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-gray-900">
										最近の取引
									</h2>
									<Link
										to="/transactions"
										className="text-sm text-blue-600 hover:text-blue-800 font-medium"
									>
										すべて見る →
									</Link>
								</div>
							</div>
							<div className="p-6">
								<TransactionList
									initialFilters={recentTransactionsFilters}
									initialSort={defaultSort}
									showFilters={false}
									compact={true}
								/>
							</div>
						</div>
					</div>

					{/* サイドバー */}
					<div className="space-y-6">
						{/* サブスクリプションウィジェット */}
						<SubscriptionWidget maxActiveItems={5} maxInactiveItems={3} />

						{/* クイックアクション */}
						<div className="bg-white rounded-lg shadow-sm border p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								クイックアクション
							</h3>
							<div className="space-y-3">
								<Link
									to="/transactions/new"
									className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
								>
									<svg
										className="w-4 h-4 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 4v16m8-8H4"
										/>
									</svg>
									支出を登録
								</Link>
								<Link
									to="/transactions/new"
									className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
								>
									<svg
										className="w-4 h-4 mr-2"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 4v16m8-8H4"
										/>
									</svg>
									収入を登録
								</Link>
							</div>
						</div>

						{/* 今月の予算 */}
						<BudgetPlaceholder
							onSetBudgetClick={() => {
								// TODO: 予算設定ページへのナビゲーション
								console.log("Navigate to budget settings");
							}}
						/>

						{/* 今月のトレンド */}
						<TrendWidget />

						{/* サブスクリプションウィジェット */}
						<SubscriptionWidget />
					</div>
				</div>

				{/* 開発者向け情報（開発中のみ表示） */}
				<div className="mt-12 bg-gray-800 text-gray-100 rounded-lg p-6">
					<h2 className="text-lg font-semibold mb-3">🚧 開発状況</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
						<div>
							<h3 className="font-medium text-gray-300 mb-2">実装済み機能</h3>
							<ul className="space-y-1 text-gray-400">
								<li>✅ レスポンシブレイアウト</li>
								<li>✅ 最近の取引一覧表示</li>
								<li>✅ 月次推移チャート（過去6ヶ月）</li>
								<li>✅ クイックアクション</li>
								<li>✅ SEOメタデータ</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium text-gray-300 mb-2">今後の実装予定</h3>
							<ul className="space-y-1 text-gray-400">
								<li>🔄 統計データの自動計算</li>
								<li>🔄 予算機能の実装</li>
								<li>🔄 通知・アラート機能</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
