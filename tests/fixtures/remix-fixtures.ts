import { type Page, test as base } from "@playwright/test";
import { TestUtils } from "../utils/test-utils";

/**
 * Remix固有のテストフィクスチャ
 * PlaywrightのベーステストをRemixユーティリティで拡張
 */

type RemixFixtures = {
	testUtils: TestUtils;
	remixPage: Page;
};

/**
 * Remix固有のセットアップを含む拡張テスト
 */
export const test = base.extend<RemixFixtures>({
	// テストユーティリティのフィクスチャ
	testUtils: async ({ page }, use) => {
		const testUtils = new TestUtils(page);
		await use(testUtils);
	},

	// 日本語ロケール設定を含むRemixページフィクスチャ
	remixPage: async ({ page }, use) => {
		// 日本語ロケールコンテキストをセットアップ
		await page.addInitScript(() => {
			// 日本語の日付/時刻フォーマットを設定
			Object.defineProperty(window.navigator, "language", {
				value: "ja-JP",
				configurable: true,
			});
			Object.defineProperty(window.navigator, "languages", {
				value: ["ja-JP", "ja", "en-US", "en"],
				configurable: true,
			});
		});

		// 一貫したテストのためのビューポート設定
		await page.setViewportSize({ width: 1280, height: 720 });

		// 日本語コンテンツ用の追加ヘッダー
		await page.setExtraHTTPHeaders({
			"Accept-Language": "ja-JP,ja;q=0.9,en;q=0.8",
		});

		await use(page);
	},
});

/**
 * Remixサーバーアクションのモックを含むテストを作成
 */
function createMockedActionTest() {
	return test.extend({
		page: async ({ page }, use) => {
			// アプリケーションコンパイルの問題を避けるためにモックサービスを動的にインポート
			const { mockSendReservationEmails } = await import("../mocks/email.mock");

			// テスト用にRemixサーバーアクションをモック
			await page.route("**/reservation", async (route) => {
				if (route.request().method() === "POST") {
					try {
						// フォームデータをパース
						const body = await route.request().text();
						const params = new URLSearchParams(body);

						const formData = {
							applicant: {
								name: params.get("name") || "",
								email: params.get("email") || "",
								phone: params.get("phone") || "",
							},
							firstChoice: {
								title: params.get("firstChoice.title") || "",
								start: params.get("firstChoice.start") || "",
								end: params.get("firstChoice.end") || "",
								instructor: params.get("firstChoice.instructor") || "",
							},
							secondChoice: params.get("secondChoice.title")
								? {
										title: params.get("secondChoice.title") || "",
										start: params.get("secondChoice.start") || "",
										end: params.get("secondChoice.end") || "",
										instructor: params.get("secondChoice.instructor") || "",
									}
								: undefined,
						};

						// モックサービスを通して送信
						await mockSendReservationEmails(
							formData,
							{} as Record<string, unknown>,
						);

						// 成功した予約送信をモック
						await route.fulfill({
							status: 200,
							contentType: "application/json",
							body: JSON.stringify({
								success: true,
								message: "メール送信成功",
							}),
						});
					} catch (error) {
						await route.fulfill({
							status: 500,
							contentType: "application/json",
							body: JSON.stringify({
								success: false,
								message: "メール送信中にエラーが発生しました",
								error: error instanceof Error ? error.message : "不明なエラー",
							}),
						});
					}
				} else {
					await route.continue();
				}
			});

			await use(page);
		},
	});
}

/**
 * エラーシミュレーションを含むテストを作成
 */
function createErrorSimulationTest() {
	return test.extend({
		page: async ({ page }, use) => {
			// サーバーエラーをシミュレート
			await page.route("**/reservation", async (route) => {
				if (route.request().method() === "POST") {
					await route.fulfill({
						status: 500,
						contentType: "application/json",
						body: JSON.stringify({
							error: "サーバーエラーが発生しました",
						}),
					});
				} else {
					await route.continue();
				}
			});

			await use(page);
		},
	});
}

/**
 * ネットワーク遅延シミュレーションを含むテストを作成
 */
function createSlowNetworkTest() {
	return test.extend({
		page: async ({ page }, use) => {
			// 低速ネットワークをシミュレート
			await page.route("**/*", async (route) => {
				await new Promise((resolve) => setTimeout(resolve, 1000));
				await route.continue();
			});

			await use(page);
		},
	});
}

/**
 * Remix固有のテストヘルパー
 */
export const RemixTestHelpers = {
	createMockedActionTest,
	createErrorSimulationTest,
	createSlowNetworkTest,
};

export { expect } from "@playwright/test";
