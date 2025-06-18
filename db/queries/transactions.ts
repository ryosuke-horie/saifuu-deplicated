import { and, desc, eq, gte, lte, sql } from "drizzle-orm";
import type { Database } from "../connection";
import {
	type CreateTransaction,
	type InsertTransaction,
	type SelectTransaction,
	categories,
	transactions,
} from "../schema";

/**
 * トランザクション関連のデータベースクエリ関数
 *
 * 設計方針:
 * - 型安全性を重視し、Drizzle ORMの型を活用
 * - 複雑なクエリはヘルパー関数として分離
 * - パフォーマンスを考慮し、必要最小限のデータを取得
 */

/**
 * 新しいトランザクションを作成
 */
export async function createTransaction(
	db: Database,
	transaction: CreateTransaction,
) {
	// tagsをJSON文字列に変換してDBに保存
	const transactionData: InsertTransaction = {
		...transaction,
		tags: transaction.tags ? JSON.stringify(transaction.tags) : null,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	const [created] = await db
		.insert(transactions)
		.values(transactionData)
		.returning();

	return created;
}

/**
 * IDでトランザクションを取得（カテゴリ情報含む）
 */
export async function getTransactionById(db: Database, id: number) {
	const [transaction] = await db
		.select({
			id: transactions.id,
			amount: transactions.amount,
			type: transactions.type,
			description: transactions.description,
			transactionDate: transactions.transactionDate,
			paymentMethod: transactions.paymentMethod,
			tags: transactions.tags,
			isRecurring: transactions.isRecurring,
			createdAt: transactions.createdAt,
			updatedAt: transactions.updatedAt,
			category: {
				id: categories.id,
				name: categories.name,
				type: categories.type,
				color: categories.color,
				icon: categories.icon,
			},
		})
		.from(transactions)
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.where(eq(transactions.id, id))
		.limit(1);

	return transaction;
}

/**
 * 期間指定でトランザクション一覧を取得
 */
export async function getTransactionsByDateRange(
	db: Database,
	startDate: string,
	endDate: string,
	type?: "income" | "expense",
) {
	const query = db
		.select({
			id: transactions.id,
			amount: transactions.amount,
			type: transactions.type,
			description: transactions.description,
			transactionDate: transactions.transactionDate,
			paymentMethod: transactions.paymentMethod,
			tags: transactions.tags,
			category: {
				id: categories.id,
				name: categories.name,
				color: categories.color,
				icon: categories.icon,
			},
		})
		.from(transactions)
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.where(
			and(
				gte(transactions.transactionDate, startDate),
				lte(transactions.transactionDate, endDate),
				type ? eq(transactions.type, type) : undefined,
			),
		)
		.orderBy(desc(transactions.transactionDate), desc(transactions.id));

	return await query;
}

/**
 * 月別のトランザクション集計
 */
export async function getMonthlyTransactionSummary(
	db: Database,
	year: number,
	month: number,
) {
	const startDate = `${year}-${month.toString().padStart(2, "0")}-01`;
	const endDate = `${year}-${month.toString().padStart(2, "0")}-31`;

	const summary = await db
		.select({
			type: transactions.type,
			categoryId: transactions.categoryId,
			categoryName: categories.name,
			categoryColor: categories.color,
			totalAmount: sql<number>`SUM(${transactions.amount})`.as("totalAmount"),
			transactionCount: sql<number>`COUNT(*)`.as("transactionCount"),
		})
		.from(transactions)
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.where(
			and(
				gte(transactions.transactionDate, startDate),
				lte(transactions.transactionDate, endDate),
			),
		)
		.groupBy(
			transactions.type,
			transactions.categoryId,
			categories.name,
			categories.color,
		);

	return summary;
}

/**
 * トランザクションを更新
 */
export async function updateTransaction(
	db: Database,
	id: number,
	updates: Partial<CreateTransaction>,
) {
	// tagsをJSON文字列に変換してDBに保存
	const updateData: Partial<InsertTransaction> = {
		...updates,
		tags: updates.tags
			? JSON.stringify(updates.tags)
			: updates.tags === null
				? null
				: undefined,
		updatedAt: new Date().toISOString(),
	};

	const [updated] = await db
		.update(transactions)
		.set(updateData)
		.where(eq(transactions.id, id))
		.returning();

	return updated;
}

/**
 * トランザクションを削除
 */
export async function deleteTransaction(db: Database, id: number) {
	const [deleted] = await db
		.delete(transactions)
		.where(eq(transactions.id, id))
		.returning();

	return deleted;
}

/**
 * 最近のトランザクションを取得（ホーム画面用）
 */
export async function getRecentTransactions(db: Database, limit = 10) {
	return await db
		.select({
			id: transactions.id,
			amount: transactions.amount,
			type: transactions.type,
			description: transactions.description,
			transactionDate: transactions.transactionDate,
			category: {
				name: categories.name,
				color: categories.color,
				icon: categories.icon,
			},
		})
		.from(transactions)
		.leftJoin(categories, eq(transactions.categoryId, categories.id))
		.orderBy(desc(transactions.createdAt))
		.limit(limit);
}
