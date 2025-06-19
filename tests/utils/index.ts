/**
 * テストユーティリティの統合エクスポート
 *
 * 設計方針:
 * - 共通のテストユーティリティを一元管理
 * - React Router v7との統合を考慮したモックヘルパー
 * - 型安全なテストヘルパー関数を提供
 * - テストの可読性と保守性を向上
 */

// ========================================
// React Query テストユーティリティ
// ========================================

export {
	QueryWrapper,
	createTestQueryClient,
	renderWithQuery,
	clearQueryClientCache,
	clearQueryCache,
	resetMutations,
	setQueryData,
	setQueryError,
	type CustomRenderOptions,
} from "./query-wrapper";

// ========================================
// React Router v7 テストヘルパー
// ========================================

import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

/**
 * MockLoaderArgsの型定義
 * React Router v7のLoaderfunctionArgsをモック用に簡素化
 */
export interface MockLoaderArgs extends Partial<LoaderFunctionArgs> {
	params?: Record<string, string>;
	request?: Request;
	context?: any;
}

/**
 * MockActionArgsの型定義
 * React Router v7のActionFunctionArgs をモック用に簡素化
 */
export interface MockActionArgs extends Partial<ActionFunctionArgs> {
	params?: Record<string, string>;
	request?: Request;
	context?: any;
}

/**
 * LoaderFunctionArgs のモックを作成
 *
 * 使用例:
 * ```typescript
 * const mockArgs = createMockLoaderArgs({
 *   params: { id: "123" },
 *   request: new Request("http://localhost/api/transactions/123")
 * });
 *
 * const result = await transactionLoader(mockArgs);
 * ```
 */
export function createMockLoaderArgs(
	overrides: MockLoaderArgs = {},
): LoaderFunctionArgs {
	const defaultRequest = new Request("http://localhost/test");

	return {
		params: overrides.params ?? {},
		request: overrides.request ?? defaultRequest,
		context: overrides.context ?? {},
		...overrides,
	} as LoaderFunctionArgs;
}

/**
 * ActionFunctionArgs のモックを作成
 *
 * 使用例:
 * ```typescript
 * const mockArgs = createMockActionArgs({
 *   params: { id: "123" },
 *   request: new Request("http://localhost/api/transactions", {
 *     method: "POST",
 *     body: JSON.stringify({ amount: 1000, description: "Test" })
 *   })
 * });
 *
 * const result = await createTransactionAction(mockArgs);
 * ```
 */
export function createMockActionArgs(
	overrides: MockActionArgs = {},
): ActionFunctionArgs {
	const defaultRequest = new Request("http://localhost/test", {
		method: "POST",
	});

	return {
		params: overrides.params ?? {},
		request: overrides.request ?? defaultRequest,
		context: overrides.context ?? {},
		...overrides,
	} as ActionFunctionArgs;
}

// ========================================
// リクエストモックヘルパー
// ========================================

/**
 * FormDataを含むPOSTリクエストのモックを作成
 */
export function createMockFormRequest(
	data: Record<string, string | File>,
	method = "POST",
): Request {
	const formData = new FormData();

	for (const [key, value] of Object.entries(data)) {
		formData.append(key, value);
	}

	return new Request("http://localhost/test", {
		method,
		body: formData,
	});
}

/**
 * JSONボディを含むリクエストのモックを作成
 */
export function createMockJsonRequest(
	data: Record<string, any>,
	method = "POST",
): Request {
	return new Request("http://localhost/test", {
		method,
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(data),
	});
}

/**
 * URLSearchParamsを含むGETリクエストのモックを作成
 */
export function createMockGetRequest(
	params: Record<string, string> = {},
): Request {
	const url = new URL("http://localhost/test");
	for (const [key, value] of Object.entries(params)) {
		url.searchParams.set(key, value);
	}

	return new Request(url.toString());
}

// ========================================
// テストデータファクトリー
// ========================================

/**
 * テスト用の取引データを作成するファクトリー関数
 */
export function createMockTransaction(overrides: Partial<any> = {}) {
	return {
		id: 1,
		type: "expense" as const,
		amount: 1000,
		description: "テスト支出",
		category_id: 1,
		date: new Date().toISOString().split("T")[0],
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides,
	};
}

/**
 * テスト用のカテゴリデータを作成するファクトリー関数
 */
export function createMockCategory(overrides: Partial<any> = {}) {
	return {
		id: 1,
		name: "テストカテゴリ",
		color: "#3B82F6",
		type: "expense" as const,
		display_order: 1,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides,
	};
}

/**
 * テスト用のサブスクリプションデータを作成するファクトリー関数
 */
export function createMockSubscription(overrides: Partial<any> = {}) {
	return {
		id: 1,
		name: "テストサブスクリプション",
		amount: 980,
		billing_cycle: "monthly" as const,
		billing_date: 1,
		category_id: 1,
		is_active: true,
		next_billing_date: new Date().toISOString().split("T")[0],
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
		...overrides,
	};
}

// ========================================
// アサーションヘルパー
// ========================================

/**
 * 配列が特定の順序でソートされているかを検証
 */
export function expectArrayToBeSortedBy<T>(
	array: T[],
	keyExtractor: (item: T) => string | number,
	order: "asc" | "desc" = "asc",
) {
	for (let i = 1; i < array.length; i++) {
		const prev = keyExtractor(array[i - 1]);
		const current = keyExtractor(array[i]);

		if (order === "asc") {
			expect(prev).toBeLessThanOrEqual(current);
		} else {
			expect(prev).toBeGreaterThanOrEqual(current);
		}
	}
}

/**
 * 日付文字列が有効なISO形式かを検証
 */
export function expectValidISODateString(dateString: string) {
	expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
	expect(new Date(dateString).getTime()).not.toBeNaN();
}

/**
 * 金額が正の数値かを検証
 */
export function expectValidAmount(amount: number) {
	expect(amount).toBeGreaterThan(0);
	expect(Number.isFinite(amount)).toBe(true);
}

// ========================================
// 型エクスポート
// ========================================

export type { MockLoaderArgs, MockActionArgs };
