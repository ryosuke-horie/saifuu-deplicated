import { defineConfig } from "drizzle-kit";

/**
 * ローカル開発専用のDrizzle Kit設定ファイル
 * Drizzle Studioでのローカルデータベース操作用
 *
 * 設計方針:
 * - ローカル環境での開発用SQLiteデータベースファイルに接続
 * - Drizzle Studioでのデータベース操作とスキーマ確認に使用
 * - マイグレーション実行はアプリケーション起動時に自動実行されるため、
 *   この設定ファイルは主にDrizzle Studioでの使用を想定
 *
 * 使用例:
 * ```bash
 * # Drizzle Studio起動
 * npx drizzle-kit studio --config drizzle.local.config.ts
 * ```
 */
export default defineConfig({
	dialect: "sqlite",
	driver: "better-sqlite3",
	schema: "./db/schema/*",
	out: "./db/migrations",
	verbose: true,
	strict: true,
	dbCredentials: {
		url: "./local-dev.db",
	},
});
