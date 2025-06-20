import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { TransactionList } from "./transaction-list";

/**
 * モックデータとAPI応答の定義
 *
 * 設計方針:
 * - 実際のDBスキーマに準拠したデータ構造
 * - 様々な取引パターンを網羅
 * - ページネーション対応
 * - リアルなカテゴリとフィルター設定
 */

// カテゴリマスターデータ
const mockCategories = [
	{ id: 1, name: "食費", type: "expense", color: "#FF6B6B", icon: "food" },
	{
		id: 2,
		name: "交通費",
		type: "expense",
		color: "#4ECDC4",
		icon: "transport",
	},
	{
		id: 3,
		name: "日用品",
		type: "expense",
		color: "#45B7D1",
		icon: "shopping",
	},
	{
		id: 4,
		name: "光熱費",
		type: "expense",
		color: "#FD79A8",
		icon: "utilities",
	},
	{ id: 5, name: "通信費", type: "expense", color: "#A29BFE", icon: "phone" },
	{ id: 6, name: "医療費", type: "expense", color: "#00B894", icon: "medical" },
	{ id: 7, name: "住居費", type: "expense", color: "#E17055", icon: "home" },
	{
		id: 8,
		name: "娯楽費",
		type: "expense",
		color: "#FDCB6E",
		icon: "entertainment",
	},
	{
		id: 9,
		name: "被服費",
		type: "expense",
		color: "#6C5CE7",
		icon: "clothing",
	},
	{
		id: 10,
		name: "教育費",
		type: "expense",
		color: "#00CEC9",
		icon: "education",
	},
	{
		id: 11,
		name: "その他支出",
		type: "expense",
		color: "#B2BEC3",
		icon: "other",
	},
	{ id: 12, name: "給与", type: "income", color: "#55A3FF", icon: "salary" },
	{ id: 13, name: "副業", type: "income", color: "#26DE81", icon: "work" },
	{
		id: 14,
		name: "投資",
		type: "income",
		color: "#FD79A8",
		icon: "investment",
	},
	{
		id: 15,
		name: "その他収入",
		type: "income",
		color: "#A29BFE",
		icon: "other",
	},
];

