/**
 * サブスクリプションデータのモック定義
 *
 * 設計方針:
 * - 実際のDBスキーマに準拠したデータ構造
 * - 様々なサブスクサービスを網羅
 * - 頻度・状態・金額パターンの多様性
 * - リアルなサービス名と料金設定
 */

// 基本的なサブスクリプションデータセット
export const mockSubscriptions = [
	// エンターテイメント系
	{
		id: 1,
		name: "Netflix",
		amount: 1980,
		categoryId: 11, // 娯楽費
		frequency: "monthly" as const,
		startDate: "2024-01-15",
		endDate: null,
		description: "動画配信サービス",
		isActive: true,
		nextPaymentDate: "2025-01-15",
		createdAt: "2024-01-15T00:00:00Z",
		updatedAt: "2024-01-15T00:00:00Z",
	},
	{
		id: 2,
		name: "Spotify",
		amount: 980,
		categoryId: 11, // 娯楽費
		frequency: "monthly" as const,
		startDate: "2024-01-14",
		endDate: null,
		description: "音楽配信サービス",
		isActive: true,
		nextPaymentDate: "2025-01-14",
		createdAt: "2024-01-14T00:00:00Z",
		updatedAt: "2024-01-14T00:00:00Z",
	},
	{
		id: 3,
		name: "Disney+",
		amount: 990,
		categoryId: 11, // 娯楽費
		frequency: "monthly" as const,
		startDate: "2024-02-01",
		endDate: null,
		description: "動画配信サービス",
		isActive: true,
		nextPaymentDate: "2025-02-01",
		createdAt: "2024-02-01T00:00:00Z",
		updatedAt: "2024-02-01T00:00:00Z",
	},
	{
		id: 4,
		name: "Prime Video",
		amount: 500,
		categoryId: 11, // 娯楽費
		frequency: "monthly" as const,
		startDate: "2024-03-15",
		endDate: null,
		description: "Amazon Prime 動画配信",
		isActive: true,
		nextPaymentDate: "2025-03-15",
		createdAt: "2024-03-15T00:00:00Z",
		updatedAt: "2024-03-15T00:00:00Z",
	},

	// 仕事・生産性系
	{
		id: 5,
		name: "Microsoft 365",
		amount: 1284,
		categoryId: 13, // 教育費
		frequency: "monthly" as const,
		startDate: "2024-01-01",
		endDate: null,
		description: "オフィスソフトウェア",
		isActive: true,
		nextPaymentDate: "2025-01-01",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 6,
		name: "Adobe Creative Cloud",
		amount: 6248,
		categoryId: 13, // 教育費
		frequency: "monthly" as const,
		startDate: "2024-01-10",
		endDate: null,
		description: "クリエイティブソフトウェア",
		isActive: true,
		nextPaymentDate: "2025-01-10",
		createdAt: "2024-01-10T00:00:00Z",
		updatedAt: "2024-01-10T00:00:00Z",
	},
	{
		id: 7,
		name: "GitHub Pro",
		amount: 400,
		categoryId: 13, // 教育費
		frequency: "monthly" as const,
		startDate: "2024-02-01",
		endDate: null,
		description: "開発プラットフォーム",
		isActive: true,
		nextPaymentDate: "2025-02-01",
		createdAt: "2024-02-01T00:00:00Z",
		updatedAt: "2024-02-01T00:00:00Z",
	},

	// 通信系
	{
		id: 8,
		name: "スマートフォン",
		amount: 4800,
		categoryId: 9, // 通信費
		frequency: "monthly" as const,
		startDate: "2024-01-01",
		endDate: null,
		description: "携帯電話料金",
		isActive: true,
		nextPaymentDate: "2025-01-01",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},
	{
		id: 9,
		name: "インターネット回線",
		amount: 5500,
		categoryId: 9, // 通信費
		frequency: "monthly" as const,
		startDate: "2024-01-01",
		endDate: null,
		description: "光回線料金",
		isActive: true,
		nextPaymentDate: "2025-01-01",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},

	// 健康・フィットネス系
	{
		id: 10,
		name: "ジム会員",
		amount: 8800,
		categoryId: 15, // その他支出
		frequency: "monthly" as const,
		startDate: "2024-01-15",
		endDate: null,
		description: "フィットネスクラブ",
		isActive: true,
		nextPaymentDate: "2025-01-15",
		createdAt: "2024-01-15T00:00:00Z",
		updatedAt: "2024-01-15T00:00:00Z",
	},

	// ストレージ・クラウド系
	{
		id: 11,
		name: "iCloud",
		amount: 130,
		categoryId: 9, // 通信費
		frequency: "monthly" as const,
		startDate: "2024-01-20",
		endDate: null,
		description: "クラウドストレージ",
		isActive: true,
		nextPaymentDate: "2025-01-20",
		createdAt: "2024-01-20T00:00:00Z",
		updatedAt: "2024-01-20T00:00:00Z",
	},
	{
		id: 12,
		name: "Dropbox",
		amount: 1200,
		categoryId: 9, // 通信費
		frequency: "monthly" as const,
		startDate: "2024-02-10",
		endDate: null,
		description: "クラウドストレージ",
		isActive: true,
		nextPaymentDate: "2025-02-10",
		createdAt: "2024-02-10T00:00:00Z",
		updatedAt: "2024-02-10T00:00:00Z",
	},

	// 年額契約
	{
		id: 13,
		name: "ドメイン更新",
		amount: 1408,
		categoryId: 13, // 教育費
		frequency: "yearly" as const,
		startDate: "2024-03-01",
		endDate: null,
		description: "ドメイン年額更新",
		isActive: true,
		nextPaymentDate: "2025-03-01",
		createdAt: "2024-03-01T00:00:00Z",
		updatedAt: "2024-03-01T00:00:00Z",
	},
	{
		id: 14,
		name: "VPS サーバー",
		amount: 12000,
		categoryId: 13, // 教育費
		frequency: "yearly" as const,
		startDate: "2024-01-01",
		endDate: null,
		description: "サーバーホスティング",
		isActive: true,
		nextPaymentDate: "2025-01-01",
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-01-01T00:00:00Z",
	},

	// 停止中・期限切れ
	{
		id: 15,
		name: "Hulu",
		amount: 1026,
		categoryId: 11, // 娯楽費
		frequency: "monthly" as const,
		startDate: "2024-01-01",
		endDate: "2024-06-30",
		description: "動画配信サービス（解約済み）",
		isActive: false,
		nextPaymentDate: null,
		createdAt: "2024-01-01T00:00:00Z",
		updatedAt: "2024-06-30T00:00:00Z",
	},
	{
		id: 16,
		name: "YouTube Premium",
		amount: 1180,
		categoryId: 11, // 娯楽費
		frequency: "monthly" as const,
		startDate: "2024-03-15",
		endDate: null,
		description: "動画配信サービス",
		isActive: false,
		nextPaymentDate: null,
		createdAt: "2024-03-15T00:00:00Z",
		updatedAt: "2024-11-15T00:00:00Z",
	},
];

