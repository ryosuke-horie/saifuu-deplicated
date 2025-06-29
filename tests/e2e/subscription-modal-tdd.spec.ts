import { expect, test } from "@playwright/test";

/**
 * TDDアプローチによるサブスクリプション新規作成モーダルのE2Eテスト
 *
 * 設計方針（t-wada TDD）：
 * 1. RED: 失敗するテストを先に書く
 * 2. GREEN: テストを通すための最小限の実装
 * 3. REFACTOR: コードを改善する
 *
 * テストシナリオ：
 * 1. 新規サブスクリプションボタンをクリック
 * 2. モーダルが表示される
 * 3. フォームに入力
 * 4. 送信してサブスクリプションが作成される
 * 5. 一覧に反映される
 */

test.describe("サブスクリプション新規作成フロー（TDD）", () => {
	test.beforeEach(async ({ page }) => {
		// テスト前にサブスクリプション管理ページに移動
		await page.goto("/subscriptions");

		// ページが完全に読み込まれるまで待機
		await page.waitForLoadState("networkidle");
		await expect(page.locator("text=サブスクリプション管理")).toBeVisible();
	});

	test("RED: 新規サブスクリプションボタンをクリックするとモーダルが表示される", async ({
		page,
	}) => {
		// STEP 1: ヘッダーの新規サブスクリプションボタンをクリック（2つあるうちの最初のもの）
		const newSubscriptionButton = page
			.locator("button", {
				hasText: "新規サブスクリプション",
			})
			.first();

		await expect(newSubscriptionButton).toBeVisible();
		await newSubscriptionButton.click();

		// STEP 2: モーダルが表示されることを確認
		const modal = page.locator('[role="dialog"]');
		await expect(modal).toBeVisible({ timeout: 5000 });

		// モーダルタイトルの確認
		await expect(page.locator("text=新規サブスクリプション登録")).toBeVisible();

		// 必要なフォームフィールドが表示されることを確認
		await expect(page.locator('label:has-text("カテゴリ")')).toBeVisible();
		await expect(page.locator('label:has-text("サービス名")')).toBeVisible();
		await expect(page.locator('label:has-text("金額")')).toBeVisible();
		await expect(page.locator('label:has-text("請求頻度")')).toBeVisible();
		await expect(page.locator('label:has-text("次回支払日")')).toBeVisible();
	});

	test("RED: フォームに入力して送信するとサブスクリプションが作成される", async ({
		page,
	}) => {
		// STEP 1: モーダルを開く
		await page
			.locator("button", { hasText: "新規サブスクリプション" })
			.first()
			.click();
		await expect(page.locator('[role="dialog"]')).toBeVisible();

		// STEP 2: フォームに入力
		// カテゴリを選択
		await page.locator('select[id="categoryId"]').selectOption({ index: 1 }); // 最初の有効なオプション

		// サービス名を入力
		await page.locator('input[id="name"]').fill("Netflix テスト");

		// 金額を入力
		await page.locator('input[id="amount"]').fill("1980");

		// 請求頻度を選択
		await page.locator('select[id="frequency"]').selectOption("monthly");

		// 次回支払日を入力
		const nextMonth = new Date();
		nextMonth.setMonth(nextMonth.getMonth() + 1);
		const nextPaymentDate = nextMonth.toISOString().split("T")[0];
		await page.locator('input[id="nextPaymentDate"]').fill(nextPaymentDate);

		// STEP 3: 送信ボタンをクリック
		const submitButton = page.locator('button[type="submit"]', {
			hasText: "登録",
		});
		await expect(submitButton).toBeVisible();
		await submitButton.click();

		// STEP 4: モーダルが閉じることを確認
		await expect(page.locator('[role="dialog"]')).toBeHidden({
			timeout: 10000,
		});

		// STEP 5: 新しいサブスクリプションが一覧に表示されることを確認
		await expect(page.locator("text=Netflix テスト")).toBeVisible({
			timeout: 10000,
		});

		// 金額が正しく表示されることを確認
		await expect(page.locator("text=¥1,980")).toBeVisible();
	});

	test("RED: モーダルの外をクリックするとモーダルが閉じる", async ({
		page,
	}) => {
		// STEP 1: モーダルを開く
		await page
			.locator("button", { hasText: "新規サブスクリプション" })
			.first()
			.click();
		await expect(page.locator('[role="dialog"]')).toBeVisible();

		// STEP 2: モーダルの外（バックドロップ）をクリック
		const backdrop = page.locator(".fixed.inset-0.bg-black.bg-opacity-50");
		await backdrop.click({ position: { x: 10, y: 10 } }); // 左上をクリック

		// STEP 3: モーダルが閉じることを確認
		await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });
	});

	test("RED: ESCキーでモーダルが閉じる", async ({ page }) => {
		// STEP 1: モーダルを開く
		await page
			.locator("button", { hasText: "新規サブスクリプション" })
			.first()
			.click();
		await expect(page.locator('[role="dialog"]')).toBeVisible();

		// STEP 2: ESCキーを押す
		await page.keyboard.press("Escape");

		// STEP 3: モーダルが閉じることを確認
		await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });
	});

	test("RED: 閉じるボタンでモーダルが閉じる", async ({ page }) => {
		// STEP 1: モーダルを開く
		await page
			.locator("button", { hasText: "新規サブスクリプション" })
			.first()
			.click();
		await expect(page.locator('[role="dialog"]')).toBeVisible();

		// STEP 2: 閉じるボタンをクリック
		const closeButton = page
			.locator('button[type="button"]')
			.filter({
				has: page.locator("svg"), // SVGアイコンを含むボタンを特定
			})
			.first();
		await closeButton.click();

		// STEP 3: モーダルが閉じることを確認
		await expect(page.locator('[role="dialog"]')).toBeHidden({ timeout: 5000 });
	});
});
