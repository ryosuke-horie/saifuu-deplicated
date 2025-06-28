import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import type { SelectCategory, SelectSubscription } from "../../types";
import { SubscriptionFormModal } from "./subscription-form-modal";

// モックデータ - カテゴリIDの重複を防ぐために明確に分離
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
	{
		id: 3,
		name: "光熱費",
		type: "expense",
		color: "#45B7D1",
		icon: "utilities",
		displayOrder: 3,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
	// 収入カテゴリ（サブスクリプションでは除外される）
	{
		id: 100, // 支出カテゴリと重複しない大きなID
		name: "給与",
		type: "income",
		color: "#96CEB4",
		icon: "salary",
		displayOrder: 100,
		isActive: true,
		createdAt: "2024-01-01T00:00:00.000Z",
		updatedAt: "2024-01-01T00:00:00.000Z",
	},
];

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

// QueryClient を作成するファクトリー関数
const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				gcTime: 0,
			},
		},
	});

const meta: Meta<typeof SubscriptionFormModal> = {
	title: "Components/Subscriptions/SubscriptionFormModal",
	component: SubscriptionFormModal,
	decorators: [
		(Story) => {
			const queryClient = createQueryClient();
			return (
				<QueryClientProvider client={queryClient}>
					<Story />
				</QueryClientProvider>
			);
		},
	],
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"サブスクリプションの新規登録・編集用のモーダルフォームコンポーネント。新規作成と編集の両方に対応し、リアルタイム年間コスト計算機能を提供します。",
			},
		},
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
						count: mockCategories.length,
					});
				}),
			],
		},
	},
	argTypes: {
		isOpen: {
			control: "boolean",
			description: "モーダルの表示状態",
		},
		mode: {
			control: "radio",
			options: ["create", "edit"],
			description: "フォームのモード",
		},
		initialData: {
			control: "object",
			description: "編集時の初期データ",
		},
		onClose: {
			action: "closed",
			description: "モーダルを閉じるコールバック",
		},
		onSubmit: {
			action: "submitted",
			description: "フォーム送信時のコールバック",
		},
	},
	args: {
		isOpen: true,
		mode: "create",
		onClose: () => {},
		onSubmit: async () => {},
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本ストーリー（新規作成）
export const Default: Story = {
	args: {
		mode: "create",
	},
};

// 編集モード
export const EditMode: Story = {
	args: {
		mode: "edit",
		initialData: mockSubscription,
	},
};

// モーダルが閉じている状態（何も表示されない）
export const Closed: Story = {
	args: {
		isOpen: false,
		mode: "create",
	},
	parameters: {
		docs: {
			description: {
				story:
					"isOpen=falseの場合、モーダルは表示されず、コンポーネントはnullを返します。",
			},
		},
	},
};

// 長い説明文付きの編集
export const WithLongDescription: Story = {
	args: {
		mode: "edit",
		initialData: {
			...mockSubscription,
			description:
				"Netflix ファミリープラン。4つのデバイスで同時視聴可能。4K画質対応。月額1,980円で家族全員が利用できるプランです。自動更新設定済み。",
		},
	},
};

// 年額プランの例
export const YearlySubscription: Story = {
	args: {
		mode: "edit",
		initialData: {
			...mockSubscription,
			name: "Adobe Creative Cloud",
			amount: 72336,
			categoryId: 2,
			frequency: "yearly",
			description: "年額プラン（月払いより20%お得）",
		},
	},
};

// カテゴリ読み込みエラーの場合
export const CategoriesError: Story = {
	args: {
		mode: "create",
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(
						{
							error: "サーバーエラーが発生しました",
						},
						{ status: 500 },
					);
				}),
			],
		},
	},
};

