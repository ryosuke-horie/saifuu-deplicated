import type { MetaFunction } from "react-router";
import { Link } from "react-router";
import {
	BudgetPlaceholder,
	SubscriptionWidget,
	SummaryCards,
} from "../components/dashboard";
import { PageHeader } from "../components/layout/page-header";

/**
 * ダッシュボードページ（サブスクリプション管理特化版）
 *
 * 設計方針:
 * - サブスクリプション管理に特化したダッシュボードページ
 * - レスポンシブデザインでモバイルファーストUI
 * - 既存のコンポーネントとパターンを再利用
 * - リダイレクトを使わず直接ダッシュボード機能を提供
 */

export const meta: MetaFunction = () => {
	return [
		{ title: "ダッシュボード | Saifuu - 家計管理アプリ" },
		{
			name: "description",
			content:
				"サブスクリプション管理の概要を確認できるダッシュボード。家計管理の全体像を把握しましょう。",
		},
		// robots meta タグとviewportは root.tsx で設定済み
	];
};

export default function Dashboard() {
	// クイックアクション
	const headerActions = (
		<div className="flex flex-wrap gap-3">
			<Link
				to="/subscriptions"
				className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
			>
				サブスク管理
			</Link>
			<Link
				to="/transactions"
				className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
			>
				収支管理
			</Link>
		</div>
	);

	return (
		<>
			{/* ページヘッダー */}
			<PageHeader
				title="ダッシュボード"
				description="サブスクリプション管理の概要を確認できます"
				actions={headerActions}
			/>

			{/* メインコンテンツ */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* サマリーカード */}
				<div className="mb-8">
					<SummaryCards />
				</div>

				{/* 2カラムレイアウト */}
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
					{/* メインコンテンツ */}
					<div className="lg:col-span-2">
						<div className="bg-white rounded-lg shadow-sm border">
							<div className="px-6 py-4 border-b border-gray-200">
								<div className="flex items-center justify-between">
									<h2 className="text-lg font-semibold text-gray-900">
										ようこそ Saifuu へ
									</h2>
								</div>
							</div>
							<div className="p-6">
								<div className="text-center">
									<svg
										className="mx-auto h-12 w-12 text-gray-400"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
										/>
									</svg>
									<h3 className="mt-2 text-sm font-medium text-gray-900">
										サブスクリプション管理アプリ
									</h3>
									<p className="mt-1 text-sm text-gray-500">
										サブスクリプションサービスを効率的に管理しましょう。
									</p>
									<div className="mt-6">
										<Link
											to="/subscriptions"
											className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										>
											<svg
												className="-ml-1 mr-2 h-5 w-5"
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
											サブスクリプション管理を開始
										</Link>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* サイドバー */}
					<div className="space-y-6">
						{/* サブスクリプションウィジェット */}
						<SubscriptionWidget maxActiveItems={5} maxInactiveItems={3} />

						{/* 今月の予算 */}
						<BudgetPlaceholder
							onSetBudgetClick={() => {
								// TODO: 予算設定ページへのナビゲーション
								console.log("Navigate to budget settings");
							}}
						/>
					</div>
				</div>
			</div>
		</>
	);
}
