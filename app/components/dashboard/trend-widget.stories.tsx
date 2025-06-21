import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { TrendWidget } from "./trend-widget";

const meta: Meta<typeof TrendWidget> = {
	title: "Dashboard/TrendWidget",
	component: TrendWidget,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"今月のトレンド情報を表示するウィジェット。月間比較、最頻使用カテゴリ、1日平均支出を表示します。",
			},
		},
	},
	argTypes: {
		compact: {
			control: "boolean",
			description: "コンパクト表示モード",
		},
	},
	args: {
		compact: false,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// モックデータ: 今月の取引（支出多め）
const currentMonthTransactions = [
	{
		id: 1,
		amount: 3000,
		type: "expense" as const,
		categoryId: 1,
		description: "ランチ",
		transactionDate: "2024-01-15",
		createdAt: "2024-01-15T12:00:00Z",
		updatedAt: "2024-01-15T12:00:00Z",
	},
	{
		id: 2,
		amount: 5000,
		type: "expense" as const,
		categoryId: 1,
		description: "夕食",
		transactionDate: "2024-01-16",
		createdAt: "2024-01-16T19:00:00Z",
		updatedAt: "2024-01-16T19:00:00Z",
	},
	{
		id: 3,
		amount: 2000,
		type: "expense" as const,
		categoryId: 2,
		description: "電車代",
		transactionDate: "2024-01-17",
		createdAt: "2024-01-17T08:00:00Z",
		updatedAt: "2024-01-17T08:00:00Z",
	},
	{
		id: 4,
		amount: 8000,
		type: "expense" as const,
		categoryId: 1,
		description: "スーパー",
		transactionDate: "2024-01-18",
		createdAt: "2024-01-18T10:00:00Z",
		updatedAt: "2024-01-18T10:00:00Z",
	},
	{
		id: 5,
		amount: 1500,
		type: "expense" as const,
		categoryId: 3,
		description: "映画",
		transactionDate: "2024-01-19",
		createdAt: "2024-01-19T14:00:00Z",
		updatedAt: "2024-01-19T14:00:00Z",
	},
];

// モックデータ: 前月の取引（支出少なめ）
const lastMonthTransactions = [
	{
		id: 11,
		amount: 2500,
		type: "expense" as const,
		categoryId: 1,
		description: "ランチ",
		transactionDate: "2023-12-15",
		createdAt: "2023-12-15T12:00:00Z",
		updatedAt: "2023-12-15T12:00:00Z",
	},
	{
		id: 12,
		amount: 3000,
		type: "expense" as const,
		categoryId: 2,
		description: "交通費",
		transactionDate: "2023-12-16",
		createdAt: "2023-12-16T08:00:00Z",
		updatedAt: "2023-12-16T08:00:00Z",
	},
];

// モックデータ: カテゴリ
const categories = [
	{
		id: 1,
		name: "食費",
		color: "#EF4444",
		type: "expense" as const,
		isActive: true,
		sortOrder: 1,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 2,
		name: "交通費",
		color: "#3B82F6",
		type: "expense" as const,
		isActive: true,
		sortOrder: 2,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 3,
		name: "娯楽",
		color: "#10B981",
		type: "expense" as const,
		isActive: true,
		sortOrder: 3,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
];

// デフォルトストーリー
export const Default: Story = {
	parameters: {
		msw: {
			handlers: [
				// 今月の取引データ
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const to = url.searchParams.get("to");

					// 前月のデータかどうかを判定（簡易）
					const isLastMonth = from?.includes("2023-12");

					return HttpResponse.json({
						success: true,
						data: isLastMonth
							? lastMonthTransactions
							: currentMonthTransactions,
						count: isLastMonth
							? lastMonthTransactions.length
							: currentMonthTransactions.length,
					});
				}),
				// カテゴリデータ
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
				}),
			],
		},
	},
};

// コンパクト表示
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
					const isLastMonth = from?.includes("2023-12");

					return HttpResponse.json({
						success: true,
						data: isLastMonth
							? lastMonthTransactions
							: currentMonthTransactions,
						count: isLastMonth
							? lastMonthTransactions.length
							: currentMonthTransactions.length,
					});
				}),
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
				}),
			],
		},
	},
};

// 空データ状態
export const EmptyData: Story = {
	parameters: {
		msw: {
			handlers: [
				// 空の取引データ
				http.get("/api/transactions", () => {
					return HttpResponse.json({
						success: true,
						data: [],
						count: 0,
					});
				}),
				// カテゴリデータ
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
				}),
			],
		},
	},
};

// 今月のみデータ（前月なし）
export const CurrentMonthOnly: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const isLastMonth = from?.includes("2023-12");

					return HttpResponse.json({
						success: true,
						data: isLastMonth ? [] : currentMonthTransactions,
						count: isLastMonth ? 0 : currentMonthTransactions.length,
					});
				}),
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
				}),
			],
		},
	},
};

// カテゴリ未設定の取引
export const UncategorizedTransactions: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const isLastMonth = from?.includes("2023-12");

					const uncategorizedTransactions = [
						{
							id: 21,
							amount: 5000,
							type: "expense" as const,
							categoryId: null,
							description: "未分類の支出",
							transactionDate: "2024-01-15",
							createdAt: "2024-01-15T12:00:00Z",
							updatedAt: "2024-01-15T12:00:00Z",
						},
					];

					return HttpResponse.json({
						success: true,
						data: isLastMonth ? [] : uncategorizedTransactions,
						count: isLastMonth ? 0 : uncategorizedTransactions.length,
					});
				}),
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
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
				// 遅延レスポンス
				http.get("/api/transactions", async () => {
					await new Promise((resolve) => setTimeout(resolve, 2000));
					return HttpResponse.json({
						success: true,
						data: currentMonthTransactions,
						count: currentMonthTransactions.length,
					});
				}),
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
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
				// 取引データでエラー
				http.get("/api/transactions", () => {
					return HttpResponse.json(
						{
							success: false,
							error: "取引データの取得に失敗しました",
						},
						{ status: 500 },
					);
				}),
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
				}),
			],
		},
	},
};

// 支出増加のケース
export const ExpenseIncrease: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const from = url.searchParams.get("from");
					const isLastMonth = from?.includes("2023-12");

					// 今月は大幅に支出増加
					const highExpenseTransactions = [
						{
							id: 31,
							amount: 15000,
							type: "expense" as const,
							categoryId: 1,
							description: "高額な食事",
							transactionDate: "2024-01-15",
							createdAt: "2024-01-15T12:00:00Z",
							updatedAt: "2024-01-15T12:00:00Z",
						},
						{
							id: 32,
							amount: 20000,
							type: "expense" as const,
							categoryId: 3,
							description: "娯楽費",
							transactionDate: "2024-01-16",
							createdAt: "2024-01-16T19:00:00Z",
							updatedAt: "2024-01-16T19:00:00Z",
						},
					];

					return HttpResponse.json({
						success: true,
						data: isLastMonth ? lastMonthTransactions : highExpenseTransactions,
						count: isLastMonth
							? lastMonthTransactions.length
							: highExpenseTransactions.length,
					});
				}),
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: categories,
						count: categories.length,
					});
				}),
			],
		},
	},
};
