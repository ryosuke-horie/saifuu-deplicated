import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ReactQueryDevtools } from "./devtools";

/**
 * TanStack Query プロバイダーの設定
 *
 * 設計方針:
 * - React Router v7との統合を考慮
 * - 適切なキャッシュ戦略とエラーハンドリング
 * - 開発環境での最適化（React Query Devtools）
 * - パフォーマンスを考慮したデフォルト設定
 */

// ========================================
// QueryClient設定
// ========================================

/**
 * デフォルトのQueryClient設定
 * 家計管理アプリに最適化された設定
 */
function createQueryClient() {
	return new QueryClient({
		defaultOptions: {
			queries: {
				// データの新鮮度: 5分間キャッシュを有効とする
				// 家計データは頻繁に変更されないため、適度なキャッシュ期間を設定
				staleTime: 5 * 60 * 1000, // 5分

				// キャッシュ時間: 30分間メモリに保持
				gcTime: 30 * 60 * 1000, // 30分（旧cacheTime）

				// エラー時の再試行設定
				retry: (failureCount, error: any) => {
					// ネットワークエラーやタイムアウトの場合のみ再試行
					// 400番台のエラー（バリデーションエラーなど）は再試行しない
					if (error?.status >= 400 && error?.status < 500) {
						return false;
					}
					return failureCount < 3;
				},

				// 再試行間隔: 指数バックオフ
				retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

				// ウィンドウフォーカス時の再取得を無効化（家計アプリでは不要）
				refetchOnWindowFocus: false,

				// マウント時の再取得を有効化（最新データを確保）
				refetchOnMount: true,

				// 接続復帰時の再取得を有効化
				refetchOnReconnect: true,
			},
			mutations: {
				// ミューテーション失敗時の再試行設定
				retry: (failureCount, error: any) => {
					// POST/PUT/DELETE操作は基本的に再試行しない
					// （データの整合性を保つため）
					return false;
				},

				// エラーハンドリング: グローバルエラーハンドラー
				onError: (error) => {
					console.error("Mutation error:", error);
					// 必要に応じてトースト通知やエラーダイアログを表示
				},
			},
		},
	});
}

// ========================================
// Query Provider コンポーネント
// ========================================

interface QueryProviderProps {
	children: React.ReactNode;
}

/**
 * TanStack Query Provider
 * アプリケーション全体でクエリ機能を提供
 */
export function QueryProvider({ children }: QueryProviderProps) {
	// QueryClientを状態として管理（SSR対応）
	const [queryClient] = useState(() => createQueryClient());

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{/* SSR対応のReact Query Devtools */}
			<ReactQueryDevtools initialIsOpen={false} position="bottom-right" />
		</QueryClientProvider>
	);
}

// ========================================
// クエリキー定義
// ========================================

/**
 * クエリキーのファクトリー関数
 * 一貫性のあるクエリキー命名とタイプセーフティを提供
 */
export const queryKeys = {
	// カテゴリ関連のクエリキー
	categories: {
		all: ["categories"] as const,
		lists: () => [...queryKeys.categories.all, "list"] as const,
		list: (filters?: Record<string, unknown>) =>
			[...queryKeys.categories.lists(), { filters }] as const,
		details: () => [...queryKeys.categories.all, "detail"] as const,
		detail: (id: number) => [...queryKeys.categories.details(), id] as const,
	},

	// 取引関連のクエリキー
	transactions: {
		all: ["transactions"] as const,
		lists: () => [...queryKeys.transactions.all, "list"] as const,
		list: (params?: {
			filters?: Record<string, unknown>;
			sort?: Record<string, unknown>;
			page?: number;
			limit?: number;
		}) => [...queryKeys.transactions.lists(), { params }] as const,
		details: () => [...queryKeys.transactions.all, "detail"] as const,
		detail: (id: number) => [...queryKeys.transactions.details(), id] as const,
		stats: (params?: Record<string, unknown>) =>
			[...queryKeys.transactions.all, "stats", { params }] as const,
	},

	// サブスクリプション関連のクエリキー
	subscriptions: {
		all: ["subscriptions"] as const,
		lists: () => [...queryKeys.subscriptions.all, "list"] as const,
		list: (filters?: Record<string, unknown>) =>
			[...queryKeys.subscriptions.lists(), { filters }] as const,
		details: () => [...queryKeys.subscriptions.all, "detail"] as const,
		detail: (id: number) => [...queryKeys.subscriptions.details(), id] as const,
	},
} as const;

// ========================================
// 型エクスポート
// ========================================

export type QueryKeys = typeof queryKeys;
