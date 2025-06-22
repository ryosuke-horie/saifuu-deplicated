import { useMemo } from "react";
import { useCurrentMonthTransactions } from "../../lib/hooks/use-transactions";
import { formatTotalAmount } from "../../utils/transaction-formatters";

/**
 * ダッシュボード用サマリーカードコンポーネント
 *
 * 設計方針:
 * - 今月の収入・支出・収支・取引件数を表示
 * - 前月比較機能（増減と%）を提供
 * - レスポンシブデザインでモバイルファーストを採用
 * - アイコンとカラーリングで視覚的な分かりやすさを重視
 * - 既存のuseTransactionsフックを活用してAPI連携
 */

export interface SummaryCardsProps {
	/**
	 * カードの表示を簡潔にするかどうか
	 */
	compact?: boolean;
}

// 取引データ取得時の制限値定数
const MAX_TRANSACTION_LIMIT = 1000;

// サマリーデータの型定義
interface SummaryData {
	totalIncome: number;
	totalExpense: number;
	balance: number;
	transactionCount: number;
	incomeChange?: number;
	expenseChange?: number;
	balanceChange?: number;
	countChange?: number;
}

// カードアイテムの型定義
interface SummaryCardItem {
	id: string;
	title: string;
	value: string;
	change?: number;
	changeText?: string;
	icon: React.ReactNode;
	colorClass: string;
	bgClass: string;
}

