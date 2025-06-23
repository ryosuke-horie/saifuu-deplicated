import { useState } from "react";
import { useCategories } from "../../lib/hooks/use-categories";
import type { TransactionFilters, TransactionSort } from "../../types";
import { formatTotalAmount } from "../../utils/transaction-formatters";

/**
 * フィルターパネルコンポーネント
 *
 * 設計方針:
 * - 日付範囲、カテゴリ、タイプ、検索の統合フィルター
 * - リアルタイム更新とパフォーマンス最適化
 * - 合計金額とカテゴリ別集計の表示
 * - フィルターのクリア機能
 */

export interface FilterPanelProps {
	filters: Partial<TransactionFilters>;
	sort: Partial<TransactionSort>;
	onFiltersChange: (filters: Partial<TransactionFilters>) => void;
	onSortChange: (sort: Partial<TransactionSort>) => void;
	totalAmount: number;
	isLoading?: boolean;
}

export function FilterPanel({
	filters,
	sort,
	onFiltersChange,
	onSortChange,
	totalAmount,
	isLoading = false,
}: FilterPanelProps) {
	// パネルの展開状態
	const [isExpanded, setIsExpanded] = useState(true);

	// カテゴリデータ取得
	const { data: categoriesResponse } = useCategories({
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== "undefined",
	} as any);

	// フィルター値の更新
	const updateFilter = (
		key: keyof TransactionFilters,
		value: string | number | undefined,
	) => {
		const newFilters = { ...filters };

		if (value === "" || value === undefined) {
			delete newFilters[key];
		} else {
			(newFilters as any)[key] = value;
		}

		onFiltersChange(newFilters);
	};

	// ソート値の更新
	const updateSort = <K extends keyof TransactionSort>(
		key: K,
		value: TransactionSort[K],
	) => {
		onSortChange({ ...sort, [key]: value });
	};

	// フィルターのクリア
	const clearFilters = () => {
		onFiltersChange({});
		onSortChange({ sort_by: "transactionDate", sort_order: "desc" });
	};

	// アクティブなフィルター数を計算
	const activeFiltersCount = Object.keys(filters).length;

	return (
		<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
			{/* ヘッダー */}
			<button
				type="button"
				className="w-full px-6 py-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
				onClick={() => setIsExpanded(!isExpanded)}
				aria-expanded={isExpanded}
				aria-label="フィルターパネルの展開・折りたたみ"
			>
				<div className="flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<h3 className="text-lg font-medium text-gray-900">フィルター</h3>
						{activeFiltersCount > 0 && (
							<span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
								{activeFiltersCount}件適用中
							</span>
						)}
						{!isLoading && (
							<div
								className={`text-sm font-medium ${
									totalAmount >= 0 ? "text-green-600" : "text-red-600"
								}`}
							>
								合計: {formatTotalAmount(totalAmount)}
							</div>
						)}
					</div>
					<div className="flex items-center space-x-2">
						{activeFiltersCount > 0 && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation();
									clearFilters();
								}}
								className="text-sm text-gray-600 hover:text-gray-800 px-2 py-1 rounded transition-colors"
							>
								クリア
							</button>
						)}
						<svg
							className={`w-5 h-5 text-gray-400 transition-transform ${
								isExpanded ? "rotate-180" : ""
							}`}
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M19 9l-7 7-7-7"
							/>
						</svg>
					</div>
				</div>
			</button>

			{/* フィルターコンテンツ */}
			{isExpanded && (
				<div className="p-6 space-y-6">
					{/* 日付範囲とタイプ */}
					<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
						{/* 開始日 */}
						<div>
							<label
								htmlFor="filter-from"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								開始日
							</label>
							<input
								id="filter-from"
								type="date"
								value={filters.from || ""}
								onChange={(e) => updateFilter("from", e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						{/* 終了日 */}
						<div>
							<label
								htmlFor="filter-to"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								終了日
							</label>
							<input
								id="filter-to"
								type="date"
								value={filters.to || ""}
								onChange={(e) => updateFilter("to", e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						{/* タイプ */}
						<div>
							<label
								htmlFor="filter-type"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								種別
							</label>
							<select
								id="filter-type"
								value={filters.type || ""}
								onChange={(e) =>
									updateFilter("type", e.target.value as "income" | "expense")
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="">すべて</option>
								<option value="income">収入</option>
								<option value="expense">支出</option>
							</select>
						</div>

						{/* カテゴリ */}
						<div>
							<label
								htmlFor="filter-category"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								カテゴリ
							</label>
							<select
								id="filter-category"
								value={filters.category_id || ""}
								onChange={(e) =>
									updateFilter(
										"category_id",
										e.target.value ? Number(e.target.value) : undefined,
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="">すべて</option>
								{categoriesResponse?.data.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
						</div>
					</div>

					{/* 検索とソート */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
						{/* 検索 */}
						<div>
							<label
								htmlFor="filter-search"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								説明文検索
							</label>
							<input
								id="filter-search"
								type="text"
								placeholder="取引の説明を検索..."
								value={filters.search || ""}
								onChange={(e) => updateFilter("search", e.target.value)}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							/>
						</div>

						{/* ソート対象 */}
						<div>
							<label
								htmlFor="sort-by"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								並び順
							</label>
							<select
								id="sort-by"
								value={sort.sort_by || "transactionDate"}
								onChange={(e) =>
									updateSort(
										"sort_by",
										e.target.value as TransactionSort["sort_by"],
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="transactionDate">取引日</option>
								<option value="amount">金額</option>
								<option value="createdAt">登録日</option>
							</select>
						</div>

						{/* ソート順序 */}
						<div>
							<label
								htmlFor="sort-order"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								順序
							</label>
							<select
								id="sort-order"
								value={sort.sort_order || "desc"}
								onChange={(e) =>
									updateSort(
										"sort_order",
										e.target.value as TransactionSort["sort_order"],
									)
								}
								className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
							>
								<option value="desc">新しい順</option>
								<option value="asc">古い順</option>
							</select>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