// 年間コスト計算の表示確認
export const AnnualCostCalculation: Story = {
	args: {
		mode: "create",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// サービス名を入力
		const nameInput = canvas.getByLabelText(/サービス名/);
		await userEvent.clear(nameInput);
		await userEvent.type(nameInput, "Spotify Premium");

		// 金額を入力
		const amountInput = canvas.getByLabelText(/金額/);
		await userEvent.clear(amountInput);
		await userEvent.type(amountInput, "980");

		// 請求頻度を月次に設定
		const frequencySelect = canvas.getByLabelText(/請求頻度/);
		await userEvent.selectOptions(frequencySelect, "monthly");

		// 年間コスト表示が現れることを確認
		await expect(canvas.getByText("年間コスト予測")).toBeInTheDocument();
		await expect(canvas.getByText("¥11,760")).toBeInTheDocument();
	},
};

// フォーム送信のテスト
export const FormSubmission: Story = {
	args: {
		mode: "create",
		onSubmit: async (data) => {
			console.log("送信データ:", data);
			// 実際の実装では API 呼び出しを行う
		},
	},
	play: async ({ canvasElement, args }) => {
		const canvas = within(canvasElement);

		// カテゴリを選択
		const categorySelect = canvas.getByLabelText(/カテゴリ/);
		await userEvent.selectOptions(categorySelect, "1");

		// サービス名を入力
		const nameInput = canvas.getByLabelText(/サービス名/);
		await userEvent.type(nameInput, "Netflix");

		// 金額を入力
		const amountInput = canvas.getByLabelText(/金額/);
		await userEvent.type(amountInput, "1980");

		// 次回支払日を設定
		const dateInput = canvas.getByLabelText(/次回支払日/);
		await userEvent.clear(dateInput);
		await userEvent.type(dateInput, "2024-03-15");

		// 説明を入力
		const descriptionInput = canvas.getByLabelText(/説明/);
		await userEvent.type(descriptionInput, "家族プラン");

		// フォームを送信
		const submitButton = canvas.getByRole("button", { name: /登録/ });
		await userEvent.click(submitButton);

		// onSubmit が呼ばれることを確認
		await expect(args.onSubmit).toHaveBeenCalledWith({
			categoryId: 1,
			name: "Netflix",
			amount: 1980,
			frequency: "monthly",
			nextPaymentDate: "2024-03-15",
			description: "家族プラン",
		});
	},
};

// バリデーションエラーのテスト
export const ValidationErrors: Story = {
	args: {
		mode: "create",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 空のフォームで送信を試行
		const submitButton = canvas.getByRole("button", { name: /登録/ });
		await userEvent.click(submitButton);

		// エラーメッセージの表示を確認
		await expect(
			canvas.getByText("カテゴリを選択してください"),
		).toBeInTheDocument();
		await expect(
			canvas.getByText("サービス名を入力してください"),
		).toBeInTheDocument();
		await expect(
			canvas.getByText("金額は1円以上で入力してください"),
		).toBeInTheDocument();
	},
};

// キーボード操作のテスト
export const KeyboardNavigation: Story = {
	args: {
		mode: "create",
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 最初のフィールドにフォーカス
		const categorySelect = canvas.getByLabelText(/カテゴリ/);
		categorySelect.focus();

		// Tab キーで次のフィールドに移動
		await userEvent.tab();
		const nameInput = canvas.getByLabelText(/サービス名/);
		await expect(nameInput).toHaveFocus();

		// Escape キーでモーダルを閉じる
		await userEvent.keyboard("{Escape}");
	},
};

// レスポンシブ表示のテスト
export const ResponsiveLayout: Story = {
	args: {
		mode: "create",
	},
	parameters: {
		viewport: {
			viewports: {
				mobile: {
					name: "Mobile",
					styles: {
						width: "375px",
						height: "667px",
					},
				},
			},
			defaultViewport: "mobile",
		},
	},
};

// ダークモード対応
export const DarkMode: Story = {
	args: {
		mode: "create",
	},
	parameters: {
		backgrounds: {
			default: "dark",
		},
	},
	decorators: [
		(Story) => (
			<div className="dark">
				<Story />
			</div>
		),
	],
};
