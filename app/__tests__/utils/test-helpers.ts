import type { AppLoadContext } from "react-router";
import { expect, vi } from "vitest";
import type { Database } from "../../../db/connection";
import type { CreateTransaction } from "../../../db/schema";

/**
 * テスト用のヘルパー関数とモック設定
 *
 * 設計方針:
 * - 各テストで再利用可能なモックデータとヘルパー関数を提供
 * - 型安全性を保ちながらテストの可読性を向上
 * - データベースとHTTPリクエストのモックを統一的に管理
 */

// ========================================
// モックデータ定義
// ========================================

export const mockCategory = {
	id: 1,
	name: "食費",
	type: "expense" as const,
	color: "#FF6B6B",
	icon: "food",
	displayOrder: 1,
	isActive: true,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

export const mockTransaction = {
	id: 1,
	amount: 1500,
	type: "expense" as const,
	categoryId: 1,
	description: "ランチ代",
	transactionDate: "2024-01-01",
	paymentMethod: "クレジットカード",
	tags: '["外食", "会社"]',
	receiptUrl: null,
	isRecurring: false,
	recurringId: null,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

export const mockTransactionWithCategory = {
	...mockTransaction,
	category: {
		id: mockCategory.id,
		name: mockCategory.name,
		type: mockCategory.type,
		color: mockCategory.color,
		icon: mockCategory.icon,
	},
};

export const mockTransactionsList = [
	mockTransactionWithCategory,
	{
		...mockTransactionWithCategory,
		id: 2,
		amount: 800,
		description: "コンビニ",
		tags: '["食品"]',
		transactionDate: "2024-01-02",
	},
];

// ========================================
// HTTPリクエストモック関数
// ========================================

/**
 * GET リクエストのモックを作成
 */
export function createMockGetRequest(url: string): Request {
	return new Request(url, {
		method: "GET",
		headers: {
			"Content-Type": "application/json",
		},
	});
}

/**
 * POST リクエストのモックを作成
 */
export function createMockPostRequest(url: string, body: unknown): Request {
	return new Request(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

/**
 * PUT リクエストのモックを作成
 */
export function createMockPutRequest(url: string, body: unknown): Request {
	return new Request(url, {
		method: "PUT",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(body),
	});
}

/**
 * DELETE リクエストのモックを作成
 */
export function createMockDeleteRequest(url: string): Request {
	return new Request(url, {
		method: "DELETE",
		headers: {
			"Content-Type": "application/json",
		},
	});
}

// ========================================
// Cloudflare Workers コンテキストモック
// ========================================

/**
 * Cloudflare Workers コンテキストのモックを作成
 */
export function createMockContext(
	mockDb: Database = {} as Database,
): AppLoadContext {
	return {
		cloudflare: {
			env: {
				DB: mockDb,
				VALUE_FROM_CLOUDFLARE: "Hello from Cloudflare",
				USE_MOCK_EMAIL: "true",
				AWS_ACCESS_KEY_ID: "test-key",
				AWS_SECRET_ACCESS_KEY: "test-secret",
			} as unknown as Env,
			ctx: {} as ExecutionContext,
		},
	} as AppLoadContext;
}

// ========================================
// データベースモック関数
// ========================================

/**
 * データベースクエリのモック関数を作成
 * 各テストで必要に応じてカスタマイズ可能
 */
export function createMockDatabase() {
	return {
		// SELECT クエリのモック
		select: vi.fn().mockReturnThis(),
		from: vi.fn().mockReturnThis(),
		leftJoin: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		orderBy: vi.fn().mockReturnThis(),
		limit: vi.fn().mockReturnThis(),
		offset: vi.fn().mockReturnThis(),
		groupBy: vi.fn().mockReturnThis(),

		// INSERT クエリのモック
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn(),

		// UPDATE クエリのモック
		update: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),

		// DELETE クエリのモック
		delete: vi.fn().mockReturnThis(),
	} as unknown as Database;
}

// ========================================
// レスポンス検証ヘルパー
// ========================================

/**
 * APIレスポンスの基本構造を検証
 */
export async function validateApiResponse(response: Response): Promise<any> {
	const json = (await response.json()) as any;

	if (response.ok) {
		// 成功レスポンスの検証
		expect(json).toHaveProperty("success", true);
		expect(json).toHaveProperty("data");
	} else {
		// エラーレスポンスの検証
		expect(json).toHaveProperty("error");
		expect(typeof json.error).toBe("string");
	}

	return json;
}

/**
 * ページネーション付きレスポンスの構造を検証
 */
export function validatePaginatedResponse(json: any): void {
	expect(json).toHaveProperty("success", true);
	expect(json).toHaveProperty("data");
	expect(json).toHaveProperty("count");
	expect(json).toHaveProperty("pagination");

	const { pagination } = json;
	expect(pagination).toHaveProperty("currentPage");
	expect(pagination).toHaveProperty("totalPages");
	expect(pagination).toHaveProperty("totalCount");
	expect(pagination).toHaveProperty("hasNextPage");
	expect(pagination).toHaveProperty("hasPrevPage");
	expect(pagination).toHaveProperty("limit");
}

// ========================================
// テストデータ生成ヘルパー
// ========================================

/**
 * 取引作成用のテストデータを生成
 */
export function generateCreateTransactionData(
	overrides: Partial<CreateTransaction> = {},
) {
	return {
		amount: 1000,
		type: "expense",
		categoryId: 1,
		description: "テスト取引",
		transactionDate: "2024-01-01",
		paymentMethod: "現金",
		tags: ["テスト"],
		...overrides,
	};
}

/**
 * 無効な取引データのパターンを生成
 */
export function generateInvalidTransactionData() {
	return [
		// 金額が不正
		{ amount: -100, type: "expense", transactionDate: "2024-01-01" },
		{ amount: "invalid", type: "expense", transactionDate: "2024-01-01" },

		// タイプが不正
		{ amount: 1000, type: "invalid", transactionDate: "2024-01-01" },

		// 日付が不正
		{ amount: 1000, type: "expense", transactionDate: "invalid-date" },
		{ amount: 1000, type: "expense", transactionDate: "2024/01/01" },

		// 必須フィールドが不足
		{ type: "expense", transactionDate: "2024-01-01" }, // amount が不足
		{ amount: 1000, transactionDate: "2024-01-01" }, // type が不足
		{ amount: 1000, type: "expense" }, // transactionDate が不足
	];
}

/**
 * クエリパラメータのテストケースを生成
 */
export function generateQueryParamTestCases() {
	return {
		valid: [
			{ from: "2024-01-01", to: "2024-01-31" },
			{ type: "expense" },
			{ type: "income" },
			{ category_id: "1" },
			{ search: "ランチ" },
			{ page: "1", limit: "10" },
			{ sort_by: "transactionDate", sort_order: "asc" },
			{ sort_by: "amount", sort_order: "desc" },
		],
		invalid: [
			{ from: "invalid-date" },
			{ to: "2024/01/31" },
			{ type: "invalid-type" },
			{ category_id: "invalid-id" },
			{ page: "0" },
			{ page: "-1" },
			{ limit: "0" },
			{ limit: "101" },
			{ sort_by: "invalid-field" },
			{ sort_order: "invalid-order" },
		],
	};
}
