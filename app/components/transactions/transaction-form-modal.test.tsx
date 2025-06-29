import { render, screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { TransactionFormModal } from "./transaction-form-modal";

/**
 * TransactionFormModal コンポーネントのテスト
 *
 * テスト方針:
 * - モーダルの表示・非表示が正常に動作することを検証
 * - フォーム入力が正常に動作することを検証
 * - キャンセルボタンでモーダルが閉じることを検証
 * - 収入・支出タイプに応じたUIの変化を検証
 */

describe("TransactionFormModal", () => {
	const mockOnClose = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
		cleanup();
	});

	it("モーダルが閉じている場合、何も表示されない", () => {
		render(
			<TransactionFormModal
				isOpen={false}
				transactionType="income"
				onClose={mockOnClose}
			/>,
		);

		expect(screen.queryByText("収入登録")).not.toBeInTheDocument();
	});

	it("収入登録モーダルが正常に表示される", () => {
		render(
			<TransactionFormModal
				isOpen={true}
				transactionType="income"
				onClose={mockOnClose}
			/>,
		);

		expect(screen.getByText("収入登録")).toBeInTheDocument();
		expect(screen.getByText("収入金額")).toBeInTheDocument();
		expect(screen.getByText("収入を登録")).toBeInTheDocument();
	});

	it("支出登録モーダルが正常に表示される", () => {
		render(
			<TransactionFormModal
				isOpen={true}
				transactionType="expense"
				onClose={mockOnClose}
			/>,
		);

		expect(screen.getByText("支出登録")).toBeInTheDocument();
		expect(screen.getByText("支出金額")).toBeInTheDocument();
		expect(screen.getByText("支出を登録")).toBeInTheDocument();
	});

	it("金額入力が正常に動作する", async () => {
		render(
			<TransactionFormModal
				isOpen={true}
				transactionType="income"
				onClose={mockOnClose}
			/>,
		);

		const amountInput = screen.getByRole("textbox", { name: /収入金額/ });
		
		fireEvent.change(amountInput, { target: { value: "1000" } });
		
		expect(amountInput).toHaveValue("1000");
		
		// 整形された金額表示を確認
		await waitFor(() => {
			expect(screen.getByText("1,000円")).toBeInTheDocument();
		});
	});

	it("取引日のデフォルト値が今日の日付になっている", () => {
		render(
			<TransactionFormModal
				isOpen={true}
				transactionType="income"
				onClose={mockOnClose}
			/>,
		);

		const dateInput = screen.getByLabelText(/取引日/);
		const today = new Date().toISOString().split("T")[0];
		
		expect(dateInput).toHaveValue(today);
	});

	it("キャンセルボタンでモーダルが閉じる", () => {
		render(
			<TransactionFormModal
				isOpen={true}
				transactionType="income"
				onClose={mockOnClose}
			/>,
		);

		// フォーム内のキャンセルボタンを特定（getAllByTextを使用し、最初のものを選択）
		const cancelButtons = screen.getAllByText("キャンセル");
		const formCancelButton = cancelButtons.find(button => 
			button.closest('form') !== null
		);
		
		expect(formCancelButton).toBeTruthy();
		fireEvent.click(formCancelButton!);

		expect(mockOnClose).toHaveBeenCalledOnce();
	});

	it("フォーム送信でモーダルが閉じる", () => {
		// console.log をモック化
		const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

		render(
			<TransactionFormModal
				isOpen={true}
				transactionType="income"
				onClose={mockOnClose}
			/>,
		);

		// 必須項目を入力
		const amountInput = screen.getByRole("textbox", { name: /収入金額/ });
		fireEvent.change(amountInput, { target: { value: "1000" } });

		// フォーム送信
		const submitButton = screen.getByRole("button", { name: "収入を登録" });
		fireEvent.click(submitButton);

		expect(mockOnClose).toHaveBeenCalledOnce();
		
		// コンソール出力も確認
		expect(consoleSpy).toHaveBeenCalledWith("Transaction data:", expect.any(Object));
		
		consoleSpy.mockRestore();
	});

	it("必須項目が空の場合、HTML5バリデーションが動作する", () => {
		render(
			<TransactionFormModal
				isOpen={true}
				transactionType="income"
				onClose={mockOnClose}
			/>,
		);

		const amountInput = screen.getByRole("textbox", { name: /収入金額/ });
		
		// required属性が設定されていることを確認
		expect(amountInput).toBeRequired();
		
		const dateInput = screen.getByLabelText(/取引日/);
		expect(dateInput).toBeRequired();
	});

	it("transactionTypeがnullの場合でもエラーが発生しない", () => {
		expect(() => {
			render(
				<TransactionFormModal
					isOpen={true}
					transactionType={null}
					onClose={mockOnClose}
				/>,
			);
		}).not.toThrow();

		// デフォルト値（支出）が表示されることを確認
		expect(screen.getByText("支出登録")).toBeInTheDocument();
	});
});