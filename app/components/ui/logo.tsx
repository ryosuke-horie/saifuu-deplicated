import React from "react";

/**
 * Saifuu アプリケーションのロゴコンポーネント
 *
 * 設計方針:
 * - 財布をモチーフにしたアイコンデザイン
 * - レスポンシブ対応（サイズ指定可能）
 * - SVGベースで高品質スケーリング
 * - アクセシビリティ対応（alt属性、role）
 */

export interface LogoProps {
	/** ロゴのサイズ（px単位） */
	size?: number;
	/** CSSクラス名 */
	className?: string;
	/** クリック可能にするかどうか */
	clickable?: boolean;
	/** クリック時のハンドラー */
	onClick?: () => void;
	/** アクセシビリティ用のラベル */
	ariaLabel?: string;
}

export function Logo({
	size = 128,
	className = "",
	clickable = false,
	onClick,
	ariaLabel = "Saifuu - 家計管理アプリ",
}: LogoProps) {
	// サイズに応じて最適なSVGファイルを選択
	const getSvgPath = (size: number): string => {
		if (size <= 16) return "/logo-16.svg";
		if (size <= 32) return "/logo-32.svg";
		return "/logo.svg";
	};

	const svgPath = getSvgPath(size);

	const logoElement = (
		<img
			src={svgPath}
			alt={ariaLabel}
			width={size}
			height={size}
			className={`${className} ${clickable ? "cursor-pointer" : ""}`}
			onClick={clickable ? onClick : undefined}
			role={clickable ? "button" : "img"}
			aria-label={ariaLabel}
			tabIndex={clickable ? 0 : undefined}
			onKeyDown={
				clickable
					? (e) => {
							if ((e.key === "Enter" || e.key === " ") && onClick) {
								e.preventDefault();
								onClick();
							}
						}
					: undefined
			}
		/>
	);

	return logoElement;
}

/**
 * ヘッダー用の小さなロゴコンポーネント
 */
export function HeaderLogo({
	className = "",
	onClick,
}: { className?: string; onClick?: () => void }) {
	return (
		<Logo
			size={40}
			className={className}
			clickable={!!onClick}
			onClick={onClick}
			ariaLabel="Saifuu ホームページに戻る"
		/>
	);
}

/**
 * アイコンサイズのロゴコンポーネント
 */
export function IconLogo({ className = "" }: { className?: string }) {
	return <Logo size={24} className={className} ariaLabel="Saifuu アイコン" />;
}

/**
 * 大きなロゴコンポーネント（ランディングページ等用）
 */
export function LargeLogo({
	className = "",
	onClick,
}: { className?: string; onClick?: () => void }) {
	return (
		<Logo
			size={128}
			className={className}
			clickable={!!onClick}
			onClick={onClick}
			ariaLabel="Saifuu - 家計管理アプリ"
		/>
	);
}
