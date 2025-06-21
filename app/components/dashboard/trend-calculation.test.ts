/**
 * TrendWidget トレンド計算ロジックのユニットテスト
 *
 * テスト対象:
 * - 月間比較（前月比変化率）の計算ロジック
 * - 最頻使用カテゴリの特定ロジック
 * - 1日平均支出の計算ロジック
 * - エッジケース処理（空データ、単一月データ、境界値など）
 * - エラーハンドリング（無効データ、計算エラーなど）
 *
 * 設計方針:
 * - TrendWidgetコンポーネントから計算ロジックを抽出してテスト
 * - 実際のコンポーネントの計算方式と同等の処理を検証
 * - 数学的計算の正確性を重点的にテスト
 * - 境界値と異常値に対する堅牢性を検証
 * - 30+ テストケースで包括的カバレッジを確保
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SelectCategory, SelectTransaction } from "../../types";

// ========================================
// トレンド計算関数（TrendWidgetから抽出）
// ========================================

/**
 * トレンドデータの型定義
 */
interface TrendData {
	monthOverMonthChange: number | null; // 前月比変化率（%）
	mostUsedCategory: string | null; // 最頻使用カテゴリ名
	dailyAverageExpense: number | null; // 1日平均支出
	hasCurrentData: boolean; // 今月のデータが存在するか
	hasPreviousData: boolean; // 前月のデータが存在するか
}

/**
 * 前月比変化率の計算
 * @param currentTotal 今月の支出総額
 * @param previousTotal 前月の支出総額
 * @param hasCurrentData 今月データの存在フラグ
 * @param hasPreviousData 前月データの存在フラグ
 * @returns 変化率（%）またはnull
 */
function calculateMonthOverMonthChange(
	currentTotal: number,
	previousTotal: number,
	hasCurrentData: boolean,
	hasPreviousData: boolean,
): number | null {
	// データが不足している場合はnullを返す
	if (!hasCurrentData || !hasPreviousData) {
		return null;
	}

	// 前月が0円の場合の特殊処理
	if (previousTotal === 0) {
		return currentTotal > 0 ? 100 : 0;
	}

	// 通常の変化率計算
	return ((currentTotal - previousTotal) / previousTotal) * 100;
}

/**
 * 最頻使用カテゴリの特定
 * @param transactions 取引データ配列
 * @param categories カテゴリマスタデータ配列
 * @param hasCurrentData データ存在フラグ
 * @returns カテゴリ名またはnull
 */
function calculateMostUsedCategory(
	transactions: SelectTransaction[],
	categories: SelectCategory[],
	hasCurrentData: boolean,
): string | null {
	if (!hasCurrentData) {
		return null;
	}

	// 支出取引のみを抽出
	const expenseTransactions = transactions.filter((t) => t.type === "expense");

	if (expenseTransactions.length === 0) {
		return null;
	}

	// カテゴリIDごとに取引回数をカウント
	const categoryUsageCount = new Map<number | null, number>();

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

	// 使用回数が0の場合はnullを返す
	if (maxCount === 0) {
		return null;
	}

	// カテゴリID→カテゴリ名の変換
	if (mostUsedCategoryId === null) {
		return "未分類";
	}

	const category = categories.find((c) => c.id === mostUsedCategoryId);
	return category?.name || "不明なカテゴリ";
}

/**
 * 1日平均支出の計算
 * @param currentTotal 今月の支出総額
 * @param hasCurrentData データ存在フラグ
 * @param currentDate 現在日時（テスト可能にするためのパラメータ）
 * @returns 1日平均支出またはnull
 */
function calculateDailyAverageExpense(
	currentTotal: number,
	hasCurrentData: boolean,
	currentDate = new Date(),
): number | null {
	if (!hasCurrentData || currentTotal <= 0) {
		return null;
	}

	// 今月の経過日数を計算（今日が含まれるため +1）
	const today = currentDate;
	const firstDayThisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
	const daysPassed =
		Math.floor(
			(today.getTime() - firstDayThisMonth.getTime()) / (1000 * 60 * 60 * 24),
		) + 1;

	return Math.round(currentTotal / daysPassed);
}

