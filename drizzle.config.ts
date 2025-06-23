import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit設定ファイル
 * 環境に応じてローカルSQLiteまたはCloudflare D1を使用
 *
 * 設計方針:
 * - 開発/テスト環境: ローカルSQLiteファイルを使用
 * - プロダクション環境: Cloudflare D1を使用
 * - 環境変数NODE_ENVで切り替え
 */

// 環境に応じた設定の切り替え
const isProduction = process.env.NODE_ENV === "production";
const isDevelopment =
	process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test";

// 基本設定
const baseConfig = {
	dialect: "sqlite" as const,
	schema: "./db/schema/*",
	out: "./db/migrations",
	verbose: true,
	strict: true,
};

// 環境別の設定
const config = isProduction
	? {
			...baseConfig,
			driver: "d1-http" as const,
			dbCredentials: {
				databaseId: process.env.DATABASE_ID || "saifuu-db",
				accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
				token: process.env.CLOUDFLARE_API_TOKEN || "",
			},
		}
	: {
			...baseConfig,
			driver: "better-sqlite3" as const,
			dbCredentials: {
				url: "./local-dev.db",
			},
		};

export default defineConfig(config);
