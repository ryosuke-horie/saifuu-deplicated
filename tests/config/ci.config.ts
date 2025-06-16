/**
 * CI-specific Playwright configuration
 * This configuration is used when running tests in CI environments
 */

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "../e2e",
	/* Run tests in files in parallel */
	fullyParallel: false, // Disable in CI for stability
	/* Fail the build on CI if you accidentally left test.only in the source code. */
	forbidOnly: true,
	/* Retry on CI */
	retries: 3,
	/* Single worker in CI for stability */
	workers: 1,
	/* Reporter to use in CI */
	reporter: [
		["github"],
		["html", { open: "never", outputFolder: "playwright-report" }],
		["junit", { outputFile: "test-results/junit.xml" }],
		["json", { outputFile: "test-results/results.json" }],
	],
	/* Shared settings for CI */
	use: {
		/* Base URL for CI tests */
		baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173",

		/* Collect trace on failure for CI debugging */
		trace: "retain-on-failure",
		screenshot: "only-on-failure",

		/* Japanese locale support */
		locale: "ja-JP",
		timezoneId: "Asia/Tokyo",

		/* Accept downloads */
		acceptDownloads: true,

		/* Enable video recording on failure */
		video: "retain-on-failure",

		/* Ignore HTTPS errors for CI */
		ignoreHTTPSErrors: false,

		/* Set user agent for CI */
		userAgent: "PlaywrightTests-CI/1.0 (Remix-Timetable-App)",

		/* Extra HTTP headers */
		extraHTTPHeaders: {
			"Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
		},
	},

	/* CI-optimized browser projects */
	projects: [
		{
			name: "ci-chromium",
			use: {
				...devices["Desktop Chrome"],
				/* CI-specific browser settings */
				launchOptions: {
					// Chromium flags for CI stability
					args: [
						"--no-sandbox",
						"--disable-setuid-sandbox",
						"--disable-dev-shm-usage",
						"--disable-web-security",
						"--disable-features=TranslateUI",
						"--disable-ipc-flooding-protection",
					],
				},
				contextOptions: {
					permissions: ["geolocation"],
					locale: "ja-JP",
					timezoneId: "Asia/Tokyo",
				},
			},
		},
		{
			name: "ci-firefox",
			use: {
				...devices["Desktop Firefox"],
				launchOptions: {
					firefoxUserPrefs: {
						"intl.accept_languages": "ja-JP,ja,en",
						"intl.locale.requested": "ja-JP",
					},
				},
				contextOptions: {
					locale: "ja-JP",
					timezoneId: "Asia/Tokyo",
				},
			},
		},
	],

	/* Global test setup and teardown for CI */
	globalSetup: "../global-setup.ts",
	globalTeardown: "../global-teardown.ts",

	/* Web server configuration for CI */
	webServer: {
		// Serve the built application using React Router dev server for CI
		command: "pnpm run dev",
		url: "http://localhost:5173",
		reuseExistingServer: false,
		timeout: 120 * 1000, // 2 minutes timeout for CI (reduced from 5 minutes)
		env: {
			NODE_ENV: "development",
			CI: "true",
		},
	},

	/* CI-specific timeout settings */
	timeout: 60 * 1000, // 60 seconds for CI
	expect: {
		timeout: 15 * 1000, // 15 seconds for assertions
		toHaveScreenshot: {
			threshold: 0.3, // More lenient for CI environment differences
			maxDiffPixels: 500,
		},
	},

	/* Output directory */
	outputDir: "./test-results/",

	/* Stop after 5 failures in CI */
	maxFailures: 5,

	/* Preserve output on CI */
	preserveOutput: "failures-only",
});
