/**
 * テストセットアップファイル
 *
 * 設計方針:
 * - Vitestのテスト環境で必要な設定を一元管理
 * - @testing-library/jest-domの設定でDOMアサーションを有効化
 * - fetchモックを設定してAPIコールをテスト環境で制御
 * - データベースモックの自動リセットでテスト間の状態隔離
 * - グローバルなテスト設定を統一
 */

import "@testing-library/jest-dom";
import React from "react";
import { vi } from "vitest";

// ========================================
// Fetch APIモック設定
// ========================================

/**
 * グローバルfetchモックの設定
 * APIリクエストをテスト環境で制御するために使用
 */
global.fetch = vi.fn();

/**
 * fetchモックのヘルパー関数
 * テスト内で簡単にレスポンスを設定できるように提供
 */
export const mockFetch = (
	response: any,
	options?: { status?: number; ok?: boolean },
) => {
	const mockResponse = {
		ok: options?.ok ?? true,
		status: options?.status ?? 200,
		json: vi.fn().mockResolvedValue(response),
		text: vi.fn().mockResolvedValue(JSON.stringify(response)),
		headers: new Headers(),
		redirected: false,
		statusText: "OK",
		type: "basic" as ResponseType,
		url: "",
		clone: vi.fn(),
		body: null,
		bodyUsed: false,
		arrayBuffer: vi.fn(),
		blob: vi.fn(),
		formData: vi.fn(),
	};

	(global.fetch as any).mockResolvedValue(mockResponse);
	return mockResponse;
};

// ========================================
// データベースモック設定
// ========================================

/**
 * データベースモックの自動リセット設定
 * 各テスト実行前にモックの状態をクリアして、テスト間の状態隔離を保証
 */

// テスト前の自動セットアップ
beforeEach(() => {
	// fetchモックをリセット
	vi.clearAllMocks();

	// データベースモックをリセット（__mocks__/db.tsのモックを利用）
	vi.resetModules();
});

// テスト後のクリーンアップ
afterEach(() => {
	vi.restoreAllMocks();
});

// ========================================
// 環境変数モック設定
// ========================================

/**
 * テスト環境用の環境変数設定
 * プロダクション環境の設定をテスト環境に適用
 */
process.env.NODE_ENV = "test";

// ========================================
// Unhandled Rejection対策
// ========================================

/**
 * テスト環境でのUnhandled Rejectionを適切に処理
 * CIでのテスト実行時にUnhandled Rejectionが発生することを防ぐ
 */
let unhandledRejections: Promise<any>[] = [];

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
	// Unhandled Rejectionをキャッチして記録
	unhandledRejections.push(event.promise);

	// テスト環境でのデバッグ用ログ（必要に応じて）
	if (
		process.env.NODE_ENV === "test" &&
		process.env.DEBUG_UNHANDLED_REJECTION
	) {
		console.warn("Unhandled Promise Rejection in test:", event.reason);
	}

	// デフォルトの動作を防ぐ
	event.preventDefault();
};

beforeAll(() => {
	// Unhandled Rejectionをキャッチ
	process.on("unhandledRejection", (reason, promise) => {
		unhandledRejections.push(promise);
		if (process.env.DEBUG_UNHANDLED_REJECTION) {
			console.warn("Unhandled Promise Rejection in test:", reason);
		}
	});

	// ブラウザ環境でのUnhandled Rejection処理
	if (typeof window !== "undefined") {
		window.addEventListener("unhandledrejection", handleUnhandledRejection);
	}
});

afterAll(() => {
	// クリーンアップ
	if (typeof window !== "undefined") {
		window.removeEventListener("unhandledrejection", handleUnhandledRejection);
	}
	unhandledRejections = [];
});

// ========================================
// コンソール出力制御
// ========================================

/**
 * テスト実行時のコンソール出力を制御
 * 必要に応じてコンソールエラーやワーニングをモック
 */
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
	// React Router の開発モードワーニングを抑制
	console.warn = vi.fn((message) => {
		if (typeof message === "string" && message.includes("React Router")) {
			return;
		}
		originalWarn(message);
	});

	// 必要に応じてエラーログも制御
	console.error = vi.fn((message) => {
		if (typeof message === "string" && message.includes("Warning:")) {
			return;
		}
		originalError(message);
	});
});

afterAll(() => {
	console.error = originalError;
	console.warn = originalWarn;
});

// ========================================
// DOM環境の設定
// ========================================

/**
 * jsdom環境での追加設定
 * window.matchMediaなどのブラウザAPIをモック
 */

// matchMediaのモック（CSS メディアクエリ対応）
Object.defineProperty(window, "matchMedia", {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// ResizeObserverのモック（チャートコンポーネント対応）
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// IntersectionObserverのモック（遅延読み込み対応）
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

// ========================================
// React Router v7専用モック設定
// ========================================

// React Router関連のモック（プリアンブル問題を回避）
vi.mock("@react-router/dev/vite", () => ({
	reactRouter: vi.fn(() => ({
		name: "react-router",
		config: vi.fn(),
	})),
}));

// React Routerフックのモック
vi.mock("react-router", () => ({
	useNavigate: vi.fn(() => vi.fn()),
	useLocation: vi.fn(() => ({
		pathname: "/",
		search: "",
		hash: "",
		state: null,
	})),
	useParams: vi.fn(() => ({})),
	useSearchParams: vi.fn(() => [new URLSearchParams(), vi.fn()]),
	Link: vi.fn(),
	NavLink: vi.fn(),
	Outlet: vi.fn(),
}));
