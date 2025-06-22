import { TransactionList } from "../components/transactions";
import type { TransactionFilters, TransactionSort } from "../types";
import { redirectIfProduction } from "../utils/environment";

/**
 * 取引一覧機能のデモページ
 *
 * 設計方針:
 * - 全ての一覧・フィルタリング機能の動作確認
 * - テーブル/カード表示切り替えのテスト
 * - モバイル・デスクトップレスポンシブの確認
 * - API統合による実データ表示
 */

export default function TransactionListDemo() {
	// 本番環境では404リダイレクト
	redirectIfProduction();
	// デフォルトフィルター（過去30日間）
	const defaultFilters: Partial<TransactionFilters> = {
		from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
			.toISOString()
			.split("T")[0],
		to: new Date().toISOString().split("T")[0],
	};

	// デフォルトソート（取引日降順）
	const defaultSort: Partial<TransactionSort> = {
		sort_by: "transactionDate",
		sort_order: "desc",
	};

	return (
		<div className="min-h-screen bg-gray-50">
			{/* ページヘッダー */}
			<div className="bg-white border-b border-gray-200">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
					<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">取引履歴</h1>
							<p className="text-gray-600 mt-2">
								過去の支出・収入を確認し、家計の状況を把握できます
							</p>
						</div>

						{/* クイックアクション */}
						<div className="mt-4 lg:mt-0 flex space-x-3">
							<button
								type="button"
								className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
								onClick={() => {
									// TODO: 新規登録ページへのナビゲーション
									console.log("Navigate to transaction form");
								}}
							>
								新規登録
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* メインコンテンツ */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* 利用ガイド */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
					<h2 className="text-lg font-semibold text-blue-900 mb-3">
						利用ガイド
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
						<div>
							<h3 className="font-medium mb-2">表示方法</h3>
							<ul className="space-y-1">
								<li>• 表形式とカード形式で切り替え可能</li>
								<li>• スマートフォンでも見やすく表示</li>
								<li>• 大量データは自動でページ分割</li>
								<li>• 期間や条件に応じた合計金額を表示</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium mb-2">絞り込み検索</h3>
							<ul className="space-y-1">
								<li>• 任意の期間で取引を絞り込み</li>
								<li>• カテゴリ別の取引を表示</li>
								<li>• 収入・支出を個別に確認</li>
								<li>• 取引内容をキーワードで検索</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium mb-2">並び替え</h3>
							<ul className="space-y-1">
								<li>• 取引日で古い順・新しい順に切り替え</li>
								<li>• 金額の大きい順・小さい順で表示</li>
								<li>• 登録した順番で確認</li>
								<li>• ワンクリックで並び順を変更</li>
							</ul>
						</div>
					</div>
				</div>

				{/* 取引一覧コンポーネント */}
				<TransactionList
					initialFilters={defaultFilters}
					initialSort={defaultSort}
					showFilters={true}
					compact={false}
				/>
			</div>
		</div>
	);
}
