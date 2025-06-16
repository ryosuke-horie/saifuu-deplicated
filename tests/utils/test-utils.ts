import type { Locator, Page } from "@playwright/test";
import { testEnvironmentManager } from "../config/test-environment";
import {
	createFormData,
	testScenarios,
	type validFormData,
} from "../fixtures/test-data";
import {
	type MockEmailConfig,
	clearMockEmails as clearEmailMocks,
	configureMockEmail,
	getMockEmailStats,
	getMockEmails,
} from "../mocks/email.mock";

/**
 * 日本語ロケールサポートを含むRemixアプリケーションE2Eテスト用拡張ユーティリティ
 */
export class TestUtils {
	constructor(private page: Page) {}

	/**
	 * Remixハイドレーションの完了を待機
	 */
	async waitForRemixHydration() {
		// Reactのハイドレーションを待機（Remix固有）
		await this.page
			.waitForFunction(
				() => {
					// 一般的なRemixパターンを探してReactがハイドレートされたかチェック
					return (
						window.location.pathname !== null &&
						document.querySelector("[data-testid]") !== null
					);
				},
				{ timeout: 5000 },
			)
			.catch(() => {
				// ハイドレーションチェックはオプショナル、SSRでは不要な場合がある
				console.log(
					"注記: Remixハイドレーションチェックがタイムアウト（SSRでは正常）",
				);
			});
	}

	/**
	 * 日本語の日付/時刻コンテンツの読み込みを待機
	 */
	async waitForJapaneseContent() {
		// 日本語の曜日名の表示を待機
		await this.page.waitForSelector("text=/月|火|水|木|金|土|日/");
		// Remixハイドレーションも待機
		await this.waitForRemixHydration();
	}

	/**
	 * Navigate using Remix router (client-side navigation)
	 */
	async navigateWithRemix(path: string) {
		// Use Remix's client-side navigation if available
		const hasRemixRouter = await this.page.evaluate(() => {
			return typeof window !== "undefined" && "history" in window;
		});

		if (hasRemixRouter) {
			// Trigger client-side navigation
			await this.page.click(`a[href="${path}"]`).catch(async () => {
				// Fallback to direct navigation
				await this.page.goto(path);
			});
		} else {
			await this.page.goto(path);
		}

		await this.waitForRemixHydration();
	}

	/**
	 * Navigate to the home page
	 */
	async goToHome() {
		await this.page.goto("/");
		await this.page.waitForLoadState("networkidle");
		await this.waitForRemixHydration();
	}

	/**
	 * Get lesson slot by Japanese day and time
	 */
	getLessonSlot(day: string, time: string): Locator {
		return this.page.locator(`[data-day="${day}"][data-time="${time}"]`);
	}

	/**
	 * Fill out the reservation form with test data
	 */
	async fillReservationForm(
		scenarioKey:
			| keyof typeof testScenarios.happyPath
			| keyof typeof testScenarios.validation,
		customData?: Partial<(typeof validFormData)[keyof typeof validFormData]>,
	) {
		const scenario =
			testScenarios.happyPath[
				scenarioKey as keyof typeof testScenarios.happyPath
			] ||
			testScenarios.validation[
				scenarioKey as keyof typeof testScenarios.validation
			];

		if (!scenario) {
			throw new Error(`Test scenario '${String(scenarioKey)}' not found`);
		}

		const data = customData ? { ...scenario, ...customData } : scenario;

		// Wait for form to be interactive
		await this.page.waitForSelector('[data-testid="reservation-form"]', {
			state: "visible",
			timeout: 10000,
		});

		// Fill applicant information
		await this.page.fill('[data-testid="name-input"]', data.applicant.name);
		await this.page.fill('[data-testid="email-input"]', data.applicant.email);
		await this.page.fill('[data-testid="phone-input"]', data.applicant.phone);

		// Select first choice lesson
		if (data.firstChoice) {
			await this.selectLesson("first", data.firstChoice);
		}

		// Select second choice lesson (if provided)
		if (data.secondChoice) {
			await this.selectLesson("second", data.secondChoice);
		}
	}

	/**
	 * Legacy method for backward compatibility
	 */
	async fillReservationFormLegacy(data: {
		name?: string;
		email?: string;
		phone?: string;
		firstChoice?: { day: string; time: string };
		secondChoice?: { day: string; time: string };
	}) {
		// Wait for form to be interactive
		await this.page.waitForSelector('[data-testid="reservation-form"]', {
			state: "visible",
		});

		if (data.name) {
			await this.page.fill('[data-testid="name-input"]', data.name);
		}
		if (data.email) {
			await this.page.fill('[data-testid="email-input"]', data.email);
		}
		if (data.phone) {
			await this.page.fill('[data-testid="phone-input"]', data.phone);
		}
		// Add more form fields as needed
	}

