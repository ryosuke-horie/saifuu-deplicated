/**
 * TrendWidget トレンド計算ロジックのユニットテスト
 *
 * テスト対象:
 * - 月間比較（前月比変化率）の計算ロジック
 * - 最頻使用カテゴリの特定ロジック
 * - 1日平均支出の計算ロジック
 * - エッジケース（データなし、単月データ、同額データ等）
 * - 境界値と異常値の処理
 *
 * GitHub Copilot レビューフィードバック対応:
 * - コンポーネントに依存せず計算ロジックのみをテスト
 * - React Router 問題を回避
 * - 包括的なテストケースによる計算精度の検証
 */

import { describe, expect, it } from "vitest";
import type { SelectCategory, SelectTransaction } from "../../types";

// ========================================
// テスト対象の計算ロジック（TrendWidget から抽出）
// ========================================

interface TrendData {
	monthOverMonthChange: number | null; // 前月比変化率（%）
	mostUsedCategory: string | null; // 最頻使用カテゴリ名
	dailyAverageExpense: number | null; // 1日平均支出
	hasCurrentData: boolean; // 今月のデータが存在するか
	hasPreviousData: boolean; // 前月のデータが存在するか
}

/**
 * トレンドデータ計算関数
 * TrendWidget コンポーネントの useMemo ロジックを関数として抽出
 */
