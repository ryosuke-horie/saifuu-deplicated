/**
 * Cloudflare環境モック
 *
 * 設計方針:
 * - React Router v7のCloudflare Workers環境をモック
 * - D1DatabaseとContextオブジェクトを完全に模倣
 * - テスト環境でのCloudflare特有の機能をシミュレート
 * - 型安全性を維持してテストの信頼性を確保
 */

import { mockDb, resetMockDataStore } from "../../__mocks__/db";

// D1Databaseインターfaces（Cloudflare Workers準拠）
export interface MockD1Database {
	prepare(query: string): MockD1PreparedStatement;
	dump(): Promise<ArrayBuffer>;
	batch<T = unknown>(
		statements: MockD1PreparedStatement[],
	): Promise<MockD1Result<T>[]>;
	exec<T = unknown>(query: string): Promise<MockD1ExecResult<T>>;
}

export interface MockD1PreparedStatement {
	bind(...values: unknown[]): MockD1PreparedStatement;
	first<T = unknown>(colName?: string): Promise<T | null>;
	run(): Promise<MockD1RunResult>;
	all<T = unknown>(): Promise<MockD1Result<T>>;
	raw<T = unknown[]>(): Promise<T[]>;
}

export interface MockD1Result<T = unknown> {
	results: T[];
	success: boolean;
	meta: MockD1Meta;
	error?: string;
}

export interface MockD1RunResult {
	success: boolean;
	meta: MockD1Meta;
	error?: string;
}

export interface MockD1ExecResult<T = unknown> {
	count: number;
	duration: number;
	results: MockD1Result<T>[];
}

export interface MockD1Meta {
	served_by?: string;
	duration?: number;
	changes?: number;
	last_row_id?: number;
	rows_read?: number;
	rows_written?: number;
}

// モックD1PreparedStatementクラス
class MockD1PreparedStatementImpl implements MockD1PreparedStatement {
	private query: string;
	private bindings: unknown[] = [];

	constructor(query: string) {
		this.query = query;
	}

	bind(...values: unknown[]): MockD1PreparedStatement {
		this.bindings = values;
		return this;
	}

	async first<T = unknown>(colName?: string): Promise<T | null> {
		const result = await this.all<T>();
		if (result.results.length === 0) return null;

		if (colName) {
			return (result.results[0] as any)[colName] || null;
		}

		return result.results[0];
	}

	async run(): Promise<MockD1RunResult> {
		try {
			// 簡略化されたSQL実行（実際のSQLパーサーは実装しない）
			const changes =
				this.query.toLowerCase().includes("insert") ||
				this.query.toLowerCase().includes("update") ||
				this.query.toLowerCase().includes("delete")
					? 1
					: 0;

			return {
				success: true,
				meta: {
					served_by: "mock-d1",
					duration: Math.random() * 10,
					changes,
					last_row_id:
						changes > 0 ? Math.floor(Math.random() * 1000) : undefined,
					rows_read: 0,
					rows_written: changes,
				},
			};
		} catch (error) {
			return {
				success: false,
				meta: { served_by: "mock-d1" },
				error: String(error),
			};
		}
	}

	async all<T = unknown>(): Promise<MockD1Result<T>> {
		try {
			// SQLクエリの簡略化された実行
			// 実際のテストではmockDbを通じてデータを取得
			return {
				results: [] as T[],
				success: true,
				meta: {
					served_by: "mock-d1",
					duration: Math.random() * 10,
					rows_read: 0,
				},
			};
		} catch (error) {
			return {
				results: [],
				success: false,
				meta: { served_by: "mock-d1" },
				error: String(error),
			};
		}
	}

	async raw<T = unknown[]>(): Promise<T[]> {
		const result = await this.all();
		return result.results as T[];
	}
}

// モックD1Databaseクラス
class MockD1DatabaseImpl implements MockD1Database {
	prepare(query: string): MockD1PreparedStatement {
		return new MockD1PreparedStatementImpl(query);
	}

	async dump(): Promise<ArrayBuffer> {
		// SQLiteダンプの模擬実装
		const encoder = new TextEncoder();
		return encoder.encode("-- Mock SQLite dump").buffer;
	}

	async batch<T = unknown>(
		statements: MockD1PreparedStatement[],
	): Promise<MockD1Result<T>[]> {
		const results: MockD1Result<T>[] = [];

		for (const statement of statements) {
			try {
				const result = await statement.all<T>();
				results.push(result);
			} catch (error) {
				results.push({
					results: [],
					success: false,
					meta: { served_by: "mock-d1" },
					error: String(error),
				});
			}
		}

		return results;
	}

	async exec<T = unknown>(query: string): Promise<MockD1ExecResult<T>> {
		const statement = this.prepare(query);
		const result = await statement.all<T>();

		return {
			count: 1,
			duration: Math.random() * 10,
			results: [result],
		};
	}
}