	/**
	 * Select a lesson from the timetable
	 */
	async selectLesson(
		choice: "first" | "second",
		lessonData: {
			title: string;
			start: string;
			end: string;
			instructor: string;
		},
	) {
		// Wait for timetable to load
		await this.page.waitForSelector('[data-testid="weekly-timetable"]', {
			timeout: 10000,
		});

		// Find and click the lesson based on title and time
		const lessonSelector = `[data-testid="lesson-${lessonData.title}"][data-start="${lessonData.start}"]`;
		await this.page.click(lessonSelector);

		// Wait for selection to be processed
		await this.page.waitForTimeout(500);

		// Verify selection was made
		const selectedElement = await this.page.locator(
			`${lessonSelector}.selected`,
		);
		if (!(await selectedElement.isVisible())) {
			throw new Error(
				`Failed to select lesson: ${lessonData.title} at ${lessonData.start}`,
			);
		}
	}

	/**
	 * Submit form and wait for Remix action to complete
	 */
	async submitFormAndWaitForResponse() {
		// Listen for navigation or action response
		const responsePromise = this.page
			.waitForResponse(
				(response) => response.url().includes("/") && response.status() === 200,
			)
			.catch(() => null); // Don't fail if no network request

		// Submit the form
		await this.page.click('[data-testid="submit-button"]');

		// Wait for either navigation or response
		await Promise.race([
			responsePromise,
			this.page.waitForNavigation({ waitUntil: "networkidle" }).catch(() => {}),
			this.page
				.waitForSelector(
					'[data-testid="success-message"], [data-testid="error-message"]',
					{
						timeout: 10000,
					},
				)
				.catch(() => {}),
		]);
	}

