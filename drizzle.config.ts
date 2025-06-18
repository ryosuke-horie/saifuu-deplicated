import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit設定ファイル
 * Cloudflare D1データベースとの連携を設定する
 *
 * 設計方針:
 * - スキーマファイルは `/db/schema` ディレクトリに配置
 * - マイグレーションファイルは `/db/migrations` ディレクトリに出力
 * - 本番環境とローカル開発環境でデータベース名を統一（saifuu-db）
 */
export default defineConfig({
	dialect: "sqlite", // Cloudflare D1はSQLiteベース
	schema: "./db/schema/*",
	out: "./db/migrations",
	driver: "d1-http",
	dbCredentials: {
		// ローカル開発時: wrangler dev で起動されるローカルD1を使用
		// 本番環境: Cloudflare D1の実際のデータベースを使用
		databaseId: process.env.DATABASE_ID || "saifuu-db",
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
		token: process.env.CLOUDFLARE_API_TOKEN || "",
	},
	verbose: true,
	strict: true,
});
