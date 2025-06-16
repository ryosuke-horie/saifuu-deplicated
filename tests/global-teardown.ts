import type { FullConfig } from "@playwright/test";

/**
 * Remixアプリケーションテスト用のグローバルティアダウン
 * すべてのテスト完了後にクリーンアップを実行
 */
async function globalTeardown(config: FullConfig) {
	console.log("🧹 Starting global teardown for Remix application...");

	// テスト完了統計をログ出力
	const baseURL = config.use?.baseURL || "http://localhost:5173";
	console.log(`🌐 Tests completed for: ${baseURL}`);

	// 必要に応じてテスト成果物をクリーンアップ
	try {
		// クリーンアップ活動をログ出力
		if (process.env.PLAYWRIGHT_GLOBAL_SETUP_COMPLETED) {
			console.log("✅ Global setup was completed successfully");
		}

		// ここに追加のクリーンアップを追加できます、例えば:
		// - テストデータベースのクリア
		// - アップロードされたテストファイルの削除
		// - テスト完了通知の送信
		// - 一時ディレクトリのクリーンアップ

		console.log("✅ Global teardown completed successfully");
	} catch (error) {
		console.error("❌ Global teardown failed:", error);
		// テスト結果を隠さないようにここではエラーをスローしない
	}
}

export default globalTeardown;
