import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import {
	CategoryBreakdownChart,
	SubscriptionWidget,
	SummaryCards,
	TrendWidget,
} from "../components/dashboard";
import { Header } from "../components/layout/header";
import { TransactionList } from "../components/transactions";
import type { TransactionFilters, TransactionSort } from "../types";

/**
 * ホームページ（旧ダッシュボード）
 *
 * 設計方針:
 * - 家計管理アプリの中心となるホームページ
 * - 最近の取引一覧、統計情報、クイックアクションを提供
 * - レスポンシブデザインでモバイルファーストUI
 * - 既存のコンポーネントとパターンを再利用
 */

export const meta: MetaFunction = () => {
	return [
		{ title: "ホーム | Saifuu - 家計管理アプリ" },
		{
			name: "description",
			content:
				"支出・収入の概要と最近の取引を確認できるホームページ。家計管理の全体像を把握しましょう。",
		},
		// robots meta タグとviewportは root.tsx で設定済み
	];
};

export default function Home() {
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
				to="/transaction-form-demo"
				className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
			>
				取引を登録
			</Link>
			<Link
				to="/transaction-list-demo"
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
				title="ホーム"
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
										to="/transaction-list-demo"
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
									to="/transaction-form-demo"
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
									to="/transaction-form-demo"
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
						<div className="bg-white rounded-lg shadow-sm border p-6">
							<h3 className="text-lg font-semibold text-gray-900 mb-4">
								今月の予算
							</h3>
							{/* 予算機能未実装時の適切なプレースホルダー表示 */}
							<div className="text-center py-8">
								<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
									<svg
										className="w-8 h-8 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
										/>
									</svg>
								</div>
								<p className="text-gray-600 mb-4">予算が設定されていません</p>
								<p className="text-sm text-gray-500 mb-6">
									月ごとの支出予算を設定して、支出管理を始めましょう
								</p>
								<button
									type="button"
									className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
									onClick={() => {
										// TODO: 予算設定ページへのナビゲーション
										console.log("Navigate to budget settings");
									}}
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
											d="M12 6v6m0 0v6m0-6h6m-6 0H6"
										/>
									</svg>
									予算を設定する
								</button>
							</div>
						</div>

						{/* 今月のトレンド */}
						<TrendWidget />
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
								<li>✅ クイックアクション</li>
								<li>✅ SEOメタデータ</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium text-gray-300 mb-2">今後の実装予定</h3>
							<ul className="space-y-1 text-gray-400">
								<li>🔄 統計データの自動計算</li>
								<li>🔄 予算機能の実装</li>
								<li>🔄 グラフ・チャート表示</li>
								<li>🔄 通知・アラート機能</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
