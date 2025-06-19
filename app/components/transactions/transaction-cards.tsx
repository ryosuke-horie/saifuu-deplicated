import type { SelectTransaction } from "../../types";

/**
 * 取引カード表示コンポーネント
 *
 * 設計方針:
 * - モバイルファーストのカードレイアウト
 * - 取引タイプに応じた視覚的な色分け
 * - タッチフレンドリーなUI
 * - コンパクト表示対応
 */

export interface TransactionCardsProps {
	transactions: SelectTransaction[];
	compact?: boolean;
}

export function TransactionCards({
	transactions,
	compact = false,
}: TransactionCardsProps) {
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

	// カードの境界線色クラス
	const getCardBorderClass = (type: "income" | "expense") => {
		return type === "income"
			? "border-l-4 border-l-green-400"
			: "border-l-4 border-l-red-400";
	};

	// 金額の色クラス
	const getAmountColorClass = (type: "income" | "expense") => {
		return type === "income" ? "text-green-600" : "text-red-600";
	};

	if (transactions.length === 0) {
		return (
			<div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
				<p className="text-gray-500">表示する取引がありません</p>
			</div>
		);
	}

	return (
		<div
			className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"}`}
		>
			{transactions.map((transaction) => (
				<div
					key={transaction.id}
					className={`bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow ${getCardBorderClass(transaction.type as "income" | "expense")}`}
				>
					{/* カードヘッダー */}
					<div className="p-4 pb-2">
						<div className="flex items-start justify-between">
							<div className="flex-1 min-w-0">
								{/* 取引日とタイプ */}
								<div className="flex items-center space-x-2 mb-2">
									<span className="text-sm font-medium text-gray-900">
										{formatDate(transaction.transactionDate)}
									</span>
									<span
										className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
											transaction.type === "income"
												? "text-green-600 bg-green-50"
												: "text-red-600 bg-red-50"
										}`}
									>
										{getTypeLabel(transaction.type as "income" | "expense")}
									</span>
								</div>

								{/* 説明 */}
								<div className="mb-3">
									{transaction.description ? (
										<p
											className="text-sm text-gray-900 line-clamp-2"
											title={transaction.description}
										>
											{transaction.description}
										</p>
									) : (
										<p className="text-sm text-gray-400 italic">説明なし</p>
									)}
								</div>
							</div>

							{/* 金額 */}
							<div className="ml-4 text-right">
								<div
									className={`text-lg font-bold ${getAmountColorClass(transaction.type as "income" | "expense")}`}
								>
									{formatAmount(
										transaction.amount,
										transaction.type as "income" | "expense",
									)}
								</div>
							</div>
						</div>
					</div>

					{/* カード詳細（コンパクトモードでない場合） */}
					{!compact && (
						<div className="px-4 pb-3 space-y-2">
							{/* カテゴリ */}
							{transaction.categoryId && (
								<div className="flex items-center text-xs text-gray-600">
									<svg
										className="w-3 h-3 mr-1"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
										/>
									</svg>
									<span>カテゴリ#{transaction.categoryId}</span>
								</div>
							)}

							{/* 支払い方法 */}
							{transaction.paymentMethod && (
								<div className="flex items-center text-xs text-gray-600">
									<svg
										className="w-3 h-3 mr-1"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
										/>
									</svg>
									<span>{transaction.paymentMethod}</span>
								</div>
							)}

							{/* 登録日 */}
							<div className="flex items-center text-xs text-gray-500">
								<svg
									className="w-3 h-3 mr-1"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<span>登録: {formatDate(transaction.createdAt)}</span>
							</div>
						</div>
					)}

					{/* カードアクション */}
					<div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
						<div className="flex items-center justify-end space-x-3">
							<button
								className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
								onClick={() => {
									// TODO: 編集機能の実装
									console.log("Edit transaction:", transaction.id);
								}}
							>
								編集
							</button>
							<button
								className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
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
					</div>
				</div>
			))}
		</div>
	);
}
