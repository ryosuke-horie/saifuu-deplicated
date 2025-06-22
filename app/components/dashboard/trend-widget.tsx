import { useMemo } from "react";
import { useCategories } from "../../lib/hooks/use-categories";
import { useCurrentMonthTransactions } from "../../lib/hooks/use-transactions";
import type { SelectCategory, SelectTransaction } from "../../types";

/**
 * ダッシュボード用トレンドウィジェットコンポーネント
 *
 * 設計方針:
 * - 今月と前月の取引データを比較してトレンド情報を表示
 * - 月間比較（増減率）、最頻使用カテゴリ、1日平均支出を計算
 * - 空データ状態を適切に処理し、「データがありません」を表示
 * - 既存のデータ取得フックを活用してAPI連携
 * - ローディング状態とエラーハンドリングを実装
 * - 日付計算は現在月と前月の期間を正確に算出
 */

export interface TrendWidgetProps {
	/**
	 * コンパクト表示モード
	 * @default false
	 */
	compact?: boolean;
}

// 取引データ取得時の制限値定数
const MAX_TRANSACTION_LIMIT = 1000;

// トレンドデータの型定義
interface TrendData {
	monthOverMonthChange: number | null; // 前月比変化率（%）
	mostUsedCategory: string | null; // 最頻使用カテゴリ名
	dailyAverageExpense: number | null; // 1日平均支出
	hasCurrentData: boolean; // 今月のデータが存在するか
	hasPreviousData: boolean; // 前月のデータが存在するか
}

