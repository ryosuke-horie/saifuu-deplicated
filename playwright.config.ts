import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests/e2e",
	/* ファイル内のテストを並行実行 */
	fullyParallel: true,
	/* ソースコードにtest.onlyを誤って残した場合、CIでビルドを失敗させる */
	forbidOnly: !!process.env.CI,
	/* CIでのみリトライ */
	retries: process.env.CI ? 2 : 0,
	/* CIでの並行テストを無効化 */
	workers: process.env.CI ? 1 : undefined,
	/* 使用するレポーター。詳細: https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI ? "github" : "html",
	/* 以下のすべてのプロジェクトの共通設定。詳細: https://playwright.dev/docs/api/class-testoptions */
	use: {
		/* `await page.goto('/')`のようなアクションで使用するベースURL */
		baseURL: "http://localhost:5173",

		/* 失敗したテストをリトライする際にトレースを収集。詳細: https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		screenshot: "only-on-failure",
	},

	/* 主要ブラウザのプロジェクト設定 */
	projects: [
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

	/* テスト開始前にローカルの開発サーバーを起動 */
	webServer: {
		command: "pnpm run dev",
		url: "http://localhost:5173",
		reuseExistingServer: !process.env.CI,
		timeout: 120 * 1000, // 2分のタイムアウト
	},
});