export function SummaryCards({ compact = false }: SummaryCardsProps) {
	// 今月の取引データを取得
	const {
		data: currentMonthData,
		isLoading: isCurrentLoading,
		error: currentError,
	} = useCurrentMonthTransactions({
		limit: MAX_TRANSACTION_LIMIT, // 全データを取得するため大きな値を設定
	}, {
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== 'undefined',
	});

	// 前月の取引データを取得（比較用）
	const now = new Date();
	const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
	const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

	const {
		data: lastMonthData,
		isLoading: isLastLoading,
		error: lastError,
	} = useCurrentMonthTransactions({
		filters: {
			from: firstDayLastMonth.toISOString().split("T")[0],
			to: lastDayLastMonth.toISOString().split("T")[0],
		},
		limit: MAX_TRANSACTION_LIMIT,
	}, {
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== 'undefined',
	});

	// サマリーデータの計算
	const summaryData = useMemo((): SummaryData => {
		const currentTransactions = currentMonthData?.data || [];
		const lastTransactions = lastMonthData?.data || [];

		// 今月の集計
		const currentIncome = currentTransactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);

		const currentExpense = currentTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);

		const currentBalance = currentIncome - currentExpense;
		const currentCount = currentTransactions.length;

		// 前月の集計
		const lastIncome = lastTransactions
			.filter((t) => t.type === "income")
			.reduce((sum, t) => sum + t.amount, 0);

		const lastExpense = lastTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);

		const lastBalance = lastIncome - lastExpense;
		const lastCount = lastTransactions.length;

		// 変化率の計算（前月が0の場合は特殊処理）
		const calculateChange = (current: number, last: number): number => {
			if (last === 0) return current > 0 ? 100 : 0;
			return ((current - last) / last) * 100;
		};

		return {
			totalIncome: currentIncome,
			totalExpense: currentExpense,
			balance: currentBalance,
			transactionCount: currentCount,
			incomeChange: calculateChange(currentIncome, lastIncome),
			expenseChange: calculateChange(currentExpense, lastExpense),
			balanceChange: calculateChange(currentBalance, lastBalance),
			countChange: calculateChange(currentCount, lastCount),
		};
	}, [currentMonthData?.data, lastMonthData?.data]);

	// カードデータの生成
	const cardItems = useMemo((): SummaryCardItem[] => {
		return [
			{
				id: "income",
				title: "今月の収入",
				value: `¥${summaryData.totalIncome.toLocaleString()}`,
				change: summaryData.incomeChange,
				changeText: summaryData.incomeChange
					? `前月比 ${summaryData.incomeChange > 0 ? "+" : ""}${summaryData.incomeChange.toFixed(1)}%`
					: undefined,
				icon: (
					<svg
						className="w-8 h-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
				),
				colorClass: "text-green-600",
				bgClass: "bg-green-50",
			},
			{
				id: "expense",
				title: "今月の支出",
				value: `¥${summaryData.totalExpense.toLocaleString()}`,
				change: summaryData.expenseChange,
				changeText: summaryData.expenseChange
					? `前月比 ${summaryData.expenseChange > 0 ? "+" : ""}${summaryData.expenseChange.toFixed(1)}%`
					: undefined,
				icon: (
					<svg
						className="w-8 h-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M20 12H4"
						/>
					</svg>
				),
				colorClass: "text-red-600",
				bgClass: "bg-red-50",
			},
			{
				id: "balance",
				title: "今月の収支",
				value: formatTotalAmount(summaryData.balance),
				change: summaryData.balanceChange,
				changeText: summaryData.balanceChange
					? `前月比 ${summaryData.balanceChange > 0 ? "+" : ""}${summaryData.balanceChange.toFixed(1)}%`
					: undefined,
				icon: (
					<svg
						className="w-8 h-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
						/>
					</svg>
				),
				colorClass:
					summaryData.balance >= 0 ? "text-blue-600" : "text-orange-600",
				bgClass: summaryData.balance >= 0 ? "bg-blue-50" : "bg-orange-50",
			},
			{
				id: "count",
				title: "今月の取引件数",
				value: `${summaryData.transactionCount}件`,
				change: summaryData.countChange,
				changeText: summaryData.countChange
					? `前月比 ${summaryData.countChange > 0 ? "+" : ""}${summaryData.countChange.toFixed(1)}%`
					: undefined,
				icon: (
					<svg
						className="w-8 h-8"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
						/>
					</svg>
				),
				colorClass: "text-purple-600",
				bgClass: "bg-purple-50",
			},
		];
	}, [summaryData]);

	// 変化率の表示用アイコンとクラス
	const getChangeIcon = (change: number) => {
		if (change > 0) {
			return (
				<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
					<path
						fillRule="evenodd"
						d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z"
						clipRule="evenodd"
					/>
				</svg>
			);
		}
		return (
			<svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
				<path
					fillRule="evenodd"
					d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z"
					clipRule="evenodd"
				/>
			</svg>
		);
	};

	const getChangeColorClass = (change: number, cardId: string) => {
		// 支出の場合は増加が悪い、減少が良い
		if (cardId === "expense") {
			return change > 0 ? "text-red-600" : "text-green-600";
		}
		// その他の場合は増加が良い、減少が悪い
		return change > 0 ? "text-green-600" : "text-red-600";
	};

	// エラー表示
	if (currentError || lastError) {
		return (
			<div
				className="bg-red-50 border border-red-200 rounded-lg p-4"
				data-testid="summary-cards-error"
			>
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
							サマリーデータの取得に失敗しました
						</h3>
						<p className="text-sm text-red-700 mt-1">
							{currentError?.message ||
								lastError?.message ||
								"不明なエラーが発生しました"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// ローディング表示
	if (isCurrentLoading || isLastLoading) {
		const loadingCards = ["income", "expense", "balance", "count"];
		return (
			<div
				className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
				data-testid="summary-cards-loading"
			>
				{loadingCards.map((cardType) => (
					<div
						key={`loading-${cardType}`}
						className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
					>
						<div className="flex items-center justify-between mb-4">
							<div className="w-8 h-8 bg-gray-200 rounded-full" />
							<div className="w-16 h-4 bg-gray-200 rounded" />
						</div>
						<div className="w-24 h-8 bg-gray-200 rounded mb-2" />
						<div className="w-20 h-4 bg-gray-200 rounded" />
					</div>
				))}
			</div>
		);
	}

	return (
		<div
			className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6"
			data-testid="summary-cards"
		>
			{cardItems.map((item) => (
				<div
					key={item.id}
					className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200"
				>
					<div className="p-6">
						{/* ヘッダー */}
						<div className="flex items-center justify-between mb-4">
							<div className={`p-3 rounded-full ${item.bgClass}`}>
								<div className={item.colorClass}>{item.icon}</div>
							</div>
							{!compact && item.change !== undefined && (
								<div
									className={`flex items-center space-x-1 text-sm font-medium ${getChangeColorClass(
										item.change,
										item.id,
									)}`}
								>
									{getChangeIcon(item.change)}
									<span>{Math.abs(item.change).toFixed(1)}%</span>
								</div>
							)}
						</div>

						{/* 値 */}
						<div className="mb-2">
							<div className="text-2xl font-bold text-gray-900 mb-1">
								{item.value}
							</div>
							<div className="text-sm font-medium text-gray-600">
								{item.title}
							</div>
						</div>

						{/* 変化率テキスト */}
						{!compact && item.changeText && (
							<div
								className={`text-xs ${getChangeColorClass(
									item.change || 0,
									item.id,
								)}`}
							>
								{item.changeText}
							</div>
						)}
					</div>
				</div>
			))}
		</div>
	);
}
