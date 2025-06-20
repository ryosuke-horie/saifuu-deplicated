import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { http, HttpResponse } from "msw";
import type { TransactionFilters, TransactionSort } from "../../types";
import { FilterPanel } from "./filter-panel";

/**
 * FilterPanelコンポーネントのStorybook設定
 *
 * 設計方針:
 * - フィルター・ソート機能の全状態をカバー
 * - MSWでカテゴリAPIをモック
 * - インタラクションテストでユーザー操作を検証
 * - 様々なデータシナリオをテスト
 */

// ========================================
// モックデータ定義
// ========================================

// 標準的なカテゴリデータ
const mockCategories = {
	success: true,
	data: [
		{
			id: 1,
			name: "給与",
			type: "income" as const,
			color: "#10B981",
			icon: "💰",
			displayOrder: 1,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: 2,
			name: "副業",
			type: "income" as const,
			color: "#059669",
			icon: "💼",
			displayOrder: 2,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: 3,
			name: "食費",
			type: "expense" as const,
			color: "#EF4444",
			icon: "🍽️",
			displayOrder: 3,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: 4,
			name: "住居費",
			type: "expense" as const,
			color: "#DC2626",
			icon: "🏠",
			displayOrder: 4,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: 5,
			name: "交通費",
			type: "expense" as const,
			color: "#B91C1C",
			icon: "🚊",
			displayOrder: 5,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: 6,
			name: "娯楽費",
			type: "expense" as const,
			color: "#991B1B",
			icon: "🎮",
			displayOrder: 6,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
	],
	count: 6,
};

// 多数のカテゴリデータ（20個）- UIの表示テスト用
const mockManyCategories = {
	success: true,
	data: Array.from({ length: 20 }, (_, i) => ({
		id: i + 1,
		name: `カテゴリ${i + 1}`,
		type: (i % 2 === 0 ? "income" : "expense") as "income" | "expense",
		color: i % 2 === 0 ? "#10B981" : "#EF4444",
		icon: i % 2 === 0 ? "💰" : "💸",
		displayOrder: i + 1,
		isActive: true,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	})),
	count: 20,
};

// 少数のカテゴリデータ（2個）- 最小構成テスト用
const mockFewCategories = {
	success: true,
	data: [
		{
			id: 1,
			name: "給与",
			type: "income" as const,
			color: "#10B981",
			icon: "💰",
			displayOrder: 1,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
		{
			id: 2,
			name: "食費",
			type: "expense" as const,
			color: "#EF4444",
			icon: "🍽️",
			displayOrder: 2,
			isActive: true,
			createdAt: "2024-01-01T00:00:00Z",
			updatedAt: "2024-01-01T00:00:00Z",
		},
	],
	count: 2,
};

// 空のカテゴリデータ
const mockNoCategories = {
	success: true,
	data: [],
	count: 0,
};

// ========================================
// Storybook設定
// ========================================

const meta: Meta<typeof FilterPanel> = {
	title: "Transactions/FilterPanel",
	component: FilterPanel,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
**FilterPanel コンポーネント**

取引データのフィルタリングとソート機能を提供するパネルです。

## 機能
- 日付範囲フィルター（開始日・終了日）
- 取引種別フィルター（収入・支出・すべて）
- カテゴリフィルター
- 説明文での検索
- ソート機能（取引日・金額・登録日 × 昇順・降順）
- フィルター数の表示と一括クリア
- 合計金額の表示
- 展開・折りたたみ機能

## 使用場面
- 取引一覧ページでの絞り込み
- レポート画面での期間指定
- 特定カテゴリの分析
`,
			},
		},
	},
	argTypes: {
		filters: {
			control: "object",
			description: "適用中のフィルター設定",
			table: {
				type: { summary: "Partial<TransactionFilters>" },
			},
		},
		sort: {
			control: "object",
			description: "ソート設定",
			table: {
				type: { summary: "Partial<TransactionSort>" },
			},
		},
		onFiltersChange: {
			description: "フィルター変更時のコールバック",
		},
		onSortChange: {
			description: "ソート変更時のコールバック",
		},
		totalAmount: {
			control: "number",
			description: "フィルター結果の合計金額",
			table: {
				type: { summary: "number" },
			},
		},
		isLoading: {
			control: "boolean",
			description: "ローディング状態",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
	},
	args: {
		filters: {},
		sort: { sort_by: "transactionDate", sort_order: "desc" },
		onFiltersChange: () => {},
		onSortChange: () => {},
		totalAmount: 0,
		isLoading: false,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ========================================
// 基本状態のストーリー
// ========================================

// デフォルト - 通常のフィルターパネル
export const Default: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
};

// 折りたたみ状態 - パネルが閉じている状態
export const Collapsed: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);
		const expandButton = canvas.getByRole("button", {
			name: /フィルターパネルの展開・折りたたみ/,
		});

		// パネルを折りたたむ
		await userEvent.click(expandButton);

		// フィルターフォームが非表示になることを確認
		expect(canvas.queryByLabelText("開始日")).not.toBeInTheDocument();
	},
};

// 展開状態 - 全フィルターが表示されている状態
export const Expanded: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 全てのフィルター要素が表示されていることを確認
		expect(canvas.getByLabelText("開始日")).toBeInTheDocument();
		expect(canvas.getByLabelText("終了日")).toBeInTheDocument();
		expect(canvas.getByLabelText("種別")).toBeInTheDocument();
		expect(canvas.getByLabelText("カテゴリ")).toBeInTheDocument();
		expect(canvas.getByLabelText("説明文検索")).toBeInTheDocument();
		expect(canvas.getByLabelText("並び順")).toBeInTheDocument();
		expect(canvas.getByLabelText("順序")).toBeInTheDocument();
	},
};

// ========================================
// フィルター状態のストーリー
// ========================================

// フィルター未適用 - クリーンな状態
export const NoFiltersApplied: Story = {
	args: {
		filters: {},
		totalAmount: 150000,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
};

// フィルター適用済み - 複数フィルターがアクティブ
export const WithFiltersApplied: Story = {
	args: {
		filters: {
			from: "2024-01-01",
			to: "2024-01-31",
			type: "expense",
			category_id: 3,
		} as TransactionFilters,
		totalAmount: -85000,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// フィルター適用数の表示を確認
		expect(canvas.getByText("4件適用中")).toBeInTheDocument();

		// クリアボタンが表示されることを確認
		expect(canvas.getByText("クリア")).toBeInTheDocument();

		// 合計金額が負の値で表示されることを確認
		expect(canvas.getByText("合計: -¥85,000")).toBeInTheDocument();
	},
};

// 検索アクティブ - 検索フィルターが適用されている状態
export const SearchActive: Story = {
	args: {
		filters: {
			search: "コンビニ",
		} as TransactionFilters,
		totalAmount: -12500,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 検索フィールドに値が設定されていることを確認
		const searchInput = canvas.getByLabelText("説明文検索") as HTMLInputElement;
		expect(searchInput.value).toBe("コンビニ");

		// フィルター適用数が表示されることを確認
		expect(canvas.getByText("1件適用中")).toBeInTheDocument();
	},
};

// ========================================
// ローディング状態のストーリー
// ========================================

// カテゴリローディング - カテゴリデータの取得中
export const CategoriesLoading: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", async () => {
					// 無限ローディング状態
					await new Promise(() => {});
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// カテゴリセレクトに「すべて」以外のオプションがないことを確認
		const categorySelect = canvas.getByLabelText("カテゴリ");
		const options = within(categorySelect).getAllByRole("option");
		expect(options).toHaveLength(1); // 「すべて」のみ
		expect(options[0]).toHaveTextContent("すべて");
	},
};

// カテゴリエラー - カテゴリAPIでエラーが発生した状態
export const CategoriesError: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(
						{ error: "カテゴリの取得に失敗しました" },
						{ status: 500 },
					);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// エラー時もカテゴリセレクトは機能することを確認（「すべて」のみ）
		const categorySelect = canvas.getByLabelText("カテゴリ");
		expect(categorySelect).toBeInTheDocument();
	},
};

// ========================================
// インタラクションストーリー
// ========================================

// フィルター適用 - 様々なフィルターを操作
export const FilterApplication: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 開始日を設定
		const fromInput = canvas.getByLabelText("開始日");
		await userEvent.type(fromInput, "2024-01-01");

		// 終了日を設定
		const toInput = canvas.getByLabelText("終了日");
		await userEvent.type(toInput, "2024-01-31");

		// タイプを支出に変更
		const typeSelect = canvas.getByLabelText("種別");
		await userEvent.selectOptions(typeSelect, "expense");

		// カテゴリを食費に変更
		const categorySelect = canvas.getByLabelText("カテゴリ");
		await userEvent.selectOptions(categorySelect, "3");

		// 検索文字列を入力
		const searchInput = canvas.getByLabelText("説明文検索");
		await userEvent.type(searchInput, "スーパー");

		// 各フィールドの値を確認
		expect(fromInput).toHaveValue("2024-01-01");
		expect(toInput).toHaveValue("2024-01-31");
		expect(typeSelect).toHaveValue("expense");
		expect(categorySelect).toHaveValue("3");
		expect(searchInput).toHaveValue("スーパー");
	},
};

// ソート変更 - ソートオプションの操作
export const SortChanges: Story = {
	args: {
		sort: { sort_by: "amount", sort_order: "asc" },
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ソート対象を金額に変更
		const sortBySelect = canvas.getByLabelText("並び順");
		await userEvent.selectOptions(sortBySelect, "amount");

		// ソート順序を昇順に変更
		const sortOrderSelect = canvas.getByLabelText("順序");
		await userEvent.selectOptions(sortOrderSelect, "asc");

		// 設定値を確認
		expect(sortBySelect).toHaveValue("amount");
		expect(sortOrderSelect).toHaveValue("asc");
	},
};

// フィルタークリア - フィルターリセット機能
export const ClearFilters: Story = {
	args: {
		filters: {
			from: "2024-01-01",
			to: "2024-01-31",
			type: "expense",
			category_id: 3,
			search: "テストデータ",
		} as TransactionFilters,
		sort: { sort_by: "amount", sort_order: "asc" },
		totalAmount: -50000,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// フィルター適用数が表示されることを確認
		expect(canvas.getByText("5件適用中")).toBeInTheDocument();

		// クリアボタンをクリック
		const clearButton = canvas.getByText("クリア");
		await userEvent.click(clearButton);

		// clearFilters関数が呼び出されたことはアクションで確認される
	},
};

// ========================================
// データシナリオのストーリー
// ========================================

// 多数のカテゴリ - カテゴリが多い場合のUI表示
export const ManyCategories: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockManyCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// カテゴリセレクトに多数のオプションが表示されることを確認
		const categorySelect = canvas.getByLabelText("カテゴリ");
		const options = within(categorySelect).getAllByRole("option");
		expect(options.length).toBeGreaterThan(20); // 「すべて」+ 20カテゴリ
	},
};

// 少数のカテゴリ - カテゴリが少ない場合の表示
export const FewCategories: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockFewCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// カテゴリセレクトに最小限のオプションが表示されることを確認
		const categorySelect = canvas.getByLabelText("カテゴリ");
		const options = within(categorySelect).getAllByRole("option");
		expect(options).toHaveLength(3); // 「すべて」+ 2カテゴリ
	},
};

// カテゴリなし - カテゴリが存在しない場合
export const NoCategories: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockNoCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// カテゴリセレクトに「すべて」のみが表示されることを確認
		const categorySelect = canvas.getByLabelText("カテゴリ");
		const options = within(categorySelect).getAllByRole("option");
		expect(options).toHaveLength(1);
		expect(options[0]).toHaveTextContent("すべて");
	},
};

// ========================================
// 金額表示のバリエーション
// ========================================

// プラス収支 - 収入が支出を上回る場合
export const PositiveBalance: Story = {
	args: {
		filters: { type: "income" },
		totalAmount: 320000,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// プラス金額が緑色で表示されることを確認
		const totalElement = canvas.getByText("合計: +¥320,000");
		expect(totalElement).toHaveClass("text-green-600");
	},
};

// マイナス収支 - 支出が収入を上回る場合
export const NegativeBalance: Story = {
	args: {
		filters: { type: "expense" },
		totalAmount: -180000,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// マイナス金額が赤色で表示されることを確認
		const totalElement = canvas.getByText("合計: -¥180,000");
		expect(totalElement).toHaveClass("text-red-600");
	},
};

// ローディング中 - 金額計算中の状態
export const LoadingAmount: Story = {
	args: {
		isLoading: true,
		totalAmount: 0,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// ローディング中は合計金額が表示されないことを確認
		expect(canvas.queryByText(/合計:/)).not.toBeInTheDocument();
	},
};

// 大きな金額 - 百万円以上の金額表示テスト
export const LargeAmount: Story = {
	args: {
		totalAmount: 12500000, // 1,250万円
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json(mockCategories);
				}),
			],
		},
	},
	play: async ({ canvasElement }) => {
		const canvas = within(canvasElement);

		// 大きな金額が適切にフォーマットされて表示されることを確認
		expect(canvas.getByText("合計: +¥12,500,000")).toBeInTheDocument();
	},
};
