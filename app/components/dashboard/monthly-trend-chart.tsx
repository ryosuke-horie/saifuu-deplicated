import { useMemo } from "react";
import {
	CartesianGrid,
	Legend,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import { useTransactionsByDateRange } from "../../lib/hooks/use-transactions";
import type { SelectTransaction } from "../../types";

/**
 * 月次推移チャートコンポーネント
 *
 * 設計方針:
 * - 過去6-12ヶ月の収入・支出推移を折れ線グラフで表示
 * - Rechartsライブラリを使用してインタラクティブなチャートを実装
 * - 既存のuseTransactionsフックを活用してデータ取得
 * - レスポンシブ対応でモバイル・デスクトップ両対応
 * - 日本語ローカライゼーション（月名、軸ラベル）
 * - 収入・支出の色分け（緑・赤）でユーザビリティ向上
 * - ホバー時の詳細表示とレジェンドでインタラクション強化
 */

export interface MonthlyTrendChartProps {
	/**
	 * 表示する月数（デフォルト: 6ヶ月）
	 */
	monthsToShow?: number;
	/**
	 * チャートの高さ（デフォルト: 400px）
	 */
	height?: number;
	/**
	 * チャートタイトルの表示有無
	 */
	showTitle?: boolean;
	/**
	 * レジェンドの表示有無
	 */
	showLegend?: boolean;
}

// チャート用のデータ型定義
interface MonthlyTrendData {
	month: string; // 表示用の月名（例: "2024年1月"）
	shortMonth: string; // 短縮表示用（例: "1月"）
	income: number; // 収入
	expense: number; // 支出
	balance: number; // 収支
	year: number; // 年
	monthNumber: number; // 月番号
}

export function MonthlyTrendChart({
	monthsToShow = 6,
	height = 400,
	showTitle = true,
	showLegend = true,
}: MonthlyTrendChartProps) {
	// 表示期間の計算
	const dateRange = useMemo(() => {
		const now = new Date();
		const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0); // 今月末
		const startDate = new Date(
			now.getFullYear(),
			now.getMonth() - monthsToShow + 1,
			1,
		); // 指定月数前の月初

		return {
			startDate: startDate.toISOString().split("T")[0],
			endDate: endDate.toISOString().split("T")[0],
		};
	}, [monthsToShow]);

	// 取引データを取得
	const {
		data: transactionsData,
		isLoading,
		error,
	} = useTransactionsByDateRange(dateRange.startDate, dateRange.endDate, {
		limit: 10000, // 全データを取得
	});

	// チャート用データの生成
	const chartData = useMemo((): MonthlyTrendData[] => {
		if (!transactionsData?.data) return [];

		const transactions = transactionsData.data;
		const monthlyData: Record<string, MonthlyTrendData> = {};

		// 表示期間の各月を初期化
		const now = new Date();
		for (let i = monthsToShow - 1; i >= 0; i--) {
			const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
			const year = date.getFullYear();
			const month = date.getMonth() + 1;
			const key = `${year}-${month.toString().padStart(2, "0")}`;

			monthlyData[key] = {
				month: `${year}年${month}月`,
				shortMonth: `${month}月`,
				income: 0,
				expense: 0,
				balance: 0,
				year,
				monthNumber: month,
			};
		}

		// 取引データを月別に集計
		for (const transaction of transactions) {
			const transactionDate = new Date(transaction.transactionDate);
			const year = transactionDate.getFullYear();
			const month = transactionDate.getMonth() + 1;
			const key = `${year}-${month.toString().padStart(2, "0")}`;

			if (monthlyData[key]) {
				if (transaction.type === "income") {
					monthlyData[key].income += transaction.amount;
				} else if (transaction.type === "expense") {
					monthlyData[key].expense += transaction.amount;
				}
			}
		}

		// 収支を計算
		for (const data of Object.values(monthlyData)) {
			data.balance = data.income - data.expense;
		}

		// 時系列順にソート
		return Object.values(monthlyData).sort((a, b) => {
			if (a.year !== b.year) return a.year - b.year;
			return a.monthNumber - b.monthNumber;
		});
	}, [transactionsData?.data, monthsToShow]);

	// カスタムツールチップコンポーネント
	const CustomTooltip = ({ active, payload, label }: any) => {
		if (!active || !payload || !payload.length) return null;

		return (
			<div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
				<p className="font-medium text-gray-900 mb-2">{label}</p>
				{payload.map((entry: any) => (
					<div key={entry.dataKey} className="flex items-center mb-1">
						<div
							className="w-3 h-3 rounded-full mr-2"
							style={{ backgroundColor: entry.color }}
						/>
						<span className="text-sm text-gray-600 mr-2">{entry.name}:</span>
						<span className="text-sm font-medium text-gray-900">
							¥{entry.value.toLocaleString()}
						</span>
					</div>
				))}
			</div>
		);
	};

	// X軸の表示フォーマット
	const formatXAxisLabel = (value: string) => {
		const data = chartData.find((d) => d.month === value);
		return data ? data.shortMonth : value;
	};

	// Y軸の表示フォーマット
	const formatYAxisLabel = (value: number) => {
		if (value === 0) return "¥0";
		if (Math.abs(value) >= 1000000) {
			return `¥${(value / 1000000).toFixed(1)}M`;
		}
		if (Math.abs(value) >= 1000) {
			return `¥${(value / 1000).toFixed(0)}K`;
		}
		return `¥${value.toLocaleString()}`;
	};

	// エラー表示
	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-6">
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
							月次推移データの取得に失敗しました
						</h3>
						<p className="text-sm text-red-700 mt-1">
							{error.message || "不明なエラーが発生しました"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// ローディング表示
	if (isLoading) {
		return (
			<div className="bg-white border border-gray-200 rounded-lg p-6">
				{showTitle && (
					<div className="w-48 h-6 bg-gray-200 rounded animate-pulse mb-6" />
				)}
				<div
					className="w-full bg-gray-200 rounded animate-pulse"
					style={{ height }}
				>
					<div className="flex items-end justify-between h-full p-4">
						{Array.from({ length: monthsToShow }, (_, i) => `loading-${i}`).map(
							(id) => (
								<div
									key={id}
									className="bg-gray-300 rounded-t"
									style={{
										width: `${80 / monthsToShow}%`,
										height: `${Math.random() * 60 + 20}%`,
									}}
								/>
							),
						)}
					</div>
				</div>
			</div>
		);
	}

	// データが空の場合
	if (chartData.length === 0) {
		return (
			<div className="bg-white border border-gray-200 rounded-lg p-6">
				{showTitle && (
					<h3 className="text-lg font-semibold text-gray-900 mb-4">
						月次推移チャート
					</h3>
				)}
				<div
					className="flex items-center justify-center bg-gray-50 rounded-lg"
					style={{ height }}
				>
					<div className="text-center">
						<div className="text-gray-400 mb-2">
							<svg
								className="w-12 h-12 mx-auto"
								fill="currentColor"
								viewBox="0 0 20 20"
							>
								<path
									fillRule="evenodd"
									d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<p className="text-gray-600">表示期間内に取引データがありません</p>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white border border-gray-200 rounded-lg p-6">
			{showTitle && (
				<h3 className="text-lg font-semibold text-gray-900 mb-4">
					月次推移チャート
				</h3>
			)}

			<div style={{ height }}>
				<ResponsiveContainer width="100%" height="100%">
					<LineChart
						data={chartData}
						margin={{
							top: 20,
							right: 30,
							left: 20,
							bottom: 20,
						}}
					>
						<CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
						<XAxis
							dataKey="month"
							tickFormatter={formatXAxisLabel}
							stroke="#6b7280"
							fontSize={12}
							tickLine={false}
						/>
						<YAxis
							tickFormatter={formatYAxisLabel}
							stroke="#6b7280"
							fontSize={12}
							tickLine={false}
						/>
						<Tooltip content={<CustomTooltip />} />
						{showLegend && (
							<Legend wrapperStyle={{ paddingTop: "20px" }} iconType="line" />
						)}
						<Line
							type="monotone"
							dataKey="income"
							stroke="#10b981"
							strokeWidth={3}
							dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
							activeDot={{ r: 6, stroke: "#10b981", strokeWidth: 2 }}
							name="収入"
						/>
						<Line
							type="monotone"
							dataKey="expense"
							stroke="#ef4444"
							strokeWidth={3}
							dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
							activeDot={{ r: 6, stroke: "#ef4444", strokeWidth: 2 }}
							name="支出"
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>

			{/* 統計情報の表示 */}
			<div className="mt-6 pt-4 border-t border-gray-200">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
					<div className="text-center">
						<div className="text-gray-600">平均収入</div>
						<div className="font-semibold text-green-600">
							¥
							{Math.round(
								chartData.reduce((sum, data) => sum + data.income, 0) /
									chartData.length,
							).toLocaleString()}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-600">平均支出</div>
						<div className="font-semibold text-red-600">
							¥
							{Math.round(
								chartData.reduce((sum, data) => sum + data.expense, 0) /
									chartData.length,
							).toLocaleString()}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-600">最高収入</div>
						<div className="font-semibold text-green-600">
							¥
							{Math.max(
								...chartData.map((data) => data.income),
							).toLocaleString()}
						</div>
					</div>
					<div className="text-center">
						<div className="text-gray-600">最高支出</div>
						<div className="font-semibold text-red-600">
							¥
							{Math.max(
								...chartData.map((data) => data.expense),
							).toLocaleString()}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
