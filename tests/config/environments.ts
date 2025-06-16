/**
 * Environment-specific configuration for Remix application testing
 */

export interface EnvironmentConfig {
	name: string;
	baseURL: string;
	timeout: number;
	retries: number;
	workers: number;
	slowMo?: number;
	webServer?: {
		command?: string;
		url: string;
		timeout: number;
		env?: Record<string, string>;
	};
}

/**
 * Development environment configuration
 */
export const developmentConfig: EnvironmentConfig = {
	name: "development",
	baseURL: "http://localhost:5173",
	timeout: 30000,
	retries: 0,
	workers: 1,
	slowMo: 0,
	webServer: {
		command: "pnpm run dev",
		url: "http://localhost:5173",
		timeout: 120000,
		env: {
			NODE_ENV: "development",
			REMIX_DEV_NO_RESTART: "1",
		},
	},
};

/**
 * Staging environment configuration
 */
export const stagingConfig: EnvironmentConfig = {
	name: "staging",
	baseURL:
		process.env.PLAYWRIGHT_STAGING_BASE_URL ||
		"https://staging.timetable-hideskick.net",
	timeout: 45000,
	retries: 1,
	workers: 2,
	slowMo: 100,
};

/**
 * Production environment configuration
 */
export const productionConfig: EnvironmentConfig = {
	name: "production",
	baseURL:
		process.env.PLAYWRIGHT_PROD_BASE_URL || "https://timetable-hideskick.net",
	timeout: 60000,
	retries: 2,
	workers: 3,
	slowMo: 0,
};

/**
 * CI environment configuration
 */
export const ciConfig: EnvironmentConfig = {
	name: "ci",
	baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:5173",
	timeout: 45000,
	retries: 3,
	workers: 1,
	slowMo: 0,
	webServer: {
		command: "pnpm run dev",
		url: "http://localhost:5173",
		timeout: 180000,
		env: {
			NODE_ENV: "test",
			CI: "true",
		},
	},
};

/**
 * Get environment configuration based on current environment
 */
export function getEnvironmentConfig(): EnvironmentConfig {
	const env = process.env.NODE_ENV || "development";
	const isCI = !!process.env.CI;

	if (isCI) {
		return ciConfig;
	}

	switch (env) {
		case "staging":
			return stagingConfig;
		case "production":
			return productionConfig;
		default:
			return developmentConfig;
	}
}

/**
 * Remix-specific environment variables
 */
export const remixEnvironmentVariables = {
	// Development
	development: {
		NODE_ENV: "development",
		REMIX_DEV_NO_RESTART: "1",
		PLAYWRIGHT_REMIX_MODE: "development",
	},
	// Testing
	test: {
		NODE_ENV: "test",
		REMIX_DEV_NO_RESTART: "1",
		PLAYWRIGHT_REMIX_MODE: "test",
		// Mock external services in test mode
		MOCK_AWS_SES: "true",
		MOCK_EMAIL_SENDING: "true",
	},
	// Production
	production: {
		NODE_ENV: "production",
		PLAYWRIGHT_REMIX_MODE: "production",
	},
};

/**
 * Get environment variables for current environment
 */
export function getRemixEnvironmentVariables(): Record<string, string> {
	const env = process.env.NODE_ENV || "development";
	const isCI = !!process.env.CI;

	if (isCI) {
		return remixEnvironmentVariables.test;
	}

	return (
		remixEnvironmentVariables[env as keyof typeof remixEnvironmentVariables] ||
		remixEnvironmentVariables.development
	);
}