export function TrendWidget({ compact = false }: TrendWidgetProps) {
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
	} as any);

	// 前月の取引データを取得（比較用）
	// 注意: useCurrentMonthTransactions は汎用的なトランザクション取得フックとして使用
	// filters パラメータで前月の日付範囲を指定することで前月データを取得
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
	} as any);

	// カテゴリマスタデータを取得（カテゴリ名解決のため）
	const {
		data: categoriesResponse,
		isLoading: isCategoriesLoading,
		error: categoriesError,
	} = useCategories({
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== 'undefined',
	} as any);

	// トレンドデータの計算
	const trendData = useMemo((): TrendData => {
		const currentTransactions = currentMonthData?.data || [];
		const lastTransactions = lastMonthData?.data || [];
		const categories = categoriesResponse?.data || [];

		// データ存在チェック
		const hasCurrentData = currentTransactions.length > 0;
		const hasPreviousData = lastTransactions.length > 0;

		// 今月の支出総額を計算
		const currentExpenseTotal = currentTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);

		// 前月の支出総額を計算
		const lastExpenseTotal = lastTransactions
			.filter((t) => t.type === "expense")
			.reduce((sum, t) => sum + t.amount, 0);

		// 月間比較の計算（前月比変化率）
		let monthOverMonthChange: number | null = null;
		if (hasPreviousData && hasCurrentData) {
			if (lastExpenseTotal === 0) {
				// 前月が0円の場合の特殊処理
				monthOverMonthChange = currentExpenseTotal > 0 ? 100 : 0;
			} else {
				monthOverMonthChange =
					((currentExpenseTotal - lastExpenseTotal) / lastExpenseTotal) * 100;
			}
		}

		// 最頻使用カテゴリの計算（今月の支出データから）
		let mostUsedCategory: string | null = null;
		if (hasCurrentData) {
			// カテゴリIDごとに取引回数をカウント
			const categoryUsageCount = new Map<number | null, number>();
			const expenseTransactions = currentTransactions.filter(
				(t) => t.type === "expense",
			);

			for (const transaction of expenseTransactions) {
				const categoryId = transaction.categoryId;
				categoryUsageCount.set(
					categoryId,
					(categoryUsageCount.get(categoryId) || 0) + 1,
				);
			}

			// 最も使用回数の多いカテゴリを特定
			let maxCount = 0;
			let mostUsedCategoryId: number | null = null;

			for (const [categoryId, count] of categoryUsageCount.entries()) {
				if (count > maxCount) {
					maxCount = count;
					mostUsedCategoryId = categoryId;
				}
			}

			// カテゴリID→カテゴリ名の変換
			if (mostUsedCategoryId === null) {
				mostUsedCategory = "未分類";
			} else {
				const category = categories.find((c) => c.id === mostUsedCategoryId);
				mostUsedCategory = category?.name || "不明なカテゴリ";
			}

			// 使用回数が0の場合は null に設定
			if (maxCount === 0) {
				mostUsedCategory = null;
			}
		}

		// 1日平均支出の計算
		let dailyAverageExpense: number | null = null;
		if (hasCurrentData && currentExpenseTotal > 0) {
			// 今月の経過日数を計算（今日が含まれるため +1）
			const today = new Date();
			const firstDayThisMonth = new Date(
				today.getFullYear(),
				today.getMonth(),
				1,
			);
			const daysPassed =
				Math.floor(
					(today.getTime() - firstDayThisMonth.getTime()) /
						(1000 * 60 * 60 * 24),
				) + 1;

			dailyAverageExpense = Math.round(currentExpenseTotal / daysPassed);
		}

		return {
			monthOverMonthChange,
			mostUsedCategory,
			dailyAverageExpense,
			hasCurrentData,
			hasPreviousData,
		};
	}, [currentMonthData?.data, lastMonthData?.data, categoriesResponse?.data]);

	// エラー表示
	if (currentError || lastError || categoriesError) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					今月のトレンド
				</h3>
				<div className="text-center text-red-500">
					<div className="text-sm mb-2">⚠️</div>
					<div>データの取得に失敗しました</div>
					<div className="text-xs text-red-400 mt-1">
						{currentError?.message ||
							lastError?.message ||
							categoriesError?.message ||
							"不明なエラーが発生しました"}
					</div>
				</div>
			</div>
		);
	}

	// ローディング表示
	if (isCurrentLoading || isLastLoading || isCategoriesLoading) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					今月のトレンド
				</h3>
				<div className="space-y-3 text-sm">
					<div className="flex items-center justify-between">
						<span className="text-gray-600">先月との比較</span>
						<div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
					</div>
					<div className="flex items-center justify-between">
						<span className="text-gray-600">よく使うカテゴリ</span>
						<div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
					</div>
					<div className="flex items-center justify-between">
						<span className="text-gray-600">1日平均支出</span>
						<div className="w-18 h-4 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
			</div>
		);
	}

	// 月間比較の表示処理
	const renderMonthComparison = () => {
		if (trendData.monthOverMonthChange === null) {
			return (
				<span className="text-gray-500 font-medium">データがありません</span>
			);
		}

		const change = trendData.monthOverMonthChange;
		const isIncrease = change > 0;
		const colorClass = isIncrease ? "text-red-600" : "text-green-600";
		const sign = isIncrease ? "+" : "";

		return (
			<span className={`${colorClass} font-medium`}>
				{sign}
				{change.toFixed(1)}%
			</span>
		);
	};

	// 最頻使用カテゴリの表示処理
	const renderMostUsedCategory = () => {
		if (!trendData.mostUsedCategory) {
			return (
				<span className="text-gray-500 font-medium">データがありません</span>
			);
		}

		return (
			<span className="text-gray-900 font-medium">
				{trendData.mostUsedCategory}
			</span>
		);
	};

	// 1日平均支出の表示処理
	const renderDailyAverage = () => {
		if (trendData.dailyAverageExpense === null) {
			return (
				<span className="text-gray-500 font-medium">データがありません</span>
			);
		}

		return (
			<span className="text-gray-900 font-medium">
				¥{trendData.dailyAverageExpense.toLocaleString()}
			</span>
		);
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">
				今月のトレンド
			</h3>
			<div className="space-y-3 text-sm">
				{/* 先月との比較 */}
				<div className="flex items-center justify-between">
					<span className="text-gray-600">先月との比較</span>
					{renderMonthComparison()}
				</div>

				{/* よく使うカテゴリ */}
				<div className="flex items-center justify-between">
					<span className="text-gray-600">よく使うカテゴリ</span>
					{renderMostUsedCategory()}
				</div>

				{/* 1日平均支出 */}
				<div className="flex items-center justify-between">
					<span className="text-gray-600">1日平均支出</span>
					{renderDailyAverage()}
				</div>
			</div>

			{/* データ不足時の注意メッセージ */}
			{!trendData.hasCurrentData && (
				<div className="mt-4 pt-4 border-t border-gray-200">
					<div className="text-xs text-gray-500 text-center">
						今月の取引データがまだありません
					</div>
				</div>
			)}
		</div>
	);
}