// Cloudflare Workers Context型定義
export interface MockCloudflareContext {
	env: {
		DB: MockD1Database;
		[key: string]: unknown;
	};
	cloudflare: {
		cf: {
			colo: string;
			country?: string;
			city?: string;
			continent?: string;
			timezone?: string;
			region?: string;
			regionCode?: string;
			metroCode?: string;
			postalCode?: string;
			latitude?: string;
			longitude?: string;
			asn?: number;
			asOrganization?: string;
		};
		ctx: {
			waitUntil(promise: Promise<unknown>): void;
			passThroughOnException(): void;
		};
	};
}

// モックCloudflareContextクラス
class MockCloudflareContextImpl implements MockCloudflareContext {
	env: {
		DB: MockD1Database;
		[key: string]: unknown;
	};

	cloudflare: {
		cf: {
			colo: string;
			country?: string;
			city?: string;
			continent?: string;
			timezone?: string;
			region?: string;
			regionCode?: string;
			metroCode?: string;
			postalCode?: string;
			latitude?: string;
			longitude?: string;
			asn?: number;
			asOrganization?: string;
		};
		ctx: {
			waitUntil(promise: Promise<unknown>): void;
			passThroughOnException(): void;
		};
	};

	constructor() {
		this.env = {
			DB: new MockD1DatabaseImpl(),
		};

		this.cloudflare = {
			cf: {
				colo: "NRT", // 成田空港のIATAコード
				country: "JP",
				city: "Tokyo",
				continent: "AS",
				timezone: "Asia/Tokyo",
				region: "Tokyo",
				regionCode: "13",
				latitude: "35.6762",
				longitude: "139.6503",
				asn: 2516,
				asOrganization: "KDDI CORPORATION",
			},
			ctx: {
				waitUntil: (promise: Promise<unknown>) => {
					// モック環境では実際の待機は行わない
					promise.catch(() => {
						// エラーハンドリング
					});
				},
				passThroughOnException: () => {
					// モック環境では何もしない
				},
			},
		};
	}
}

// エクスポート用のファクトリ関数
export const createMockCloudflareContext = (): MockCloudflareContext => {
	return new MockCloudflareContextImpl();
};

export const createMockD1Database = (): MockD1Database => {
	return new MockD1DatabaseImpl();
};

// テスト用ヘルパー関数
export const setupMockCloudflareEnvironment = () => {
	const context = createMockCloudflareContext();
	resetMockDataStore(); // データストアをリセット
	return context;
};

// React Router用のLoaderArgs/ActionArgsモック
export interface CloudflareMockLoaderArgs {
	request: Request;
	params: Record<string, string>;
	context: {
		env: {
			DB: MockD1Database;
			[key: string]: unknown;
		};
		cloudflare: {
			cf: {
				colo: string;
				country?: string;
				city?: string;
				continent?: string;
				timezone?: string;
				region?: string;
				regionCode?: string;
				metroCode?: string;
				postalCode?: string;
				latitude?: string;
				longitude?: string;
				asn?: number;
				asOrganization?: string;
			};
			ctx: {
				waitUntil(promise: Promise<unknown>): void;
				passThroughOnException(): void;
			};
		};
	};
}

export interface CloudflareMockActionArgs {
	request: Request;
	params: Record<string, string>;
	context: {
		env: {
			DB: MockD1Database;
			[key: string]: unknown;
		};
		cloudflare: {
			cf: {
				colo: string;
				country?: string;
				city?: string;
				continent?: string;
				timezone?: string;
				region?: string;
				regionCode?: string;
				metroCode?: string;
				postalCode?: string;
				latitude?: string;
				longitude?: string;
				asn?: number;
				asOrganization?: string;
			};
			ctx: {
				waitUntil(promise: Promise<unknown>): void;
				passThroughOnException(): void;
			};
		};
	};
}

export const createMockLoaderArgs = (
	url = "http://localhost:3000/",
	params: Record<string, string> = {},
	method = "GET",
): CloudflareMockLoaderArgs => {
	const mockContext = createMockCloudflareContext();
	return {
		request: new Request(url, { method }),
		params,
		context: {
			env: mockContext.env,
			cloudflare: mockContext.cloudflare,
		},
	};
};

export const createMockActionArgs = (
	url = "http://localhost:3000/",
	params: Record<string, string> = {},
	method = "POST",
	body?: BodyInit,
): CloudflareMockActionArgs => {
	const mockContext = createMockCloudflareContext();
	return {
		request: new Request(url, { method, body }),
		params,
		context: {
			env: mockContext.env,
			cloudflare: mockContext.cloudflare,
		},
	};
};

// グローバルなモック設定関数（Jest環境用）
export const setupGlobalCloudflareEnvironmentMocks = () => {
	// グローバルなCloudflare Workers環境変数をモック
	if (typeof global !== "undefined") {
		(global as any).MockCloudflareContext = MockCloudflareContextImpl;
		(global as any).MockD1Database = MockD1DatabaseImpl;
	}
};
