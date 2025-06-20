/**
 * 取引データのモック定義
 *
 * 設計方針:
 * - 実際のDBスキーマに準拠したデータ構造
 * - 様々な取引パターンを網羅（収入・支出・定期・単発）
 * - ページネーション・フィルタリング・ソート対応
 * - リアルな金額・日付・説明文を使用
 */

// 基本的な取引データセット（30件）
export const mockTransactions = [
	// 収入取引
	{
		id: 1,
		amount: 300000,
		type: "income" as const,
		categoryId: 1,
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
		amount: 25000,
		type: "income" as const,
		categoryId: 2,
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
		id: 3,
		amount: 15000,
		type: "income" as const,
		categoryId: 3,
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

	// 住居費
	{
		id: 4,
		amount: 80000,
		type: "expense" as const,
		categoryId: 6,
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

	// 光熱費
	{
		id: 5,
		amount: 15000,
		type: "expense" as const,
		categoryId: 8,
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

	// 食費
	{
		id: 6,
		amount: 4500,
		type: "expense" as const,
		categoryId: 5,
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
		id: 7,
		amount: 1200,
		type: "expense" as const,
		categoryId: 5,
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
		id: 8,
		amount: 7200,
		type: "expense" as const,
		categoryId: 5,
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
		id: 9,
		amount: 3800,
		type: "expense" as const,
		categoryId: 5,
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

	// 交通費
	{
		id: 10,
		amount: 3200,
		type: "expense" as const,
		categoryId: 7,
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
		id: 11,
		amount: 2300,
		type: "expense" as const,
		categoryId: 7,
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

	// 通信費
	{
		id: 12,
		amount: 4800,
		type: "expense" as const,
		categoryId: 9,
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

	// 医療費
	{
		id: 13,
		amount: 3500,
		type: "expense" as const,
		categoryId: 10,
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

	// 娯楽費
	{
		id: 14,
		amount: 12000,
		type: "expense" as const,
		categoryId: 11,
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
		id: 15,
		amount: 1980,
		type: "expense" as const,
		categoryId: 11,
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
		id: 16,
		amount: 980,
		type: "expense" as const,
		categoryId: 11,
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

	// 被服費
	{
		id: 17,
		amount: 8500,
		type: "expense" as const,
		categoryId: 12,
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

	// 教育費
	{
		id: 18,
		amount: 2500,
		type: "expense" as const,
		categoryId: 13,
		description: "技術書籍",
		transactionDate: "2024-12-19",
		paymentMethod: "クレジットカード",
		tags: '["学習", "書籍"]',
		receatedAt: "2024-12-19T11:10:00Z",
		updatedAt: "2024-12-19T11:10:00Z",
	},

	// 日用品
	{
		id: 19,
		amount: 6800,
		type: "expense" as const,
		categoryId: 14,
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

	// その他支出
	{
		id: 20,
		amount: 4200,
		type: "expense" as const,
		categoryId: 15,
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

	// 追加の取引データ（21-30）
	{
		id: 21,
		amount: 280000,
		type: "income" as const,
		categoryId: 1,
		description: "11月分給与",
		transactionDate: "2024-11-25",
		paymentMethod: "銀行振込",
		tags: null,
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-11-25T10:00:00Z",
		updatedAt: "2024-11-25T10:00:00Z",
	},
	{
		id: 22,
		amount: 80000,
		type: "expense" as const,
		categoryId: 6,
		description: "12月分家賃",
		transactionDate: "2024-11-28",
		paymentMethod: "銀行振込",
		tags: null,
		receiptUrl: null,
		isRecurring: true,
		recurringId: 1,
		createdAt: "2024-11-28T09:00:00Z",
		updatedAt: "2024-11-28T09:00:00Z",
	},
	{
		id: 23,
		amount: 14500,
		type: "expense" as const,
		categoryId: 8,
		description: "電気・ガス代",
		transactionDate: "2024-11-27",
		paymentMethod: "クレジットカード",
		tags: '["光熱費", "毎月"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-11-27T14:30:00Z",
		updatedAt: "2024-11-27T14:30:00Z",
	},
	{
		id: 24,
		amount: 5200,
		type: "expense" as const,
		categoryId: 5,
		description: "食材購入",
		transactionDate: "2024-11-26",
		paymentMethod: "クレジットカード",
		tags: '["スーパー", "食材"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-11-26T18:20:00Z",
		updatedAt: "2024-11-26T18:20:00Z",
	},
	{
		id: 25,
		amount: 4800,
		type: "expense" as const,
		categoryId: 9,
		description: "スマートフォン料金",
		transactionDate: "2024-11-18",
		paymentMethod: "銀行引き落とし",
		tags: '["通信費", "毎月"]',
		receiptUrl: null,
		isRecurring: true,
		recurringId: 2,
		createdAt: "2024-11-18T10:00:00Z",
		updatedAt: "2024-11-18T10:00:00Z",
	},
	{
		id: 26,
		amount: 1980,
		type: "expense" as const,
		categoryId: 11,
		description: "Netflix",
		transactionDate: "2024-11-15",
		paymentMethod: "クレジットカード",
		tags: '["サブスク", "動画配信"]',
		receiptUrl: null,
		isRecurring: true,
		recurringId: 3,
		createdAt: "2024-11-15T00:15:00Z",
		updatedAt: "2024-11-15T00:15:00Z",
	},
	{
		id: 27,
		amount: 980,
		type: "expense" as const,
		categoryId: 11,
		description: "Spotify",
		transactionDate: "2024-11-14",
		paymentMethod: "クレジットカード",
		tags: '["サブスク", "音楽配信"]',
		receiptUrl: null,
		isRecurring: true,
		recurringId: 4,
		createdAt: "2024-11-14T00:20:00Z",
		updatedAt: "2024-11-14T00:20:00Z",
	},
	{
		id: 28,
		amount: 18000,
		type: "income" as const,
		categoryId: 2,
		description: "Web制作案件",
		transactionDate: "2024-11-10",
		paymentMethod: "銀行振込",
		tags: '["副業", "Web制作"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-11-10T16:00:00Z",
		updatedAt: "2024-11-10T16:00:00Z",
	},
	{
		id: 29,
		amount: 3200,
		type: "expense" as const,
		categoryId: 7,
		description: "電車・バス代",
		transactionDate: "2024-11-08",
		paymentMethod: "ICカード",
		tags: '["通勤", "交通費"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-11-08T08:30:00Z",
		updatedAt: "2024-11-08T08:30:00Z",
	},
	{
		id: 30,
		amount: 15000,
		type: "expense" as const,
		categoryId: 11,
		description: "コンサート",
		transactionDate: "2024-11-03",
		paymentMethod: "クレジットカード",
		tags: '["音楽", "エンターテイメント"]',
		receiptUrl: null,
		isRecurring: false,
		recurringId: null,
		createdAt: "2024-11-03T20:00:00Z",
		updatedAt: "2024-11-03T20:00:00Z",
	},
];

// 収入のみ
export const mockIncomeTransactions = mockTransactions.filter(
	(transaction) => transaction.type === "income",
);

// 支出のみ
export const mockExpenseTransactions = mockTransactions.filter(
	(transaction) => transaction.type === "expense",
);

// 大量データセット生成
export const generateLargeTransactionDataset = (count = 100) => {
	const largeDataset = [...mockTransactions];
	const categories = [1, 2, 3, 5, 6, 7, 8, 9, 10, 11]; // よく使われるカテゴリ
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
			"日用品",
		],
		income: ["給与", "副業収入", "配当金", "投資利益", "その他収入"],
	};

	for (let i = 31; i <= 30 + count; i++) {
		const isIncome = Math.random() < 0.2; // 20%の確率で収入
		const type = isIncome ? "income" : "expense";
		const categoryId = isIncome
			? Math.random() < 0.8
				? 1
				: Math.random() < 0.5
					? 2
					: 3
			: categories[Math.floor(Math.random() * 8)];
		const amount = isIncome
			? Math.floor(Math.random() * 200000) + 50000 // 収入: 5万〜25万円
			: Math.floor(Math.random() * 20000) + 500; // 支出: 500〜20,500円

		const daysAgo = Math.floor(Math.random() * 90); // 過去90日以内
		const date = new Date();
		date.setDate(date.getDate() - daysAgo);
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
			isRecurring: Math.random() < 0.1, // 10%の確率で定期
			recurringId:
				Math.random() < 0.1 ? Math.floor(Math.random() * 10) + 1 : null,
			createdAt: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00Z`,
			updatedAt: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, "0")}:${String(Math.floor(Math.random() * 60)).padStart(2, "0")}:00Z`,
		});
	}

	return largeDataset;
};

// 個別取引取得用
export const getTransactionById = (id: number) => {
	const transaction = mockTransactions.find((t) => t.id === id);
	if (!transaction) {
		return {
			error: "取引が見つかりません",
			details: `ID: ${id} の取引は存在しません`,
		};
	}

	return {
		success: true,
		data: transaction,
	};
};

// フィルタリング用ヘルパー
export const filterTransactions = (
	data: typeof mockTransactions,
	filters: {
		type?: "income" | "expense";
		category_id?: number;
		from?: string;
		to?: string;
		search?: string;
	} = {},
) => {
	let filteredData = [...data];

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
			(t) => t.transactionDate >= filters.from!,
		);
	}
	if (filters.to) {
		filteredData = filteredData.filter((t) => t.transactionDate <= filters.to!);
	}
	if (filters.search) {
		const searchTerm = filters.search.toLowerCase();
		filteredData = filteredData.filter((t) =>
			t.description.toLowerCase().includes(searchTerm),
		);
	}

	return filteredData;
};

// ソート用ヘルパー
export const sortTransactions = (
	data: typeof mockTransactions,
	sortBy = "transactionDate",
	sortOrder = "desc",
) => {
	const sortedData = [...data];

	sortedData.sort((a, b) => {
		let aVal: number | string;
		let bVal: number | string;

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

		if (typeof aVal === "number" && typeof bVal === "number") {
			const result = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			return sortOrder === "desc" ? -result : result;
		}

		return 0;
	});

	return sortedData;
};

// ページネーション用ヘルパー
export const paginateTransactions = (
	data: typeof mockTransactions,
	page = 1,
	limit = 20,
) => {
	const totalCount = data.length;
	const totalPages = Math.ceil(totalCount / limit);
	const startIndex = (page - 1) * limit;
	const paginatedData = data.slice(startIndex, startIndex + limit);

	return {
		data: paginatedData,
		pagination: {
			currentPage: page,
			totalPages,
			totalCount,
			hasNextPage: page < totalPages,
			hasPrevPage: page > 1,
			limit,
		},
	};
};
