import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Drizzle ORM データベース接続設定
 *
 * 設計方針:
 * - Cloudflare WorkersのD1バインディングを使用
 * - スキーマは自動的にインポートして型安全性を確保
 * - 開発時とプロダクション時で同じインターフェースを使用
 *
 * 使用例:
 * ```typescript
 * // Cloudflare Workersのリクエストハンドラー内で
 * const db = createDb(env.DB);
 * const transactions = await db.select().from(schema.transactions);
 * ```
 */

export type DbConnection = ReturnType<typeof createDb>;

/**
 * データベース接続を作成する
 * @param d1 - Cloudflare WorkersのD1バインディング
 * @returns Drizzle ORMのデータベースインスタンス
 */
export function createDb(d1: D1Database) {
	return drizzle(d1, { schema });
}

/**
 * 型安全なデータベースクライアント
 * アプリケーション内でのデータベース操作に使用
 */
export type Database = ReturnType<typeof createDb>;
