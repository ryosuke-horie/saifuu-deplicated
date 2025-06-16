import { type FullConfig, chromium } from "@playwright/test";
import {
	createPlaywrightTestEnvironment,
	validateTestEnvironment,
} from "./config/test-environment";
import { TestEnvironmentUtils } from "./utils/test-utils";

/**
 * Remixアプリケーションテスト用のグローバルセットアップ
 * すべてのテスト実行前に一度だけ実行するセットアップ
 */
async function globalSetup(config: FullConfig) {
	console.log("🎭 Setting up Playwright for Remix application...");

	// テスト環境変数をセットアップ
	console.log("🔧 Configuring test environment...");
	const testEnv = createPlaywrightTestEnvironment();
	for (const [key, value] of Object.entries(testEnv)) {
		process.env[key] = value;
	}

	// テスト環境を検証
	const validation = validateTestEnvironment();
	if (!validation.isValid) {
		console.error("❌ Test environment validation failed:", validation.errors);
		throw new Error(
			`Test environment validation failed: ${validation.errors.join(", ")}`,
		);
	}

	// テスト環境とモックサービスを初期化
	try {
		await TestEnvironmentUtils.setupTestEnvironment("e2e");
		console.log("✅ Test environment and mock services initialized");
	} catch (error) {
		console.error("❌ Failed to initialize test environment:", error);
		throw error;
	}

	// 設定からベースURLを取得
	const baseURL = config.use?.baseURL || "http://localhost:5173";
	console.log(`🌐 Base URL: ${baseURL}`);

	// テスト前チェック用のブラウザを起動
	const browser = await chromium.launch();
	const context = await browser.newContext({
		locale: "ja-JP",
		timezoneId: "Asia/Tokyo",
	});
	const page = await context.newPage();

	try {
		// Remixの開発サーバーが準備完了するまで待機
		console.log("🔄 Waiting for Remix dev server...");
		await page.goto(baseURL, { waitUntil: "networkidle" });

		// アプリケーションが正しく読み込まれるかチェック
		const title = await page.title();
		console.log(`📄 Page title: ${title}`);

		// 日本語ロケールが機能しているか確認
		const bodyText = await page.textContent("body");
		if (
			bodyText &&
			/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(bodyText)
		) {
			console.log("✅ Japanese locale detected");
		} else {
			console.warn("⚠️  Japanese locale not detected");
		}

		// Remixのハイドレーションをチェック（クライアントサイドの場合）
		await page
			.waitForFunction(() => window.location.pathname !== null, {
				timeout: 5000,
			})
			.catch(() => {
				console.warn(
					"⚠️  Remixハイドレーションチェックがタイムアウト（SSRでは正常な場合があります）",
				);
			});

		console.log("✅ Remix application is ready for testing");
	} catch (error) {
		console.error("❌ Global setup failed:", error);
		throw error;
	} finally {
		await browser.close();
	}

	// テスト用の環境変数を設定
	process.env.PLAYWRIGHT_GLOBAL_SETUP_COMPLETED = "true";

	console.log("🎯 Test environment configuration:");
	console.log("  - NODE_ENV:", process.env.NODE_ENV);
	console.log("  - MOCK_EMAIL_SENDING:", process.env.MOCK_EMAIL_SENDING);
	console.log("  - AWS_REGION:", process.env.AWS_REGION);
	console.log("  - TZ:", process.env.TZ);

	return async () => {
		// クリーンアップ関数（全テスト終了後に実行）
		console.log("🧹 Starting global cleanup...");

		try {
			await TestEnvironmentUtils.teardownTestEnvironment();
			console.log("✅ Test environment cleanup completed");
		} catch (error) {
			console.error("❌ Test environment cleanup failed:", error);
		}

		console.log("🧹 Global setup cleanup completed");
	};
}

export default globalSetup;
