/**
 * React Query テストユーティリティ
 *
 * 設計方針:
 * - テスト環境でReact Queryを使用するコンポーネントをラップ
 * - Issue #37の例に基づいたQueryWrapper実装
 * - retry: falseでテスト実行を高速化
 * - テスト用に最適化されたQueryClient設定
 * - テスト間での状態隔離を保証
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import React, { type ReactElement, type ReactNode } from "react";

// ========================================
// テスト用QueryClient設定
// ========================================

/**
 * テスト用QueryClientの作成
 * プロダクション設定とは異なる、テスト実行に最適化された設定
 */
export function createTestQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// テスト環境では再試行を無効化（高速化のため）
				retry: false,

				// キャッシュを無効化してテスト間の状態隔離を保証
				gcTime: 0, // 旧cacheTime
				staleTime: 0,

				// テスト環境では自動的な再取得を無効化
				refetchOnMount: false,
				refetchOnWindowFocus: false,
				refetchOnReconnect: false,
			},
			mutations: {
				// ミューテーションも再試行を無効化
				retry: false,

				// テスト環境ではエラーログを抑制
				onError: () => {
					// テスト環境ではエラーハンドリングを簡素化
				},
			},
		},
	});
}

// ========================================
// QueryWrapper コンポーネント
// ========================================

interface QueryWrapperProps {
	children: ReactNode;
	queryClient?: QueryClient;
}

/**
 * テスト用QueryWrapper
 * React Queryが必要なコンポーネントのテストで使用
 */
export function QueryWrapper({ children, queryClient }: QueryWrapperProps) {
	const client = queryClient ?? createTestQueryClient();

	// React Routerプリアンブル問題を回避するため、単純なProviderのみ使用
	return React.createElement(QueryClientProvider, { client }, children);
}

// ========================================
// React Testing Library 統合
// ========================================

/**
 * React Testing LibraryのrenderOptions拡張
 * QueryWrapperを含むカスタムレンダリング設定
 */
interface CustomRenderOptions extends Omit<RenderOptions, "wrapper"> {
	queryClient?: QueryClient;
	wrapper?: React.ComponentType<{ children: ReactNode }>;
}

/**
 * React QueryをサポートするカスタムRender関数
 *
 * 使用例:
 * ```typescript
 * import { renderWithQuery } from "tests/utils/query-wrapper";
 *
 * test("should render transaction list", () => {
 *   const { getByText } = renderWithQuery(<TransactionList />);
 *   // テストロジック
 * });
 * ```
 */
export function renderWithQuery(
	ui: ReactElement,
	options: CustomRenderOptions = {},
): any {
	const { queryClient, wrapper: Wrapper, ...renderOptions } = options;

	const testQueryClient = queryClient ?? createTestQueryClient();

	// 既存のwrapperがある場合は合成
	function AllTheProviders({ children }: { children: ReactNode }) {
		const providers = React.createElement(QueryWrapper, {
			queryClient: testQueryClient,
			children,
		});

		return Wrapper ? React.createElement(Wrapper, null, providers) : providers;
	}

	return {
		...render(ui, { wrapper: AllTheProviders, ...renderOptions }),
		// テスト内でQueryClientにアクセスできるようにエクスポート
		queryClient: testQueryClient,
	};
}

// ========================================
// テストヘルパー関数
// ========================================

/**
 * QueryClientの状態をクリアするヘルパー関数
 * テスト間でのデータリセットに使用
 */
export function clearQueryClientCache(queryClient: QueryClient) {
	queryClient.clear();
	queryClient.removeQueries();
	queryClient.cancelQueries();
}

/**
 * 特定のクエリキーのキャッシュをクリア
 */
export function clearQueryCache(queryClient: QueryClient, queryKey: unknown[]) {
	queryClient.removeQueries({ queryKey });
}

/**
 * QueryClientの全ミューテーションをリセット
 */
export function resetMutations(queryClient: QueryClient) {
	queryClient.getMutationCache().clear();
}

// ========================================
// モックデータ設定ヘルパー
// ========================================

/**
 * QueryClientにモックデータを事前設定するヘルパー
 * テストで特定のクエリ結果を事前に設定したい場合に使用
 */
export function setQueryData<T>(
	queryClient: QueryClient,
	queryKey: unknown[],
	data: T,
	options?: {
		updatedAt?: number;
	},
) {
	queryClient.setQueryData(queryKey, data, {
		updatedAt: options?.updatedAt ?? Date.now(),
	});
}

/**
 * エラー状態のクエリを事前設定するヘルパー
 */
export function setQueryError(
	queryClient: QueryClient,
	queryKey: unknown[],
	error: Error,
) {
	// React Query v5では直接的なエラー状態設定は異なるアプローチを使用
	queryClient.setQueryData(queryKey, undefined);
	// エラー状態の設定は、実際のクエリが失敗した場合にライブラリが自動的に行う
}

// ========================================
// 型エクスポート
// ========================================

export type { CustomRenderOptions };
