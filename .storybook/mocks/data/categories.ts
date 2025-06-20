/**
 * カテゴリマスターデータのモック定義
 *
 * 設計方針:
 * - 実際のDBスキーマに準拠したデータ構造
 * - 収入・支出の代表的なカテゴリを網羅
 * - UIテスト用に色やアイコン情報も含む
 * - 表示順序も設定済み
 */

export const mockCategories = [
	// 収入カテゴリ
	{
		id: 1,
		name: "給与",
		type: "income" as const,
		color: "#10B981",
		icon: "💰",
		displayOrder: 1,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 2,
		name: "副業",
		type: "income" as const,
		color: "#059669",
		icon: "💼",
		displayOrder: 2,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 3,
		name: "投資",
		type: "income" as const,
		color: "#047857",
		icon: "📈",
		displayOrder: 3,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 4,
		name: "その他収入",
		type: "income" as const,
		color: "#065F46",
		icon: "💵",
		displayOrder: 4,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},

	// 支出カテゴリ
	{
		id: 5,
		name: "食費",
		type: "expense" as const,
		color: "#EF4444",
		icon: "🍽️",
		displayOrder: 5,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 6,
		name: "住居費",
		type: "expense" as const,
		color: "#DC2626",
		icon: "🏠",
		displayOrder: 6,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 7,
		name: "交通費",
		type: "expense" as const,
		color: "#B91C1C",
		icon: "🚊",
		displayOrder: 7,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 8,
		name: "光熱費",
		type: "expense" as const,
		color: "#991B1B",
		icon: "⚡",
		displayOrder: 8,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 9,
		name: "通信費",
		type: "expense" as const,
		color: "#7F1D1D",
		icon: "📱",
		displayOrder: 9,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 10,
		name: "医療費",
		type: "expense" as const,
		color: "#3B82F6",
		icon: "🏥",
		displayOrder: 10,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 11,
		name: "娯楽費",
		type: "expense" as const,
		color: "#8B5CF6",
		icon: "🎮",
		displayOrder: 11,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 12,
		name: "被服費",
		type: "expense" as const,
		color: "#EC4899",
		icon: "👕",
		displayOrder: 12,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 13,
		name: "教育費",
		type: "expense" as const,
		color: "#F59E0B",
		icon: "📚",
		displayOrder: 13,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 14,
		name: "日用品",
		type: "expense" as const,
		color: "#10B981",
		icon: "🧴",
		displayOrder: 14,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 15,
		name: "その他支出",
		type: "expense" as const,
		color: "#6B7280",
		icon: "📦",
		displayOrder: 15,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// 収入カテゴリのみ
export const mockIncomeCategories = mockCategories.filter(
	(category) => category.type === "income",
);

// 支出カテゴリのみ
export const mockExpenseCategories = mockCategories.filter(
	(category) => category.type === "expense",
);

// 無効化されたカテゴリを含むデータセット（テスト用）
export const mockCategoriesWithInactive = [
	...mockCategories,
	{
		id: 16,
		name: "廃止カテゴリ",
		type: "expense" as const,
		color: "#9CA3AF",
		icon: "🚫",
		displayOrder: 16,
		isActive: false,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// 大量データセット（100個のカテゴリ）
export const generateLargeCategoryDataset = () => {
	const largeDataset = [...mockCategories];

	for (let i = 17; i <= 100; i++) {
		const isIncome = Math.random() < 0.3; // 30%の確率で収入
		largeDataset.push({
			id: i,
			name: `${isIncome ? "収入" : "支出"}カテゴリ${i}`,
			type: isIncome ? ("income" as const) : ("expense" as const),
			color: `#${Math.floor(Math.random() * 16777215)
				.toString(16)
				.padStart(6, "0")}`,
			icon: isIncome ? "💰" : "💳",
			displayOrder: i,
			isActive: Math.random() > 0.1, // 10%の確率で非アクティブ
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		});
	}

	return largeDataset;
};

// APIレスポンス形式でのラップ
export const mockCategoriesApiResponse = {
	success: true,
	data: mockCategories,
	count: mockCategories.length,
};

export const mockIncomeCategoriesApiResponse = {
	success: true,
	data: mockIncomeCategories,
	count: mockIncomeCategories.length,
};

export const mockExpenseCategoriesApiResponse = {
	success: true,
	data: mockExpenseCategories,
	count: mockExpenseCategories.length,
};

// エラーレスポンス
export const mockCategoryErrorResponse = {
	error: "カテゴリの取得に失敗しました",
	details: "データベース接続エラーが発生しました",
};

// 個別カテゴリ取得用
export const getCategoryById = (id: number) => {
	const category = mockCategories.find((cat) => cat.id === id);
	if (!category) {
		return {
			error: "カテゴリが見つかりません",
			details: `ID: ${id} のカテゴリは存在しません`,
		};
	}

	return {
		success: true,
		data: category,
	};
};
