import { Link } from "react-router";
import { HeaderLogo } from "../ui/logo";

/**
 * アプリケーション共通ヘッダーコンポーネント
 *
 * 設計方針:
 * - ロゴとナビゲーションを含む統一的なヘッダー
 * - レスポンシブデザイン（モバイルファーストUI）
 * - アクセシビリティ対応
 * - 既存のUIパターンと一貫性を保つ
 */

export interface HeaderProps {
	/** ヘッダーのタイトル */
	title?: string;
	/** 説明文 */
	description?: string;
	/** 追加のアクション要素 */
	actions?: React.ReactNode;
	/** ナビゲーションを表示するかどうか */
	showNavigation?: boolean;
}

export function Header({
	title,
	description,
	actions,
	showNavigation = true,
}: HeaderProps) {
	return (
		<header className="bg-white border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				{/* ロゴとナビゲーション */}
				{showNavigation && (
					<div className="flex items-center justify-between py-4">
						{/* ロゴ */}
						<Link
							to="/"
							className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
						>
							<HeaderLogo />
							<div className="hidden sm:block">
								<h1 className="text-xl font-bold text-gray-900">Saifuu</h1>
								<p className="text-sm text-gray-600">家計管理アプリ</p>
							</div>
						</Link>

						{/* ナビゲーションメニュー */}
						<nav className="hidden md:flex items-center space-x-6">
							<Link
								to="/"
								className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
							>
								ホーム
							</Link>
							<Link
								to="/transactions"
								className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
							>
								取引一覧
							</Link>
							<Link
								to="/subscriptions"
								className="text-gray-700 hover:text-blue-600 transition-colors font-medium"
							>
								サブスク管理
							</Link>
							<Link
								to="/transaction-form-demo"
								className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
							>
								取引登録
							</Link>
						</nav>

						{/* モバイルメニューボタン（将来実装用） */}
						<button
							type="button"
							className="md:hidden p-2 text-gray-700 hover:text-blue-600 transition-colors"
							aria-label="メニューを開く"
						>
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M4 6h16M4 12h16M4 18h16"
								/>
							</svg>
						</button>
					</div>
				)}

				{/* ページタイトルエリア */}
				{(title || description || actions) && (
					<div className="py-6 border-t border-gray-100">
						<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
							<div>
								{title && (
									<h1 className="text-3xl font-bold text-gray-900">{title}</h1>
								)}
								{description && (
									<p className="text-gray-600 mt-2">{description}</p>
								)}
							</div>
							{actions && <div className="mt-4 lg:mt-0">{actions}</div>}
						</div>
					</div>
				)}
			</div>
		</header>
	);
}

/**
 * シンプルなヘッダーコンポーネント（ロゴのみ）
 */
export function SimpleHeader() {
	return (
		<header className="bg-white border-b border-gray-200">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
				<Link
					to="/"
					className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
				>
					<HeaderLogo />
					<div>
						<h1 className="text-xl font-bold text-gray-900">Saifuu</h1>
						<p className="text-sm text-gray-600">家計管理アプリ</p>
					</div>
				</Link>
			</div>
		</header>
	);
}
