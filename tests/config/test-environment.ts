/**
 * Test environment configuration and setup
 * Manages environment variables, mock services, and test-specific settings
 */

import { resetMockEmailService } from "../mocks/email.mock";

// Test environment variables
export const testEnvironmentVariables = {
	// Core application settings
	NODE_ENV: "test",
	REMIX_DEV_NO_RESTART: "1",
	PLAYWRIGHT_REMIX_MODE: "test",

	// Mock service flags
	MOCK_AWS_SES: "true",
	MOCK_EMAIL_SENDING: "true",
	MOCK_EXTERNAL_SERVICES: "true",

	// Test-specific AWS settings (these won't be used when mocking is enabled)
	AWS_REGION: "ap-northeast-1",
	AWS_ACCESS_KEY_ID: "test-access-key",
	AWS_SECRET_ACCESS_KEY: "test-secret-key",
	SES_FROM_EMAIL: "no-reply@timetable-hideskick.net",

	// Test data settings
	TEST_GYM_EMAIL: "test-gym@example.com",
	TEST_APPLICANT_EMAIL: "test-applicant@example.com",

	// Test timeouts and delays
	TEST_EMAIL_DELAY: "0", // No delay in tests by default
	TEST_NETWORK_DELAY: "0",
	TEST_RETRY_COUNT: "3",

	// Debug settings
	DEBUG_MOCK_SERVICES: "true",
	DEBUG_EMAIL_CONTENT: "true",
	DEBUG_FORM_VALIDATION: "true",

	// Feature flags for testing
	ENABLE_FORM_VALIDATION: "true",
	ENABLE_EMAIL_SENDING: "true",
	ENABLE_LESSON_VALIDATION: "true",
	ENABLE_TIMEZONE_VALIDATION: "true",

	// Test database/storage settings
	TEST_DATA_PERSISTENCE: "false", // Don't persist test data
	CLEAR_TEST_DATA_ON_START: "true",
} as const;

// Different test environment configurations
export const testEnvironments = {
	// Unit testing environment
	unit: {
		...testEnvironmentVariables,
		MOCK_ALL_SERVICES: "true",
		TEST_LEVEL: "unit",
	},

	// Integration testing environment
	integration: {
		...testEnvironmentVariables,
		MOCK_EXTERNAL_SERVICES: "true",
		MOCK_EMAIL_SENDING: "true",
		TEST_LEVEL: "integration",
	},

	// E2E testing environment
	e2e: {
		...testEnvironmentVariables,
		MOCK_AWS_SES: "true",
		MOCK_EMAIL_SENDING: "true",
		TEST_LEVEL: "e2e",
		// Keep some real services for more realistic testing
		MOCK_ALL_SERVICES: "false",
	},

	// CI testing environment
	ci: {
		...testEnvironmentVariables,
		MOCK_ALL_SERVICES: "true",
		CI: "true",
		TEST_LEVEL: "ci",
		// Faster timeouts for CI
		TEST_EMAIL_DELAY: "0",
		TEST_NETWORK_DELAY: "0",
		TEST_RETRY_COUNT: "1",
	},
} as const;

// Test environment interface
export interface TestEnvironment {
	name: string;
	variables: Record<string, string>;
	setup: () => Promise<void>;
	teardown: () => Promise<void>;
}

/**
 * Get test environment configuration
 */
export function getTestEnvironment(
	level: keyof typeof testEnvironments = "e2e",
): TestEnvironment {
	const config = testEnvironments[level];

	return {
		name: level,
		variables: config,
		setup: async () => {
			await setupTestEnvironment(config);
		},
		teardown: async () => {
			await teardownTestEnvironment(config);
		},
	};
}

/**
 * Setup test environment
 */
async function setupTestEnvironment(
	config: Record<string, string>,
): Promise<void> {
	console.log("[TEST-ENV] Setting up test environment...");

	// Set environment variables
	for (const [key, value] of Object.entries(config)) {
		process.env[key] = value;
	}

	// Reset mock services
	if (config.MOCK_EMAIL_SENDING === "true") {
		resetMockEmailService();
	}

	// Clear any existing test data
	if (config.CLEAR_TEST_DATA_ON_START === "true") {
		await clearTestData();
	}

	// Setup timezone for Japanese locale
	process.env.TZ = "Asia/Tokyo";

	console.log("[TEST-ENV] Test environment setup completed");
}

