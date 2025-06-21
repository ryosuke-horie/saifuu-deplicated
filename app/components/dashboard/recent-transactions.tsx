import { Link } from "react-router";
import { useTransactions } from "../../lib/hooks/use-transactions";
import type { ApiTransaction } from "../../lib/schemas/api-responses";
import {
	formatAmount,
	formatDate,
	getAmountColorClass,
	getTypeLabel,
} from "../../utils/transaction-formatters";

/**
 * ダッシュボード用最新取引リストコンポーネント
 *
 * 設計方針:
 * - ダッシュボード専用の軽量化された取引表示
 * - 直近の取引を簡潔に表示
 * - TransactionCardsより軽量でパフォーマンス重視
 * - レスポンシブデザインに対応
 * - 「もっと見る」リンクで取引一覧ページへの導線を提供
 */

export interface RecentTransactionsProps {
	limit?: number;
	className?: string;
}

export function RecentTransactions({
	limit = 5,
	className = "",
}: RecentTransactionsProps) {
	// 最新の取引を取得（日付順で降順ソート）
	const { data, isLoading, error } = useTransactions({
		limit,
		sort: {
			sort_by: "transactionDate",
			sort_order: "desc",
		},
	});

	const transactions = data?.data || [];

	// ローディング状態
	if (isLoading) {
		return (
			<div
				className={`bg-white rounded-lg border border-gray-200 ${className}`}
			>
				<div className="p-6 border-b border-gray-100">
					<h2 className="text-lg font-semibold text-gray-900">最新の取引</h2>
				</div>
				<div className="p-6">
					<div className="animate-pulse space-y-4">
						<SkeletonItem />
						<SkeletonItem />
						<SkeletonItem />
						<SkeletonItem />
						<SkeletonItem />
					</div>
				</div>
			</div>
		);
	}

	// エラー状態
	if (error) {
		return (
			<div
				className={`bg-white rounded-lg border border-gray-200 ${className}`}
			>
				<div className="p-6 border-b border-gray-100">
					<h2 className="text-lg font-semibold text-gray-900">最新の取引</h2>
				</div>
				<div className="p-6 text-center">
					<p className="text-red-600">取引データの読み込みに失敗しました</p>
					<p className="text-sm text-gray-500 mt-1">
						しばらく時間をおいて再度お試しください
					</p>
				</div>
			</div>
		);
	}

	// データがない場合
	if (transactions.length === 0) {
		return (
			<div
				className={`bg-white rounded-lg border border-gray-200 ${className}`}
			>
				<div className="p-6 border-b border-gray-100">
					<h2 className="text-lg font-semibold text-gray-900">最新の取引</h2>
				</div>
				<div className="p-6 text-center">
					<div className="text-gray-400 mb-4">
						<svg
							className="w-12 h-12 mx-auto"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={1}
								d="M9 7h6m0 10v-3m-3 3h.01M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<p className="text-gray-500 text-sm">まだ取引がありません</p>
					<Link
						to="/transactions/new"
						className="inline-block mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors"
					>
						最初の取引を登録する
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
			{/* カードヘッダー */}
			<div className="p-6 border-b border-gray-100">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold text-gray-900">最新の取引</h2>
					<Link
						to="/transactions"
						className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
					>
						もっと見る
					</Link>
				</div>
			</div>

			{/* 取引リスト */}
			<div className="divide-y divide-gray-100">
				{transactions.map((transaction) => (
					<TransactionItem key={transaction.id} transaction={transaction} />
				))}
			</div>
		</div>
	);
}

/**
 * 個別の取引アイテムコンポーネント
 * ダッシュボード表示用に最適化された軽量版
 */
interface TransactionItemProps {
	transaction: ApiTransaction;
}

/**
 * スケルトンローディング用のアイテムコンポーネント
 */
function SkeletonItem() {
	return (
		<div className="flex items-center justify-between">
			<div className="flex-1">
				<div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
				<div className="h-3 bg-gray-200 rounded w-3/4" />
			</div>
			<div className="h-5 bg-gray-200 rounded w-20" />
		</div>
	);
}

function TransactionItem({ transaction }: TransactionItemProps) {
	return (
		<div className="p-4 hover:bg-gray-50 transition-colors">
			<div className="flex items-center justify-between">
				{/* 左側: 取引情報 */}
				<div className="flex-1 min-w-0">
					<div className="flex items-center space-x-3">
						{/* 取引タイプインジケーター */}
						<div
							className={`w-3 h-3 rounded-full flex-shrink-0 ${
								transaction.type === "income" ? "bg-green-400" : "bg-red-400"
							}`}
						/>

						{/* 取引詳細 */}
						<div className="flex-1 min-w-0">
							<div className="flex items-center space-x-2 mb-1">
								{/* 取引日 */}
								<span className="text-sm font-medium text-gray-900">
									{formatDate(transaction.transactionDate)}
								</span>

								{/* 取引タイプバッジ（モバイル表示用） */}
								<span
									className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full sm:hidden ${
										transaction.type === "income"
											? "text-green-600 bg-green-50"
											: "text-red-600 bg-red-50"
									}`}
								>
									{getTypeLabel(transaction.type as "income" | "expense")}
								</span>
							</div>

							{/* 説明文 */}
							<div className="flex items-center space-x-2">
								<p
									className="text-sm text-gray-600 truncate"
									title={transaction.description || "説明なし"}
								>
									{transaction.description || "説明なし"}
								</p>

								{/* カテゴリ情報（デスクトップ表示） */}
								{transaction.categoryId && (
									<span className="hidden sm:inline-flex text-xs text-gray-400">
										• カテゴリ#{transaction.categoryId}
									</span>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* 右側: 金額とタイプ */}
				<div className="ml-4 text-right flex-shrink-0">
					{/* 金額 */}
					<div
						className={`text-base font-semibold ${getAmountColorClass(transaction.type as "income" | "expense")}`}
					>
						{formatAmount(
							transaction.amount,
							transaction.type as "income" | "expense",
						)}
					</div>

					{/* 取引タイプバッジ（デスクトップ表示） */}
					<div className="hidden sm:block mt-1">
						<span
							className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${
								transaction.type === "income"
									? "text-green-600 bg-green-50"
									: "text-red-600 bg-red-50"
							}`}
						>
							{getTypeLabel(transaction.type as "income" | "expense")}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
}
