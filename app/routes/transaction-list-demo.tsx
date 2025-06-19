import { TransactionList } from "../components/transactions";
import type { TransactionFilters, TransactionSort } from "../types";

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
							<h1 className="text-3xl font-bold text-gray-900">取引一覧デモ</h1>
							<p className="text-gray-600 mt-2">
								支出/収入の一覧表示・フィルタリング・ソート機能のデモンストレーション
							</p>
						</div>

						{/* クイックアクション */}
						<div className="mt-4 lg:mt-0 flex space-x-3">
							<button
								className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
								onClick={() => {
									// TODO: 新規登録ページへのナビゲーション
									console.log("Navigate to transaction form");
								}}
							>
								新規登録
							</button>
							<button
								className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium"
								onClick={() => {
									// TODO: CSVエクスポート機能
									console.log("Export to CSV");
								}}
							>
								CSVエクスポート
							</button>
						</div>
					</div>
				</div>
			</div>

			{/* メインコンテンツ */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* 機能説明カード */}
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
					<h2 className="text-lg font-semibold text-blue-900 mb-3">
						🚀 実装済み機能
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-blue-800">
						<div>
							<h3 className="font-medium mb-2">📊 表示機能</h3>
							<ul className="space-y-1">
								<li>• テーブル/カード表示切り替え</li>
								<li>• レスポンシブデザイン</li>
								<li>• ページネーション</li>
								<li>• 合計金額表示</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium mb-2">🔍 フィルター機能</h3>
							<ul className="space-y-1">
								<li>• 日付範囲指定</li>
								<li>• カテゴリ絞り込み</li>
								<li>• 収入/支出切り替え</li>
								<li>• 説明文検索</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium mb-2">⚡ ソート機能</h3>
							<ul className="space-y-1">
								<li>• 取引日ソート</li>
								<li>• 金額ソート</li>
								<li>• 登録日ソート</li>
								<li>• 昇順/降順切り替え</li>
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

				{/* 開発者向け情報 */}
				<div className="mt-12 bg-gray-800 text-gray-100 rounded-lg p-6">
					<h2 className="text-lg font-semibold mb-3">🛠️ 開発者向け情報</h2>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-sm">
						<div>
							<h3 className="font-medium text-gray-300 mb-2">
								コンポーネント構成
							</h3>
							<ul className="space-y-1 text-gray-400">
								<li>• TransactionList: メインコンポーネント</li>
								<li>• FilterPanel: フィルター・ソートUI</li>
								<li>• TransactionTable: テーブル表示</li>
								<li>• TransactionCards: カード表示</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium text-gray-300 mb-2">技術スタック</h3>
							<ul className="space-y-1 text-gray-400">
								<li>• React 19 + TanStack Query</li>
								<li>• TypeScript + Zod</li>
								<li>• Tailwind CSS v4</li>
								<li>• Cloudflare D1 API</li>
							</ul>
						</div>
					</div>
					<div className="mt-4 p-4 bg-gray-700 rounded text-xs font-mono">
						<div className="text-gray-300 mb-2">使用例:</div>
						<code className="text-green-400">
							{`<TransactionList
  initialFilters={{ type: "expense" }}
  initialSort={{ sort_by: "amount", sort_order: "desc" }}
  showFilters={true}
  compact={false}
/>`}
						</code>
					</div>
				</div>

				{/* 今後の機能拡張予定 */}
				<div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
					<h2 className="text-lg font-semibold text-yellow-900 mb-3">
						🔮 今後の機能拡張予定
					</h2>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-yellow-800">
						<div>
							<h3 className="font-medium mb-2">一括操作</h3>
							<ul className="space-y-1">
								<li>• 複数選択・一括削除</li>
								<li>• 一括カテゴリ変更</li>
								<li>• 一括編集機能</li>
							</ul>
						</div>
						<div>
							<h3 className="font-medium mb-2">高度な機能</h3>
							<ul className="space-y-1">
								<li>• 無限スクロール</li>
								<li>• 統計グラフ表示</li>
								<li>• フィルター保存</li>
							</ul>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