// 基本的な取引データセット（20件）
const mockTransactions = [
	{
		id: 1,
		amount: 300000,
		type: "income" as const,
		categoryId: 12,
		description: "12月分給与",
		transactionDate: "2024-12-25",
		paymentMethod: "銀行振込",
		tags: null,
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-25T10:00:00Z",
		updatedAt: "2024-12-25T10:00:00Z",
	},
	{
		id: 2,
		amount: 80000,
		type: "expense" as const,
		categoryId: 7,
		description: "1月分家賃",
		transactionDate: "2024-12-28",
		paymentMethod: "銀行振込",
		tags: null,
		receiptUrl: null,
		isRecurring: true,
		recurringId: 1,
		createdAt: "2024-12-28T09:00:00Z",
		updatedAt: "2024-12-28T09:00:00Z",
	},
	{
		id: 3,
		amount: 15000,
		type: "expense" as const,
		categoryId: 4,
		description: "電気・ガス代",
		transactionDate: "2024-12-27",
		paymentMethod: "クレジットカード",
		tags: '["光熱費", "毎月"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-27T14:30:00Z",
		updatedAt: "2024-12-27T14:30:00Z",
	},
	{
		id: 4,
		amount: 4500,
		type: "expense" as const,
		categoryId: 1,
		description: "スーパーマーケット",
		transactionDate: "2024-12-26",
		paymentMethod: "クレジットカード",
		tags: '["日常", "食材"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-26T18:20:00Z",
		updatedAt: "2024-12-26T18:20:00Z",
	},
	{
		id: 5,
		amount: 25000,
		type: "income" as const,
		categoryId: 13,
		description: "フリーランス案件",
		transactionDate: "2024-12-24",
		paymentMethod: "銀行振込",
		tags: '["副業", "Web開発"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-24T16:45:00Z",
		updatedAt: "2024-12-24T16:45:00Z",
	},
	{
		id: 6,
		amount: 1200,
		type: "expense" as const,
		categoryId: 1,
		description: "コンビニ弁当",
		transactionDate: "2024-12-23",
		paymentMethod: "電子マネー",
		tags: '["外食", "ランチ"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-23T12:15:00Z",
		updatedAt: "2024-12-23T12:15:00Z",
	},
	{
		id: 7,
		amount: 3200,
		type: "expense" as const,
		categoryId: 2,
		description: "電車・バス代",
		transactionDate: "2024-12-22",
		paymentMethod: "ICカード",
		tags: '["通勤", "定期"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-22T08:30:00Z",
		updatedAt: "2024-12-22T08:30:00Z",
	},
	{
		id: 8,
		amount: 12000,
		type: "expense" as const,
		categoryId: 8,
		description: "映画・ディナー",
		transactionDate: "2024-12-21",
		paymentMethod: "クレジットカード",
		tags: '["デート", "娯楽"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-21T20:45:00Z",
		updatedAt: "2024-12-21T20:45:00Z",
	},
	{
		id: 9,
		amount: 8500,
		type: "expense" as const,
		categoryId: 9,
		description: "冬服購入",
		transactionDate: "2024-12-20",
		paymentMethod: "クレジットカード",
		tags: '["洋服", "季節もの"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-20T15:20:00Z",
		updatedAt: "2024-12-20T15:20:00Z",
	},
	{
		id: 10,
		amount: 2500,
		type: "expense" as const,
		categoryId: 10,
		description: "技術書籍",
		transactionDate: "2024-12-19",
		paymentMethod: "クレジットカード",
		tags: '["学習", "書籍"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-19T11:10:00Z",
		updatedAt: "2024-12-19T11:10:00Z",
	},
	{
		id: 11,
		amount: 4800,
		type: "expense" as const,
		categoryId: 5,
		description: "スマートフォン料金",
		transactionDate: "2024-12-18",
		paymentMethod: "銀行引き落とし",
		tags: '["通信費", "毎月"]',
		receiptUrl: null,
		isRecurring: true,
		recurringId: 2,
		createdAt: "2024-12-18T10:00:00Z",
		updatedAt: "2024-12-18T10:00:00Z",
	},
	{
		id: 12,
		amount: 6800,
		type: "expense" as const,
		categoryId: 3,
		description: "日用品まとめ買い",
		transactionDate: "2024-12-17",
		paymentMethod: "クレジットカード",
		tags: '["洗剤", "シャンプー", "まとめ買い"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-17T14:25:00Z",
		updatedAt: "2024-12-17T14:25:00Z",
	},
	{
		id: 13,
		amount: 3500,
		type: "expense" as const,
		categoryId: 6,
		description: "歯医者治療費",
		transactionDate: "2024-12-16",
		paymentMethod: "現金",
		tags: '["歯科", "治療"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-16T16:40:00Z",
		updatedAt: "2024-12-16T16:40:00Z",
	},
	{
		id: 14,
		amount: 1980,
		type: "expense" as const,
		categoryId: 8,
		description: "Netflix",
		transactionDate: "2024-12-15",
		paymentMethod: "クレジットカード",
		tags: '["サブスク", "動画配信"]',
		receiptUrl: null,
		isRecurring: true,
		recurringId: 3,
		createdAt: "2024-12-15T00:15:00Z",
		updatedAt: "2024-12-15T00:15:00Z",
	},
	{
		id: 15,
		amount: 980,
		type: "expense" as const,
		categoryId: 8,
		description: "Spotify",
		transactionDate: "2024-12-14",
		paymentMethod: "クレジットカード",
		tags: '["サブスク", "音楽配信"]',
		receiptUrl: null,
		isRecurring: true,
		recurringId: 4,
		createdAt: "2024-12-14T00:20:00Z",
		updatedAt: "2024-12-14T00:20:00Z",
	},
	{
		id: 16,
		amount: 7200,
		type: "expense" as const,
		categoryId: 1,
		description: "外食（居酒屋）",
		transactionDate: "2024-12-13",
		paymentMethod: "クレジットカード",
		tags: '["外食", "飲み会"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-13T21:30:00Z",
		updatedAt: "2024-12-13T21:30:00Z",
	},
	{
		id: 17,
		amount: 15000,
		type: "income" as const,
		categoryId: 14,
		description: "株式投資配当",
		transactionDate: "2024-12-12",
		paymentMethod: "証券口座",
		tags: '["投資", "配当金"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-12T09:00:00Z",
		updatedAt: "2024-12-12T09:00:00Z",
	},
	{
		id: 18,
		amount: 2300,
		type: "expense" as const,
		categoryId: 2,
		description: "タクシー代",
		transactionDate: "2024-12-11",
		paymentMethod: "クレジットカード",
		tags: '["タクシー", "緊急"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-11T23:45:00Z",
		updatedAt: "2024-12-11T23:45:00Z",
	},
	{
		id: 19,
		amount: 4200,
		type: "expense" as const,
		categoryId: 11,
		description: "美容院",
		transactionDate: "2024-12-10",
		paymentMethod: "現金",
		tags: '["美容", "カット"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-10T14:00:00Z",
		updatedAt: "2024-12-10T14:00:00Z",
	},
	{
		id: 20,
		amount: 3800,
		type: "expense" as const,
		categoryId: 1,
		description: "コンビニ・軽食",
		transactionDate: "2024-12-09",
		paymentMethod: "電子マネー",
		tags: '["コンビニ", "軽食"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-12-09T19:15:00Z",
		updatedAt: "2024-12-09T19:15:00Z",
	},
];

