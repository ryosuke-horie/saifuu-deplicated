import { useState } from "react";

/**
 * 取引登録モーダルの状態管理カスタムフック
 *
 * 設計方針:
 * - モーダルの開閉状態を管理
 * - 取引タイプ（収入・支出）の状態を管理
 * - フォームリセット機能を提供
 * - シンプルで再利用可能なAPI設計
 *
 * 使用例:
 * ```typescript
 * const { isOpen, transactionType, openModal, closeModal } = useTransactionModal();
 * ```
 */

export type TransactionType = "income" | "expense";

interface UseTransactionModalReturn {
	/** モーダルの表示状態 */
	isOpen: boolean;
	/** 取引タイプ（収入・支出） */
	transactionType: TransactionType | null;
	/** 収入登録モーダルを開く */
	openIncomeModal: () => void;
	/** 支出登録モーダルを開く */
	openExpenseModal: () => void;
	/** モーダルを閉じる */
	closeModal: () => void;
}

/**
 * 取引登録モーダルの状態管理フック
 */
export function useTransactionModal(): UseTransactionModalReturn {
	const [isOpen, setIsOpen] = useState(false);
	const [transactionType, setTransactionType] =
		useState<TransactionType | null>(null);

	const openIncomeModal = () => {
		setTransactionType("income");
		setIsOpen(true);
	};

	const openExpenseModal = () => {
		setTransactionType("expense");
		setIsOpen(true);
	};

	const closeModal = () => {
		setIsOpen(false);
		// モーダルを閉じる際に状態をリセット
		// これにより、次回開いた時に前回の状態が残らない
		setTransactionType(null);
	};

	return {
		isOpen,
		transactionType,
		openIncomeModal,
		openExpenseModal,
		closeModal,
	};
}
