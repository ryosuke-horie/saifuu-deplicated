import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * タイムテーブルテスト操作用ユーティリティクラス
 * 一般的なタイムテーブル操作の再利用可能なメソッドを提供
 */
export class TimetableTestUtils {
	constructor(private page: Page) {}

	/**
	 * タイムテーブルが完全に読み込まれるまで待機
	 */
	async waitForTimetableLoad(): Promise<void> {
		await this.page.waitForSelector(".timeline-calendar", { state: "visible" });
		await this.page.waitForSelector('[data-testid="weekly-timetable"]', {
			state: "visible",
		});
		await this.page.waitForSelector(".day-column", { state: "visible" });
	}

	/**
	 * 現在の週表示テキストを取得
	 */
	async getCurrentWeekDisplay(): Promise<string> {
		const weekDisplay = this.page.locator(
			'[data-testid="current-week-display"]',
		);
		await expect(weekDisplay).toBeVisible();
		return (await weekDisplay.textContent()) || "";
	}

	/**
	 * 前の週にナビゲート
	 */
	async navigateToPreviousWeek(): Promise<void> {
		await this.page.locator('[data-testid="prev-week-button"]').click();
		await this.page.waitForTimeout(500);
	}

	/**
	 * 次の週にナビゲート
	 */
	async navigateToNextWeek(): Promise<void> {
		await this.page.locator('[data-testid="next-week-button"]').click();
		await this.page.waitForTimeout(500);
	}

	/**
	 * 利用可能な（過去ではない）レッスンをすべて取得
	 */
	getAvailableLessons(): Locator {
		return this.page.locator(".event:not(.past)");
	}

	/**
	 * Get all past lessons
	 */
	getPastLessons(): Locator {
		return this.page.locator(".event.past");
	}

	/**
	 * Get all day columns
	 */
	getDayColumns(): Locator {
		return this.page.locator(".day-column");
	}

	/**
	 * Click on the first available lesson
	 */
	async clickFirstAvailableLesson(): Promise<void> {
		const availableLesson = this.getAvailableLessons().first();
		await availableLesson.click();
	}

	/**
	 * Click on a specific lesson by index
	 */
	async clickLessonByIndex(index: number): Promise<void> {
		const lesson = this.getAvailableLessons().nth(index);
		await lesson.click();
	}

	/**
	 * Get lesson details (title and time) for a specific lesson
	 */
	async getLessonDetails(
		lessonIndex: number,
	): Promise<{ title: string; time: string }> {
		const lesson = this.getAvailableLessons().nth(lessonIndex);
		const title = (await lesson.locator(".event-title").textContent()) || "";
		const time = (await lesson.locator(".event-time").textContent()) || "";
		return { title, time };
	}

	/**
	 * Open popup for lesson selection
	 */
	async openLessonPopup(lessonIndex = 0): Promise<void> {
		await this.clickLessonByIndex(lessonIndex);
		await expect(this.page.locator(".popup")).toBeVisible();
	}

	/**
	 * Close the popup using the cancel button
	 */
	async closePopup(): Promise<void> {
		await this.page.locator("button.cancel-button").click();
		await expect(this.page.locator(".popup")).not.toBeVisible();
	}

	/**
	 * Enable second choice selection mode
	 */
	async enableSecondChoiceMode(): Promise<void> {
		await this.page.locator("button:has-text('第二希望を選択する')").click();
		// Popup closes automatically after enabling second choice mode
		await expect(this.page.locator(".popup")).not.toBeVisible();
		await expect(this.page.locator(".selection-mode-indicator")).toBeVisible();
	}

	/**
	 * Clear all selections (must be called when popup is open)
	 */
	async clearSelections(): Promise<void> {
		// Ensure popup is open before clearing
		await expect(this.page.locator(".popup")).toBeVisible();
		await this.page.locator("button.cancel-button").click();
		await expect(this.page.locator(".popup")).not.toBeVisible();
		await expect(
			this.page.locator(".selection-mode-indicator"),
		).not.toBeVisible();
	}

	/**
	 * Check if selection mode indicator is visible
	 */
	async isSelectionModeActive(): Promise<boolean> {
		const indicator = this.page.locator(".selection-mode-indicator");
		return await indicator.isVisible();
	}

	/**
	 * Get the count of available lessons
	 */
	async getAvailableLessonCount(): Promise<number> {
		return await this.getAvailableLessons().count();
	}

	/**
	 * Get the count of past lessons
	 */
	async getPastLessonCount(): Promise<number> {
		return await this.getPastLessons().count();
	}

	/**
	 * Verify timetable structure is correct
	 */
	async verifyTimetableStructure(): Promise<void> {
		// Check main containers
		await expect(this.page.locator(".timeline-calendar")).toBeVisible();
		await expect(this.page.locator(".days-container")).toBeVisible();

		// Check day columns (should be 7 for a week)
		await expect(this.getDayColumns()).toHaveCount(7);

		// Check week navigation
		await expect(
			this.page.locator("button[aria-label='前の週']"),
		).toBeVisible();
		await expect(
			this.page.locator("button[aria-label='次の週']"),
		).toBeVisible();
		await expect(this.page.locator(".week-display")).toBeVisible();
	}