// 大量データセット用（100件）
const generateLargeDataset = () => {
	const largeDataset = [];
	const categories = [1, 2, 3, 7, 8, 12, 13]; // よく使われるカテゴリ
	const paymentMethods = ["クレジットカード", "現金", "電子マネー", "銀行振込"];
	const descriptions = {
		expense: [
			"スーパーマーケット",
			"コンビニ",
			"レストラン",
			"カフェ",
			"電車代",
			"バス代",
			"ガソリン代",
			"駐車場代",
			"家賃",
			"光熱費",
			"通信費",
			"映画鑑賞",
			"書籍購入",
			"洋服購入",
			"美容院",
			"医療費",
		],
		income: ["給与", "副業収入", "配当金", "投資利益", "その他収入"],
	};

	for (let i = 21; i <= 120; i++) {
		const isIncome = Math.random() < 0.2; // 20%の確率で収入
		const type = isIncome ? "income" : "expense";
		const categoryId = isIncome
			? Math.random() < 0.8
				? 12
				: 13
			: categories[Math.floor(Math.random() * 5)];
		const amount = isIncome
			? Math.floor(Math.random() * 200000) + 50000 // 収入: 5万〜25万円
			: Math.floor(Math.random() * 20000) + 500; // 支出: 500〜20,500円

		const date = new Date(2024, 11, Math.floor(Math.random() * 28) + 1);
		const dateStr = date.toISOString().split("T")[0];

		largeDataset.push({
			id: i,
			amount,
			type: type as "income" | "expense",
			categoryId,
			description:
				descriptions[type][
					Math.floor(Math.random() * descriptions[type].length)
				],
			transactionDate: dateStr,
			paymentMethod:
				paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
			tags: null,
			receiptUrl: null,
			isRecurring: false,
			recurringId: null,
			createdAt: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00Z`,
			updatedAt: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00Z`,
		});
	}

	return largeDataset;
};

// ページネーション応答作成ヘルパー
const createPaginatedResponse = (
	allData: typeof mockTransactions,
	page = 1,
	limit = 20,
	filters: any = {},
) => {
	// フィルター適用
	let filteredData = [...allData];

	if (filters.type) {
		filteredData = filteredData.filter((t) => t.type === filters.type);
	}
	if (filters.category_id) {
		filteredData = filteredData.filter(
			(t) => t.categoryId === Number(filters.category_id),
		);
	}
	if (filters.from) {
		filteredData = filteredData.filter(
			(t) => t.transactionDate >= filters.from,
		);
	}
	if (filters.to) {
		filteredData = filteredData.filter((t) => t.transactionDate <= filters.to);
	}
	if (filters.search) {
		const searchTerm = filters.search.toLowerCase();
		filteredData = filteredData.filter((t) =>
			t.description.toLowerCase().includes(searchTerm),
		);
	}

	// ソート適用
	const sortBy = filters.sort_by || "transactionDate";
	const sortOrder = filters.sort_order || "desc";

	filteredData.sort((a, b) => {
		let aVal: number;
		let bVal: number;
		switch (sortBy) {
			case "amount":
				aVal = a.amount;
				bVal = b.amount;
				break;
			case "createdAt":
				aVal = new Date(a.createdAt).getTime();
				bVal = new Date(b.createdAt).getTime();
				break;
			default: // transactionDate
				aVal = new Date(a.transactionDate).getTime();
				bVal = new Date(b.transactionDate).getTime();
		}

		const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
		return sortOrder === "desc" ? -result : result;
	});

	const totalCount = filteredData.length;
	const totalPages = Math.ceil(totalCount / limit);
	const startIndex = (page - 1) * limit;
	const paginatedData = filteredData.slice(startIndex, startIndex + limit);

	return {
		success: true,
		data: paginatedData,
		pagination: {
			currentPage: page,
			totalPages,
			totalCount,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			limit,
		},
		filters,
		sort: {
			sort_by: sortBy,
			sort_order: sortOrder,
		},
	};
};

