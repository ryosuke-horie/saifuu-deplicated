import { useEffect, useMemo, useState } from "react";
import {
	Cell,
	Legend,
	Pie,
	PieChart,
	ResponsiveContainer,
	Tooltip,
} from "recharts";
import { useCategories } from "../../lib/hooks/use-categories";
import { useCurrentMonthTransactions } from "../../lib/hooks/use-transactions";
import type { SelectCategory, SelectTransaction } from "../../types";

/**
 * カテゴリ別支出・収入の円グラフコンポーネント
 *
 * 設計方針:
 * - RechartsのPieChartを使用して円グラフを描画
 * - 今月の取引データをカテゴリ別に集計してグラフ化
 * - 支出・収入の切り替え機能を提供
 * - レスポンシブ対応とモバイル最適化
 * - カテゴリ未設定の取引は「未分類」として表示
 * - 既存のカテゴリカラーとの統一性を保つ
 * - インタラクティブな操作（ホバー、クリック）に対応
 */

// チャートデータの型定義
interface ChartDataItem {
	name: string;
	value: number;
	percentage: number;
	color: string;
	categoryId: number | null;
}

// プロパティの型定義
export interface CategoryBreakdownChartProps {
	/**
	 * 初期表示する取引タイプ
	 * @default "expense"
	 */
	defaultType?: "income" | "expense";
	/**
	 * チャートのコンテナ高さ
	 * @default 400
	 */
	height?: number;
	/**
	 * コンパクト表示モード
	 * @default false
	 */
	compact?: boolean;
	/**
	 * カテゴリクリック時のハンドラー
	 */
	onCategoryClick?: (categoryId: number | null) => void;
}

// デフォルトカラーパレット（カテゴリにカラーが設定されていない場合に使用）
const DEFAULT_COLORS = [
	"#3B82F6", // blue-500
	"#EF4444", // red-500
	"#10B981", // emerald-500
	"#F59E0B", // amber-500
	"#8B5CF6", // violet-500
	"#EC4899", // pink-500
	"#06B6D4", // cyan-500
	"#84CC16", // lime-500
	"#F97316", // orange-500
	"#6366F1", // indigo-500
];

// 「未分類」カテゴリのカラー
const UNCATEGORIZED_COLOR = "#9CA3AF"; // gray-400

/**
 * カテゴリ別円グラフコンポーネント
 */
