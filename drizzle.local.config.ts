import { defineConfig } from "drizzle-kit";

/**
 * ローカル開発専用のDrizzle Kit設定ファイル
 * better-sqlite3を使用してローカルSQLiteファイルでマイグレーションを実行
 *
 * 使用目的:
 * - ローカル開発でのマイグレーション実行
 * - Drizzle Studioでのローカルデータベース操作
 * - テスト環境でのマイグレーション適用
 */
export default defineConfig({
	dialect: "sqlite",
	schema: "./db/schema/*",
	out: "./db/migrations",
	driver: "better-sqlite3",
	dbCredentials: {
		url: "./local-dev.db",
	},
	verbose: true,
	strict: true,
});
