import { and, desc, eq, lte, sql } from "drizzle-orm";
import type { Database } from "../connection";
import {
	type InsertSubscription,
	type SelectSubscription,
	categories,
	subscriptions,
} from "../schema";

/**
 * サブスクリプション関連のデータベースクエリ関数
 *
 * 設計方針:
 * - 定期支払いの自動化を前提とした設計
 * - 次回支払日の管理と更新機能を重視
 * - アクティブ・非アクティブの管理をサポート
 */

/**
 * 新しいサブスクリプションを作成
 */
export async function createSubscription(
	db: Database,
	subscription: InsertSubscription,
) {
	// createdAt/updatedAtはデータベースのCURRENT_TIMESTAMPデフォルト値を使用
	const [created] = await db
		.insert(subscriptions)
		.values(subscription)
		.returning();

	return created;
}

/**
 * IDでサブスクリプションを取得（カテゴリ情報含む）
 */
export async function getSubscriptionById(db: Database, id: number) {
	const [subscription] = await db
		.select({
			id: subscriptions.id,
			name: subscriptions.name,
			amount: subscriptions.amount,
			frequency: subscriptions.frequency,
			nextPaymentDate: subscriptions.nextPaymentDate,
			description: subscriptions.description,
			isActive: subscriptions.isActive,
			autoGenerate: subscriptions.autoGenerate,
			createdAt: subscriptions.createdAt,
			updatedAt: subscriptions.updatedAt,
			category: {
				id: categories.id,
				name: categories.name,
				type: categories.type,
				color: categories.color,
				icon: categories.icon,
			},
		})
		.from(subscriptions)
		.leftJoin(categories, eq(subscriptions.categoryId, categories.id))
		.where(eq(subscriptions.id, id))
		.limit(1);

	return subscription;
}

/**
 * サブスクリプション一覧を取得（フィルタリング対応）
 */
export async function getSubscriptionsList(
	db: Database,
	options: {
		isActive?: boolean;
	} = {},
) {
	const { isActive } = options;

	const query = db
		.select({
			id: subscriptions.id,
			name: subscriptions.name,
			amount: subscriptions.amount,
			frequency: subscriptions.frequency,
			nextPaymentDate: subscriptions.nextPaymentDate,
			description: subscriptions.description,
			isActive: subscriptions.isActive,
			autoGenerate: subscriptions.autoGenerate,
			createdAt: subscriptions.createdAt,
			updatedAt: subscriptions.updatedAt,
			category: {
				id: categories.id,
				name: categories.name,
				type: categories.type,
				color: categories.color,
				icon: categories.icon,
			},
		})
		.from(subscriptions)
		.leftJoin(categories, eq(subscriptions.categoryId, categories.id));

	// アクティブ・非アクティブのフィルタリング
	if (isActive !== undefined) {
		query.where(eq(subscriptions.isActive, isActive));
	}

	return await query.orderBy(desc(subscriptions.createdAt));
}

/**
 * アクティブなサブスクリプション一覧を取得
 */
export async function getActiveSubscriptions(db: Database) {
	return await db
		.select({
			id: subscriptions.id,
			name: subscriptions.name,
			amount: subscriptions.amount,
			frequency: subscriptions.frequency,
			nextPaymentDate: subscriptions.nextPaymentDate,
			description: subscriptions.description,
			autoGenerate: subscriptions.autoGenerate,
			category: {
				id: categories.id,
				name: categories.name,
				color: categories.color,
				icon: categories.icon,
			},
		})
		.from(subscriptions)
		.leftJoin(categories, eq(subscriptions.categoryId, categories.id))
		.where(eq(subscriptions.isActive, true))
		.orderBy(subscriptions.nextPaymentDate);
}

/**
 * 今日支払い予定のサブスクリプションを取得
 */
export async function getSubscriptionsDueToday(db: Database) {
	const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD形式

	return await db
		.select({
			id: subscriptions.id,
			name: subscriptions.name,
			amount: subscriptions.amount,
			frequency: subscriptions.frequency,
			nextPaymentDate: subscriptions.nextPaymentDate,
			autoGenerate: subscriptions.autoGenerate,
			category: {
				id: categories.id,
				name: categories.name,
				color: categories.color,
				icon: categories.icon,
			},
		})
		.from(subscriptions)
		.leftJoin(categories, eq(subscriptions.categoryId, categories.id))
		.where(
			and(
				eq(subscriptions.isActive, true),
				lte(subscriptions.nextPaymentDate, today),
			),
		);
}

/**
 * サブスクリプションを更新
 */
export async function updateSubscription(
	db: Database,
	id: number,
	updates: Partial<InsertSubscription>,
) {
	const [updated] = await db
		.update(subscriptions)
		.set({
			...updates,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(subscriptions.id, id))
		.returning();

	return updated;
}

/**
 * サブスクリプションの次回支払日を更新
 */
export async function updateNextPaymentDate(
	db: Database,
	id: number,
	nextPaymentDate: string,
) {
	const [updated] = await db
		.update(subscriptions)
		.set({
			nextPaymentDate,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(subscriptions.id, id))
		.returning();

	return updated;
}

/**
 * サブスクリプションを非アクティブにする（論理削除）
 */
export async function deactivateSubscription(db: Database, id: number) {
	const [updated] = await db
		.update(subscriptions)
		.set({
			isActive: false,
			updatedAt: new Date().toISOString(),
		})
		.where(eq(subscriptions.id, id))
		.returning();

	return updated;
}

/**
 * サブスクリプションを完全削除
 */
export async function deleteSubscription(db: Database, id: number) {
	const [deleted] = await db
		.delete(subscriptions)
		.where(eq(subscriptions.id, id))
		.returning();

	return deleted;
}

/**
 * 月次サブスクリプション合計金額を計算
 */
export async function getMonthlySubscriptionTotal(db: Database) {
	// 各周期を月次に換算した金額を計算
	// daily: 30倍, weekly: 4.33倍, monthly: 1倍, yearly: 1/12倍
	const result = await db
		.select({
			totalMonthly: sql<number>`
        SUM(
          CASE 
            WHEN frequency = 'daily' THEN amount * 30
            WHEN frequency = 'weekly' THEN amount * 4.33
            WHEN frequency = 'monthly' THEN amount
            WHEN frequency = 'yearly' THEN amount / 12
            ELSE 0
          END
        )
      `.as("totalMonthly"),
		})
		.from(subscriptions)
		.where(eq(subscriptions.isActive, true));

	return (result[0] as any)?.totalMonthly || 0;
}

/**
 * 頻度別の次回支払日を計算
 */
export function calculateNextPaymentDate(
	currentDate: string,
	frequency: string,
): string {
	const date = new Date(currentDate);

	switch (frequency) {
		case "daily":
			date.setDate(date.getDate() + 1);
			break;
		case "weekly":
			date.setDate(date.getDate() + 7);
			break;
		case "monthly":
			date.setMonth(date.getMonth() + 1);
			break;
		case "yearly":
			date.setFullYear(date.getFullYear() + 1);
			break;
		default:
			throw new Error(`Unsupported frequency: ${frequency}`);
	}

	return date.toISOString().split("T")[0]; // YYYY-MM-DD形式で返す
}
