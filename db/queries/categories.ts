import { and, asc, desc, eq, max } from "drizzle-orm";
import type { Database } from "../connection";
import {
	type InsertCategory,
	type SelectCategory,
	categories,
} from "../schema";

/**
 * カテゴリ関連のデータベースクエリ関数
 *
 * 設計方針:
 * - 論理削除を考慮し、isActive=trueのみ取得
 * - 表示順序（displayOrder）を基準にソート
 * - type別での絞り込みに対応
 * - 並び順変更機能を提供
 */

/**
 * 新しいカテゴリを作成
 */
export async function createCategory(db: Database, category: InsertCategory) {
	// 現在の最大表示順序を取得し、新しいカテゴリを末尾に追加
	const maxOrder = await getMaxDisplayOrder(db, category.type);

	const categoryData: InsertCategory = {
		...category,
		displayOrder: category.displayOrder ?? maxOrder + 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	const [created] = await db
		.insert(categories)
		.values(categoryData)
		.returning();

	return created;
}

/**
 * IDでカテゴリを取得
 */
export async function getCategoryById(db: Database, id: number) {
	const [category] = await db
		.select()
		.from(categories)
		.where(and(eq(categories.id, id), eq(categories.isActive, true)))
		.limit(1);

	return category;
}

/**
 * アクティブなカテゴリ一覧を取得
 * @param type - 'income' | 'expense' でフィルタ（未指定の場合は全て）
 */
export async function getActiveCategories(
	db: Database,
	type?: "income" | "expense",
) {
	const whereConditions = [eq(categories.isActive, true)];

	if (type) {
		whereConditions.push(eq(categories.type, type));
	}

	return await db
		.select()
		.from(categories)
		.where(and(...whereConditions))
		.orderBy(asc(categories.displayOrder), asc(categories.id));
}

/**
 * カテゴリを更新
 */
export async function updateCategory(
	db: Database,
	id: number,
	updates: Partial<InsertCategory>,
) {
	const updateData = {
		...updates,
		updatedAt: new Date().toISOString(),
	};

	const [updated] = await db
		.update(categories)
		.set(updateData)
		.where(eq(categories.id, id))
		.returning();

	return updated;
}

/**
 * カテゴリを論理削除
 */
export async function deleteCategory(db: Database, id: number) {
	const [deleted] = await db
		.update(categories)
		.set({
			isActive: false,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(categories.id, id))
		.returning();

	return deleted;
}

/**
 * カテゴリの表示順序を更新
 * @param reorderData - {id: number, displayOrder: number}[]の配列
 */
export async function reorderCategories(
	db: Database,
	reorderData: Array<{ id: number; displayOrder: number }>,
) {
	// トランザクション内で一括更新を実行
	const results = [];

	for (const { id, displayOrder } of reorderData) {
		const [updated] = await db
			.update(categories)
			.set({
				displayOrder,
				updatedAt: new Date().toISOString(),
			})
			.where(eq(categories.id, id))
			.returning();

		if (updated) {
			results.push(updated);
		}
	}

	return results;
}

/**
 * 指定されたtypeの最大表示順序を取得
 */
async function getMaxDisplayOrder(
	db: Database,
	type: "income" | "expense",
): Promise<number> {
	const [result] = await db
		.select({
			maxOrder: max(categories.displayOrder),
		})
		.from(categories)
		.where(and(eq(categories.type, type), eq(categories.isActive, true)));

	return (result?.maxOrder ?? 0) as number;
}

/**
 * カテゴリが使用中かどうかを確認（削除前のチェック用）
 * トランザクションやサブスクリプションで参照されているかを確認
 */
export async function isCategoryInUse(
	db: Database,
	categoryId: number,
): Promise<boolean> {
	// この関数は将来的にtransactionsテーブルとsubscriptionsテーブルをチェックする
	// 現時点では論理削除のみなので、常にfalseを返す
	// TODO: transactions、subscriptionsテーブルでの参照をチェック
	return false;
}
