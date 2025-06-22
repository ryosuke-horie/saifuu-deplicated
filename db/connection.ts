import { drizzle } from "drizzle-orm/d1";
import Database from "better-sqlite3";
import { drizzle as drizzleSqlite } from "drizzle-orm/better-sqlite3";
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
	// 開発環境用のメモリ内SQLiteデータベース
	const sqlite = new Database(":memory:");
	const db = drizzleSqlite(sqlite, { schema });
	
	// 開発環境用のテーブル作成とサンプルデータ挿入
	initializeDevDatabase(sqlite as any); // Drizzleラッパーではなく直接better-sqlite3インスタンスを渡す
	
	return db;
}

/**
 * 開発環境用データベースの初期化
 * テーブル作成とサンプルデータの挿入
 */
function initializeDevDatabase(sqlite: any) {
	// テーブル作成（better-sqlite3では exec または prepare().run() を使用）
	try {
		sqlite.exec(`
			CREATE TABLE IF NOT EXISTS categories (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
				icon TEXT,
				color TEXT,
				display_order INTEGER DEFAULT 0,
				is_active INTEGER DEFAULT 1,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP
			);
			
			CREATE TABLE IF NOT EXISTS transactions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				amount INTEGER NOT NULL,
				type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
				category_id INTEGER,
				description TEXT,
				transaction_date TEXT NOT NULL,
				payment_method TEXT,
				tags TEXT,
				receipt_url TEXT,
				is_recurring INTEGER DEFAULT 0,
				recurring_id INTEGER,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (category_id) REFERENCES categories(id),
				FOREIGN KEY (recurring_id) REFERENCES subscriptions(id)
			);
			
			CREATE TABLE IF NOT EXISTS subscriptions (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				name TEXT NOT NULL,
				amount INTEGER NOT NULL,
				category_id INTEGER,
				frequency TEXT NOT NULL,
				next_payment_date TEXT NOT NULL,
				description TEXT,
				is_active INTEGER DEFAULT 1,
				auto_generate INTEGER DEFAULT 1,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (category_id) REFERENCES categories(id)
			);
			
			CREATE TABLE IF NOT EXISTS budgets (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				category_id INTEGER,
				amount INTEGER NOT NULL,
				period TEXT NOT NULL,
				year INTEGER NOT NULL,
				month INTEGER,
				created_at TEXT DEFAULT CURRENT_TIMESTAMP,
				updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
				FOREIGN KEY (category_id) REFERENCES categories(id)
			);
			
			INSERT OR IGNORE INTO categories (id, name, type, icon, color) VALUES 
			(1, '食費', 'expense', '🍽️', '#FF6B6B'),
			(2, '交通費', 'expense', '🚗', '#4ECDC4'),
			(3, '給与', 'income', '💰', '#45B7D1'),
			(4, '副業', 'income', '💼', '#96CEB4');
			
			INSERT OR IGNORE INTO transactions (id, amount, type, category_id, description, transaction_date) VALUES 
			(1, 50000, 'income', 3, '給与', '2025-06-01'),
			(2, 1200, 'expense', 1, 'ランチ', '2025-06-01'),
			(3, 800, 'expense', 2, '電車代', '2025-06-02'),
			(4, 15000, 'income', 4, 'フリーランス収入', '2025-06-02'),
			(5, 2500, 'expense', 1, '夕食', '2025-06-10'),
			(6, 350, 'expense', 2, 'バス代', '2025-06-15'),
			(7, 8000, 'income', 4, 'ボーナス', '2025-06-20'),
			(8, 1800, 'expense', 1, '朝食', '2025-06-22');
			
			INSERT OR IGNORE INTO subscriptions (id, name, amount, category_id, frequency, next_payment_date) VALUES 
			(1, 'Netflix', 1980, 1, 'monthly', '2025-07-01'),
			(2, 'Spotify', 980, 1, 'monthly', '2025-07-05');
		`);
	} catch (error) {
		console.error('開発データベース初期化エラー:', error);
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
