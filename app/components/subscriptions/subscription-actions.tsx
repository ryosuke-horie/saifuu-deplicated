import { useState } from "react";
import {
	useActivateSubscription,
	useDeactivateSubscription,
	useDeleteSubscription,
} from "../../lib/hooks/use-subscriptions";
import type { SelectSubscription } from "../../types";

/**
 * サブスクリプション操作アクションコンポーネント
 *
 * 設計方針:
 * - activate/deactivate/delete操作の統一インターフェース
 * - 削除時の確認ダイアログ表示
 * - 楽観的更新によるUX向上
 * - エラーハンドリングとフィードバック
 * - 既存のAPIフックとの完全連携
 * - アクセシブルなボタン設計
 */

export interface SubscriptionActionsProps {
	/**
	 * 対象のサブスクリプション
	 */
	subscription: SelectSubscription;
	/**
	 * 編集ボタンクリック時のコールバック
	 */
	onEdit?: (subscription: SelectSubscription) => void;
	/**
	 * 操作完了時のコールバック
	 */
	onActionComplete?: () => void;
	/**
	 * コンパクト表示モード
	 */
	compact?: boolean;
}

export function SubscriptionActions({
	subscription,
	onEdit,
	onActionComplete,
	compact = false,
}: SubscriptionActionsProps) {
	const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

	// ミューテーションフック
	const activateMutation = useActivateSubscription();
	const deactivateMutation = useDeactivateSubscription();
	const deleteMutation = useDeleteSubscription();

	// 編集ハンドラー
	const handleEdit = () => {
		onEdit?.(subscription);
	};

	// アクティブ/非アクティブ切り替えハンドラー
	const handleToggleActive = async () => {
		try {
			if (subscription.isActive) {
				await deactivateMutation.mutateAsync(subscription.id);
			} else {
				await activateMutation.mutateAsync(subscription.id);
			}
			onActionComplete?.();
		} catch (error) {
			console.error("Toggle active error:", error);
		}
	};

	// 削除確認表示
	const handleDeleteClick = () => {
		setShowDeleteConfirm(true);
	};

	// 削除実行
	const handleDeleteConfirm = async () => {
		try {
			await deleteMutation.mutateAsync(subscription.id);
			setShowDeleteConfirm(false);
			onActionComplete?.();
		} catch (error) {
			console.error("Delete error:", error);
		}
	};

	// 削除キャンセル
	const handleDeleteCancel = () => {
		setShowDeleteConfirm(false);
	};

	// 削除確認ダイアログ
	if (showDeleteConfirm) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-4">
				<div className="flex items-start">
					<div className="flex-shrink-0">
						<div className="text-red-600">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
					</div>
					<div className="ml-3 w-0 flex-1">
						<h3 className="text-sm font-medium text-red-800">
							サブスクリプションの削除
						</h3>
						<div className="mt-2 text-sm text-red-700">
							<p>
								「{subscription.name}」を削除してもよろしいですか？
								<br />
								この操作は取り消すことができません。
							</p>
						</div>
						<div className="mt-4 flex space-x-3">
							<button
								type="button"
								onClick={handleDeleteConfirm}
								disabled={deleteMutation.isPending}
								className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
									deleteMutation.isPending
										? "bg-red-400 cursor-not-allowed"
										: "bg-red-600 hover:bg-red-700"
								}`}
							>
								{deleteMutation.isPending ? (
									<>
										<svg
											className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												className="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												strokeWidth="4"
											/>
											<path
												className="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											/>
										</svg>
										削除中...
									</>
								) : (
									"削除する"
								)}
							</button>
							<button
								type="button"
								onClick={handleDeleteCancel}
								disabled={deleteMutation.isPending}
								className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
							>
								キャンセル
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// 通常のアクションボタン
	return (
		<div className="flex items-center justify-between pt-4 border-t border-gray-200">
			<div className="flex items-center space-x-2">
				<button
					type="button"
					onClick={handleEdit}
					className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
				>
					編集
				</button>
				<button
					type="button"
					onClick={handleToggleActive}
					disabled={activateMutation.isPending || deactivateMutation.isPending}
					className={`text-sm font-medium transition-colors ${
						subscription.isActive
							? "text-orange-600 hover:text-orange-800"
							: "text-green-600 hover:text-green-800"
					} ${
						activateMutation.isPending || deactivateMutation.isPending
							? "opacity-50 cursor-not-allowed"
							: ""
					}`}
				>
					{activateMutation.isPending || deactivateMutation.isPending ? (
						<span className="flex items-center">
							<svg
								className="animate-spin -ml-1 mr-1 h-3 w-3"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									className="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									strokeWidth="4"
								/>
								<path
									className="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								/>
							</svg>
							{subscription.isActive ? "停止中..." : "再開中..."}
						</span>
					) : subscription.isActive ? (
						"一時停止"
					) : (
						"再開"
					)}
				</button>
			</div>
			<button
				type="button"
				onClick={handleDeleteClick}
				className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
			>
				削除
			</button>
		</div>
	);
}

/**
 * 削除確認ダイアログ（独立コンポーネント版）
 */
export interface DeleteConfirmDialogProps {
	/**
	 * 削除対象のサブスクリプション
	 */
	subscription: SelectSubscription;
	/**
	 * ダイアログの表示状態
	 */
	isOpen: boolean;
	/**
	 * 削除確認時のコールバック
	 */
	onConfirm: () => void;
	/**
	 * キャンセル時のコールバック
	 */
	onCancel: () => void;
	/**
	 * 削除処理中の状態
	 */
	isDeleting?: boolean;
}

export function DeleteConfirmDialog({
	subscription,
	isOpen,
	onConfirm,
	onCancel,
	isDeleting = false,
}: DeleteConfirmDialogProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			<div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
				{/* 背景オーバーレイ */}
				<div
					className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
					onClick={onCancel}
					onKeyDown={(e) => {
						if (e.key === "Escape") {
							onCancel();
						}
					}}
					role="button"
					tabIndex={0}
					aria-label="ダイアログを閉じる"
				/>

				{/* ダイアログ本体 */}
				<div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
					<div className="sm:flex sm:items-start">
						<div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
							<svg
								className="h-6 w-6 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
							<h3 className="text-lg font-medium text-gray-900">
								サブスクリプションの削除
							</h3>
							<div className="mt-2">
								<p className="text-sm text-gray-500">
									「{subscription.name}」を削除してもよろしいですか？
									<br />
									この操作は取り消すことができません。
								</p>
							</div>
						</div>
					</div>
					<div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
						<button
							type="button"
							onClick={onConfirm}
							disabled={isDeleting}
							className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm ${
								isDeleting
									? "bg-red-400 cursor-not-allowed"
									: "bg-red-600 hover:bg-red-700"
							}`}
						>
							{isDeleting ? "削除中..." : "削除する"}
						</button>
						<button
							type="button"
							onClick={onCancel}
							disabled={isDeleting}
							className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
						>
							キャンセル
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