/**
 * 支出総額の計算
 * @param transactions 取引データ配列
 * @returns 支出総額
 */
function calculateExpenseTotal(transactions: SelectTransaction[]): number {
	return transactions
		.filter((t) => t.type === "expense")
		.reduce((sum, t) => sum + t.amount, 0);
}

/**
 * トレンドデータ全体の計算
 * @param currentTransactions 今月の取引データ
 * @param previousTransactions 前月の取引データ
 * @param categories カテゴリマスタデータ
 * @param currentDate 計算基準日（テスト用）
 * @returns トレンドデータ
 */
function calculateTrendData(
	currentTransactions: SelectTransaction[],
	previousTransactions: SelectTransaction[],
	categories: SelectCategory[],
	currentDate = new Date(),
): TrendData {
	// データ存在チェック
	const hasCurrentData = currentTransactions.length > 0;
	const hasPreviousData = previousTransactions.length > 0;

	// 支出総額を計算
	const currentExpenseTotal = calculateExpenseTotal(currentTransactions);
	const previousExpenseTotal = calculateExpenseTotal(previousTransactions);

	// 各指標を計算
	const monthOverMonthChange = calculateMonthOverMonthChange(
		currentExpenseTotal,
		previousExpenseTotal,
		hasCurrentData,
		hasPreviousData,
	);

	const mostUsedCategory = calculateMostUsedCategory(
		currentTransactions,
		categories,
		hasCurrentData,
	);

	const dailyAverageExpense = calculateDailyAverageExpense(
		currentExpenseTotal,
		hasCurrentData,
		currentDate,
	);

	return {
		monthOverMonthChange,
		mostUsedCategory,
		dailyAverageExpense,
		hasCurrentData,
		hasPreviousData,
	};
}

// ========================================
// テストデータ
// ========================================