	/**
	 * Submit the reservation form
	 */
	async submitReservationForm() {
		await this.page.click(
			'button[type="submit"][data-testid="submit-reservation"]',
		);
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Check for success message
	 */
	async expectSuccessMessage(timeout = 10000) {
		await this.page.waitForSelector('[data-testid="success-message"]', {
			timeout,
		});
		return await this.page.textContent('[data-testid="success-message"]');
	}

	/**
	 * Check for error message
	 */
	async expectErrorMessage(timeout = 10000) {
		await this.page.waitForSelector('[data-testid="error-message"]', {
			timeout,
		});
		return await this.page.textContent('[data-testid="error-message"]');
	}

	/**
	 * Check for validation errors
	 */
	async getValidationErrors(): Promise<string[]> {
		const errorElements = await this.page
			.locator('[data-testid^="validation-error"]')
			.all();
		const errors: string[] = [];

		for (const element of errorElements) {
			const text = await element.textContent();
			if (text) errors.push(text);
		}

		return errors;
	}

	/**
	 * Check if Japanese validation messages are displayed
	 */
	async checkJapaneseValidationMessages() {
		// Wait a bit for validation to trigger
		await this.page.waitForTimeout(500);

		const errorMessages = await this.page
			.locator('[data-testid="error-message"]')
			.allTextContents();
		return errorMessages.some((msg) => /必須|入力|エラー/.test(msg));
	}

	/**
	 * Check if form submission is disabled
	 */
	async isSubmitDisabled(): Promise<boolean> {
		return await this.page.locator('button[type="submit"]').isDisabled();
	}

	/**
	 * Check if Remix error boundary is displayed
	 */
	async checkForRemixErrorBoundary() {
		const errorBoundary = this.page.locator('[data-testid="error-boundary"]');
		return await errorBoundary.isVisible();
	}

	/**
	 * Wait for Remix action to complete and check result
	 */
	async waitForActionResult(expectSuccess = true) {
		// Wait for either success or error message
		const resultSelector = expectSuccess
			? '[data-testid="success-message"]'
			: '[data-testid="error-message"]';

		await this.page.waitForSelector(resultSelector, { timeout: 15000 });

		if (expectSuccess) {
			// Check for Japanese success message
			const successText = await this.page.textContent(resultSelector);
			return (
				successText && /ありがとう|送信完了|予約完了|成功/.test(successText)
			);
		}
		// Check for Japanese error message
		const errorText = await this.page.textContent(resultSelector);
		return errorText && /エラー|失敗|問題/.test(errorText);
	}

	/**
	 * Take screenshot for debugging
	 */
	async takeDebugScreenshot(name: string) {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		await this.page.screenshot({
			path: `test-results/debug-${name}-${timestamp}.png`,
			fullPage: true,
		});
	}

	/**
	 * Take screenshot with Japanese filename
	 */
	async takeScreenshot(name: string) {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `screenshot-${name}-${timestamp}.png`;
		await this.page.screenshot({
			path: `test-results/${filename}`,
			fullPage: true,
		});
		return filename;
	}

	/**
	 * Wait for any network requests to complete
	 */
	async waitForNetworkIdle() {
		await this.page.waitForLoadState("networkidle");
	}

	/**
	 * Check if element is visible
	 */
	async isElementVisible(selector: string): Promise<boolean> {
		return await this.page.isVisible(selector);
	}

	/**
	 * Get element text content
	 */
	async getElementText(selector: string): Promise<string> {
		return (await this.page.textContent(selector)) || "";
	}

	/**
	 * Check if page has specific content
	 */
	async hasContent(text: string): Promise<boolean> {
		return await this.page.locator(`text=${text}`).isVisible();
	}

	/**
	 * Wait for timetable to load
	 */
	async waitForTimetableLoad() {
		await this.page.waitForSelector('[data-testid="weekly-timetable"]', {
			timeout: 15000,
		});
		await this.page.waitForFunction(() => {
			const lessons = document.querySelectorAll('[data-testid^="lesson-"]');
			return lessons.length > 0;
		});
	}

	/**
	 * Get available lessons from timetable
	 */
	async getAvailableLessons() {
		await this.waitForTimetableLoad();

		const lessons = await this.page.locator('[data-testid^="lesson-"]').all();
		const lessonData = [];

		for (const lesson of lessons) {
			const title = (await lesson.getAttribute("data-title")) || "";
			const start = (await lesson.getAttribute("data-start")) || "";
			const end = (await lesson.getAttribute("data-end")) || "";
			const instructor = (await lesson.getAttribute("data-instructor")) || "";
			const isPast = (await lesson.getAttribute("data-past")) === "true";

			lessonData.push({ title, start, end, instructor, isPast });
		}

		return lessonData;
	}

	/**
	 * Check if lesson is selectable (not in past)
	 */
	async isLessonSelectable(
		lessonTitle: string,
		startTime: string,
	): Promise<boolean> {
		const lessonSelector = `[data-testid="lesson-${lessonTitle}"][data-start="${startTime}"]`;
		const lesson = this.page.locator(lessonSelector);

		if (!(await lesson.isVisible())) {
			return false;
		}

		const isPast = (await lesson.getAttribute("data-past")) === "true";
		const isDisabled = (await lesson.getAttribute("disabled")) === "true";

		return !isPast && !isDisabled;
	}

	/**
	 * Navigate between weeks in timetable
	 */
	async navigateToNextWeek() {
		await this.page.click('[data-testid="next-week-button"]');
		await this.waitForTimetableLoad();
	}

	async navigateToPreviousWeek() {
		await this.page.click('[data-testid="prev-week-button"]');
		await this.waitForTimetableLoad();
	}

	/**
	 * Get current week display
	 */
	async getCurrentWeekDisplay(): Promise<string> {
		return await this.getElementText('[data-testid="current-week-display"]');
	}

	/**
	 * Check if page has proper Japanese meta tags
	 */
	async checkJapaneseMetaTags() {
		const lang = await this.page.getAttribute("html", "lang");
		const title = await this.page.title();
		const description = await this.page.getAttribute(
			'meta[name="description"]',
			"content",
		);

		return {
			hasJapaneseLang: lang === "ja" || lang === "ja-JP",
			hasJapaneseTitle: title
				? /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(title)
				: false,
			hasJapaneseDescription: description
				? /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(description)
				: false,
		};
	}
}

/**
 * Mock service utilities for testing
 */
export namespace MockServiceUtils {
	/**
	 * Configure mock email service
	 */
	export function configureMockEmailService(config: Partial<MockEmailConfig>) {
		configureMockEmail(config);
	}

	/**
	 * Clear all mock emails
	 */
	export function clearMockEmails() {
		clearEmailMocks();
	}

	/**
	 * Get all mock emails
	 */
	export function getMockEmails() {
		return getMockEmails();
	}

	/**
	 * Get mock email statistics
	 */
	export function getMockEmailStats() {
		return getMockEmailStats();
	}

	/**
	 * Setup mock services for test
	 */
	export async function setupMockServices() {
		// Clear previous mock data
		clearMockEmails();

		// Configure mock email service for testing
		configureMockEmail({
			shouldFail: false,
			failureRate: 0,
			delay: 0,
			maxEmails: 100,
		});
	}

