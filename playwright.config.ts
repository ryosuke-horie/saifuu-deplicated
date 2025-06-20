import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright設定ファイル
 * E2Eテストの実行環境とプロジェクト設定を定義
 *
 * 設計判断：
 * - ポート5173: Vite開発サーバーのデフォルトポート
 * - レトライ: CI環境でのみ有効化してローカルデバッグを効率化
 * - Trace: 失敗時のみ取得してストレージ容量を節約
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
	reporter: [["html"], ["junit", { outputFile: "test-results/junit.xml" }]],

	use: {
		baseURL: "http://localhost:5173",
		trace: "on-first-retry",
		screenshot: "only-on-failure",
		video: "retain-on-failure",
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
		timeout: 120 * 1000,
	},
});
