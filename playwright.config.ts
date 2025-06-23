import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル
 * E2Eテストの実行環境とプロジェクト設定を定義
 *
 * 設計判断：
 * - ポート5173: Vite開発サーバーのデフォルトポート
 * - レトライ: CI環境でのみ有効化してローカルデバッグを効率化
 * - レポート: シンプルなコンソール出力（dot/line）でリソース節約
 * - アーティファクト: 失敗時のみ最小限の情報を保存
 * - クロスブラウザ: Chrome/Firefox/Safari + モバイル対応
 */
export default defineConfig({
	testDir: "./tests/e2e",
	timeout: 30 * 1000,
	expect: {
		timeout: 5000,
	},
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: process.env.CI ? [["dot"]] : [["line"]],

	use: {
		baseURL: "http://localhost:5173",
		trace: "retain-on-failure",
		screenshot: "only-on-failure",
		headless: !!process.env.CI,
		video: process.env.CI ? "off" : "retain-on-failure",
	},

	projects: process.env.CI
		? [
				{
					name: "chromium",
					use: { ...devices["Desktop Chrome"] },
				},
			]
		: [
				{
					name: "chromium",
					use: { ...devices["Desktop Chrome"] },
				},
				{
					name: "firefox",
					use: { ...devices["Desktop Firefox"] },
				},
				{
					name: "webkit",
					use: { ...devices["Desktop Safari"] },
				},
			],

	webServer: {
		command: "pnpm run dev",
		port: 5173,
		reuseExistingServer: !process.env.CI,
		timeout: 180 * 1000,
		env: {
			...process.env,
			NODE_ENV: "test"
		}
	},
});
