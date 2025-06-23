import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router";
import { useUIActions, useUIState } from "../../contexts/app-context";

/**
 * モバイル専用ナビゲーションドロワーコンポーネント
 *
 * 設計方針:
 * - モバイルファーストUI：小画面での使いやすさを最優先
 * - スライドイン式サイドドロワー：画面幅を有効活用
 * - アクセシビリティ対応：キーボードナビゲーション・ARIA属性
 * - 既存のナビゲーション項目との一貫性を保つ
 * - アプリコンテキストとの密結合：isSidebarOpen状態と連携
 */

export interface MobileDrawerProps {
	/** 追加のCSS className */
	className?: string;
}

export function MobileDrawer({ className = "" }: MobileDrawerProps) {
	const { isSidebarOpen } = useUIState();
	const { setSidebarOpen } = useUIActions();
	const location = useLocation();
	const drawerRef = useRef<HTMLDivElement>(null);
	const overlayRef = useRef<HTMLDivElement>(null);

	// ページ遷移時にドロワーを閉じる
	// biome-ignore lint/correctness/useExhaustiveDependencies: ページ遷移時にドロワーを閉じるために必要
	useEffect(() => {
		setSidebarOpen(false);
	}, [location.pathname, setSidebarOpen]);

	// Escapeキーでドロワーを閉じる
	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape" && isSidebarOpen) {
				setSidebarOpen(false);
			}
		};

		if (isSidebarOpen) {
			document.addEventListener("keydown", handleKeyDown);
			// ボディのスクロールを無効化
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleKeyDown);
			document.body.style.overflow = "";
		};
	}, [isSidebarOpen, setSidebarOpen]);

	// フォーカストラップの実装
	useEffect(() => {
		if (!isSidebarOpen || !drawerRef.current) return;

		const drawer = drawerRef.current;
		const focusableElements = drawer.querySelectorAll(
			'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
		);
		const firstElement = focusableElements[0] as HTMLElement;
		const lastElement = focusableElements[
			focusableElements.length - 1
		] as HTMLElement;

		const handleTabKey = (event: KeyboardEvent) => {
			if (event.key !== "Tab") return;

			if (event.shiftKey) {
				// Shift + Tab: 前の要素へ
				if (document.activeElement === firstElement) {
					event.preventDefault();
					lastElement?.focus();
				}
			} else {
				// Tab: 次の要素へ
				if (document.activeElement === lastElement) {
					event.preventDefault();
					firstElement?.focus();
				}
			}
		};

		drawer.addEventListener("keydown", handleTabKey);
		// 初期フォーカスを最初の要素に設定
		firstElement?.focus();

		return () => {
			drawer.removeEventListener("keydown", handleTabKey);
		};
	}, [isSidebarOpen]);

	// オーバーレイクリックでドロワーを閉じる
	const handleOverlayClick = (event: React.MouseEvent) => {
		if (event.target === overlayRef.current) {
			setSidebarOpen(false);
		}
	};

	// アクティブなリンクかどうかを判定
	const isActiveLink = (path: string) => {
		if (path === "/") {
			return location.pathname === "/";
		}
		return location.pathname.startsWith(path);
	};

	// ナビゲーション項目の共通スタイル
	const getLinkClassName = (path: string) => {
		const baseClassName =
			"flex items-center px-4 py-3 text-sm font-medium transition-colors rounded-md";
		const activeClassName =
			"bg-blue-100 text-blue-700 border-r-2 border-blue-600";
		const inactiveClassName =
			"text-gray-700 hover:bg-gray-100 hover:text-blue-600";

		return `${baseClassName} ${isActiveLink(path) ? activeClassName : inactiveClassName}`;
	};

	if (!isSidebarOpen) {
		return null;
	}

	return (
		<div
			className={`fixed inset-0 z-50 md:hidden ${className}`}
			role="dialog"
			aria-modal="true"
			aria-labelledby="mobile-drawer-title"
		>
			{/* オーバーレイ背景 */}
			<div
				ref={overlayRef}
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={handleOverlayClick}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						setSidebarOpen(false);
					}
				}}
				tabIndex={-1}
				aria-hidden="true"
			/>

			{/* ドロワー本体 */}
			<div
				ref={drawerRef}
				className={`fixed top-0 left-0 h-full w-80 max-w-[80vw] bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
					isSidebarOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				{/* ヘッダー */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					<h2
						id="mobile-drawer-title"
						className="text-lg font-semibold text-gray-900"
					>
						メニュー
					</h2>
					<button
						type="button"
						className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
						onClick={() => setSidebarOpen(false)}
						aria-label="メニューを閉じる"
					>
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* ナビゲーション */}
				<nav className="flex-1 p-4 space-y-2">
					{/* ホーム */}
					<Link to="/" className={getLinkClassName("/")} role="menuitem">
						<svg
							className="w-5 h-5 mr-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
							/>
						</svg>
						ホーム
					</Link>

					{/* 取引一覧 */}
					<Link
						to="/transactions"
						className={getLinkClassName("/transactions")}
						role="menuitem"
					>
						<svg
							className="w-5 h-5 mr-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
							/>
						</svg>
						取引一覧
					</Link>

					{/* サブスク管理 */}
					<Link
						to="/subscriptions"
						className={getLinkClassName("/subscriptions")}
						role="menuitem"
					>
						<svg
							className="w-5 h-5 mr-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						サブスク管理
					</Link>

					{/* 区切り線 */}
					<div className="border-t border-gray-200 my-4" />

					{/* 取引登録（プライマリアクション） */}
					<Link
						to="/transactions/new"
						className="flex items-center px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-md"
						role="menuitem"
					>
						<svg
							className="w-5 h-5 mr-3"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
						取引登録
					</Link>
				</nav>

				{/* フッター */}
				<div className="p-4 border-t border-gray-200">
					<div className="text-xs text-gray-500 text-center">
						Saifuu - 家計管理アプリ
					</div>
				</div>
			</div>
		</div>
	);
}
