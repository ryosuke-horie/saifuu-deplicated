import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { SummaryCards } from "./summary-cards";

// APIレスポンスのモックデータ
const mockCurrentMonthData = {
	data: [
		{
			id: 1,
			type: "income" as const,
			amount: 300000,
			description: "給与",
			date: "2024-01-15",
			categoryId: 1,
			categoryName: "給与",
		},
		{
			id: 2,
			type: "expense" as const,
			amount: 80000,
			description: "家賃",
			date: "2024-01-01",
			categoryId: 2,
			categoryName: "住居費",
		},
		{
			id: 3,
			type: "expense" as const,
			amount: 30000,
			description: "食費",
			date: "2024-01-10",
			categoryId: 3,
			categoryName: "食費",
		},
		{
			id: 4,
			type: "expense" as const,
			amount: 15000,
			description: "光熱費",
			date: "2024-01-05",
			categoryId: 4,
			categoryName: "光熱費",
		},
	],
	pagination: {
		total: 4,
		page: 1,
		perPage: 10,
		hasNext: false,
		hasPrev: false,
	},
};

const mockLastMonthData = {
	data: [
		{
			id: 5,
			type: "income" as const,
			amount: 280000,
			description: "給与",
			date: "2023-12-15",
			categoryId: 1,
			categoryName: "給与",
		},
		{
			id: 6,
			type: "expense" as const,
			amount: 80000,
			description: "家賃",
			date: "2023-12-01",
			categoryId: 2,
			categoryName: "住居費",
		},
		{
			id: 7,
			type: "expense" as const,
			amount: 25000,
			description: "食費",
			date: "2023-12-10",
			categoryId: 3,
			categoryName: "食費",
		},
	],
	pagination: {
		total: 3,
		page: 1,
		perPage: 10,
		hasNext: false,
		hasPrev: false,
	},
};

// Storybook メタデータ設定
const meta: Meta<typeof SummaryCards> = {
	title: "Dashboard/SummaryCards",
	component: SummaryCards,
	parameters: {
		// レイアウト設定
		layout: "padded",
		// ドキュメント生成設定
		docs: {
			description: {
				component: `
**SummaryCards コンポーネント**

ダッシュボードに表示する月次サマリーカード群です。

## 機能
- 今月の収入・支出・収支・取引件数を表示
- 前月比較（増減率）を表示
- レスポンシブデザイン対応
- ローディング・エラー状態の表示

## 使用場面
- ダッシュボードのメイン情報表示
- 月次レポートの概要表示
`,
			},
		},
	},
	// プロパティ設定
	argTypes: {
		compact: {
			control: "boolean",
			description: "コンパクト表示モード（前月比較を非表示）",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
	},
	// デフォルト値
	args: {
		compact: false,
	},
	// タグ設定
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的なストーリー - 正常なデータ表示
export const Default: Story = {
	parameters: {
		msw: {
			handlers: [
				// 今月のデータ取得API
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const to = url.searchParams.get("to");

					// 前月データの判定（日付フィルターの有無で判断）
					if (from && to) {
						return HttpResponse.json(mockLastMonthData);
					}

					// 今月データ
					return HttpResponse.json(mockCurrentMonthData);
				}),
			],
		},
	},
};

// コンパクトモード - 前月比較を非表示
export const Compact: Story = {
	args: {
		compact: true,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const to = url.searchParams.get("to");

					if (from && to) {
						return HttpResponse.json(mockLastMonthData);
					}

					return HttpResponse.json(mockCurrentMonthData);
				}),
			],
		},
	},
};

// ローディング状態
export const Loading: Story = {
	parameters: {
		msw: {
			handlers: [
				// 遅延レスポンスでローディング状態を作る
				http.get("/api/transactions", async () => {
					// 無限ローディング状態にする
					await new Promise(() => {});
					return HttpResponse.json(mockCurrentMonthData);
				}),
			],
		},
	},
};

// エラー状態
export const ErrorState: Story = {
	parameters: {
		msw: {
			handlers: [
				// エラーレスポンス
				http.get("/api/transactions", () => {
					return HttpResponse.json(
						{ error: "サーバーエラーが発生しました" },
						{ status: 500 },
					);
				}),
			],
		},
	},
};

// 収支がマイナスの場合
export const NegativeBalance: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const to = url.searchParams.get("to");

					// 支出が多い月のデータ
					const negativeData = {
						data: [
							{
								id: 1,
								type: "income" as const,
								amount: 200000,
								description: "給与",
								date: "2024-01-15",
								categoryId: 1,
								categoryName: "給与",
							},
							{
								id: 2,
								type: "expense" as const,
								amount: 150000,
								description: "家賃",
								date: "2024-01-01",
								categoryId: 2,
								categoryName: "住居費",
							},
							{
								id: 3,
								type: "expense" as const,
								amount: 80000,
								description: "食費・外食",
								date: "2024-01-10",
								categoryId: 3,
								categoryName: "食費",
							},
						],
						pagination: {
							total: 3,
							page: 1,
							perPage: 10,
							hasNext: false,
							hasPrev: false,
						},
					};

					if (from && to) {
						return HttpResponse.json(mockLastMonthData);
					}

					return HttpResponse.json(negativeData);
				}),
			],
		},
	},
};

// データなし（空の状態）
export const EmptyData: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const to = url.searchParams.get("to");

					const emptyData = {
						data: [],
						pagination: {
							total: 0,
							page: 1,
							perPage: 10,
							hasNext: false,
							hasPrev: false,
						},
					};

					return HttpResponse.json(emptyData);
				}),
			],
		},
	},
};

// 大きな数値のテスト
export const LargeNumbers: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const to = url.searchParams.get("to");

					const largeData = {
						data: [
							{
								id: 1,
								type: "income" as const,
								amount: 1250000,
								description: "ボーナス",
								date: "2024-01-15",
								categoryId: 1,
								categoryName: "給与",
							},
							{
								id: 2,
								type: "expense" as const,
								amount: 850000,
								description: "投資",
								date: "2024-01-01",
								categoryId: 2,
								categoryName: "投資",
							},
						],
						pagination: {
							total: 2,
							page: 1,
							perPage: 10,
							hasNext: false,
							hasPrev: false,
						},
					};

					if (from && to) {
						return HttpResponse.json(mockLastMonthData);
					}

					return HttpResponse.json(largeData);
				}),
			],
		},
	},
};
