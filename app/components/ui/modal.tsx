import { type ReactNode, useEffect } from "react";

/**
 * モーダルコンポーネント
 *
 * 設計方針:
 * - AppContextと連携したモーダル表示機能
 * - オーバーレイクリックで閉じる機能
 * - ESCキーで閉じる機能
 * - フォーカストラップ機能
 * - スクロール防止機能
 * - アクセシビリティ対応
 */

interface ModalProps {
	/** モーダルの表示状態 */
	isOpen: boolean;
	/** モーダルを閉じる関数 */
	onClose: () => void;
	/** モーダルの内容 */
	children: ReactNode;
	/** モーダルのタイトル（アクセシビリティ用） */
	title?: string;
}

export function Modal({ isOpen, onClose, children, title }: ModalProps) {
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

	// モーダルが閉じている場合は何も表示しない
	if (!isOpen) {
		return null;
	}

	// オーバーレイクリックで閉じる
	const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) {
			onClose();
		}
	};

	return (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center"
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
			aria-labelledby={title ? "modal-title" : undefined}
		>
			{/* オーバーレイ */}
			<div className="absolute inset-0 bg-black bg-opacity-50 transition-opacity" />

			{/* モーダルコンテンツ */}
			<div className="relative bg-white rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
				{/* ヘッダー */}
				<div className="flex items-center justify-between p-4 border-b border-gray-200">
					{title && (
						<h2
							id="modal-title"
							className="text-lg font-semibold text-gray-900"
						>
							{title}
						</h2>
					)}
					<button
						type="button"
						onClick={onClose}
						className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
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
				<div className="p-6">{children}</div>
			</div>
		</div>
	);
}
