import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * 家計管理アプリケーションのデータベーススキーマ定義
 *
 * 設計方針:
 * - 支出・収入を統一的に管理するためtransactionsテーブルを使用
 * - カテゴリは柔軟に追加できるよう独立したテーブルとして設計
 * - サブスクリプションは定期的な支出として別テーブルで管理
 * - 通貨は円（JPY）を前提とし、小数点以下は管理しない（整数で円単位）
 */

// ========================================
// カテゴリマスタテーブル
// ========================================
export const categories = sqliteTable("categories", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(), // カテゴリ名（例: 食費、交通費、給与など）
	type: text("type").notNull(), // 'income' | 'expense'
	color: text("color"), // UI表示用の色コード（例: #FF6B6B）
	icon: text("icon"), // アイコン名（例: food, transport, salary）
	displayOrder: integer("display_order").notNull().default(0), // 表示順序
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // 論理削除フラグ
	createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
	updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ========================================
// 取引テーブル（収入・支出の統合管理）
// ========================================
export const transactions = sqliteTable("transactions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	amount: integer("amount").notNull(), // 金額（円単位の整数）
	type: text("type").notNull(), // 'income' | 'expense'
	categoryId: integer("category_id").references(() => categories.id),
	description: text("description"), // 取引の説明・メモ
	transactionDate: text("transaction_date").notNull(), // 取引日（YYYY-MM-DD形式）
	paymentMethod: text("payment_method"), // 支払い方法（現金、クレジットカード、銀行振込など）
	tags: text("tags"), // タグ（JSON配列として保存、例: ["外食", "会社"]）
	receiptUrl: text("receipt_url"), // レシート画像のURL（将来の機能拡張用）
	isRecurring: integer("is_recurring", { mode: "boolean" })
		.notNull()
		.default(false), // 定期取引フラグ
	recurringId: integer("recurring_id").references(() => subscriptions.id), // 定期取引の参照
	createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
	updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ========================================
// サブスクリプション・定期支払いテーブル
// ========================================
export const subscriptions = sqliteTable("subscriptions", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	name: text("name").notNull(), // サービス名（例: Netflix, Spotify, 家賃）
	amount: integer("amount").notNull(), // 金額（円単位の整数）
	categoryId: integer("category_id").references(() => categories.id),
	frequency: text("frequency").notNull(), // 'monthly' | 'yearly' | 'weekly' | 'daily'
	nextPaymentDate: text("next_payment_date").notNull(), // 次回支払日（YYYY-MM-DD形式）
	description: text("description"), // 説明・メモ
	isActive: integer("is_active", { mode: "boolean" }).notNull().default(true), // アクティブフラグ
	autoGenerate: integer("auto_generate", { mode: "boolean" })
		.notNull()
		.default(true), // 自動取引生成フラグ
	createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
	updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ========================================
// 予算管理テーブル
// ========================================
export const budgets = sqliteTable("budgets", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	categoryId: integer("category_id").references(() => categories.id),
	amount: integer("amount").notNull(), // 予算金額（円単位の整数）
	period: text("period").notNull(), // 'monthly' | 'yearly'
	year: integer("year").notNull(), // 年
	month: integer("month"), // 月（月次予算の場合のみ）
	createdAt: text("created_at").notNull().default("CURRENT_TIMESTAMP"),
	updatedAt: text("updated_at").notNull().default("CURRENT_TIMESTAMP"),
});

// ========================================
// Zodスキーマ定義（バリデーション用）
// ========================================

// カテゴリのスキーマ
export const insertCategorySchema = createInsertSchema(categories, {
	type: z.enum(["income", "expense"]),
	color: z
		.string()
		.regex(/^#[0-9A-F]{6}$/i)
		.optional(),
	displayOrder: z.number().int().min(0).optional(),
});
export const selectCategorySchema = createSelectSchema(categories);
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type SelectCategory = z.infer<typeof selectCategorySchema>;

// 取引のスキーマ
// データベース保存用の基本スキーマ
export const insertTransactionSchema = createInsertSchema(transactions, {
	amount: z.number().int().positive(), // 正の整数のみ
	type: z.enum(["income", "expense"]),
	transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD形式
});

// アプリケーション入力用のスキーマ（タグを配列として受け取る）
export const createTransactionSchema = insertTransactionSchema.extend({
	tags: z.array(z.string()).optional(),
});
export const selectTransactionSchema = createSelectSchema(transactions);

// APIレスポンス用の取引型（tagsが配列として解析済み）
export const selectTransactionWithParsedTagsSchema =
	selectTransactionSchema.extend({
		tags: z.array(z.string()).nullable(),
	});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type CreateTransaction = z.infer<typeof createTransactionSchema>;
export type SelectTransaction = z.infer<typeof selectTransactionSchema>;
export type SelectTransactionWithParsedTags = z.infer<
	typeof selectTransactionWithParsedTagsSchema
>;

// サブスクリプションのスキーマ
export const insertSubscriptionSchema = createInsertSchema(subscriptions, {
	amount: z.number().int().positive(),
	frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
	nextPaymentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
export const selectSubscriptionSchema = createSelectSchema(subscriptions);
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type SelectSubscription = z.infer<typeof selectSubscriptionSchema>;

// 予算のスキーマ
export const insertBudgetSchema = createInsertSchema(budgets, {
	amount: z.number().int().positive(),
	period: z.enum(["monthly", "yearly"]),
	year: z.number().int().min(2020).max(2100),
	month: z.number().int().min(1).max(12).optional(),
});
export const selectBudgetSchema = createSelectSchema(budgets);
export type InsertBudget = z.infer<typeof insertBudgetSchema>;
export type SelectBudget = z.infer<typeof selectBudgetSchema>;