// Storybook メタデータ設定
const meta: Meta<typeof TransactionList> = {
	title: "Transactions/TransactionList",
	component: TransactionList,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component: `
**TransactionList コンポーネント**

取引一覧表示の統合コンポーネントです。フィルタリング、ソート、ページネーション機能を備えています。

## 機能
- 取引データの一覧表示（テーブル/カード切り替え可能）
- 高度なフィルタリング（日付範囲、カテゴリ、タイプ、検索）
- ソート機能（日付、金額、作成日時）
- ページネーション対応
- レスポンシブデザイン
- ローディング・エラー・空状態の表示

## データフロー
- TanStack Queryによるデータ取得
- MSWによるAPI モック
- オプティミスティックアップデート対応

## 使用場面
- メインの取引履歴ページ
- ダッシュボードの取引一覧セクション
- カテゴリ別取引表示
`,
			},
		},
	},
	argTypes: {
		initialFilters: {
			control: "object",
			description: "初期フィルター設定",
			table: {
				type: { summary: "Partial<TransactionFilters>" },
				defaultValue: { summary: "{}" },
			},
		},
		initialSort: {
			control: "object",
			description: "初期ソート設定",
			table: {
				type: { summary: "Partial<TransactionSort>" },
				defaultValue: {
					summary: '{ sort_by: "transactionDate", sort_order: "desc" }',
				},
			},
		},
		showFilters: {
			control: "boolean",
			description: "フィルターパネル表示フラグ",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "true" },
			},
		},
		compact: {
			control: "boolean",
			description: "コンパクト表示モード",
			table: {
				type: { summary: "boolean" },
				defaultValue: { summary: "false" },
			},
		},
	},
	args: {
		initialFilters: {},
		initialSort: { sort_by: "transactionDate", sort_order: "desc" },
		showFilters: true,
		compact: false,
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本状態のストーリー群

/**
 * デフォルト - 通常の取引一覧表示
 * 基本的な取引データを表示し、全機能が動作する状態
 */
export const Default: Story = {
	parameters: {
		msw: {
			handlers: [
				// カテゴリデータ
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),

				// 取引データ
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					return HttpResponse.json(
						createPaginatedResponse(mockTransactions, page, limit, params),
					);
				}),
			],
		},
	},
};

/**
 * コンパクトモード - 省スペース表示
 * ダッシュボードなどの限られたスペースでの使用を想定
 */
export const CompactMode: Story = {
	args: {
		compact: true,
		showFilters: false,
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					// コンパクトモードでは最近の10件のみ表示
					const recentTransactions = mockTransactions.slice(0, 10);
					return HttpResponse.json(
						createPaginatedResponse(recentTransactions, page, 10, params),
					);
				}),
			],
		},
	},
};

/**
 * 大量データセット - ページネーションテスト
 * 大量のデータでのパフォーマンスとページネーション動作確認
 */
export const LargeDataset: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					const largeDataset = [...mockTransactions, ...generateLargeDataset()];
					return HttpResponse.json(
						createPaginatedResponse(
							largeDataset as typeof mockTransactions,
							page,
							limit,
							params,
						),
					);
				}),
			],
		},
	},
};

// データ状態のストーリー群

/**
 * ローディング状態 - データ読み込み中
 * 初回ロード時やフィルター変更時の表示状態
 */
export const LoadingState: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", async () => {
					// 無限ローディング状態を作る
					await new Promise(() => {});
					return HttpResponse.json(createPaginatedResponse(mockTransactions));
				}),
			],
		},
	},
};

/**
 * 空状態 - 取引データなし
 * 初期状態やフィルター条件に該当するデータがない場合
 */
export const EmptyState: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", () => {
					return HttpResponse.json({
						success: true,
						data: [],
						pagination: {
							currentPage: 1,
							totalPages: 0,
							totalCount: 0,
							hasNextPage: false,
							hasPrevPage: false,
							limit: 20,
						},
						filters: {},
						sort: {
							sort_by: "transactionDate",
							sort_order: "desc",
						},
					});
				}),
			],
		},
	},
};

