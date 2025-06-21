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
							<div className="space-y-4">
								<div>
									<div className="flex justify-between text-sm mb-2">
										<span className="text-gray-600">食費</span>
										<span className="text-gray-900">¥--,--- / ¥--,---</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-orange-500 h-2 rounded-full"
											style={{ width: "75%" }}
										/>
									</div>
								</div>
								<div>
									<div className="flex justify-between text-sm mb-2">
										<span className="text-gray-600">交通費</span>
										<span className="text-gray-900">¥--,--- / ¥--,---</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-blue-500 h-2 rounded-full"
											style={{ width: "45%" }}
										/>
									</div>
								</div>
								<div>
									<div className="flex justify-between text-sm mb-2">
										<span className="text-gray-600">娯楽</span>
										<span className="text-gray-900">¥--,--- / ¥--,---</span>
									</div>
									<div className="w-full bg-gray-200 rounded-full h-2">
										<div
											className="bg-red-500 h-2 rounded-full"
											style={{ width: "90%" }}
										/>
									</div>
								</div>
							</div>
							<div className="mt-4 pt-4 border-t border-gray-200">
								<button
									type="button"
									className="w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
									onClick={() => {
										// TODO: 予算設定ページへのナビゲーション
										console.log("Navigate to budget settings");
									}}
								>
									予算を設定 →
								</button>
							</div>
						</div>

						{/* 今月のトレンド */}
						<TrendWidget />
					</div>
				</div>
			</div>
		</div>
	);
}