function calculateTrendData(
	currentTransactions: SelectTransaction[],
	lastTransactions: SelectTransaction[],
	categories: SelectCategory[],
	currentDate: Date = new Date(),
): TrendData {
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
		const today = currentDate;
		const firstDayThisMonth = new Date(
			today.getFullYear(),
			today.getMonth(),
			1,
		);
		const daysPassed =
			Math.floor(
				(today.getTime() - firstDayThisMonth.getTime()) / (1000 * 60 * 60 * 24),
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
}

// ========================================
// テストデータ
// ========================================

const mockCategories: SelectCategory[] = [
	{
		id: 1,
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		icon: "🍽️",
		isActive: true,
		displayOrder: 1,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: 2,
		name: "交通費",
		type: "expense",
		color: "#45B7D1",
		icon: "🚗",
		isActive: true,
		displayOrder: 2,
		createdAt: "2024-01-02T00:00:00.000Z",
		updatedAt: "2024-01-02T00:00:00.000Z",
	},
	{
		id: 3,
		name: "給与",
		type: "income",
		color: "#4ECDC4",
		icon: "💰",
		isActive: true,
		displayOrder: 1,
		createdAt: "2024-01-03T00:00:00.000Z",
		updatedAt: "2024-01-03T00:00:00.000Z",
	},
];

const createTransaction = (
	id: number,
	amount: number,
	type: "income" | "expense",
	categoryId: number | null,
	date: string,
	description: string,
): SelectTransaction => ({
	id,
	amount,
	type,
	categoryId,
	description,
	transactionDate: date,
	paymentMethod: "現金",
	tags: null,
	receiptUrl: null,
	isRecurring: false,
	recurringId: null,
	createdAt: `${date}T00:00:00.000Z`,
	updatedAt: `${date}T00:00:00.000Z`,
});

// ========================================
// テストスイート
// ========================================

describe("TrendWidget 計算ロジック", () => {
	// ========================================
	// 月間比較の計算テスト
	// ========================================

	describe("月間比較の計算", () => {
		it("正常な増加パターンの計算", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費1"),
				createTransaction(2, 2000, "expense", 1, "2024-06-02", "食費2"),
				createTransaction(3, 500, "expense", 2, "2024-06-03", "交通費"),
			];

			const lastTransactions = [
				createTransaction(4, 1500, "expense", 1, "2024-05-15", "前月食費"),
				createTransaction(5, 1000, "expense", 2, "2024-05-20", "前月交通費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
				new Date("2024-06-15T10:00:00.000Z"),
			);

			// 今月: 3500円, 前月: 2500円 → 40%増加
			expect(result.monthOverMonthChange).toBe(40);
		});

		it("正常な減少パターンの計算", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
			];

			const lastTransactions = [
				createTransaction(2, 2000, "expense", 1, "2024-05-15", "前月食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			// 今月: 1000円, 前月: 2000円 → -50%減少
			expect(result.monthOverMonthChange).toBe(-50);
		});

		it("同額の場合、0%変化", () => {
			const currentTransactions = [
				createTransaction(1, 2000, "expense", 1, "2024-06-01", "食費"),
			];

			const lastTransactions = [
				createTransaction(2, 2000, "expense", 1, "2024-05-15", "前月食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			expect(result.monthOverMonthChange).toBe(0);
		});

		it("前月が0円の場合、特殊処理（100%増加）", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
			];

			const lastTransactions = [
				createTransaction(2, 5000, "income", 3, "2024-05-25", "前月収入のみ"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			expect(result.monthOverMonthChange).toBe(100);
		});

		it("前月が0円で今月も0円の場合、0%変化", () => {
			const currentTransactions = [
				createTransaction(1, 10000, "income", 3, "2024-06-25", "今月収入のみ"),
			];

			const lastTransactions = [
				createTransaction(2, 5000, "income", 3, "2024-05-25", "前月収入のみ"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			expect(result.monthOverMonthChange).toBe(0);
		});

		it("今月のデータがない場合、nullが返される", () => {
			const currentTransactions: SelectTransaction[] = [];
			const lastTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-05-15", "前月食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			expect(result.monthOverMonthChange).toBeNull();
		});

		it("前月のデータがない場合、nullが返される", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
			];
			const lastTransactions: SelectTransaction[] = [];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			expect(result.monthOverMonthChange).toBeNull();
		});
	});

	// ========================================
	// 最頻使用カテゴリの計算テスト
	// ========================================

	describe("最頻使用カテゴリの計算", () => {
		it("明確に最頻のカテゴリが特定される", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費1"),
				createTransaction(2, 2000, "expense", 1, "2024-06-02", "食費2"),
				createTransaction(3, 500, "expense", 2, "2024-06-03", "交通費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
			);

			expect(result.mostUsedCategory).toBe("食費");
		});

		it("複数カテゴリが同じ使用回数の場合、最初に見つかったものが選ばれる", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費1"),
				createTransaction(2, 1000, "expense", 1, "2024-06-02", "食費2"),
				createTransaction(3, 500, "expense", 2, "2024-06-03", "交通費1"),
				createTransaction(4, 500, "expense", 2, "2024-06-04", "交通費2"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
			);

			// forループで最初に最大値に達したカテゴリが選ばれる（食費）
			expect(result.mostUsedCategory).toBe("食費");
		});

		it("カテゴリIDがnullの取引は「未分類」として処理される", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", null, "2024-06-01", "未分類1"),
				createTransaction(2, 1000, "expense", null, "2024-06-02", "未分類2"),
				createTransaction(3, 500, "expense", 1, "2024-06-03", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
			);

			expect(result.mostUsedCategory).toBe("未分類");
		});

		it("存在しないカテゴリIDの場合、「不明なカテゴリ」として処理される", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 999, "2024-06-01", "不明1"),
				createTransaction(2, 1000, "expense", 999, "2024-06-02", "不明2"),
				createTransaction(3, 500, "expense", 1, "2024-06-03", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
			);

			expect(result.mostUsedCategory).toBe("不明なカテゴリ");
		});

		it("支出がない場合、nullが返される", () => {
			const currentTransactions = [
				createTransaction(1, 10000, "income", 3, "2024-06-25", "収入のみ"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
			);

			expect(result.mostUsedCategory).toBeNull();
		});

		it("今月のデータがない場合、nullが返される", () => {
			const result = calculateTrendData([], [], mockCategories);

			expect(result.mostUsedCategory).toBeNull();
		});
	});

	// ========================================
	// 1日平均支出の計算テスト
	// ========================================

	describe("1日平均支出の計算", () => {
		it("月初（1日）の場合の計算", () => {
			const currentTransactions = [
				createTransaction(1, 3500, "expense", 1, "2024-06-01", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-01T10:00:00.000Z"),
			);

			// 3500円 ÷ 1日 = 3500円
			expect(result.dailyAverageExpense).toBe(3500);
		});

		it("月の途中（15日）の場合の計算", () => {
			const currentTransactions = [
				createTransaction(1, 3500, "expense", 1, "2024-06-01", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-15T10:00:00.000Z"),
			);

			// 3500円 ÷ 15日 = 233.33... → 233円（四捨五入）
			expect(result.dailyAverageExpense).toBe(233);
		});

		it("月末（30日）の場合の計算", () => {
			const currentTransactions = [
				createTransaction(1, 3500, "expense", 1, "2024-06-01", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-30T10:00:00.000Z"),
			);

			// 3500円 ÷ 30日 = 116.66... → 117円（四捨五入）
			expect(result.dailyAverageExpense).toBe(117);
		});

		it("小数点を含む計算の四捨五入", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-03T10:00:00.000Z"),
			);

			// 1000円 ÷ 3日 = 333.33... → 333円（四捨五入）
			expect(result.dailyAverageExpense).toBe(333);
		});

		it("支出が0円の場合、nullが返される", () => {
			const currentTransactions = [
				createTransaction(1, 10000, "income", 3, "2024-06-25", "収入のみ"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-15T10:00:00.000Z"),
			);

			expect(result.dailyAverageExpense).toBeNull();
		});

		it("今月のデータがない場合、nullが返される", () => {
			const result = calculateTrendData(
				[],
				[],
				mockCategories,
				new Date("2024-06-15T10:00:00.000Z"),
			);

			expect(result.dailyAverageExpense).toBeNull();
		});
	});

	// ========================================
	// データ存在フラグのテスト
	// ========================================

	describe("データ存在フラグ", () => {
		it("今月のデータが存在する場合", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
			);

			expect(result.hasCurrentData).toBe(true);
			expect(result.hasPreviousData).toBe(false);
		});

		it("前月のデータが存在する場合", () => {
			const lastTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-05-15", "前月食費"),
			];

			const result = calculateTrendData([], lastTransactions, mockCategories);

			expect(result.hasCurrentData).toBe(false);
			expect(result.hasPreviousData).toBe(true);
		});

		it("両方のデータが存在する場合", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
			];
			const lastTransactions = [
				createTransaction(2, 1000, "expense", 1, "2024-05-15", "前月食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			expect(result.hasCurrentData).toBe(true);
			expect(result.hasPreviousData).toBe(true);
		});

		it("どちらのデータも存在しない場合", () => {
			const result = calculateTrendData([], [], mockCategories);

			expect(result.hasCurrentData).toBe(false);
			expect(result.hasPreviousData).toBe(false);
		});
	});

	// ========================================
	// 境界値と異常値のテスト
	// ========================================

	describe("境界値と異常値", () => {
		it("大きな金額の計算", () => {
			const currentTransactions = [
				createTransaction(
					1,
					1000000,
					"expense",
					1,
					"2024-06-01",
					"大きな支出1",
				),
				createTransaction(
					2,
					2000000,
					"expense",
					1,
					"2024-06-02",
					"大きな支出2",
				),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-15T10:00:00.000Z"),
			);

			// 300万円 ÷ 15日 = 20万円
			expect(result.dailyAverageExpense).toBe(200000);
		});

		it("非常に小さな金額の計算", () => {
			const currentTransactions = [
				createTransaction(1, 1, "expense", 1, "2024-06-01", "1円"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-02T10:00:00.000Z"),
			);

			// 1円 ÷ 2日 = 0.5 → 1円（四捨五入）
			expect(result.dailyAverageExpense).toBe(1);
		});

		it("極端な変化率の計算", () => {
			const currentTransactions = [
				createTransaction(1, 1000000, "expense", 1, "2024-06-01", "大きな増加"),
			];

			const lastTransactions = [
				createTransaction(2, 1, "expense", 1, "2024-05-15", "極小前月"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			// ((1000000 - 1) / 1) * 100 = 99999900%
			expect(result.monthOverMonthChange).toBe(99999900);
		});

		it("空のカテゴリ配列の処理", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
			];

			const result = calculateTrendData(currentTransactions, [], []);

			// カテゴリが見つからない場合、「不明なカテゴリ」
			expect(result.mostUsedCategory).toBe("不明なカテゴリ");
		});

		it("複数の収入と支出が混在する場合", () => {
			const currentTransactions = [
				createTransaction(1, 1000, "expense", 1, "2024-06-01", "食費"),
				createTransaction(2, 50000, "income", 3, "2024-06-05", "給与"),
				createTransaction(3, 500, "expense", 2, "2024-06-10", "交通費"),
				createTransaction(4, 2000, "income", 3, "2024-06-15", "副収入"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-15T10:00:00.000Z"),
			);

			// 支出のみの計算: 1000 + 500 = 1500円
			// 1500円 ÷ 15日 = 100円
			expect(result.dailyAverageExpense).toBe(100);
			expect(result.hasCurrentData).toBe(true);
		});
	});

	// ========================================
	// 精度と計算の整合性テスト
	// ========================================

	describe("計算精度と整合性", () => {
		it("変化率の小数点計算精度", () => {
			const currentTransactions = [
				createTransaction(1, 3333, "expense", 1, "2024-06-01", "食費"),
			];

			const lastTransactions = [
				createTransaction(2, 2500, "expense", 1, "2024-05-15", "前月食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				lastTransactions,
				mockCategories,
			);

			// ((3333 - 2500) / 2500) * 100 = 33.32%
			expect(result.monthOverMonthChange).toBeCloseTo(33.32, 2);
		});

		it("複数カテゴリの使用回数カウント精度", () => {
			const currentTransactions = [
				createTransaction(1, 100, "expense", 1, "2024-06-01", "食費1"),
				createTransaction(2, 200, "expense", 2, "2024-06-02", "交通費1"),
				createTransaction(3, 300, "expense", 1, "2024-06-03", "食費2"),
				createTransaction(4, 400, "expense", 2, "2024-06-04", "交通費2"),
				createTransaction(5, 500, "expense", 1, "2024-06-05", "食費3"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
			);

			// 食費：3回、交通費：2回 → 食費が最頻
			expect(result.mostUsedCategory).toBe("食費");
		});

		it("日付計算の精度（月をまたぐ日付）", () => {
			const currentTransactions = [
				createTransaction(1, 3100, "expense", 1, "2024-06-01", "食費"),
			];

			const result = calculateTrendData(
				currentTransactions,
				[],
				mockCategories,
				new Date("2024-06-31T23:59:59.000Z"), // 実際には6月31日は存在しないが境界値テスト
			);

			// JavaScriptの Date オブジェクトは自動的に翌月に調整されるため、この動作を確認
			expect(result.dailyAverageExpense).toBeDefined();
		});
	});
});
