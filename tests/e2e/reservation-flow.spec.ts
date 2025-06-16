import { expect, test } from "@playwright/test";

test.describe("予約フロー（日本語ロケール）", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.waitForLoadState("networkidle");
		await page.waitForSelector("h1:has-text('レッスン体験申し込み')", {
			timeout: 10000,
		});
	});

	test("日本語の曜日名で週間タイムテーブルを表示", async ({ page }) => {
		// Check for Japanese day names in the timetable
		const japaneseDay = /[月火水木金土日]/;
		await expect(page.locator(".date-label").first()).toContainText(
			japaneseDay,
		);
	});

	test("利用可能なレッスンをクリックしたとき予約フォームを開く", async ({
		page,
	}) => {
		// Click on first available lesson
		const availableLesson = page.locator(".event:not(.past)").first();
		await availableLesson.click();

		// Check if form opens
		await expect(page.locator(".popup")).toBeVisible();

		// Check for Japanese form labels using more specific selectors
		await expect(
			page.locator("label").filter({ hasText: "氏名" }),
		).toBeVisible();
		await expect(
			page.locator("label").filter({ hasText: "メールアドレス" }),
		).toBeVisible();
		await expect(
			page.locator("label").filter({ hasText: "電話番号" }),
		).toBeVisible();
	});

	test("日本語エラーメッセージでフォームをバリデーション", async ({ page }) => {
		// Open reservation form
		const availableLesson = page.locator(".event:not(.past)").first();
		await availableLesson.click();

		// Wait for popup to open
		await expect(page.locator(".popup")).toBeVisible();

		// Check for validation message about second choice requirement
		await expect(
			page
				.locator(".validation-message")
				.filter({ hasText: "予約確定には第二希望の選択が必要です" }),
		).toBeVisible();
	});
});
