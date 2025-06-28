import type { MetaFunction } from "react-router";
import { Link, Outlet } from "react-router";
import { PageHeader } from "../components/layout/page-header";
import { SubscriptionCards } from "../components/subscriptions";
import type { SelectSubscription } from "../types";

/**
 * サブスクリプション管理ページ
 *
 * 設計方針:
 * - サブスクリプションの包括的な管理インターフェースを提供
 * - カード形式での一覧表示とCRUD操作
 * - 月額/年額の表示切り替え機能
 * - アクティブ/非アクティブ状態の管理
 * - 次回請求日とコスト計算の可視化
 * - 既存のSubscriptionWidgetを拡張した専用管理画面
 */

export const meta: MetaFunction = () => {
	return [
		{ title: "サブスクリプション管理 | Saifuu - 家計管理アプリ" },
		{
			name: "description",
			content:
				"サブスクリプション（定期支払い）の管理画面。登録・編集・一時停止・解約予定の設定が可能です。月額・年額の切り替え表示で総コストを把握できます。",
		},
		// robots meta タグは root.tsx で設定済み
	];
};

export default function SubscriptionsPage() {
	// サブスクリプション編集時のナビゲーション
	const handleEdit = (subscription?: SelectSubscription) => {
		if (subscription) {
			// React Router v7のナビゲーションを使用
			window.location.href = `/subscriptions/${subscription.id}/update`;
		}
	};

	// ヘッダーアクション
	const headerActions = (
		<div className="flex flex-wrap gap-3">
			<Link
				to="/subscriptions/new"
				className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
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
				新規サブスクリプション
			</Link>
			<button
				type="button"
				className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium flex items-center"
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
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
				年間コスト分析
			</button>
		</div>
	);

	return (
		<>
			{/* ページヘッダー */}
			<PageHeader
				title="サブスクリプション管理"
				description="定期支払いサービスを一元管理し、支出を最適化しましょう"
				actions={headerActions}
			/>

			{/* メインコンテンツ */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* サブスクリプション一覧 */}
				<div className="space-y-6">
					<SubscriptionCards onEdit={handleEdit} />
				</div>
			</div>

			{/* 子ルート（new, $id.update）のレンダリング */}
			<Outlet />
		</>
	);
}
