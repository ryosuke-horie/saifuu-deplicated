import { defineConfig, devices } from "@playwright/test";

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
	testDir: "./tests/e2e",
	/* ファイル内のテストを並行実行 */
	fullyParallel: true,
	/* ソースコードにtest.onlyを誘って残した場合、CIでビルドを失敗させる */
	forbidOnly: !!process.env.CI,
	/* CIでのみリトライ */
	retries: process.env.CI ? 2 : 0,
	/* CIでの並行テストを無効化 */
	workers: process.env.CI ? 1 : undefined,
	/* 使用するレポーター。詳細: https://playwright.dev/docs/test-reporters */
	reporter: process.env.CI
		? [
				["github"],
				["html", { open: "never", outputFolder: "playwright-report" }],
				["junit", { outputFile: "test-results/junit.xml" }],
			]
		: "html",
	/* 以下のすべてのプロジェクトの共通設定。詳細: https://playwright.dev/docs/api/class-testoptions */
	use: {
		/* `await page.goto('/')`のようなアクションで使用するベースURL */
		baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173",

		/* 失敗したテストをリトライする際にトレースを収集。詳細: https://playwright.dev/docs/trace-viewer */
		trace: "on-first-retry",
		screenshot: "only-on-failure",

		/* ヒデズキックジムの日本語ロケールサポート */
		locale: "ja-JP",
		timezoneId: "Asia/Tokyo",

		/* ナビゲーション完了とみなす前にネットワークがアイドルになるまで待機 */
		// waitForNavigation: "networkidle", // このオプションは非推奨

		/* ダウンロードを許可（レポートダウンロードのテストがある場合） */
		acceptDownloads: true,

		/* 失敗時のビデオ録画を有効化 */
		video: "retain-on-failure",

		/* HTTPSエラーを無視（自己署名証明書でのテスト用） */
		ignoreHTTPSErrors: false,

		/* 一貫したテストのためのユーザーエージェント設定 */
		userAgent: "PlaywrightTests/1.0 (Remix-Timetable-App)",

		/* Extra HTTP headers for all requests */
		extraHTTPHeaders: {
			"Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
		},
	},

	/* Configure projects for major browsers */
	projects: process.env.CI
		? [
				// CI environment - focus on Chromium for faster execution
				{
					name: "chromium",
					use: {
						...devices["Desktop Chrome"],
						/* Remix-specific browser settings */
						contextOptions: {
							// Permissions for geolocation if needed
							permissions: ["geolocation"],
							// Japanese locale settings
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},
				{
					name: "firefox",
					use: {
						...devices["Desktop Firefox"],
						contextOptions: {
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},
			]
		: [
				// Development environment - all browsers
				{
					name: "chromium",
					use: {
						...devices["Desktop Chrome"],
						/* Remix-specific browser settings */
						contextOptions: {
							// Permissions for geolocation if needed
							permissions: ["geolocation"],
							// Japanese locale settings
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},

				{
					name: "firefox",
					use: {
						...devices["Desktop Firefox"],
						contextOptions: {
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},

				{
					name: "webkit",
					use: {
						...devices["Desktop Safari"],
						contextOptions: {
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},

				/* Test against mobile viewports for Remix responsive design */
				{
					name: "Mobile Chrome",
					use: {
						...devices["Pixel 5"],
						contextOptions: {
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},
				{
					name: "Mobile Safari",
					use: {
						...devices["iPhone 12"],
						contextOptions: {
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},

				/* Remix development testing project */
				{
					name: "remix-dev",
					use: {
						...devices["Desktop Chrome"],
						baseURL: "http://localhost:5173",
						contextOptions: {
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},

				/* Remix production testing project (for staging/production) */
				{
					name: "remix-prod",
					use: {
						...devices["Desktop Chrome"],
						baseURL:
							process.env.PLAYWRIGHT_PROD_BASE_URL ||
							"https://timetable-hideskick.net",
						contextOptions: {
							locale: "ja-JP",
							timezoneId: "Asia/Tokyo",
						},
					},
				},

				/* Test against branded browsers. */
				// {
				//   name: 'Microsoft Edge',
				//   use: { ...devices['Desktop Edge'], channel: 'msedge' },
				// },
				// {
				//   name: 'Google Chrome',
				//   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
				// },
			],

	/* Global test setup and teardown */
	globalSetup: "./tests/global-setup.ts",
	globalTeardown: "./tests/global-teardown.ts",

	/* Run your local Remix dev server before starting the tests */
	webServer: process.env.CI
		? [
				{
					// CI environment - serve the built application
					command: "pnpm run preview",
					url: "http://localhost:5173",
					reuseExistingServer: false,
					timeout: 180 * 1000, // 3 minutes timeout for CI
					env: {
						NODE_ENV: "production",
						CI: "true",
						// Mock email service environment variables for testing
						AWS_ACCESS_KEY_ID: "test-access-key",
						AWS_SECRET_ACCESS_KEY: "test-secret-key",
						SES_FROM_EMAIL: "no-reply@timetable-hideskick.net",
						AWS_REGION: "ap-northeast-1",
						USE_MOCK_EMAIL: "true",
					},
				},
			]
		: [
				{
					// Development environment - run dev server
					command: "pnpm run dev",
					url: "http://localhost:5173",
					reuseExistingServer: !process.env.CI,
					timeout: 120 * 1000, // 2 minutes timeout for Remix dev server
					env: {
						NODE_ENV: "development",
						// Disable HMR refresh during tests
						REMIX_DEV_NO_RESTART: "1",
						// Mock email service environment variables for testing
						AWS_ACCESS_KEY_ID: "test-access-key",
						AWS_SECRET_ACCESS_KEY: "test-secret-key",
						SES_FROM_EMAIL: "no-reply@timetable-hideskick.net",
						AWS_REGION: "ap-northeast-1",
						USE_MOCK_EMAIL: "true",
					},
				},
			],

	/* Test timeout and expect settings */
	timeout: 30 * 1000, // 30 seconds
	expect: {
		/* Maximum time expect() should wait for the condition to be met */
		timeout: 10 * 1000,
		/* Threshold for screenshots comparison */
		toHaveScreenshot: {
			threshold: 0.2,
		},
	},

	/* Output directory for test results */
	outputDir: "./test-results/",

	/* Maximum number of failures before stopping the test suite */
	maxFailures: process.env.CI ? 10 : undefined,
});