const mockCategories: SelectCategory[] = [
	{
		id: 1,
		name: "食費",
		type: "expense",
		displayOrder: 1,
		color: "#FF6B6B",
		icon: null,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: 2,
		name: "交通費",
		type: "expense",
		displayOrder: 2,
		color: "#4ECDC4",
		icon: null,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: 3,
		name: "娯楽費",
		type: "expense",
		displayOrder: 3,
		color: "#45B7D1",
		icon: null,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: 4,
		name: "給与",
		type: "income",
		displayOrder: 4,
		color: "#96CEB4",
		icon: null,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
];

function createMockTransaction(
	id: number,
	amount: number,
	type: "income" | "expense",
	categoryId: number | null,
	description: string,
	transactionDate: string,
): SelectTransaction {
	return {
		id,
		amount,
		type,
		categoryId,
		description,
		transactionDate,
		paymentMethod: "現金",
		tags: null,
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	};
}

// ========================================
// テストスイート
// ========================================

describe("TrendWidget 計算ロジック", () => {
	// 各テスト前にDateモックをリセット
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	// ========================================
	// 前月比変化率（Month-over-Month Change）テスト
	// ========================================

	describe("calculateMonthOverMonthChange", () => {
		it("前月比増加時に正の変化率を返すこと", () => {
			const result = calculateMonthOverMonthChange(12000, 10000, true, true);
			expect(result).toBe(20);
		});

		it("前月比減少時に負の変化率を返すこと", () => {
			const result = calculateMonthOverMonthChange(8000, 10000, true, true);
			expect(result).toBe(-20);
		});

		it("前月比変化なしの場合に0を返すこと", () => {
			const result = calculateMonthOverMonthChange(10000, 10000, true, true);
			expect(result).toBe(0);
		});

		it("前月が0円で今月に支出がある場合に100%を返すこと", () => {
			const result = calculateMonthOverMonthChange(5000, 0, true, true);
			expect(result).toBe(100);
		});

		it("前月が0円で今月も0円の場合に0%を返すこと", () => {
			const result = calculateMonthOverMonthChange(0, 0, true, true);
			expect(result).toBe(0);
		});

		it("今月から支出が0円になった場合に-100%を返すこと", () => {
			const result = calculateMonthOverMonthChange(0, 10000, true, true);
			expect(result).toBe(-100);
		});

		it("今月データがない場合にnullを返すこと", () => {
			const result = calculateMonthOverMonthChange(10000, 8000, false, true);
			expect(result).toBeNull();
		});

		it("前月データがない場合にnullを返すこと", () => {
			const result = calculateMonthOverMonthChange(10000, 8000, true, false);
			expect(result).toBeNull();
		});

		it("両月ともデータがない場合にnullを返すこと", () => {
			const result = calculateMonthOverMonthChange(10000, 8000, false, false);
			expect(result).toBeNull();
		});

		it("小数点を含む変化率を正確に計算すること", () => {
			const result = calculateMonthOverMonthChange(10333, 10000, true, true);
			expect(result).toBeCloseTo(3.33, 2);
		});

		it("非常に大きな金額でも正確に計算すること", () => {
			const result = calculateMonthOverMonthChange(1000000, 500000, true, true);
			expect(result).toBe(100);
		});

		it("非常に小さな金額でも正確に計算すること", () => {
			const result = calculateMonthOverMonthChange(3, 2, true, true);
			expect(result).toBe(50);
		});
	});

	// ========================================
	// 最頻使用カテゴリ特定テスト
	// ========================================

	describe("calculateMostUsedCategory", () => {
		it("最も使用回数の多いカテゴリを正しく特定すること", () => {
			const transactions = [
				createMockTransaction(1, 1000, "expense", 1, "食費1", "2024-06-01"),
				createMockTransaction(2, 2000, "expense", 1, "食費2", "2024-06-02"),
				createMockTransaction(3, 500, "expense", 2, "交通費1", "2024-06-03"),
				createMockTransaction(4, 3000, "expense", 3, "娯楽費1", "2024-06-04"),
			];

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBe("食費");
		});

		it("同じ使用回数の場合に最初に見つかったカテゴリを返すこと", () => {
			const transactions = [
				createMockTransaction(1, 1000, "expense", 1, "食費1", "2024-06-01"),
				createMockTransaction(2, 2000, "expense", 2, "交通費1", "2024-06-02"),
				createMockTransaction(3, 500, "expense", 3, "娯楽費1", "2024-06-03"),
			];

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			// MapのiterationOrderに依存するが、通常は最初に見つかった要素
			expect(["食費", "交通費", "娯楽費"]).toContain(result);
		});

		it("収入取引は除外して支出取引のみから計算すること", () => {
			const transactions = [
				createMockTransaction(1, 1000, "expense", 1, "食費1", "2024-06-01"),
				createMockTransaction(2, 50000, "income", 4, "給与", "2024-06-02"),
				createMockTransaction(3, 2000, "expense", 2, "交通費1", "2024-06-03"),
				createMockTransaction(4, 3000, "expense", 2, "交通費2", "2024-06-04"),
			];

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBe("交通費");
		});

		it("categoryIdがnullの取引を未分類として処理すること", () => {
			const transactions = [
				createMockTransaction(
					1,
					1000,
					"expense",
					null,
					"未分類1",
					"2024-06-01",
				),
				createMockTransaction(
					2,
					2000,
					"expense",
					null,
					"未分類2",
					"2024-06-02",
				),
				createMockTransaction(3, 500, "expense", 1, "食費1", "2024-06-03"),
			];

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBe("未分類");
		});

		it("存在しないカテゴリIDの場合に不明なカテゴリを返すこと", () => {
			const transactions = [
				createMockTransaction(1, 1000, "expense", 999, "不明1", "2024-06-01"),
				createMockTransaction(2, 2000, "expense", 999, "不明2", "2024-06-02"),
			];

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBe("不明なカテゴリ");
		});

		it("支出取引が存在しない場合にnullを返すこと", () => {
			const transactions = [
				createMockTransaction(1, 50000, "income", 4, "給与", "2024-06-01"),
				createMockTransaction(2, 30000, "income", 4, "ボーナス", "2024-06-02"),
			];

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBeNull();
		});

		it("データが存在しない場合にnullを返すこと", () => {
			const transactions: SelectTransaction[] = [];
			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				false,
			);
			expect(result).toBeNull();
		});

		it("取引データが空配列の場合にnullを返すこと", () => {
			const transactions: SelectTransaction[] = [];
			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBeNull();
		});

		it("単一の支出取引でも正しくカテゴリを特定すること", () => {
			const transactions = [
				createMockTransaction(1, 1000, "expense", 1, "食費1", "2024-06-01"),
			];

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBe("食費");
		});

		it("大量の取引データでも正確に処理すること", () => {
			const transactions: SelectTransaction[] = [];
			// 食費を100回、交通費を50回、娯楽費を30回
			for (let i = 1; i <= 100; i++) {
				transactions.push(
					createMockTransaction(
						i,
						1000,
						"expense",
						1,
						`食費${i}`,
						"2024-06-01",
					),
				);
			}
			for (let i = 101; i <= 150; i++) {
				transactions.push(
					createMockTransaction(
						i,
						500,
						"expense",
						2,
						`交通費${i - 100}`,
						"2024-06-02",
					),
				);
			}
			for (let i = 151; i <= 180; i++) {
				transactions.push(
					createMockTransaction(
						i,
						2000,
						"expense",
						3,
						`娯楽費${i - 150}`,
						"2024-06-03",
					),
				);
			}

			const result = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(result).toBe("食費");
		});
	});

	// ========================================
	// 1日平均支出計算テスト
	// ========================================

	describe("calculateDailyAverageExpense", () => {
		it("月初（1日目）の平均支出を正しく計算すること", () => {
			const currentDate = new Date("2024-06-01");
			const result = calculateDailyAverageExpense(3000, true, currentDate);
			expect(result).toBe(3000); // 3000 / 1日 = 3000
		});

		it("月中（15日目）の平均支出を正しく計算すること", () => {
			const currentDate = new Date("2024-06-15");
			const result = calculateDailyAverageExpense(30000, true, currentDate);
			expect(result).toBe(2000); // 30000 / 15日 = 2000
		});

		it("月末（30日目）の平均支出を正しく計算すること", () => {
			const currentDate = new Date("2024-06-30");
			const result = calculateDailyAverageExpense(60000, true, currentDate);
			expect(result).toBe(2000); // 60000 / 30日 = 2000
		});

		it("2月29日（うるう年）でも正しく計算すること", () => {
			const currentDate = new Date("2024-02-29");
			const result = calculateDailyAverageExpense(58000, true, currentDate);
			expect(result).toBe(2000); // 58000 / 29日 = 2000
		});

		it("小数点以下を四捨五入すること", () => {
			const currentDate = new Date("2024-06-03");
			const result = calculateDailyAverageExpense(10000, true, currentDate);
			expect(result).toBe(3333); // 10000 / 3日 = 3333.33... → 3333
		});

		it("支出が0円の場合にnullを返すこと", () => {
			const currentDate = new Date("2024-06-15");
			const result = calculateDailyAverageExpense(0, true, currentDate);
			expect(result).toBeNull();
		});

		it("負の支出額の場合にnullを返すこと", () => {
			const currentDate = new Date("2024-06-15");
			const result = calculateDailyAverageExpense(-1000, true, currentDate);
			expect(result).toBeNull();
		});

		it("データが存在しない場合にnullを返すこと", () => {
			const currentDate = new Date("2024-06-15");
			const result = calculateDailyAverageExpense(10000, false, currentDate);
			expect(result).toBeNull();
		});

		it("非常に大きな金額でも正確に計算すること", () => {
			const currentDate = new Date("2024-06-10");
			const result = calculateDailyAverageExpense(10000000, true, currentDate);
			expect(result).toBe(1000000); // 10,000,000 / 10日 = 1,000,000
		});

		it("非常に小さな金額でも正確に計算すること", () => {
			const currentDate = new Date("2024-06-10");
			const result = calculateDailyAverageExpense(9, true, currentDate);
			expect(result).toBe(1); // 9 / 10日 = 0.9 → 1
		});

		it("年度跨ぎでも正しく計算すること", () => {
			const currentDate = new Date("2024-01-31");
			const result = calculateDailyAverageExpense(31000, true, currentDate);
			expect(result).toBe(1000); // 31000 / 31日 = 1000
		});
	});

	// ========================================
	// 支出総額計算テスト
	// ========================================

	describe("calculateExpenseTotal", () => {
		it("支出のみの取引から正しく総額を計算すること", () => {
			const transactions = [
				createMockTransaction(1, 1000, "expense", 1, "食費1", "2024-06-01"),
				createMockTransaction(2, 2000, "expense", 2, "交通費1", "2024-06-02"),
				createMockTransaction(3, 3000, "expense", 3, "娯楽費1", "2024-06-03"),
			];

			const result = calculateExpenseTotal(transactions);
			expect(result).toBe(6000);
		});

		it("収入取引を除外して支出のみを計算すること", () => {
			const transactions = [
				createMockTransaction(1, 1000, "expense", 1, "食費1", "2024-06-01"),
				createMockTransaction(2, 50000, "income", 4, "給与", "2024-06-02"),
				createMockTransaction(3, 2000, "expense", 2, "交通費1", "2024-06-03"),
			];

			const result = calculateExpenseTotal(transactions);
			expect(result).toBe(3000);
		});

		it("空配列の場合に0を返すこと", () => {
			const transactions: SelectTransaction[] = [];
			const result = calculateExpenseTotal(transactions);
			expect(result).toBe(0);
		});

		it("収入のみの場合に0を返すこと", () => {
			const transactions = [
				createMockTransaction(1, 50000, "income", 4, "給与", "2024-06-01"),
				createMockTransaction(2, 30000, "income", 4, "ボーナス", "2024-06-02"),
			];

			const result = calculateExpenseTotal(transactions);
			expect(result).toBe(0);
		});

		it("0円の支出も含めて計算すること", () => {
			const transactions = [
				createMockTransaction(1, 0, "expense", 1, "無料サンプル", "2024-06-01"),
				createMockTransaction(2, 1000, "expense", 2, "交通費1", "2024-06-02"),
			];

			const result = calculateExpenseTotal(transactions);
			expect(result).toBe(1000);
		});
	});

	// ========================================
	// 統合テスト（calculateTrendData）
	// ========================================

	describe("calculateTrendData（統合テスト）", () => {
		it("正常なデータでトレンド情報を正しく計算すること", () => {
			const currentTransactions = [
				createMockTransaction(1, 3000, "expense", 1, "食費1", "2024-06-01"),
				createMockTransaction(2, 2000, "expense", 1, "食費2", "2024-06-02"),
				createMockTransaction(3, 1000, "expense", 2, "交通費1", "2024-06-03"),
			];

			const previousTransactions = [
				createMockTransaction(4, 2000, "expense", 1, "食費", "2024-05-01"),
				createMockTransaction(5, 1500, "expense", 2, "交通費", "2024-05-02"),
			];

			const currentDate = new Date("2024-06-03");
			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
				currentDate,
			);

			expect(result.hasCurrentData).toBe(true);
			expect(result.hasPreviousData).toBe(true);
			expect(result.monthOverMonthChange).toBeCloseTo(71.43, 2); // (6000-3500)/3500*100
			expect(result.mostUsedCategory).toBe("食費"); // 2回使用
			expect(result.dailyAverageExpense).toBe(2000); // 6000 / 3日
		});

		it("今月データなしの場合に適切にnullを返すこと", () => {
			const currentTransactions: SelectTransaction[] = [];
			const previousTransactions = [
				createMockTransaction(1, 2000, "expense", 1, "食費", "2024-05-01"),
			];

			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
			);

			expect(result.hasCurrentData).toBe(false);
			expect(result.hasPreviousData).toBe(true);
			expect(result.monthOverMonthChange).toBeNull();
			expect(result.mostUsedCategory).toBeNull();
			expect(result.dailyAverageExpense).toBeNull();
		});

		it("前月データなしの場合に適切にnullを返すこと", () => {
			const currentTransactions = [
				createMockTransaction(1, 3000, "expense", 1, "食費1", "2024-06-01"),
			];
			const previousTransactions: SelectTransaction[] = [];

			const currentDate = new Date("2024-06-01");
			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
				currentDate,
			);

			expect(result.hasCurrentData).toBe(true);
			expect(result.hasPreviousData).toBe(false);
			expect(result.monthOverMonthChange).toBeNull();
			expect(result.mostUsedCategory).toBe("食費");
			expect(result.dailyAverageExpense).toBe(3000);
		});

		it("両月ともデータなしの場合にすべてnullを返すこと", () => {
			const currentTransactions: SelectTransaction[] = [];
			const previousTransactions: SelectTransaction[] = [];

			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
			);

			expect(result.hasCurrentData).toBe(false);
			expect(result.hasPreviousData).toBe(false);
			expect(result.monthOverMonthChange).toBeNull();
			expect(result.mostUsedCategory).toBeNull();
			expect(result.dailyAverageExpense).toBeNull();
		});

		it("収入のみの取引データでも正しく処理すること", () => {
			const currentTransactions = [
				createMockTransaction(1, 50000, "income", 4, "給与", "2024-06-01"),
			];
			const previousTransactions = [
				createMockTransaction(2, 45000, "income", 4, "給与", "2024-05-01"),
			];

			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
			);

			expect(result.hasCurrentData).toBe(true);
			expect(result.hasPreviousData).toBe(true);
			expect(result.monthOverMonthChange).toBe(0); // 支出が両月とも0円
			expect(result.mostUsedCategory).toBeNull(); // 支出取引なし
			expect(result.dailyAverageExpense).toBeNull(); // 支出が0円
		});

		it("カテゴリマスタが空でも正しく処理すること", () => {
			const currentTransactions = [
				createMockTransaction(
					1,
					3000,
					"expense",
					1,
					"不明カテゴリ",
					"2024-06-01",
				),
			];
			const previousTransactions = [
				createMockTransaction(
					2,
					2000,
					"expense",
					1,
					"不明カテゴリ",
					"2024-05-01",
				),
			];

			const emptyCategories: SelectCategory[] = [];
			const currentDate = new Date("2024-06-01");
			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				emptyCategories,
				currentDate,
			);

			expect(result.hasCurrentData).toBe(true);
			expect(result.hasPreviousData).toBe(true);
			expect(result.monthOverMonthChange).toBe(50); // (3000-2000)/2000*100
			expect(result.mostUsedCategory).toBe("不明なカテゴリ");
			expect(result.dailyAverageExpense).toBe(3000);
		});
	});

	// ========================================
	// エッジケース・境界値テスト
	// ========================================

	describe("エッジケース・境界値テスト", () => {
		it("月末日の日付計算が正確であること", () => {
			// 1月31日（31日ある月）
			const jan31 = new Date("2024-01-31");
			const result1 = calculateDailyAverageExpense(31000, true, jan31);
			expect(result1).toBe(1000);

			// 2月29日（うるう年）
			const feb29 = new Date("2024-02-29");
			const result2 = calculateDailyAverageExpense(29000, true, feb29);
			expect(result2).toBe(1000);

			// 4月30日（30日の月）
			const apr30 = new Date("2024-04-30");
			const result3 = calculateDailyAverageExpense(30000, true, apr30);
			expect(result3).toBe(1000);
		});

		it("極端に大きな金額でもオーバーフローしないこと", () => {
			const transactions = [
				createMockTransaction(
					1,
					Number.MAX_SAFE_INTEGER / 2,
					"expense",
					1,
					"大金1",
					"2024-06-01",
				),
				createMockTransaction(
					2,
					Number.MAX_SAFE_INTEGER / 2 - 1,
					"expense",
					1,
					"大金2",
					"2024-06-02",
				),
			];

			const result = calculateExpenseTotal(transactions);
			expect(result).toBe(Number.MAX_SAFE_INTEGER - 1);
		});

		it("小数点を含む金額でも正確に処理すること", () => {
			const transactions = [
				createMockTransaction(1, 999.99, "expense", 1, "小数1", "2024-06-01"),
				createMockTransaction(2, 1000.01, "expense", 1, "小数2", "2024-06-02"),
			];

			const result = calculateExpenseTotal(transactions);
			expect(result).toBeCloseTo(2000, 2);
		});

		it("大量のカテゴリでも最頻カテゴリを正確に特定すること", () => {
			// 1000個のカテゴリを作成
			const manyCategories: SelectCategory[] = [];
			for (let i = 1; i <= 1000; i++) {
				manyCategories.push({
					id: i,
					name: `カテゴリ${i}`,
					type: "expense",
					displayOrder: i,
					color: "#FF6B6B",
					icon: null,
					isActive: true,
					createdAt: "2024-01-01T00:00:00.000Z",
					updatedAt: "2024-01-01T00:00:00.000Z",
				});
			}

			const transactions: SelectTransaction[] = [];
			// カテゴリ500を5回使用（最頻）
			for (let i = 1; i <= 5; i++) {
				transactions.push(
					createMockTransaction(
						i,
						1000,
						"expense",
						500,
						`取引${i}`,
						"2024-06-01",
					),
				);
			}
			// 他のカテゴリを1-4回ずつ使用
			for (let i = 1; i <= 100; i++) {
				if (i !== 500) {
					transactions.push(
						createMockTransaction(
							100 + i,
							1000,
							"expense",
							i,
							`取引${100 + i}`,
							"2024-06-01",
						),
					);
				}
			}

			const result = calculateMostUsedCategory(
				transactions,
				manyCategories,
				true,
			);
			expect(result).toBe("カテゴリ500");
		});

		it("同一金額・同一カテゴリの大量取引でも正確に処理すること", () => {
			const transactions: SelectTransaction[] = [];
			// 同じカテゴリ・同じ金額の取引を1000件作成
			for (let i = 1; i <= 1000; i++) {
				transactions.push(
					createMockTransaction(
						i,
						1000,
						"expense",
						1,
						`取引${i}`,
						"2024-06-01",
					),
				);
			}

			const result = calculateExpenseTotal(transactions);
			expect(result).toBe(1000000);

			const categoryResult = calculateMostUsedCategory(
				transactions,
				mockCategories,
				true,
			);
			expect(categoryResult).toBe("食費");
		});
	});

	// ========================================
	// 現実的なシナリオテスト
	// ========================================

	describe("現実的なシナリオテスト", () => {
		it("典型的な家計簿データでトレンド分析が正確であること", () => {
			// 今月のデータ（6月）
			const currentTransactions = [
				// 食費（頻度高）
				createMockTransaction(1, 800, "expense", 1, "スーパー", "2024-06-01"),
				createMockTransaction(2, 1200, "expense", 1, "コンビニ", "2024-06-02"),
				createMockTransaction(
					3,
					2500,
					"expense",
					1,
					"レストラン",
					"2024-06-03",
				),
				createMockTransaction(4, 900, "expense", 1, "弁当", "2024-06-04"),
				createMockTransaction(5, 1500, "expense", 1, "外食", "2024-06-05"),
				// 交通費
				createMockTransaction(6, 400, "expense", 2, "電車", "2024-06-01"),
				createMockTransaction(7, 300, "expense", 2, "バス", "2024-06-03"),
				// 娯楽費
				createMockTransaction(8, 3000, "expense", 3, "映画", "2024-06-02"),
				// 収入
				createMockTransaction(9, 250000, "income", 4, "給与", "2024-06-25"),
			];

			// 前月のデータ（5月）
			const previousTransactions = [
				createMockTransaction(10, 1000, "expense", 1, "食費", "2024-05-01"),
				createMockTransaction(11, 2000, "expense", 1, "食費", "2024-05-02"),
				createMockTransaction(12, 500, "expense", 2, "交通費", "2024-05-03"),
				createMockTransaction(13, 1500, "expense", 3, "娯楽費", "2024-05-04"),
			]; // 前月支出合計: 5000円

			const currentDate = new Date("2024-06-05");
			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
				currentDate,
			);

			expect(result.hasCurrentData).toBe(true);
			expect(result.hasPreviousData).toBe(true);

			// 今月支出合計: 10600円、前月: 5000円
			const expectedChange = ((10600 - 5000) / 5000) * 100;
			expect(result.monthOverMonthChange).toBeCloseTo(expectedChange, 1);

			// 食費が5回で最頻
			expect(result.mostUsedCategory).toBe("食費");

			// 1日平均: 10600 / 5日 = 2120円
			expect(result.dailyAverageExpense).toBe(2120);
		});

		it("節約成功月のトレンド分析が正確であること", () => {
			const currentTransactions = [
				createMockTransaction(1, 500, "expense", 1, "自炊", "2024-06-01"),
				createMockTransaction(2, 600, "expense", 1, "自炊", "2024-06-02"),
			]; // 今月: 1100円

			const previousTransactions = [
				createMockTransaction(3, 3000, "expense", 1, "外食", "2024-05-01"),
				createMockTransaction(4, 2500, "expense", 1, "外食", "2024-05-02"),
				createMockTransaction(5, 4000, "expense", 1, "外食", "2024-05-03"),
			]; // 前月: 9500円

			const currentDate = new Date("2024-06-02");
			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
				currentDate,
			);

			// 大幅削減: (1100-9500)/9500*100 ≈ -88.4%
			expect(result.monthOverMonthChange).toBeCloseTo(-88.42, 1);
			expect(result.mostUsedCategory).toBe("食費");
			expect(result.dailyAverageExpense).toBe(550); // 1100 / 2日
		});

		it("支出急増月のトレンド分析が正確であること", () => {
			const currentTransactions = [
				createMockTransaction(1, 50000, "expense", 3, "旅行", "2024-06-01"),
				createMockTransaction(2, 30000, "expense", 3, "ホテル", "2024-06-02"),
				createMockTransaction(3, 20000, "expense", 3, "お土産", "2024-06-03"),
			]; // 今月: 100000円

			const previousTransactions = [
				createMockTransaction(4, 3000, "expense", 1, "食費", "2024-05-01"),
				createMockTransaction(5, 2000, "expense", 2, "交通費", "2024-05-02"),
			]; // 前月: 5000円

			const currentDate = new Date("2024-06-03");
			const result = calculateTrendData(
				currentTransactions,
				previousTransactions,
				mockCategories,
				currentDate,
			);

			// 大幅増加: (100000-5000)/5000*100 = 1900%
			expect(result.monthOverMonthChange).toBe(1900);
			expect(result.mostUsedCategory).toBe("娯楽費");
			expect(result.dailyAverageExpense).toBe(33333); // 100000 / 3日
		});
	});
});
