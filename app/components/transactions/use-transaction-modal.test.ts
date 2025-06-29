import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useTransactionModal } from "./use-transaction-modal";

/**
 * useTransactionModal カスタムフックのテスト
 *
 * テスト方針:
 * - モーダル開閉の状態管理が正常に動作することを検証
 * - 取引タイプ（収入・支出）の切り替えが正常に動作することを検証
 * - モーダルクローズ時の状態リセットが正常に動作することを検証
 */

describe("useTransactionModal", () => {
	it("初期状態が正しく設定される", () => {
		const { result } = renderHook(() => useTransactionModal());

		expect(result.current.isOpen).toBe(false);
		expect(result.current.transactionType).toBe(null);
	});

	it("収入モーダルが正常に開く", () => {
		const { result } = renderHook(() => useTransactionModal());

		act(() => {
			result.current.openIncomeModal();
		});

		expect(result.current.isOpen).toBe(true);
		expect(result.current.transactionType).toBe("income");
	});

	it("支出モーダルが正常に開く", () => {
		const { result } = renderHook(() => useTransactionModal());

		act(() => {
			result.current.openExpenseModal();
		});

		expect(result.current.isOpen).toBe(true);
		expect(result.current.transactionType).toBe("expense");
	});

	it("モーダルが正常に閉じ、状態がリセットされる", () => {
		const { result } = renderHook(() => useTransactionModal());

		// まず収入モーダルを開く
		act(() => {
			result.current.openIncomeModal();
		});

		expect(result.current.isOpen).toBe(true);
		expect(result.current.transactionType).toBe("income");

		// モーダルを閉じる
		act(() => {
			result.current.closeModal();
		});

		// 状態がリセットされることを確認
		expect(result.current.isOpen).toBe(false);
		expect(result.current.transactionType).toBe(null);
	});

	it("取引タイプを切り替えてもモーダルが正常に動作する", () => {
		const { result } = renderHook(() => useTransactionModal());

		// 収入モーダルを開く
		act(() => {
			result.current.openIncomeModal();
		});

		expect(result.current.transactionType).toBe("income");

		// 支出モーダルに切り替える（通常の使用では発生しないが、API の堅牢性をテスト）
		act(() => {
			result.current.openExpenseModal();
		});

		expect(result.current.isOpen).toBe(true);
		expect(result.current.transactionType).toBe("expense");
	});
});