/**
 * Teardown test environment
 */
async function teardownTestEnvironment(
	config: Record<string, string>,
): Promise<void> {
	console.log("[TEST-ENV] Tearing down test environment...");

	// Reset mock services
	if (config.MOCK_EMAIL_SENDING === "true") {
		resetMockEmailService();
	}

	// Clear test data if needed
	if (config.TEST_DATA_PERSISTENCE === "false") {
		await clearTestData();
	}

	console.log("[TEST-ENV] Test environment teardown completed");
}

/**
 * Clear test data
 */
async function clearTestData(): Promise<void> {
	// Reset mock email service
	resetMockEmailService();

	// Clear any other test data stores
	// (Add more cleanup as needed)
}

/**
 * Check if we're in test mode
 */
export function isTestMode(): boolean {
	return (
		process.env.NODE_ENV === "test" ||
		process.env.PLAYWRIGHT_REMIX_MODE === "test"
	);
}

/**
 * Check if mocking is enabled
 */
export function isMockingEnabled(): boolean {
	return (
		process.env.MOCK_EMAIL_SENDING === "true" ||
		process.env.MOCK_ALL_SERVICES === "true"
	);
}

/**
 * Get mock configuration based on environment
 */
export function getMockConfiguration() {
	return {
		emailSending: process.env.MOCK_EMAIL_SENDING === "true",
		awsSes: process.env.MOCK_AWS_SES === "true",
		externalServices: process.env.MOCK_EXTERNAL_SERVICES === "true",
		allServices: process.env.MOCK_ALL_SERVICES === "true",

		// Mock behavior settings
		emailDelay: Number.parseInt(process.env.TEST_EMAIL_DELAY || "0", 10),
		networkDelay: Number.parseInt(process.env.TEST_NETWORK_DELAY || "0", 10),

		// Debug settings
		debugMockServices: process.env.DEBUG_MOCK_SERVICES === "true",
		debugEmailContent: process.env.DEBUG_EMAIL_CONTENT === "true",
		debugFormValidation: process.env.DEBUG_FORM_VALIDATION === "true",
	};
}

/**
 * Create test environment variables for Playwright
 */
export function createPlaywrightTestEnvironment(): Record<string, string> {
	const testEnv = getTestEnvironment("e2e");
	return {
		...testEnv.variables,
		// Playwright specific settings
		PLAYWRIGHT_TEST_BASE_URL: "http://localhost:5173",
		PLAYWRIGHT_HEADLESS: "true",
		PLAYWRIGHT_BROWSER: "chromium",
	};
}

/**
 * Test environment validation
 */
export function validateTestEnvironment(): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Check required environment variables
	const requiredVars = [
		"NODE_ENV",
		"MOCK_EMAIL_SENDING",
		"AWS_REGION",
		"SES_FROM_EMAIL",
	];

	for (const varName of requiredVars) {
		if (!process.env[varName]) {
			errors.push(`Missing required environment variable: ${varName}`);
		}
	}

	// Validate specific values
	if (process.env.NODE_ENV !== "test") {
		errors.push("NODE_ENV should be 'test' for testing");
	}

	if (process.env.AWS_REGION !== "ap-northeast-1") {
		errors.push("AWS_REGION should be 'ap-northeast-1' for Japanese timezone");
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Environment-specific configuration loader
 */
export class TestEnvironmentManager {
	private currentEnvironment: TestEnvironment | null = null;

	async setupEnvironment(
		level: keyof typeof testEnvironments = "e2e",
	): Promise<void> {
		if (this.currentEnvironment) {
			await this.teardownEnvironment();
		}

		this.currentEnvironment = getTestEnvironment(level);
		await this.currentEnvironment.setup();
	}

	async teardownEnvironment(): Promise<void> {
		if (this.currentEnvironment) {
			await this.currentEnvironment.teardown();
			this.currentEnvironment = null;
		}
	}

	getCurrentEnvironment(): TestEnvironment | null {
		return this.currentEnvironment;
	}

	isEnvironmentSetup(): boolean {
		return this.currentEnvironment !== null;
	}
}

// Singleton instance for global use
export const testEnvironmentManager = new TestEnvironmentManager();
