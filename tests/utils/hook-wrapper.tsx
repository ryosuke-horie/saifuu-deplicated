/**
 * React Hooks テスト専用ラッパー
 *
 * 設計方針:
 * - React Router v7のプリアンブル問題を回避
 * - フックテスト専用の軽量ラッパー
 * - QueryClientのみを提供してテストを簡素化
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { createTestQueryClient } from "./query-wrapper";

interface HookWrapperProps {
	children: ReactNode;
	queryClient?: QueryClient;
}

/**
 * フックテスト専用ラッパー
 * React Routerを使用せず、QueryClientのみを提供
 */
export function HookWrapper({ children, queryClient }: HookWrapperProps) {
	const client = queryClient ?? createTestQueryClient();
	return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}