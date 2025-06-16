/**
 * E2Eテスト用モックサーバーセットアップ
 * API呼び出しをインターセプトし、外部依存を避けるためにモックレスポンスを提供
 */

import type { Page, Route } from "@playwright/test";
import type { ParsedData } from "../../app/utils/email.server";
import { testScenarios } from "../fixtures/test-data";
import {
	configureMockEmail,
	getMockEmailStats,
	getMockEmails,
	mockSendReservationEmails,
} from "./email.mock";

// モックサーバーの設定
export interface MockServerConfig {
	enableMocking: boolean;
	mockEmailService: boolean;
	mockDelay: number;
	failureRate: number;
	logRequests: boolean;
}

const defaultConfig: MockServerConfig = {
	enableMocking: true,
	mockEmailService: true,
	mockDelay: 0,
	failureRate: 0,
	logRequests: true,
};

/**
 * APIエンドポイント用モックサーバー
 */
export class MockServer {
	private config: MockServerConfig;
	private page: Page;
	private routes: Map<string, (route: Route) => Promise<void>> = new Map();

	constructor(page: Page, config: Partial<MockServerConfig> = {}) {
		this.page = page;
		this.config = { ...defaultConfig, ...config };
		this.setupRoutes();
	}

	/**
	 * モックルートをセットアップ
	 */
	private setupRoutes() {
		// Mock reservation submission endpoint
		this.routes.set(
			"**/reservation",
			this.handleReservationSubmission.bind(this),
		);

		// Mock email status endpoint (for testing)
		this.routes.set("**/test/emails", this.handleEmailStatusRequest.bind(this));

		// Mock health check endpoint
		this.routes.set("**/health", this.handleHealthCheck.bind(this));
	}

	/**
	 * Start intercepting requests
	 */
	async start() {
		if (!this.config.enableMocking) {
			console.log("[MockServer] Mocking disabled, skipping setup");
			return;
		}

		console.log("[MockServer] Starting mock server...");

		// Setup email service mocking
		if (this.config.mockEmailService) {
			configureMockEmail({
				delay: this.config.mockDelay,
				failureRate: this.config.failureRate,
				shouldFail: this.config.failureRate >= 1,
			});
		}

		// Setup route interceptors
		for (const [pattern, handler] of this.routes) {
			await this.page.route(pattern, handler);
		}

		console.log("[MockServer] Mock server started");
	}

	/**
	 * Stop intercepting requests
	 */
	async stop() {
		if (!this.config.enableMocking) {
			return;
		}

		console.log("[MockServer] Stopping mock server...");

		// Remove all route interceptors
		for (const pattern of this.routes.keys()) {
			await this.page.unroute(pattern);
		}

		console.log("[MockServer] Mock server stopped");
	}

	/**
	 * Update mock server configuration
	 */
	updateConfig(newConfig: Partial<MockServerConfig>) {
		this.config = { ...this.config, ...newConfig };

		if (this.config.mockEmailService) {
			configureMockEmail({
				delay: this.config.mockDelay,
				failureRate: this.config.failureRate,
				shouldFail: this.config.failureRate >= 1,
			});
		}
	}

