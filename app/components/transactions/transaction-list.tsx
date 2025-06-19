import { useState } from "react";
import { useTransactions } from "../../lib/hooks/use-transactions";
import type { TransactionFilters, TransactionSort } from "../../types";
import { FilterPanel } from "./filter-panel";
import { TransactionCards } from "./transaction-cards";
import { TransactionTable } from "./transaction-table";

/**
 * 取引一覧メインコンポーネント
 *
 * 設計方針:
 * - フィルター、ソート、表示切り替えの統合管理
 * - API連携による動的データ表示
 * - モバイルファーストのレスポンシブデザイン
 * - 合計金額とカテゴリ別集計の表示
 */

export interface TransactionListProps {
	initialFilters?: Partial<TransactionFilters>;
	initialSort?: Partial<TransactionSort>;
	showFilters?: boolean;
	compact?: boolean;
}

export function TransactionList({
	initialFilters = {},
	initialSort = { sort_by: "transactionDate", sort_order: "desc" },
	showFilters = true,
	compact = false,
}: TransactionListProps) {
	// 表示モード管理（テーブル/カード）
	const [viewMode, setViewMode] = useState<"table" | "cards">("table");

	// フィルターとソートの状態管理
	const [filters, setFilters] =
		useState<Partial<TransactionFilters>>(initialFilters);
	const [sort, setSort] = useState<Partial<TransactionSort>>(initialSort);
	const [page, setPage] = useState(1);

	// API呼び出し
	const {
		data: transactionsResponse,
		isLoading,
		error,
		refetch,
	} = useTransactions({
		filters,
		sort,
		page,
		limit: 20,
	});

	// フィルター変更ハンドラー
	const handleFiltersChange = (newFilters: Partial<TransactionFilters>) => {
		setFilters(newFilters);
		setPage(1); // フィルター変更時はページをリセット
	};

	// ソート変更ハンドラー
	const handleSortChange = (newSort: Partial<TransactionSort>) => {
		setSort(newSort);
		setPage(1); // ソート変更時はページをリセット
	};

	// ページ変更ハンドラー
	const handlePageChange = (newPage: number) => {
		setPage(newPage);
	};

	// 合計金額の計算
	const totalAmount =
		transactionsResponse?.data.reduce((sum, transaction) => {
			return transaction.type === "income"
				? sum + transaction.amount
				: sum - transaction.amount;
		}, 0) || 0;

	// エラー表示
	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<div className="flex items-center space-x-2">
					<div className="text-red-600">
						<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<div>
						<h3 className="text-sm font-medium text-red-800">
							取引データの取得に失敗しました
						</h3>
						<p className="text-sm text-red-700 mt-1">
							{error.message || "不明なエラーが発生しました"}
						</p>
					</div>
				</div>
				<div className="mt-3">
					<button
						onClick={() => refetch()}
						className="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-md hover:bg-red-200 transition-colors"
					>
						再試行
					</button>
				</div>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* ヘッダーエリア */}
			<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">取引履歴</h1>
					{transactionsResponse?.pagination && (
						<p className="text-sm text-gray-600 mt-1">
							全{transactionsResponse.pagination.totalCount}件中{" "}
							{(transactionsResponse.pagination.currentPage - 1) *
								transactionsResponse.pagination.limit +
								1}
							-
							{Math.min(
								transactionsResponse.pagination.currentPage *
									transactionsResponse.pagination.limit,
								transactionsResponse.pagination.totalCount,
							)}
							件を表示
						</p>
					)}
				</div>

				{/* 表示切り替えボタン */}
				<div className="flex items-center space-x-2">
					<span className="text-sm text-gray-700">表示:</span>
					<div className="flex border border-gray-300 rounded-md overflow-hidden">
						<button
							onClick={() => setViewMode("table")}
							className={`px-3 py-1 text-sm font-medium transition-colors ${
								viewMode === "table"
									? "bg-blue-600 text-white"
									: "bg-white text-gray-700 hover:bg-gray-50"
							}`}
						>
							テーブル
						</button>
						<button
							onClick={() => setViewMode("cards")}
							className={`px-3 py-1 text-sm font-medium transition-colors ${
								viewMode === "cards"
									? "bg-blue-600 text-white"
									: "bg-white text-gray-700 hover:bg-gray-50"
							}`}
						>
							カード
						</button>
					</div>
				</div>
			</div>

			{/* フィルターパネル */}
			{showFilters && (
				<FilterPanel
					filters={filters}
					sort={sort}
					onFiltersChange={handleFiltersChange}
					onSortChange={handleSortChange}
					totalAmount={totalAmount}
					isLoading={isLoading}
				/>
			)}

			{/* ローディング表示 */}
			{isLoading && (
				<div className="flex items-center justify-center py-12">
					<div className="flex items-center space-x-2">
						<div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
						<span className="text-gray-600">読み込み中...</span>
					</div>
				</div>
			)}

			{/* 取引一覧表示 */}
			{!isLoading && transactionsResponse && (
				<>
					{viewMode === "table" ? (
						<TransactionTable
							transactions={transactionsResponse.data}
							sort={sort}
							onSortChange={handleSortChange}
							compact={compact}
						/>
					) : (
						<TransactionCards
							transactions={transactionsResponse.data}
							compact={compact}
						/>
					)}

					{/* ページネーション */}
					{transactionsResponse.pagination &&
						transactionsResponse.pagination.totalPages > 1 && (
							<div className="flex items-center justify-between border-t border-gray-200 pt-6">
								<button
									onClick={() => handlePageChange(page - 1)}
									disabled={!transactionsResponse.pagination.hasPrevPage}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									前のページ
								</button>

								<span className="text-sm text-gray-700">
									{transactionsResponse.pagination.currentPage} /{" "}
									{transactionsResponse.pagination.totalPages}
								</span>

								<button
									onClick={() => handlePageChange(page + 1)}
									disabled={!transactionsResponse.pagination.hasNextPage}
									className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									次のページ
								</button>
							</div>
						)}
				</>
			)}

			{/* データなしの場合 */}
			{!isLoading && transactionsResponse?.data.length === 0 && (
				<div className="text-center py-12">
					<div className="text-gray-400 mb-3">
						<svg
							className="mx-auto h-12 w-12"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
					</div>
					<h3 className="text-lg font-medium text-gray-900 mb-1">
						取引データがありません
					</h3>
					<p className="text-gray-600">
						条件に合う取引が見つかりませんでした。フィルター条件を変更してみてください。
					</p>
				</div>
			)}
		</div>
	);
}