	/**
	 * Verify lesson accessibility attributes
	 */
	async verifyLessonAccessibility(): Promise<void> {
		const lessons = this.getAvailableLessons();
		const count = await lessons.count();

		if (count > 0) {
			const firstLesson = lessons.first();
			await expect(firstLesson).toHaveAttribute("role", "button");
			await expect(firstLesson).toHaveAttribute("tabindex", "0");
		}
	}

	/**
	 * Navigate multiple weeks forward
	 */
	async navigateWeeksForward(count: number): Promise<void> {
		for (let i = 0; i < count; i++) {
			await this.navigateToNextWeek();
		}
	}

	/**
	 * Navigate multiple weeks backward
	 */
	async navigateWeeksBackward(count: number): Promise<void> {
		for (let i = 0; i < count; i++) {
			await this.navigateToPreviousWeek();
		}
	}

	/**
	 * Test keyboard navigation on a lesson
	 */
	async testLessonKeyboardNavigation(key: "Enter" | "Space"): Promise<void> {
		const lessons = this.getAvailableLessons();
		const count = await lessons.count();

		if (count > 0) {
			const firstLesson = lessons.first();
			await firstLesson.focus();
			await expect(firstLesson).toBeFocused();

			await this.page.keyboard.press(key);
			await expect(this.page.locator(".popup")).toBeVisible();
		}
	}

	/**
	 * Set viewport to mobile size
	 */
	async setMobileViewport(): Promise<void> {
		await this.page.setViewportSize({ width: 375, height: 667 });
	}

	/**
	 * Set viewport to tablet size
	 */
	async setTabletViewport(): Promise<void> {
		await this.page.setViewportSize({ width: 768, height: 1024 });
	}

	/**
	 * Set viewport to desktop size
	 */
	async setDesktopViewport(): Promise<void> {
		await this.page.setViewportSize({ width: 1200, height: 800 });
	}

	/**
	 * Verify horizontal scrolling works on mobile
	 */
	async verifyHorizontalScrolling(): Promise<void> {
		const daysContainer = this.page.locator(".days-container");
		await expect(daysContainer).toHaveCSS("overflow-x", "auto");

		// Test actual scrolling
		await daysContainer.scroll({ left: 100 });
	}

	/**
	 * Verify popup is properly sized for current viewport
	 */
	async verifyPopupResponsiveness(): Promise<void> {
		const popup = this.page.locator(".popup");
		await expect(popup).toBeVisible();

		const viewport = this.page.viewportSize();
		if (viewport) {
			const popupBox = await popup.boundingBox();
			expect(popupBox?.width).toBeLessThanOrEqual(viewport.width);
		}
	}

	/**
	 * Wait for page to stabilize after navigation
	 */
	async waitForStabilization(timeout = 500): Promise<void> {
		await this.page.waitForTimeout(timeout);
	}

	/**
	 * Verify week display format is correct
	 */
	async verifyWeekDisplayFormat(): Promise<void> {
		const weekText = await this.getCurrentWeekDisplay();
		expect(weekText).toMatch(
			/\d{4}\/\d{1,2}\/\d{1,2} - \d{4}\/\d{1,2}\/\d{1,2}/,
		);
	}

	/**
	 * Verify Japanese day names are displayed
	 */
	async verifyJapaneseDayNames(): Promise<void> {
		const dayLabels = this.page.locator(".date-label");
		await expect(dayLabels).toHaveCount(7);

		const firstDayLabel = await dayLabels.first().textContent();
		expect(firstDayLabel).toMatch(/[日月火水木金土]/);
	}

	/**
	 * Perform rapid navigation test
	 */
	async performRapidNavigationTest(): Promise<void> {
		// Rapid navigation
		await this.navigateToNextWeek();
		await this.navigateToPreviousWeek();
		await this.navigateToNextWeek();

		// Wait for stabilization
		await this.waitForStabilization(1000);

		// Verify timetable is still functional
		await this.verifyTimetableStructure();
	}
}

/**
 * Timetable test data and constants
 */
export const TimetableTestData = {
	// Common selectors
	selectors: {
		timetableContainer: ".timeline-calendar",
		daysContainer: ".days-container",
		dayColumn: ".day-column",
		availableLesson: ".event:not(.past)",
		pastLesson: ".event.past",
		popup: ".popup",
		weekDisplay: ".week-display",
		prevWeekButton: "button[aria-label='前の週']",
		nextWeekButton: "button[aria-label='次の週']",
		selectionModeIndicator: ".selection-mode-indicator",
		cancelButton: "button.cancel-button",
		secondChoiceButton: "button:has-text('第二希望を選択する')",
		clearSelectionButton: "button.cancel-button",
	},

	// Viewport sizes for responsive testing
	viewports: {
		mobile: { width: 375, height: 667 },
		tablet: { width: 768, height: 1024 },
		desktop: { width: 1200, height: 800 },
		smallMobile: { width: 320, height: 568 },
	},

	// Test timeouts
	timeouts: {
		navigation: 500,
		stabilization: 1000,
		popup: 300,
	},

	// Expected Japanese day names
	japaneseWeekdays: ["日", "月", "火", "水", "木", "金", "土"],

	// CSS properties to verify
	cssProperties: {
		pastLessonOpacity: "0.5",
		pastLessonPointerEvents: "none",
		daysContainerOverflow: "auto",
	},
};

/**
 * Helper function to create a TimetableTestUtils instance
 */
export function createTimetableTestUtils(page: Page): TimetableTestUtils {
	return new TimetableTestUtils(page);
}
