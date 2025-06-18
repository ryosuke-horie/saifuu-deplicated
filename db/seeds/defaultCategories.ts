import { and, eq } from "drizzle-orm";
import type { Database } from "../connection";
import { categories } from "../schema";
import type { InsertCategory } from "../schema";

/**
 * デフォルトカテゴリシーダー
 *
 * 設計意図:
 * - Issue #12で指定されたデフォルトカテゴリを提供
 * - 重複チェック機能により安全に実行可能
 * - カテゴリには適切な色とアイコンを設定
 * - displayOrderでUI表示順序を制御
 *
 * 代替案: SQLファイルでのシード実行も検討したが、
 * TypeScriptによる型安全性と重複チェック機能を優先
 */

/**
 * デフォルト支出カテゴリの定義
 * UI表示順序とビジュアル設計を考慮した配色・アイコン選択
 */
const DEFAULT_EXPENSE_CATEGORIES: Omit<
	InsertCategory,
	"id" | "createdAt" | "updatedAt"
>[] = [
	{
		name: "食費",
		type: "expense",
		color: "#FF6B6B",
		icon: "utensils",
		displayOrder: 1,
		isActive: true,
	},
	{
		name: "交通費",
		type: "expense",
		color: "#4ECDC4",
		icon: "car",
		displayOrder: 2,
		isActive: true,
	},
	{
		name: "光熱費",
		type: "expense",
		color: "#DDA0DD",
		icon: "zap",
		displayOrder: 3,
		isActive: true,
	},
	{
		name: "通信費",
		type: "expense",
		color: "#FFEAA7",
		icon: "smartphone",
		displayOrder: 4,
		isActive: true,
	},
	{
		name: "娯楽費",
		type: "expense",
		color: "#F7DC6F",
		icon: "game-controller-01",
		displayOrder: 5,
		isActive: true,
	},
	{
		name: "医療費",
		type: "expense",
		color: "#96CEB4",
		icon: "heart",
		displayOrder: 6,
		isActive: true,
	},
	{
		name: "日用品",
		type: "expense",
		color: "#45B7D1",
		icon: "shopping-cart",
		displayOrder: 7,
		isActive: true,
	},
	{
		name: "その他",
		type: "expense",
		color: "#D5DBDB",
		icon: "more-horizontal",
		displayOrder: 8,
		isActive: true,
	},
];

/**
 * デフォルト収入カテゴリの定義
 * 収入種別の一般的な優先順位に基づく表示順序
 */
const DEFAULT_INCOME_CATEGORIES: Omit<
	InsertCategory,
	"id" | "createdAt" | "updatedAt"
>[] = [
	{
		name: "給与",
		type: "income",
		color: "#58D68D",
		icon: "briefcase",
		displayOrder: 1,
		isActive: true,
	},
	{
		name: "副業",
		type: "income",
		color: "#1890FF",
		icon: "laptop",
		displayOrder: 2,
		isActive: true,
	},
	{
		name: "投資",
		type: "income",
		color: "#722ED1",
		icon: "trending-up",
		displayOrder: 3,
		isActive: true,
	},
	{
		name: "その他",
		type: "income",
		color: "#13C2C2",
		icon: "plus-circle",
		displayOrder: 4,
		isActive: true,
	},
];

/**
 * 指定されたカテゴリが既に存在するかチェック
 * @param db - データベース接続
 * @param name - カテゴリ名
 * @param type - カテゴリタイプ
 * @returns 存在する場合true
 */
async function categoryExists(
	db: Database,
	name: string,
	type: "income" | "expense",
): Promise<boolean> {
	const existing = await db
		.select()
		.from(categories)
		.where(and(eq(categories.name, name), eq(categories.type, type)))
		.limit(1);

	return existing.length > 0;
}

/**
 * デフォルトカテゴリを安全に挿入
 * 重複チェックを行い、存在しないカテゴリのみ挿入する
 * @param db - データベース接続
 * @param categoryList - 挿入するカテゴリリスト
 * @returns 挿入されたカテゴリ数
 */
async function insertCategoriesIfNotExists(
	db: Database,
	categoryList: Omit<InsertCategory, "id" | "createdAt" | "updatedAt">[],
): Promise<number> {
	let insertedCount = 0;

	for (const category of categoryList) {
		const exists = await categoryExists(db, category.name, category.type);

		if (!exists) {
			await db.insert(categories).values(category);
			insertedCount++;
			console.log(
				`カテゴリを挿入しました: ${category.name} (${category.type})`,
			);
		} else {
			console.log(
				`カテゴリは既に存在します: ${category.name} (${category.type})`,
			);
		}
	}

	return insertedCount;
}

/**
 * デフォルトカテゴリシーダーのメイン関数
 * 支出・収入カテゴリを重複チェック付きで挿入
 *
 * @param db - データベース接続
 * @returns 挿入されたカテゴリの総数
 */
export async function seedDefaultCategories(db: Database): Promise<number> {
	console.log("デフォルトカテゴリシーダーを開始します...");

	try {
		// 支出カテゴリの挿入
		console.log("支出カテゴリを挿入中...");
		const expenseInserted = await insertCategoriesIfNotExists(
			db,
			DEFAULT_EXPENSE_CATEGORIES,
		);

		// 収入カテゴリの挿入
		console.log("収入カテゴリを挿入中...");
		const incomeInserted = await insertCategoriesIfNotExists(
			db,
			DEFAULT_INCOME_CATEGORIES,
		);

		const totalInserted = expenseInserted + incomeInserted;

		console.log("デフォルトカテゴリシーダーが完了しました。");
		console.log(`- 支出カテゴリ: ${expenseInserted}件挿入`);
		console.log(`- 収入カテゴリ: ${incomeInserted}件挿入`);
		console.log(`- 合計: ${totalInserted}件挿入`);

		return totalInserted;
	} catch (error) {
		console.error("デフォルトカテゴリシーダーでエラーが発生しました:", error);
		throw error;
	}
}

/**
 * 全てのデフォルトカテゴリの定義を取得
 * テストやその他の用途で使用可能
 */
export function getAllDefaultCategories(): Omit<
	InsertCategory,
	"id" | "createdAt" | "updatedAt"
>[] {
	return [...DEFAULT_EXPENSE_CATEGORIES, ...DEFAULT_INCOME_CATEGORIES];
}

/**
 * 支出カテゴリの定義のみを取得
 */
export function getDefaultExpenseCategories(): Omit<
	InsertCategory,
	"id" | "createdAt" | "updatedAt"
>[] {
	return DEFAULT_EXPENSE_CATEGORIES;
}

/**
 * 収入カテゴリの定義のみを取得
 */
export function getDefaultIncomeCategories(): Omit<
	InsertCategory,
	"id" | "createdAt" | "updatedAt"
>[] {
	return DEFAULT_INCOME_CATEGORIES;
}
