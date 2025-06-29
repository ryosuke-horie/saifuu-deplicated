import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { SelectCategory, SelectSubscription } from "../../types";
import { SubscriptionFormModal } from "./subscription-form-modal";

// React Query のモック
const createTestQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
				staleTime: 0,
			},
			mutations: {
				retry: false,
			},
		},
	});

// useActiveCategories フックのモック
vi.mock("../../lib/hooks/use-categories", () => ({
	useActiveCategories: vi.fn(),
}));

const { useActiveCategories } = await vi.importMock<{
	useActiveCategories: any;
}>("../../lib/hooks/use-categories");

// テスト用のラッパーコンポーネント
function TestWrapper({ children }: { children: React.ReactNode }) {
	const queryClient = createTestQueryClient();
	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}

// モックデータ - カテゴリIDが重複しないようユニークに管理
const mockCategories: SelectCategory[] = [
	{
		id: 1,
		name: "エンターテイメント",
		type: "expense",
		color: "#FF6B6B",
		icon: "entertainment",
		displayOrder: 1,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	{
		id: 2,
		name: "ソフトウェア・アプリ",
		type: "expense",
		color: "#4ECDC4",
		icon: "software",
		displayOrder: 2,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
];

// 収入カテゴリ（支出カテゴリと重複しないID）
const mockIncomeCategory: SelectCategory = {
	id: 100, // 大きなIDで支出カテゴリと重複回避
	name: "給与",
	type: "income",
	color: "#96CEB4",
	icon: "salary",
	displayOrder: 100,
	isActive: true,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

const mockSubscription: SelectSubscription = {
	id: 1,
	name: "Netflix",
	amount: 1980,
	categoryId: 1,
	frequency: "monthly",
	nextPaymentDate: "2024-02-15",
	description: "家族プラン",
	isActive: true,
	autoGenerate: true,
	createdAt: "2024-01-01T00:00:00.000Z",
	updatedAt: "2024-01-01T00:00:00.000Z",
};

describe("SubscriptionFormModal", () => {
	const mockOnClose = vi.fn();
	const mockOnSubmit = vi.fn();

	beforeEach(() => {
		// 全てのモック関数をクリア
		vi.clearAllMocks();
		// DOM要素もクリーンアップ
		document.body.innerHTML = "";

		// デフォルトのモック実装（支出カテゴリのみ）
		useActiveCategories.mockReturnValue({
			data: {
				data: mockCategories,
				count: mockCategories.length,
			},
			isLoading: false,
			error: null,
		});
	});

	afterEach(() => {
		// 各テスト後にコンポーネントをクリーンアップ
		cleanup();
		// モック関数の呼び出し履歴もクリア
		vi.clearAllMocks();
		// DOM要素もクリーンアップ
		document.body.innerHTML = "";
	});

	describe("基本的な表示", () => {
		it("新規作成モードで正しく表示される", () => {
			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			expect(
				screen.getByText("新規サブスクリプション登録"),
			).toBeInTheDocument();
			expect(screen.getByLabelText(/カテゴリ/)).toBeInTheDocument();
			expect(screen.getByLabelText(/サービス名/)).toBeInTheDocument();
			expect(screen.getByLabelText(/金額/)).toBeInTheDocument();
			expect(screen.getByLabelText(/請求頻度/)).toBeInTheDocument();
			expect(screen.getByLabelText(/次回支払日/)).toBeInTheDocument();
			expect(screen.getByLabelText(/説明/)).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /登録/ })).toBeInTheDocument();
		});

		it("編集モードで初期データが正しく表示される", () => {
			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="edit"
						initialData={mockSubscription}
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			expect(screen.getByText("サブスクリプション編集")).toBeInTheDocument();
			expect(screen.getByDisplayValue("Netflix")).toBeInTheDocument();
			expect(screen.getByDisplayValue("1980")).toBeInTheDocument();
			// セレクトボックスの値確認
			const frequencySelect = screen.getByLabelText(
				/請求頻度/,
			) as unknown as HTMLSelectElement;
			expect(frequencySelect.value).toBe("monthly");
			expect(screen.getByDisplayValue("2024-02-15")).toBeInTheDocument();
			expect(screen.getByDisplayValue("家族プラン")).toBeInTheDocument();
			expect(screen.getByRole("button", { name: /更新/ })).toBeInTheDocument();
		});

		it("モーダルが閉じている時は何も表示されない", () => {
			const { container } = render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={false}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// モーダルが閉じている時は、コンポーネントがnullを返すため
			// QueryClientProviderのdivのみが残り、モーダル要素は存在しないことを確認
			expect(container.querySelector('[class*="fixed inset-0"]')).toBeNull();
			expect(
				container.querySelector(
					'[role="button"][aria-label="モーダルを閉じる"]',
				),
			).toBeNull();
			expect(
				screen.queryByText("新規サブスクリプション登録"),
			).not.toBeInTheDocument();
			expect(
				screen.queryByText("サブスクリプション編集"),
			).not.toBeInTheDocument();
		});
	});

	describe("カテゴリの表示", () => {
		it("支出用カテゴリのみが表示される", async () => {
			// 支出と収入カテゴリを含むデータでモックを更新
			const categoriesWithIncome: SelectCategory[] = [
				...mockCategories, // 支出カテゴリ（ID: 1, 2）
				mockIncomeCategory, // 収入カテゴリ（ID: 100）
			];

			useActiveCategories.mockReturnValue({
				data: {
					data: categoriesWithIncome,
					count: categoriesWithIncome.length,
				},
				isLoading: false,
				error: null,
			});

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			const categorySelect = screen.getByLabelText(/カテゴリ/);
			expect(categorySelect).toBeInTheDocument();

			// カテゴリ選択肢のユニークチェック - 重複が発生しないことを確認
			const options = screen.getAllByRole("option");
			const optionTexts = options.map((option) => option.textContent);
			const uniqueOptions = new Set(optionTexts);
			expect(optionTexts.length).toBe(uniqueOptions.size); // 重複なし

			// 支出用カテゴリのみが選択肢に含まれることを確認
			expect(
				screen.getByRole("option", { name: "エンターテイメント" }),
			).toBeInTheDocument();
			expect(
				screen.getByRole("option", { name: "ソフトウェア・アプリ" }),
			).toBeInTheDocument();
			// 収入カテゴリ（給与）は表示されないことを確認
			expect(
				screen.queryByRole("option", { name: "給与" }),
			).not.toBeInTheDocument();
		});

		it("カテゴリ読み込みエラー時にエラーメッセージが表示される", () => {
			useActiveCategories.mockReturnValue({
				data: undefined,
				isLoading: false,
				error: new Error("サーバーエラー"),
			});

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			expect(
				screen.getByText("カテゴリの読み込みに失敗しました"),
			).toBeInTheDocument();
		});
	});

	describe("年間コスト計算", () => {
		it("金額と頻度を入力すると年間コストが表示される", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// 金額を入力
			const amountInput = screen.getByLabelText(/金額/);
			await user.clear(amountInput);
			await user.type(amountInput, "1000");

			// 年間コストが表示されることを確認（月次はデフォルト）
			await waitFor(
				() => {
					expect(screen.getByText(/年間コスト予測:/)).toBeInTheDocument();
					expect(screen.getByText("¥12,000")).toBeInTheDocument();
					expect(screen.getByText("月平均: ¥1,000")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});

		it("異なる請求頻度で正しく計算される", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			const amountInput = screen.getByLabelText(/金額/);
			const frequencySelect = screen.getByLabelText(/請求頻度/);

			// 年次の場合
			await user.clear(amountInput);
			await user.type(amountInput, "12000");
			await user.selectOptions(frequencySelect, "yearly");

			await waitFor(
				() => {
					expect(screen.getByText("¥12,000")).toBeInTheDocument();
					expect(screen.getByText("月平均: ¥1,000")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);

			// 週次の場合 - フィールドをクリアして新しい値を入力
			await user.clear(amountInput);
			await user.type(amountInput, "500");
			await user.selectOptions(frequencySelect, "weekly");

			await waitFor(
				() => {
					expect(screen.getByText("¥26,000")).toBeInTheDocument();
				},
				{ timeout: 3000 },
			);
		});
	});

	describe("フォーム送信", () => {
		it("正しいデータでフォーム送信ができる", async () => {
			const user = userEvent.setup();
			mockOnSubmit.mockResolvedValue(undefined);

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// フォームに順次入力 - 各入力を小分けしてより安定させる
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "1");

			const nameInput = screen.getByLabelText(/サービス名/);
			await user.type(nameInput, "Netflix");

			const amountInput = screen.getByLabelText(/金額/);
			await user.clear(amountInput);
			await user.type(amountInput, "1980");

			const frequencySelect = screen.getByLabelText(/請求頻度/);
			await user.selectOptions(frequencySelect, "monthly");

			const dateInput = screen.getByLabelText(/次回支払日/);
			await user.clear(dateInput);
			await user.type(dateInput, "2024-03-15");

			const descriptionInput = screen.getByLabelText(/説明/);
			await user.type(descriptionInput, "家族プラン");

			// フォーム送信
			const submitButton = screen.getByRole("button", { name: /登録/ });
			await user.click(submitButton);

			// 送信データの確認
			await waitFor(
				() => {
					expect(mockOnSubmit).toHaveBeenCalledWith({
						categoryId: 1,
						name: "Netflix",
						amount: 1980,
						frequency: "monthly",
						nextPaymentDate: "2024-03-15",
						description: "家族プラン",
					});
				},
				{ timeout: 5000 },
			);

			// モーダルが閉じられることを確認
			await waitFor(
				() => {
					expect(mockOnClose).toHaveBeenCalled();
				},
				{ timeout: 3000 },
			);
		});

		it("必須項目が未入力の場合はバリデーションエラーが表示される", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// 空のフォームで送信
			await user.click(screen.getByRole("button", { name: /登録/ }));

			// エラーメッセージが表示されることを確認
			await waitFor(
				() => {
					// カテゴリエラーメッセージを特定（selectタグのプレースホルダーと区別）
					const categoryErrorElements = screen.getAllByText(
						"カテゴリを選択してください",
					);
					const categoryErrorMessage = categoryErrorElements.find((el) => {
						return el.tagName === "P" && el.className.includes("text-red-600");
					});
					expect(categoryErrorMessage).toBeInTheDocument();

					// その他のバリデーションエラーメッセージ
					expect(
						screen.getByText("サービス名を入力してください"),
					).toBeInTheDocument();
					expect(
						screen.getByText("金額は1円以上で入力してください"),
					).toBeInTheDocument();
				},
				{ timeout: 5000 },
			);

			// onSubmit が呼ばれないことを確認
			expect(mockOnSubmit).not.toHaveBeenCalled();
		});

		it("送信エラー時でもモーダルが閉じられない", async () => {
			const user = userEvent.setup();
			mockOnSubmit.mockRejectedValue(new Error("送信エラー"));

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// 有効なデータを入力
			const categorySelect = screen.getByLabelText(/カテゴリ/);
			await user.selectOptions(categorySelect, "1");

			const nameInput = screen.getByLabelText(/サービス名/);
			await user.type(nameInput, "Netflix");

			const amountInput = screen.getByLabelText(/金額/);
			await user.clear(amountInput);
			await user.type(amountInput, "1980");

			// フォーム送信
			const submitButton = screen.getByRole("button", { name: /登録/ });
			await user.click(submitButton);

			await waitFor(
				() => {
					expect(mockOnSubmit).toHaveBeenCalled();
				},
				{ timeout: 5000 },
			);

			// エラー時はモーダルが閉じられないことを確認
			expect(mockOnClose).not.toHaveBeenCalled();
		});
	});

	describe("モーダル操作", () => {
		it("閉じるボタンでモーダルが閉じられる", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// ヘッダーの×ボタンを特定（SVGが含まれるボタンを選択）
			const closeButtons = screen.getAllByRole("button", { name: /閉じる/ });
			const headerCloseButton = closeButtons.find(
				(button) => button.tagName === "BUTTON" && button.querySelector("svg"),
			);

			expect(headerCloseButton).toBeDefined();
			await user.click(headerCloseButton!);

			expect(mockOnClose).toHaveBeenCalled();
		});

		it("キャンセルボタンでモーダルが閉じられる", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			const cancelButton = screen.getByRole("button", { name: /キャンセル/ });
			await user.click(cancelButton);

			expect(mockOnClose).toHaveBeenCalled();
		});

		it("バックドロップクリックでモーダルが閉じられる", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// バックドロップ要素を取得してクリック
			const backdrop = screen.getByLabelText("モーダルを閉じる");
			await user.click(backdrop);
			expect(mockOnClose).toHaveBeenCalled();
		});
	});

	describe("フォームリセット", () => {
		it("モーダルが閉じられる時にフォームがリセットされる", async () => {
			const user = userEvent.setup();

			render(
				<TestWrapper>
					<SubscriptionFormModal
						isOpen={true}
						onClose={mockOnClose}
						mode="create"
						onSubmit={mockOnSubmit}
					/>
				</TestWrapper>,
			);

			// フォームに値を入力
			const nameInput = screen.getByLabelText(/サービス名/);
			await user.clear(nameInput);
			await user.type(nameInput, "Test Service");

			// 値が入力されていることを確認
			expect(nameInput).toHaveValue("Test Service");

			// キャンセルボタンでモーダルを閉じる
			await user.click(screen.getByRole("button", { name: /キャンセル/ }));

			// onCloseが呼ばれることを確認
			expect(mockOnClose).toHaveBeenCalled();
		});
	});
});
