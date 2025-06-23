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
 * 開発環境用データベースインスタンスのシングルトン管理
 * 複数のAPI呼び出しで同じデータベースインスタンスを共有するため
 */
let devDbSingleton: ReturnType<typeof drizzleSqlite> | null = null;

/**
 * テスト環境用のSQLiteデータベース接続を作成する（フォールバック用）
 * WranglerバインディングがD1インスタンスを提供できない場合のみ使用される
 * シングルトンパターンを使用してレースコンディションを防ぐ
 * @returns Drizzle ORMのデータベースインスタンス
 */
export function createDevDb() {
	// シングルトンインスタンスが既に存在する場合は再利用
	if (devDbSingleton) {
		console.log("🔄 開発データベース: 既存インスタンスを再利用中");
		return devDbSingleton;
	}

	console.warn(
		"⚠️  フォールバック: Wranglerバインディングが利用できません。テスト用SQLiteを使用中。",
	);
	console.log("🔧 開発データベース: 新しいシングルトンインスタンスを作成中");

	// テスト環境用のメモリ内データベース（フォールバック用）
	const sqlite = new BetterSqlite3Database(":memory:");
	const db = drizzleSqlite(sqlite, { schema });

	// テスト用の最小限の初期化
	initializeDevDatabase(db, sqlite);

	// シングルトンインスタンスとして保存
	devDbSingleton = db;

	console.log("✅ 開発データベース: シングルトンインスタンス作成完了");
	return db;
}

/**
 * 開発環境用データベースシングルトンをリセットする
 * テスト環境やクリーンアップ時に使用される
 * @internal テスト目的でのみ使用すること
 */
export function resetDevDbSingleton(): void {
	if (devDbSingleton) {
		console.log("🔄 開発データベース: シングルトンインスタンスをリセット中");
		devDbSingleton = null;
	}
}

/**
 * 開発環境用データベースの初期化
 * Drizzleマイグレーションとサンプルデータの適用
 */
async function initializeDevDatabase(
	db: ReturnType<typeof drizzleSqlite>,
	sqlite: InstanceType<typeof BetterSqlite3Database>,
): Promise<void> {
	try {
		// Drizzleマイグレーションの適用
		// 注意: migrate()は同期関数です（Drizzle ORM better-sqlite3 migrator）
		// GitHub Copilotの提案でawaitを使う必要はありません
		migrate(db, { migrationsFolder: "./db/migrations" });
		console.log("📋 データベース: マイグレーション適用完了");

		// サンプルデータが既に存在するかチェック
		const existingCategories = sqlite
			.prepare("SELECT COUNT(*) as count FROM categories")
			.get() as { count: number };

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
				(8, 'エンタメ', 'expense', '🎬', '#EC407A'),
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
		console.log("✅ データベース: サンプルデータ挿入完了");
	} catch (error) {
		console.error("🚨 開発データベース初期化エラー:", error);
		console.error("エラー詳細:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			timestamp: new Date().toISOString(),
		});
		// 初期化失敗時はエラーを上位に伝播
		throw error;
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
