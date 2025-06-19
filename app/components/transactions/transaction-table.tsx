import type { SelectTransaction, TransactionSort } from "../../types";

/**
 * 取引テーブル表示コンポーネント
 *
 * 設計方針:
 * - ソート可能なヘッダー
 * - モバイル対応のレスポンシブテーブル
 * - 取引タイプに応じた色分け表示
 * - 編集・削除アクション
 */

export interface TransactionTableProps {
	transactions: SelectTransaction[];
	sort: Partial<TransactionSort>;
	onSortChange: (sort: Partial<TransactionSort>) => void;
	compact?: boolean;
}

export function TransactionTable({
	transactions,
	sort,
	onSortChange,
	compact = false,
}: TransactionTableProps) {
	// ソートヘッダーのクリックハンドラー
	const handleSort = (sortBy: TransactionSort["sort_by"]) => {
		const newOrder =
			sort.sort_by === sortBy && sort.sort_order === "desc" ? "asc" : "desc";
		onSortChange({ sort_by: sortBy, sort_order: newOrder });
	};

	// ソートアイコンの表示
	const getSortIcon = (column: TransactionSort["sort_by"]) => {
		if (sort.sort_by !== column) {
			return (
				<svg
					className="w-4 h-4 text-gray-400"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
					/>
				</svg>
			);
		}

		return sort.sort_order === "asc" ? (
			<svg
				className="w-4 h-4 text-blue-600"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M5 15l7-7 7 7"
				/>
			</svg>
		) : (
			<svg
				className="w-4 h-4 text-blue-600"
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
		);
	};

	// 金額のフォーマット
	const formatAmount = (amount: number, type: "income" | "expense") => {
		const formattedAmount = amount.toLocaleString();
		return type === "income" ? `+¥${formattedAmount}` : `-¥${formattedAmount}`;
	};

	// 日付のフォーマット
	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("ja-JP", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	};

	// タイプの表示名
	const getTypeLabel = (type: "income" | "expense") => {
		return type === "income" ? "収入" : "支出";
	};

	// タイプの色クラス
	const getTypeColorClass = (type: "income" | "expense") => {
		return type === "income"
			? "text-green-600 bg-green-50"
			: "text-red-600 bg-red-50";
	};

	if (transactions.length === 0) {
		return (
			<div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
				<p className="text-gray-500">表示する取引がありません</p>
			</div>
		);
	}

	return (
		<div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
			<div className="overflow-x-auto">
				<table className="min-w-full divide-y divide-gray-200">
					<thead className="bg-gray-50">
						<tr>
							{/* 取引日 */}
							<th
								className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								onClick={() => handleSort("transactionDate")}
							>
								<div className="flex items-center space-x-1">
									<span>取引日</span>
									{getSortIcon("transactionDate")}
								</div>
							</th>

							{/* タイプ */}
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								種別
							</th>

							{/* 金額 */}
							<th
								className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
								onClick={() => handleSort("amount")}
							>
								<div className="flex items-center justify-end space-x-1">
									<span>金額</span>
									{getSortIcon("amount")}
								</div>
							</th>

							{/* カテゴリ */}
							{!compact && (
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									カテゴリ
								</th>
							)}

							{/* 説明 */}
							<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
								説明
							</th>

							{/* 支払い方法 */}
							{!compact && (
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
									支払い方法
								</th>
							)}

							{/* 登録日 */}
							{!compact && (
								<th
									className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
									onClick={() => handleSort("createdAt")}
								>
									<div className="flex items-center space-x-1">
										<span>登録日</span>
										{getSortIcon("createdAt")}
									</div>
								</th>
							)}

							{/* アクション */}
							<th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
								操作
							</th>
						</tr>
					</thead>
					<tbody className="bg-white divide-y divide-gray-200">
						{transactions.map((transaction) => (
							<tr key={transaction.id} className="hover:bg-gray-50">
								{/* 取引日 */}
								<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
									{formatDate(transaction.transactionDate)}
								</td>

								{/* タイプ */}
								<td className="px-6 py-4 whitespace-nowrap">
									<span
										className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getTypeColorClass(transaction.type as "income" | "expense")}`}
									>
										{getTypeLabel(transaction.type as "income" | "expense")}
									</span>
								</td>

								{/* 金額 */}
								<td
									className={`px-6 py-4 whitespace-nowrap text-sm font-medium text-right ${
										transaction.type === "income"
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{formatAmount(
										transaction.amount,
										transaction.type as "income" | "expense",
									)}
								</td>

								{/* カテゴリ */}
								{!compact && (
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
										{transaction.categoryId ? (
											<span className="text-gray-900">
												{/* TODO: カテゴリ名の表示 - カテゴリIDからカテゴリ名を取得する必要がある */}
												カテゴリ#{transaction.categoryId}
											</span>
										) : (
											<span className="text-gray-400">未分類</span>
										)}
									</td>
								)}

								{/* 説明 */}
								<td className="px-6 py-4 text-sm text-gray-900">
									<div
										className="max-w-xs truncate"
										title={transaction.description || ""}
									>
										{transaction.description || "—"}
									</div>
								</td>

								{/* 支払い方法 */}
								{!compact && (
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{transaction.paymentMethod || "—"}
									</td>
								)}

								{/* 登録日 */}
								{!compact && (
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
										{formatDate(transaction.createdAt)}
									</td>
								)}

								{/* アクション */}
								<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
									<div className="flex items-center justify-end space-x-2">
										<button
											className="text-blue-600 hover:text-blue-900 text-sm"
											onClick={() => {
												// TODO: 編集機能の実装
												console.log("Edit transaction:", transaction.id);
											}}
										>
											編集
										</button>
										<button
											className="text-red-600 hover:text-red-900 text-sm"
											onClick={() => {
												// TODO: 削除機能の実装
												if (confirm("この取引を削除しますか？")) {
													console.log("Delete transaction:", transaction.id);
												}
											}}
										>
											削除
										</button>
									</div>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