// アクティブなサブスクリプション
export const mockActiveSubscriptions = mockSubscriptions.filter(
	(subscription) => subscription.isActive,
);

// 非アクティブなサブスクリプション
export const mockInactiveSubscriptions = mockSubscriptions.filter(
	(subscription) => !subscription.isActive,
);

// 月額サブスクリプション
export const mockMonthlySubscriptions = mockSubscriptions.filter(
	(subscription) => subscription.frequency === "monthly",
);

// 年額サブスクリプション
export const mockYearlySubscriptions = mockSubscriptions.filter(
	(subscription) => subscription.frequency === "yearly",
);

// カテゴリ別サブスクリプション
export const mockSubscriptionsByCategory = {
	entertainment: mockSubscriptions.filter((sub) => sub.categoryId === 11),
	communication: mockSubscriptions.filter((sub) => sub.categoryId === 9),
	education: mockSubscriptions.filter((sub) => sub.categoryId === 13),
	other: mockSubscriptions.filter((sub) => sub.categoryId === 15),
};

// 大量データセット生成
export const generateLargeSubscriptionDataset = (count = 50) => {
	const largeDataset = [...mockSubscriptions];
	const services = [
		"Service A",
		"Service B",
		"Service C",
		"App X",
		"Platform Y",
		"Tool Z",
		"Software Alpha",
		"Beta Service",
		"Gamma App",
		"Delta Platform",
		"Epsilon Tool",
		"Zeta Software",
	];
	const categories = [9, 11, 13, 15]; // 通信費、娯楽費、教育費、その他
	const frequencies = ["monthly", "yearly"] as const;

	for (let i = 17; i <= 16 + count; i++) {
		const frequency =
			frequencies[Math.floor(Math.random() * frequencies.length)];
		const amount =
			frequency === "monthly"
				? Math.floor(Math.random() * 5000) + 100 // 月額: 100-5100円
				: Math.floor(Math.random() * 20000) + 1000; // 年額: 1000-21000円

		const startDate = new Date(
			2024,
			Math.floor(Math.random() * 12),
			Math.floor(Math.random() * 28) + 1,
		);
		const startDateStr = startDate.toISOString().split("T")[0];

		// 次回支払日を計算
		const nextPaymentDate = new Date(startDate);
		if (frequency === "monthly") {
			nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
		} else {
			nextPaymentDate.setFullYear(nextPaymentDate.getFullYear() + 1);
		}

		largeDataset.push({
			id: i,
			name: `${services[Math.floor(Math.random() * services.length)]} ${i}`,
			amount,
			categoryId: categories[Math.floor(Math.random() * categories.length)],
			frequency,
			startDate: startDateStr,
			endDate: Math.random() < 0.2 ? "2024-12-31" : null, // 20%の確率で終了日設定
			description: `${frequency === "monthly" ? "月額" : "年額"}サービス ${i}`,
			isActive: Math.random() > 0.2, // 80%の確率でアクティブ
			nextPaymentDate:
				Math.random() > 0.2
					? nextPaymentDate.toISOString().split("T")[0]
					: null,
			createdAt: `${startDateStr}T00:00:00Z`,
			updatedAt: `${startDateStr}T00:00:00Z`,
		});
	}

	return largeDataset;
};