export function CategoryBreakdownChart({
	defaultType = "expense",
	height = 400,
	compact = false,
	onCategoryClick,
}: CategoryBreakdownChartProps) {
	// SSR対応: クライアントサイドでのみRechartsをレンダリング
	const [isClient, setIsClient] = useState(false);

	// 表示する取引タイプの状態管理
	const [selectedType, setSelectedType] = useState<"income" | "expense">(
		defaultType,
	);

	// クライアントサイドでマウントされたことを検知
	useEffect(() => {
		setIsClient(true);
	}, []);

	// 今月の取引データを取得
	const {
		data: transactionsResponse,
		isLoading: isLoadingTransactions,
		error: transactionsError,
	} = useCurrentMonthTransactions(
		{
			filters: { type: selectedType },
			limit: 1000, // 大きな値を設定して全件取得を試行
		},
		{
			// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
			enabled: typeof window !== "undefined",
		} as any,
	);

	// カテゴリマスタデータを取得
	const {
		data: categoriesResponse,
		isLoading: isLoadingCategories,
		error: categoriesError,
	} = useCategories({
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== "undefined",
	} as any);

	// チャートデータの生成
	const chartData = useMemo(() => {
		if (!transactionsResponse?.data || !categoriesResponse?.data) {
			return [];
		}

		const transactions = transactionsResponse.data;
		const categories = categoriesResponse.data;

		// カテゴリごとの合計金額を計算
		const categoryTotals = new Map<number | null, number>();
		let totalAmount = 0;

		// 取引をカテゴリごとに集計
		for (const transaction of transactions) {
			const categoryId = transaction.categoryId;
			const amount = transaction.amount;

			categoryTotals.set(
				categoryId,
				(categoryTotals.get(categoryId) || 0) + amount,
			);
			totalAmount += amount;
		}

		// チャートデータを生成
		const data: ChartDataItem[] = [];
		let colorIndex = 0;

		// カテゴリマップを作成（効率的な検索のため）
		const categoryMap = new Map<number, SelectCategory>();
		for (const category of categories) {
			categoryMap.set(category.id, category);
		}

		// カテゴリごとのデータを生成
		for (const [categoryId, amount] of categoryTotals.entries()) {
			const percentage = totalAmount > 0 ? (amount / totalAmount) * 100 : 0;

			if (categoryId === null) {
				// 未分類のケース
				data.push({
					name: "未分類",
					value: amount,
					percentage,
					color: UNCATEGORIZED_COLOR,
					categoryId: null,
				});
			} else {
				// カテゴリが設定されているケース
				const category = categoryMap.get(categoryId);
				if (category) {
					data.push({
						name: category.name,
						value: amount,
						percentage,
						color:
							category.color ||
							DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length],
						categoryId: category.id,
					});
					colorIndex++;
				}
			}
		}

		// 金額の降順でソート
		return data.sort((a, b) => b.value - a.value);
	}, [transactionsResponse?.data, categoriesResponse?.data]);

	// ローディング状態
	if (isLoadingTransactions || isLoadingCategories) {
		return (
			<div className="bg-white rounded-lg shadow-sm border">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">
						カテゴリ別内訳
					</h3>
				</div>
				<div
					className="flex items-center justify-center"
					style={{ height: `${height}px` }}
				>
					<div className="text-gray-500">読み込み中...</div>
				</div>
			</div>
		);
	}

	// エラー状態
	if (transactionsError || categoriesError) {
		return (
			<div className="bg-white rounded-lg shadow-sm border">
				<div className="px-6 py-4 border-b border-gray-200">
					<h3 className="text-lg font-semibold text-gray-900">
						カテゴリ別内訳
					</h3>
				</div>
				<div
					className="flex items-center justify-center"
					style={{ height: `${height}px` }}
				>
					<div className="text-red-500">データの読み込みに失敗しました</div>
				</div>
			</div>
		);
	}

	// データが空の場合
	if (chartData.length === 0) {
		const debugInfo =
			process.env.NODE_ENV !== "production"
				? {
						transactionCount: transactionsResponse?.data?.length || 0,
						selectedType,
						currentMonth: new Date().toISOString().slice(0, 7),
						sampleTransaction: transactionsResponse?.data?.[0],
					}
				: null;

		return (
			<div className="bg-white rounded-lg shadow-sm border">
				<div className="px-6 py-4 border-b border-gray-200">
					<div className="flex items-center justify-between">
						<h3 className="text-lg font-semibold text-gray-900">
							カテゴリ別内訳
						</h3>
						<div className="flex rounded-md shadow-sm">
							<button
								type="button"
								onClick={() => setSelectedType("expense")}
								className={`px-3 py-1 text-sm font-medium rounded-l-md border ${
									selectedType === "expense"
										? "bg-blue-50 text-blue-700 border-blue-200"
										: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
								}`}
							>
								支出
							</button>
							<button
								type="button"
								onClick={() => setSelectedType("income")}
								className={`px-3 py-1 text-sm font-medium rounded-r-md border-l-0 border ${
									selectedType === "income"
										? "bg-blue-50 text-blue-700 border-blue-200"
										: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
								}`}
							>
								収入
							</button>
						</div>
					</div>
				</div>
				<div
					className="flex items-center justify-center"
					style={{ height: `${height}px` }}
				>
					<div className="text-center text-gray-500">
						<div className="text-lg mb-2">📊</div>
						<div>
							今月の{selectedType === "expense" ? "支出" : "収入"}
							データがありません
						</div>
						{debugInfo && (
							<div className="mt-4 p-3 bg-gray-50 rounded text-xs text-left max-w-md">
								<div className="font-semibold mb-2">デバッグ情報:</div>
								<div>取引件数: {debugInfo.transactionCount}</div>
								<div>選択タイプ: {debugInfo.selectedType}</div>
								<div>対象月: {debugInfo.currentMonth}</div>
								{debugInfo.sampleTransaction && (
									<div className="mt-1">
										サンプル: {debugInfo.sampleTransaction.description} (
										{debugInfo.sampleTransaction.transactionDate})
									</div>
								)}
							</div>
						)}
					</div>
				</div>
			</div>
		);
	}

	// カスタムツールチップ
	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload as ChartDataItem;
			return (
				<div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
					<p className="font-medium text-gray-900">{data.name}</p>
					<p className="text-sm text-gray-600">
						金額: ¥{data.value.toLocaleString()}
					</p>
					<p className="text-sm text-gray-600">
						割合: {data.percentage.toFixed(1)}%
					</p>
				</div>
			);
		}
		return null;
	};

	// セルクリックハンドラー
	const handleCellClick = (data: ChartDataItem) => {
		if (onCategoryClick) {
			onCategoryClick(data.categoryId);
		}
	};

	return (
		<div className="bg-white rounded-lg shadow-sm border">
			{/* ヘッダー */}
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">
						カテゴリ別内訳
					</h3>
					{/* 取引タイプ切り替えボタン */}
					<div className="flex rounded-md shadow-sm">
						<button
							type="button"
							onClick={() => setSelectedType("expense")}
							className={`px-3 py-1 text-sm font-medium rounded-l-md border transition-colors ${
								selectedType === "expense"
									? "bg-blue-50 text-blue-700 border-blue-200"
									: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
							}`}
						>
							支出
						</button>
						<button
							type="button"
							onClick={() => setSelectedType("income")}
							className={`px-3 py-1 text-sm font-medium rounded-r-md border-l-0 border transition-colors ${
								selectedType === "income"
									? "bg-blue-50 text-blue-700 border-blue-200"
									: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
							}`}
						>
							収入
						</button>
					</div>
				</div>
			</div>

			{/* チャートコンテンツ */}
			<div className="p-6">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					{/* 円グラフ */}
					<div className="lg:col-span-2">
						{isClient ? (
							<ResponsiveContainer width="100%" height={height}>
								<PieChart>
									<Pie
										data={chartData}
										cx="50%"
										cy="50%"
										outerRadius={compact ? 80 : 120}
										innerRadius={compact ? 30 : 50}
										dataKey="value"
										onClick={handleCellClick}
										className="cursor-pointer"
									>
										{chartData.map((entry) => (
											<Cell
												key={`cell-${entry.categoryId || "uncategorized"}-${entry.name}`}
												fill={entry.color}
												stroke="white"
												strokeWidth={2}
											/>
										))}
									</Pie>
									<Tooltip content={<CustomTooltip />} />
									{!compact && (
										<Legend
											verticalAlign="bottom"
											height={36}
											formatter={(value, entry: any) => (
												<span style={{ color: entry.color }}>{value}</span>
											)}
										/>
									)}
								</PieChart>
							</ResponsiveContainer>
						) : (
							<div
								className="flex items-center justify-center bg-gray-50 rounded-lg"
								style={{ height: `${height}px` }}
							>
								<div className="text-gray-500">チャートを読み込み中...</div>
							</div>
						)}
					</div>

					{/* 詳細リスト */}
					<div className="space-y-3">
						<h4 className="font-medium text-gray-900 text-sm">内訳詳細</h4>
						<div className="space-y-2 max-h-80 overflow-y-auto">
							{chartData.map((item) => (
								<div
									key={`detail-${item.categoryId || "uncategorized"}-${item.name}`}
									className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
									onClick={() => handleCellClick(item)}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											handleCellClick(item);
										}
									}}
									tabIndex={0}
									role="button"
								>
									<div className="flex items-center space-x-3">
										<div
											className="w-3 h-3 rounded-full"
											style={{ backgroundColor: item.color }}
										/>
										<span className="text-sm font-medium text-gray-900">
											{item.name}
										</span>
									</div>
									<div className="text-right">
										<div className="text-sm font-medium text-gray-900">
											¥{item.value.toLocaleString()}
										</div>
										<div className="text-xs text-gray-500">
											{item.percentage.toFixed(1)}%
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