	/**
	 * Reset mock services
	 */
	export async function resetMockServices() {
		clearMockEmails();
		configureMockEmail({
			shouldFail: false,
			failureRate: 0,
			delay: 0,
			maxEmails: 100,
		});
	}

	/**
	 * Simulate email service failure
	 */
	export function simulateEmailFailure(failureRate = 1) {
		configureMockEmail({
			shouldFail: failureRate >= 1,
			failureRate: failureRate < 1 ? failureRate : 0,
		});
	}

	/**
	 * Simulate slow email service
	 */
	export function simulateSlowEmailService(delayMs = 2000) {
		configureMockEmail({
			delay: delayMs,
		});
	}
}

/**
 * Test environment utilities
 */
export namespace TestEnvironmentUtils {
	/**
	 * Setup test environment
	 */
	export async function setupTestEnvironment(
		level: "unit" | "integration" | "e2e" | "ci" = "e2e",
	) {
		await testEnvironmentManager.setupEnvironment(level);
		await MockServiceUtils.setupMockServices();
	}

	/**
	 * Teardown test environment
	 */
	export async function teardownTestEnvironment() {
		await MockServiceUtils.resetMockServices();
		await testEnvironmentManager.teardownEnvironment();
	}

	/**
	 * Get current test environment
	 */
	export function getCurrentTestEnvironment() {
		return testEnvironmentManager.getCurrentEnvironment();
	}

	/**
	 * Check if test environment is setup
	 */
	export function isTestEnvironmentSetup(): boolean {
		return testEnvironmentManager.isEnvironmentSetup();
	}
}

/**
 * Form testing utilities
 */
export namespace FormTestUtils {
	/**
	 * Create FormData for testing
	 */
	export function createTestFormData(
		scenarioKey: keyof typeof testScenarios.happyPath,
	) {
		const scenario = testScenarios.happyPath[scenarioKey];
		return createFormData(scenario);
	}

	/**
	 * Create invalid FormData for testing
	 */
	export function createInvalidFormData(
		scenarioKey: keyof typeof testScenarios.validation,
	) {
		const scenario = testScenarios.validation[scenarioKey];
		// Type assertion needed for validation scenarios that may have invalid data
		return createFormData(
			scenario as (typeof testScenarios.happyPath)[keyof typeof testScenarios.happyPath],
		);
	}

	/**
	 * Generate random test data
	 */
	export function generateRandomTestData() {
		const randomSuffix = Math.random().toString(36).substring(7);
		return {
			applicant: {
				name: `テストユーザー${randomSuffix}`,
				email: `test-${randomSuffix}@example.com`,
				phone: `090-${Math.floor(Math.random() * 10000)
					.toString()
					.padStart(4, "0")}-${Math.floor(Math.random() * 10000)
					.toString()
					.padStart(4, "0")}`,
			},
		};
	}
}

/**
 * Date/Time testing utilities
 */
export namespace DateTimeTestUtils {
	/**
	 * Get future date for lesson testing
	 */
	export function getFutureDate(daysFromNow = 7): Date {
		const date = new Date();
		date.setDate(date.getDate() + daysFromNow);
		return date;
	}

	/**
	 * Get past date for validation testing
	 */
	export function getPastDate(daysAgo = 7): Date {
		const date = new Date();
		date.setDate(date.getDate() - daysAgo);
		return date;
	}

	/**
	 * Format date for lesson selection
	 */
	export function formatDateForLesson(
		date: Date,
		hour: number,
		minute: number,
	): string {
		date.setHours(hour, minute, 0, 0);
		return date.toISOString();
	}

	/**
	 * Get next week's Monday
	 */
	export function getNextMonday(): Date {
		const date = new Date();
		const day = date.getDay();
		const diff = date.getDate() - day + (day === 0 ? -6 : 1) + 7; // Next Monday
		return new Date(date.setDate(diff));
	}
}

/**
 * Common test data for Japanese context (backward compatibility)
 */
export const testData = {
	validUser: {
		name: "田中太郎",
		email: "tanaka@example.com",
		phone: "090-1234-5678",
	},
	invalidUser: {
		name: "",
		email: "invalid-email",
		phone: "123",
	},
	days: ["月", "火", "水", "木", "金", "土", "日"],
	times: [
		"10:00",
		"11:00",
		"12:00",
		"13:00",
		"14:00",
		"15:00",
		"16:00",
		"17:00",
		"18:00",
		"19:00",
		"20:00",
	],
};