/**
 * エラー状態 - API呼び出し失敗
 * ネットワークエラーやサーバーエラー時の表示
 */
export const ErrorState: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", () => {
					return HttpResponse.json(
						{
							error: "データベース接続エラーが発生しました",
							details:
								"サーバーが一時的に利用できません。しばらく時間をおいてから再度お試しください。",
						},
						{ status: 503 },
					);
				}),
			],
		},
	},
};

// フィルターシナリオのストーリー群

/**
 * 収入のみ表示 - 収入取引フィルター
 * 給与、副業、投資利益など収入のみを表示
 */
export const IncomeOnly: Story = {
	args: {
		initialFilters: { type: "income" },
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					return HttpResponse.json(
						createPaginatedResponse(mockTransactions, page, limit, {
							...params,
							type: "income",
						}),
					);
				}),
			],
		},
	},
};

/**
 * 支出のみ表示 - 支出取引フィルター
 * 家賃、食費、光熱費など支出のみを表示
 */
export const ExpenseOnly: Story = {
	args: {
		initialFilters: { type: "expense" },
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					return HttpResponse.json(
						createPaginatedResponse(mockTransactions, page, limit, {
							...params,
							type: "expense",
						}),
					);
				}),
			],
		},
	},
};

/**
 * カテゴリフィルター - 食費のみ表示
 * 特定カテゴリの取引のみを表示する例
 */
export const CategoryFiltered: Story = {
	args: {
		initialFilters: { category_id: 1 }, // 食費カテゴリ
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					return HttpResponse.json(
						createPaginatedResponse(mockTransactions, page, limit, {
							...params,
							category_id: 1,
						}),
					);
				}),
			],
		},
	},
};

/**
 * 日付範囲フィルター - 直近1週間
 * 特定期間の取引のみを表示する例
 */
export const DateRangeFiltered: Story = {
	args: {
		initialFilters: {
			from: "2024-12-20",
			to: "2024-12-28",
		},
	},
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					return HttpResponse.json(
						createPaginatedResponse(mockTransactions, page, limit, {
							...params,
							from: "2024-12-20",
							to: "2024-12-28",
						}),
					);
				}),
			],
		},
	},
};

// エッジケースのストーリー群

/**
 * 単一の取引 - 1件のみ表示
 * 検索結果が1件の場合の表示確認
 */
export const SingleTransaction: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", () => {
					return HttpResponse.json({
						success: true,
						data: [mockTransactions[0]], // 1件のみ
						pagination: {
							currentPage: 1,
							totalPages: 1,
							totalCount: 1,
							hasNextPage: false,
							hasPrevPage: false,
							limit: 20,
						},
						filters: {},
						sort: {
							sort_by: "transactionDate",
							sort_order: "desc",
						},
					});
				}),
			],
		},
	},
};

/**
 * 多様なカテゴリ - 全カテゴリの取引を表示
 * 様々なカテゴリと金額の取引を混在表示
 */
export const MixedCategories: Story = {
	parameters: {
		msw: {
			handlers: [
				http.get("/api/categories", () => {
					return HttpResponse.json({
						success: true,
						data: mockCategories,
					});
				}),
				http.get("/api/transactions", ({ request }) => {
					const url = new URL(request.url);
					const params = Object.fromEntries(url.searchParams);
					const page = Number(params.page) || 1;
					const limit = Number(params.limit) || 20;

					// 全カテゴリを含む多様なデータセット作成
					const mixedData = mockCategories.map((category, index) => ({
						id: 1000 + index,
						amount:
							category.type === "income"
								? Math.floor(Math.random() * 200000) + 50000
								: Math.floor(Math.random() * 50000) + 1000,
						type: category.type as "income" | "expense",
						categoryId: category.id,
						description: `${category.name}のサンプル取引`,
						transactionDate: `2024-12-${String(Math.floor(Math.random() * 28) + 1).padStart(2, "0")}`,
						paymentMethod: "クレジットカード",
						tags: null,
						receiptUrl: null,
						isRecurring: false,
						recurringId: null,
						createdAt: "2024-12-15T10:00:00Z",
						updatedAt: "2024-12-15T10:00:00Z",
					}));

					return HttpResponse.json(
						createPaginatedResponse(
							mixedData as typeof mockTransactions,
							page,
							limit,
							params,
						),
					);
				}),
			],
		},
	},
};