// 個別サブスクリプション取得用
export const getSubscriptionById = (id: number) => {
	const subscription = mockSubscriptions.find((s) => s.id === id);
	if (!subscription) {
		return {
			error: "サブスクリプションが見つかりません",
			details: `ID: ${id} のサブスクリプションは存在しません`,
		};
	}

	return {
		success: true,
		data: subscription,
	};
};

// フィルタリング用ヘルパー
export const filterSubscriptions = (
	data: typeof mockSubscriptions,
	filters: {
		isActive?: boolean;
		frequency?: "monthly" | "yearly";
		category_id?: number;
		search?: string;
	} = {},
) => {
	let filteredData = [...data];

	if (filters.isActive !== undefined) {
		filteredData = filteredData.filter((s) => s.isActive === filters.isActive);
	}
	if (filters.frequency) {
		filteredData = filteredData.filter(
			(s) => s.frequency === filters.frequency,
		);
	}
	if (filters.category_id) {
		filteredData = filteredData.filter(
			(s) => s.categoryId === Number(filters.category_id),
		);
	}
	if (filters.search) {
		const searchTerm = filters.search.toLowerCase();
		filteredData = filteredData.filter(
			(s) =>
				s.name.toLowerCase().includes(searchTerm) ||
				s.description.toLowerCase().includes(searchTerm),
		);
	}

	return filteredData;
};

// 月額総額計算
export const calculateMonthlyTotal = (
	subscriptions: typeof mockSubscriptions,
) => {
	return subscriptions
		.filter((sub) => sub.isActive)
		.reduce((total, sub) => {
			if (sub.frequency === "monthly") {
				return total + sub.amount;
			}
			if (sub.frequency === "yearly") {
				return total + Math.round(sub.amount / 12);
			}
			return total;
		}, 0);
};

// 年額総額計算
export const calculateYearlyTotal = (
	subscriptions: typeof mockSubscriptions,
) => {
	return subscriptions
		.filter((sub) => sub.isActive)
		.reduce((total, sub) => {
			if (sub.frequency === "monthly") {
				return total + sub.amount * 12;
			}
			if (sub.frequency === "yearly") {
				return total + sub.amount;
			}
			return total;
		}, 0);
};

// カテゴリ別統計
export const getSubscriptionStatsByCategory = (
	subscriptions: typeof mockSubscriptions,
) => {
	const stats: Record<
		number,
		{ count: number; monthlyTotal: number; yearlyTotal: number }
	> = {};

	for (const sub of subscriptions.filter((sub) => sub.isActive)) {
		if (!stats[sub.categoryId]) {
			stats[sub.categoryId] = { count: 0, monthlyTotal: 0, yearlyTotal: 0 };
		}

		stats[sub.categoryId].count++;

		if (sub.frequency === "monthly") {
			stats[sub.categoryId].monthlyTotal += sub.amount;
			stats[sub.categoryId].yearlyTotal += sub.amount * 12;
		} else if (sub.frequency === "yearly") {
			stats[sub.categoryId].monthlyTotal += Math.round(sub.amount / 12);
			stats[sub.categoryId].yearlyTotal += sub.amount;
		}
	}

	return stats;
};

// 今月の支払い予定
export const getUpcomingPayments = (
	subscriptions: typeof mockSubscriptions,
	targetMonth?: string,
) => {
	const today = new Date();
	const month =
		targetMonth ||
		`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

	return subscriptions
		.filter(
			(sub) =>
				sub.isActive &&
				sub.nextPaymentDate &&
				sub.nextPaymentDate.startsWith(month),
		)
		.sort((a, b) =>
			(a.nextPaymentDate || "").localeCompare(b.nextPaymentDate || ""),
		);
};

// APIレスポンス形式でのラップ
export const mockSubscriptionsApiResponse = {
	success: true,
	data: mockSubscriptions,
	count: mockSubscriptions.length,
};

export const mockActiveSubscriptionsApiResponse = {
	success: true,
	data: mockActiveSubscriptions,
	count: mockActiveSubscriptions.length,
};

// エラーレスポンス
export const mockSubscriptionErrorResponse = {
	error: "サブスクリプションの取得に失敗しました",
	details: "データベース接続エラーが発生しました",
};
