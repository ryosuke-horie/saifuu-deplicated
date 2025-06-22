import { and, asc, eq, sql } from "drizzle-orm";
import type { Database } from "../connection";
import {
	type InsertCategory,
	type SelectCategory,
	categories,
} from "../schema";

/**
 * カテゴリマスタ関連のデータベースクエリ関数
 *
 * 設計方針:
 * - 表示順序（displayOrder）による並び順制御を重視
 * - 論理削除（isActive）による削除管理
 * - 収入・支出タイプ別の効率的な取得
 * - 一括更新機能による表示順序管理の最適化
 */

/**
 * 全カテゴリを取得（displayOrder順、アクティブのみ）
 */
export async function getAllCategories(db: Database) {
	return await db
		.select()
		.from(categories)
		.where(eq(categories.isActive, true))
		.orderBy(asc(categories.displayOrder), asc(categories.id));
}

/**
 * タイプ別にカテゴリを取得（displayOrder順、アクティブのみ）
 */
export async function getCategoriesByType(
	db: Database,
	type: "income" | "expense",
) {
	return await db
		.select()
		.from(categories)
		.where(and(eq(categories.type, type), eq(categories.isActive, true)))
		.orderBy(asc(categories.displayOrder), asc(categories.id));
}

/**
 * 新しいカテゴリを作成
 * displayOrderが指定されていない場合、同タイプ内での最大値+1を設定
 */
export async function createCategory(db: Database, data: InsertCategory) {
	// displayOrderが指定されていない場合、同タイプ内での最大値+1を設定
	let displayOrder = data.displayOrder;
	if (displayOrder === undefined) {
		const [maxOrder] = (await (db as any)
			.select({
				maxOrder: sql<number>`COALESCE(MAX(${categories.displayOrder}), 0)`,
			})
			.from(categories)
			.where(
				and(eq(categories.type, data.type), eq(categories.isActive, true)),
			)) as any;

		displayOrder = ((maxOrder as any).maxOrder || 0) + 1;
	}

	const [created] = await db
		.insert(categories)
		.values({
			...data,
			displayOrder,
		})
		.returning();

	return created;
}

/**
 * カテゴリを更新
 */
export async function updateCategory(
	db: Database,
	id: number,
	data: Partial<InsertCategory>,
) {
	const [updated] = await db
		.update(categories)
		.set({
			...data,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(categories.id, id))
		.returning();

	return updated;
}

/**
 * カテゴリを論理削除（isActiveをfalseに設定）
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
 * 表示順序を一括更新
 * ドラッグ&ドロップによる並び替え機能で使用
 */
export async function updateDisplayOrder(
	db: Database,
	updates: { id: number; displayOrder: number }[],
) {
	if (updates.length === 0) {
		return [];
	}

	const results: SelectCategory[] = [];
	const now = new Date().toISOString();

	// 複数の更新をPromise.allで並列実行し、効率化
	const updatePromises = updates.map(async (update) => {
		const [updated] = await db
			.update(categories)
			.set({
				displayOrder: update.displayOrder,
				updatedAt: now,
			})
			.where(eq(categories.id, update.id))
			.returning();

		return updated;
	});

	const updatedResults = await Promise.all(updatePromises);

	// null/undefinedをフィルタリング
	for (const result of updatedResults) {
		if (result) {
			results.push(result);
		}
	}

	return results;
}

/**
 * IDでカテゴリを取得（アクティブのみ）
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
 * アクティブなカテゴリ一覧を取得（type別フィルタ対応）
 */
export async function getActiveCategories(
	db: Database,
	type?: "income" | "expense",
) {
	if (type) {
		return getCategoriesByType(db, type);
	}
	return getAllCategories(db);
}

/**
 * カテゴリの表示順序を更新（reorderCategories関数のエイリアス）
 */
export const reorderCategories = updateDisplayOrder;

/**
 * カテゴリが使用中かどうかを確認（削除前のチェック用）
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