	/**
	 * Handle reservation submission requests
	 */
	private async handleReservationSubmission(route: Route) {
		if (this.config.logRequests) {
			console.log(
				"[MockServer] Intercepted reservation request:",
				route.request().method(),
			);
		}

		// Only handle POST requests
		if (route.request().method() !== "POST") {
			await route.fulfill({
				status: 405,
				contentType: "application/json",
				body: JSON.stringify({ message: "Method not allowed" }),
			});
			return;
		}

		try {
			// Simulate network delay
			if (this.config.mockDelay > 0) {
				await new Promise((resolve) =>
					setTimeout(resolve, this.config.mockDelay),
				);
			}

			// Parse form data from request
			const formData = await this.parseFormDataFromRequest(route.request());

			if (this.config.logRequests) {
				console.log("[MockServer] Parsed form data:", formData);
			}

			// Validate form data (basic validation)
			const validation = this.validateFormData(formData);
			if (!validation.isValid) {
				await route.fulfill({
					status: 400,
					contentType: "application/json",
					body: JSON.stringify({
						message: "バリデーションエラー",
						errors: validation.errors,
					}),
				});
				return;
			}

			// Process email sending through mock service
			if (this.config.mockEmailService) {
				try {
					await mockSendReservationEmails(
						formData,
						{} as Record<string, unknown>,
					);
				} catch (error) {
					// Simulate email service failure
					await route.fulfill({
						status: 500,
						contentType: "application/json",
						body: JSON.stringify({
							message: "メール送信中にエラーが発生しました",
							error: error instanceof Error ? error.message : "不明なエラー",
						}),
					});
					return;
				}
			}

			// Return success response
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ message: "メール送信成功" }),
			});
		} catch (error) {
			console.error("[MockServer] Error handling reservation:", error);
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({
					message: "サーバーエラーが発生しました",
					error: error instanceof Error ? error.message : "不明なエラー",
				}),
			});
		}
	}

	/**
	 * Handle email status requests (for testing)
	 */
	private async handleEmailStatusRequest(route: Route) {
		if (route.request().method() === "GET") {
			const emails = getMockEmails();
			const stats = getMockEmailStats();

			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					emails,
					stats,
					timestamp: new Date().toISOString(),
				}),
			});
		} else {
			await route.fulfill({
				status: 405,
				contentType: "application/json",
				body: JSON.stringify({ message: "Method not allowed" }),
			});
		}
	}

	/**
	 * Handle health check requests
	 */
	private async handleHealthCheck(route: Route) {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({
				status: "ok",
				timestamp: new Date().toISOString(),
				mockingEnabled: this.config.enableMocking,
				emailMockingEnabled: this.config.mockEmailService,
			}),
		});
	}

	/**
	 * Parse form data from request
	 */
	private async parseFormDataFromRequest(
		request: Request,
	): Promise<ParsedData> {
		// This is a simplified parser - in a real implementation,
		// you would use the same parser as the server
		const body = await request.text();
		const params = new URLSearchParams(body);

		return {
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
	}

	/**
	 * Basic form data validation
	 */
	private validateFormData(data: ParsedData): {
		isValid: boolean;
		errors: string[];
	} {
		const errors: string[] = [];

		// Validate applicant data
		if (!data.applicant.name?.trim()) {
			errors.push("氏名は必須です");
		}
		if (!data.applicant.email?.trim()) {
			errors.push("メールアドレスは必須です");
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.applicant.email)) {
			errors.push("正しいメールアドレスを入力してください");
		}
		if (!data.applicant.phone?.trim()) {
			errors.push("電話番号は必須です");
		}

		// Validate first choice
		if (!data.firstChoice?.title?.trim()) {
			errors.push("第一希望のレッスンを選択してください");
		}

		return {
			isValid: errors.length === 0,
			errors,
		};
	}

	/**
	 * Get mock email data (for testing)
	 */
	getMockEmails() {
		return getMockEmails();
	}

	/**
	 * Get mock email statistics (for testing)
	 */
	getMockEmailStats() {
		return getMockEmailStats();
	}
}

/**
 * Mock server factory functions
 */
export namespace MockServerFactory {
	/**
	 * Create a mock server for successful scenarios
	 */
	export function createSuccessfulMockServer(page: Page): MockServer {
		return new MockServer(page, {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 0,
			failureRate: 0,
			logRequests: true,
		});
	}

	/**
	 * Create a mock server that simulates failures
	 */
	export function createFailingMockServer(
		page: Page,
		failureRate = 1,
	): MockServer {
		return new MockServer(page, {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 0,
			failureRate,
			logRequests: true,
		});
	}

	/**
	 * Create a mock server that simulates slow responses
	 */
	export function createSlowMockServer(page: Page, delayMs = 2000): MockServer {
		return new MockServer(page, {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: delayMs,
			failureRate: 0,
			logRequests: true,
		});
	}

	/**
	 * Create a mock server with partial failures
	 */
	export function createPartialFailureMockServer(
		page: Page,
		failureRate = 0.3,
	): MockServer {
		return new MockServer(page, {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 100,
			failureRate,
			logRequests: true,
		});
	}

	/**
	 * Create a disabled mock server (passes through to real services)
	 */
	export function createDisabledMockServer(page: Page): MockServer {
		return new MockServer(page, {
			enableMocking: false,
			mockEmailService: false,
			mockDelay: 0,
			failureRate: 0,
			logRequests: false,
		});
	}
}

/**
 * Test scenarios for mock server
 */
export const mockServerScenarios = {
	// Happy path - all requests succeed
	success: {
		config: {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 0,
			failureRate: 0,
		},
		description: "すべてのリクエストが成功する",
	},

	// Email service failure
	emailFailure: {
		config: {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 0,
			failureRate: 1,
		},
		description: "メール送信サービスが失敗する",
	},

	// Slow response simulation
	slowResponse: {
		config: {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 3000,
			failureRate: 0,
		},
		description: "レスポンスが遅い",
	},

	// Intermittent failures
	intermittentFailure: {
		config: {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 500,
			failureRate: 0.3,
		},
		description: "30%の確率で失敗する",
	},

	// Network timeout simulation
	timeout: {
		config: {
			enableMocking: true,
			mockEmailService: true,
			mockDelay: 10000, // Very long delay to simulate timeout
			failureRate: 0,
		},
		description: "タイムアウトをシミュレート",
	},
} as const;
