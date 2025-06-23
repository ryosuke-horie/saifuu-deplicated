import type { SelectCategory } from "../../db/schema";

/**
 * 固定の支出カテゴリリスト
 *
 * 設計意図:
 * - Issue #120に対応し、支出登録時に固定のカテゴリリストを表示
 * - 食費・交通費を最優先で表示（displayOrder: 1, 2）
 * - APIに依存せず即座に表示可能
 * - defaultCategories.tsのデータ構造に準拠
 *
 * 代替案: APIから取得する動的実装も可能だが、
 * ユーザー体験向上のため固定リストを採用
 */
export const FIXED_EXPENSE_CATEGORIES: Partial<SelectCategory>[] = [
	{
		id: 1,
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		icon: "utensils",
		displayOrder: 1,
		isActive: true,
	},
	{
		id: 2,
		name: "交通費",
		type: "expense",
		color: "#4ECDC4",
		icon: "car",
		displayOrder: 2,
		isActive: true,
	},
	{
		id: 3,
		name: "光熱費",
		type: "expense",
		color: "#DDA0DD",
		icon: "zap",
		displayOrder: 3,
		isActive: true,
	},
	{
		id: 4,
		name: "通信費",
		type: "expense",
		color: "#FFEAA7",
		icon: "smartphone",
		displayOrder: 4,
		isActive: true,
	},
	{
		id: 5,
		name: "娯楽費",
		type: "expense",
		color: "#F7DC6F",
		icon: "game-controller-01",
		displayOrder: 5,
		isActive: true,
	},
	{
		id: 6,
		name: "医療費",
		type: "expense",
		color: "#96CEB4",
		icon: "heart",
		displayOrder: 6,
		isActive: true,
	},
	{
		id: 7,
		name: "日用品",
		type: "expense",
		color: "#45B7D1",
		icon: "shopping-cart",
		displayOrder: 7,
		isActive: true,
	},
	{
		id: 8,
		name: "その他",
		type: "expense",
		color: "#D5DBDB",
		icon: "more-horizontal",
		displayOrder: 8,
		isActive: true,
	},
];

/**
 * 固定の収入カテゴリリスト
 *
 * 将来的な拡張用に収入カテゴリも定義
 * 現在のIssue #120では支出のみが対象だが、
 * 一貫性のため収入カテゴリも固定化
 */
export const FIXED_INCOME_CATEGORIES: Partial<SelectCategory>[] = [
	{
		id: 9,
		name: "給与",
		type: "income",
		color: "#58D68D",
		icon: "briefcase",
		displayOrder: 1,
		isActive: true,
	},
	{
		id: 10,
		name: "副業",
		type: "income",
		color: "#1890FF",
		icon: "laptop",
		displayOrder: 2,
		isActive: true,
	},
	{
		id: 11,
		name: "投資",
		type: "income",
		color: "#722ED1",
		icon: "trending-up",
		displayOrder: 3,
		isActive: true,
	},
	{
		id: 12,
		name: "その他",
		type: "income",
		color: "#13C2C2",
		icon: "plus-circle",
		displayOrder: 4,
		isActive: true,
	},
];
