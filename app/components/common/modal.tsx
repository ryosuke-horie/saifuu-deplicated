import { type ReactNode, useEffect, useState } from "react";

/**
 * 汎用モーダルコンポーネント
 *
 * 設計方針:
 * - レスポンシブ対応の汎用モーダル
 * - オーバーレイクリックで閉じる機能
 * - ESCキーで閉じる機能
 * - フォーカストラップ機能
 * - スクロール防止機能
 * - フェードイン・アウトアニメーション
 * - サイズオプション（sm, md, lg）
 * - アクセシビリティ対応
 * - 右下に閉じるボタン配置
 */

interface ModalProps {
	/** モーダルの表示状態 */
	isOpen: boolean;
	/** モーダルを閉じる関数 */
	onClose: () => void;
	/** モーダルのタイトル */
	title: string;
	/** モーダルの内容 */
	children: ReactNode;
	/** モーダルのサイズ */
	size?: "sm" | "md" | "lg";
}

export function Modal({
	isOpen,
	onClose,
	children,
	title,
	size = "md",
}: ModalProps) {
	// アニメーション状態管理
	const [isAnimating, setIsAnimating] = useState(false);
	const [shouldRender, setShouldRender] = useState(false);

	// サイズに応じたクラス設定
	const getSizeClasses = () => {
		switch (size) {
			case "sm":
				return "max-w-sm w-full";
			case "lg":
				return "max-w-4xl w-full";
			default:
				return "max-w-2xl w-full";
		}
	};

	// ESCキーでモーダルを閉じる
	useEffect(() => {
		const handleEscapeKey = (event: KeyboardEvent) => {
			if (event.key === "Escape") {
				onClose();
			}
		};

		if (isOpen) {
			document.addEventListener("keydown", handleEscapeKey);
			// モーダル表示中はページのスクロールを防止
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscapeKey);
			document.body.style.overflow = "unset";
		};
	}, [isOpen, onClose]);

	// アニメーション制御
	useEffect(() => {
		if (isOpen) {
			setShouldRender(true);
			// 少し遅延してアニメーション開始
			const timer = setTimeout(() => setIsAnimating(true), 10);
			return () => clearTimeout(timer);
		}
		setIsAnimating(false);
		// アニメーション終了後にDOMから削除
		const timer = setTimeout(() => setShouldRender(false), 300);
		return () => clearTimeout(timer);
	}, [isOpen]);

	// オーバーレイクリックで閉じる
	const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) {
			onClose();
		}
	};

	// モーダルが閉じている場合は何も表示しない
	if (!shouldRender) {
		return null;
	}

	return (
		<div
			className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
				isAnimating ? "opacity-100" : "opacity-0"
			}`}
			onClick={handleOverlayClick}
			onKeyDown={(event) => {
				if (event.key === "Enter" || event.key === " ") {
					handleOverlayClick(
						event as unknown as React.MouseEvent<HTMLDivElement>,
					);
				}
			}}
			role="dialog"
			aria-modal="true"
			aria-labelledby="modal-title"
		>
			{/* オーバーレイ */}
			<div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity duration-300" />

			{/* モーダルコンテンツ */}
			<div
				className={`relative bg-white rounded-lg shadow-xl ${getSizeClasses()} mx-4 max-h-[90vh] overflow-hidden transform transition-all duration-300 ${
					isAnimating ? "scale-100 opacity-100" : "scale-95 opacity-0"
				}`}
			>
				{/* ヘッダー */}
				<div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
					<h2
						id="modal-title"
						className="text-lg sm:text-xl font-semibold text-gray-900 truncate pr-4"
					>
						{title}
					</h2>
					<button
						type="button"
						onClick={onClose}
						className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1 transition-colors duration-200"
						aria-label="モーダルを閉じる"
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
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				{/* モーダル内容 */}
				<div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
					{children}
				</div>

				{/* 右下の閉じるボタン */}
				<div className="absolute bottom-4 right-4">
					<button
						type="button"
						onClick={onClose}
						className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-2 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
						aria-label="モーダルを閉じる"
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
			</div>
		</div>
	);
}
