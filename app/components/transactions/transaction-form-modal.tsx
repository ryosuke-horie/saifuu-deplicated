import { useCallback, useState } from "react";
import { Modal } from "../ui/modal";
import type { TransactionType } from "./use-transaction-modal";

/**
 * 取引登録フォームモーダル
 *
 * 設計方針:
 * - Modalコンポーネントを再利用した統一的なUI
 * - 収入・支出の両方に対応する汎用的なフォーム
 * - 既存のサブスクリプションフォームのパターンを踏襲
 * - Progressive Enhancement対応（HTMLネイティブ機能を基本）
 * - モーダルクローズ時の状態リセット（要件を満たす）
 */

interface TransactionFormModalProps {
	/** モーダルの表示状態 */
	isOpen: boolean;
	/** 取引タイプ（収入・支出） */
	transactionType: TransactionType | null;
	/** モーダルを閉じる関数 */
	onClose: () => void;
}

export function TransactionFormModal({
	isOpen,
	transactionType,
	onClose,
}: TransactionFormModalProps) {
	// 金額の表示用状態（入力値をリアルタイムで整形表示）
	const [displayAmount, setDisplayAmount] = useState("");

	// フォーム送信処理
	const handleSubmit = useCallback(
		(event: React.FormEvent<HTMLFormElement>) => {
			event.preventDefault();

			// TODO: フォームデータの送信処理を実装
			// 現在はコンソール出力のみ（後続で実装）
			const formData = new FormData(event.currentTarget);
			const data = Object.fromEntries(formData.entries());
			console.log("Transaction data:", data);

			// フォーム送信後にモーダルを閉じる
			onClose();
		},
		[onClose],
	);

	// 金額入力の処理（リアルタイム表示用）
	const handleAmountChange = useCallback(
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = event.target.value.replace(/[^0-9]/g, "");
			setDisplayAmount(value);
		},
		[],
	);

	// モーダルが閉じられる際の状態リセット
	const handleClose = useCallback(() => {
		setDisplayAmount("");
		onClose();
	}, [onClose]);

	// 取引種別に応じたタイトルとスタイル
	const getModalConfig = () => {
		if (transactionType === "income") {
			return {
				title: "収入登録",
				submitText: "収入を登録",
				amountLabel: "収入金額",
				buttonClass: "bg-green-600 hover:bg-green-700 focus:ring-green-500",
				iconColor: "text-green-600",
			};
		}
		return {
			title: "支出登録",
			submitText: "支出を登録",
			amountLabel: "支出金額",
			buttonClass: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
			iconColor: "text-red-600",
		};
	};

	const config = getModalConfig();
	const formatAmount = (amount: string) => {
		if (!amount) return "";
		return Number.parseInt(amount, 10).toLocaleString();
	};

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title={config.title}>
			<form onSubmit={handleSubmit} className="space-y-6">
				{/* 隠しフィールド: 取引タイプ */}
				<input type="hidden" name="type" value={transactionType || ""} />

				{/* 金額入力 */}
				<div>
					<label
						htmlFor="amount"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						{config.amountLabel} <span className="text-red-500">*</span>
					</label>
					<div className="relative">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<span className="text-gray-500 sm:text-sm">¥</span>
						</div>
						<input
							type="text"
							id="amount"
							name="amount"
							value={displayAmount}
							onChange={handleAmountChange}
							className="block w-full pl-8 pr-12 border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-right"
							placeholder="0"
							required
							aria-describedby="amount-help"
						/>
						<div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
							<span className="text-gray-500 sm:text-sm">円</span>
						</div>
					</div>
					{displayAmount && (
						<p className="mt-1 text-sm text-gray-600">
							{formatAmount(displayAmount)}円
						</p>
					)}
					<p id="amount-help" className="mt-1 text-xs text-gray-500">
						例: 1000（千円）、50000（5万円）
					</p>
				</div>

				{/* 取引日 */}
				<div>
					<label
						htmlFor="transactionDate"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						取引日 <span className="text-red-500">*</span>
					</label>
					<input
						type="date"
						id="transactionDate"
						name="transactionDate"
						defaultValue={new Date().toISOString().split("T")[0]}
						className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
						required
					/>
				</div>

				{/* 説明 */}
				<div>
					<label
						htmlFor="description"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						説明・メモ
					</label>
					<textarea
						id="description"
						name="description"
						rows={3}
						className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
						placeholder={`${transactionType === "income" ? "給与、副業収入など" : "食費、交通費、光熱費など"}の詳細を記入してください`}
					/>
				</div>

				{/* 支払い方法 */}
				<div>
					<label
						htmlFor="paymentMethod"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						支払い方法
					</label>
					<select
						id="paymentMethod"
						name="paymentMethod"
						className="block w-full border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
					>
						<option value="">選択してください</option>
						<option value="cash">現金</option>
						<option value="credit">クレジットカード</option>
						<option value="debit">デビットカード</option>
						<option value="bank_transfer">銀行振込</option>
						<option value="electronic_money">電子マネー</option>
						<option value="other">その他</option>
					</select>
				</div>

				{/* ボタン */}
				<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
					<button
						type="button"
						onClick={handleClose}
						className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
					>
						キャンセル
					</button>
					<button
						type="submit"
						className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors ${config.buttonClass}`}
					>
						{config.submitText}
					</button>
				</div>
			</form>
		</Modal>
	);
}
