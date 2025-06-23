import { defineConfig } from "drizzle-kit";

/**
 * ローカル開発専用のDrizzle Kit設定ファイル
 * Drizzle Studioでのローカルデータベース操作用
 *
 * 注意: マイグレーション実行はアプリケーション起動時に自動実行されるため、
 * この設定ファイルは主にDrizzle Studioでの使用を想定
 */
export default defineConfig({
	dialect: "sqlite",
	schema: "./db/schema/*",
	out: "./db/migrations",
	verbose: true,
	strict: true,
});
