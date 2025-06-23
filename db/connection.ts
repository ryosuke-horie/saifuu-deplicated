import * as fs from "node:fs";
import BetterSqlite3Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
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
 * 開発環境用のSQLiteデータベース接続を作成する
 * @returns Drizzle ORMのデータベースインスタンス
 */
export function createDevDb() {
	// 環境変数でメモリ内DBを強制する場合
	const forceMemory = process.env.USE_MEMORY_DB === "true";

	// 開発環境用のファイルベースまたはメモリ内SQLiteデータベース
	const dbPath = forceMemory ? ":memory:" : "data/dev.db";
	const sqlite = new BetterSqlite3Database(dbPath);
	const db = drizzleSqlite(sqlite, { schema });

	// マイグレーションとサンプルデータの適用
	initializeDevDatabase(db, sqlite);

	return db;
}

/**
 * 開発環境用データベースの初期化
 * Drizzleマイグレーションとサンプルデータの適用
 */
function initializeDevDatabase(db: any, sqlite: any) {
	try {
		// Drizzleマイグレーションの適用
		migrate(db, { migrationsFolder: "./db/migrations" });

		// サンプルデータが既に存在するかチェック
		const existingCategories = sqlite
			.prepare("SELECT COUNT(*) as count FROM categories")
			.get();

		if (existingCategories.count === 0) {
			// サンプルデータの挿入
			sqlite.exec(`
				INSERT INTO categories (id, name, type, icon, color) VALUES 
				(1, '食費', 'expense', '🍽️', '#FF6B6B'),
				(2, '交通費', 'expense', '🚗', '#4ECDC4'),
				(3, '日用品', 'expense', '🧴', '#FFA726'),
				(4, '娯楽費', 'expense', '🎮', '#AB47BC'),
				(5, '通信費', 'expense', '📱', '#26A69A'),
				(6, '光熱費', 'expense', '💡', '#FFCA28'),
				(7, '住居費', 'expense', '🏠', '#8D6E63'),
				(8, '娯楽費', 'expense', '🎬', '#EC407A'),
				(9, '被服費', 'expense', '👕', '#5C6BC0'),
				(10, '教育費', 'expense', '📚', '#66BB6A'),
				(11, '医療費', 'expense', '🏥', '#EF5350'),
				(12, '給与', 'income', '💰', '#45B7D1'),
				(13, '副業', 'income', '💼', '#96CEB4'),
				(14, 'その他収入', 'income', '📈', '#4CAF50');
				
				INSERT INTO transactions (amount, type, category_id, description, transaction_date) VALUES 
				(50000, 'income', 12, '給与', '2025-06-01'),
				(1200, 'expense', 1, 'ランチ', '2025-06-01'),
				(800, 'expense', 2, '電車代', '2025-06-02'),
				(15000, 'income', 13, 'フリーランス収入', '2025-06-02'),
				(2500, 'expense', 1, '夕食', '2025-06-10'),
				(350, 'expense', 2, 'バス代', '2025-06-15'),
				(8000, 'income', 14, 'ボーナス', '2025-06-20'),
				(1800, 'expense', 1, '朝食', '2025-06-22');
				
				INSERT INTO subscriptions (name, amount, category_id, frequency, next_payment_date) VALUES 
				('Netflix', 1980, 8, 'monthly', '2025-07-01'),
				('Spotify', 980, 8, 'monthly', '2025-07-05');
			`);
		}
	} catch (error) {
		console.error("開発データベース初期化エラー:", error);
	}
}

/**
 * データベース接続を作成する
 * @param d1 - Cloudflare WorkersのD1バインディング（オプション）
 * @returns Drizzle ORMのデータベースインスタンス
 */
export function createDb(d1?: D1Database) {
	// 開発環境の場合（d1がundefinedの場合）
	if (!d1) {
		return createDevDb();
	}
	// プロダクション環境の場合
	return drizzle(d1, { schema });
}

/**
 * 型安全なデータベースクライアント
 * アプリケーション内でのデータベース操作に使用
 */
export type Database = ReturnType<typeof createDb>;
