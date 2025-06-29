import { useMemo, useState } from "react";
import { useSubscriptions } from "../../lib/hooks/use-subscriptions";
import type { SelectSubscription } from "../../types";
import { SubscriptionActions } from "./subscription-actions";

/**
 * サブスクリプションカード一覧コンポーネント
 *
 * 設計方針:
 * - カード形式での視覚的なサブスクリプション一覧表示
 * - 月額/年額の表示切り替え機能
 * - アクティブ/非アクティブの状態管理
 * - 次回請求日の計算と表示
 * - インライン編集・削除・状態切り替え機能
 * - 既存のTransactionCardsパターンを踏襲
 * - レスポンシブデザインとアクセシビリティ対応
 */

export interface SubscriptionCardsProps {
	/**
	 * 表示するサブスクリプションのフィルター
	 */
	filter?: "all" | "active" | "inactive";
	/**
	 * カードの表示を簡潔にするかどうか
	 */
	compact?: boolean;
	/**
	 * 1ページあたりの表示件数
	 */
	limit?: number;
	/**
	 * 編集ボタンクリック時のコールバック
	 */
	onEdit?: (subscription: SelectSubscription) => void;
	/**
	 * 新規作成ボタンクリック時のコールバック
	 */
	onCreateNew?: () => void;
}

// 表示期間の型定義
type DisplayPeriod = "monthly" | "yearly";

// 請求頻度に応じた年間回数の計算
const getAnnualMultiplier = (frequency: string): number => {
	switch (frequency) {
		case "daily":
			return 365;
		case "weekly":
			return 52;
		case "monthly":
			return 12;
		case "yearly":
			return 1;
		default:
			return 12; // デフォルトは月次
	}
};

// 次回請求日の計算（既存のnextPaymentDateを使用）
const getNextBillingDate = (
	nextPaymentDate: string,
	frequency: string,
): Date => {
	// 既存のnextPaymentDateをそのまま使用
	return new Date(nextPaymentDate);
};

// 請求頻度の日本語表示
const getFrequencyLabel = (frequency: string): string => {
	switch (frequency) {
		case "daily":
			return "日次";
		case "weekly":
			return "週次";
		case "monthly":
			return "月次";
		case "yearly":
			return "年次";
		default:
			return "月次";
	}
};

export function SubscriptionCards({
	filter = "all",
	compact = false,
	limit = 50,
	onEdit,
	onCreateNew,
}: SubscriptionCardsProps) {
	// 表示期間の状態管理
	const [displayPeriod, setDisplayPeriod] = useState<DisplayPeriod>("monthly");

	// サブスクリプションデータを取得
	const {
		data: subscriptionsResponse,
		isLoading,
		error,
	} = useSubscriptions({
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== "undefined",
	} as any);

	// フィルタリングされたサブスクリプションデータ
	const subscriptions = useMemo(() => {
		if (!subscriptionsResponse?.data) return [];

		const filtered = subscriptionsResponse.data.filter((sub) => {
			if (filter === "active") return sub.isActive;
			if (filter === "inactive") return !sub.isActive;
			return true; // "all"
		});

		return filtered.sort((a, b) => {
			// アクティブなものを先に表示
			if (a.isActive !== b.isActive) {
				return a.isActive ? -1 : 1;
			}
			// 次回請求日が近いものを先に表示
			const nextA = getNextBillingDate(a.nextPaymentDate, a.frequency);
			const nextB = getNextBillingDate(b.nextPaymentDate, b.frequency);
			return nextA.getTime() - nextB.getTime();
		});
	}, [subscriptionsResponse?.data, filter]);

	// 期間別の合計コスト計算
	const totalCost = useMemo(() => {
		if (!subscriptions.length) return 0;

		return subscriptions
			.filter((sub) => sub.isActive)
			.reduce((total, sub) => {
				const annualMultiplier = getAnnualMultiplier(sub.frequency);
				const annualCost = sub.amount * annualMultiplier;

				if (displayPeriod === "monthly") {
					return total + annualCost / 12;
				}
				return total + annualCost;
			}, 0);
	}, [subscriptions, displayPeriod]);

	// 表示期間切り替えのハンドラー
	const handlePeriodChange = (period: DisplayPeriod) => {
		setDisplayPeriod(period);
	};

	// 個別サブスクリプションの表示金額計算
	const getDisplayAmount = (subscription: SelectSubscription): number => {
		const annualMultiplier = getAnnualMultiplier(subscription.frequency);
		const annualCost = subscription.amount * annualMultiplier;

		if (displayPeriod === "monthly") {
			return annualCost / 12;
		}
		return annualCost;
	};

	// 次回請求日までの日数計算
	const getDaysUntilNext = (subscription: SelectSubscription): number => {
		const nextDate = getNextBillingDate(
			subscription.nextPaymentDate,
			subscription.frequency,
		);
		const today = new Date();
		const diffTime = nextDate.getTime() - today.getTime();
		return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
	};

	// ローディング表示
	if (isLoading) {
		return (
			<div className="space-y-6">
				{/* ヘッダースケルトン */}
				<div className="flex items-center justify-between">
					<div className="w-48 h-8 bg-gray-200 rounded animate-pulse" />
					<div className="w-32 h-8 bg-gray-200 rounded animate-pulse" />
				</div>

				{/* カードスケルトン */}
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{Array.from({ length: 6 }, (_, i) => i).map((index) => (
						<div
							key={`skeleton-${index}`}
							className="bg-white border border-gray-200 rounded-lg p-6 animate-pulse"
						>
							<div className="flex items-center justify-between mb-4">
								<div className="w-24 h-6 bg-gray-200 rounded" />
								<div className="w-16 h-5 bg-gray-200 rounded" />
							</div>
							<div className="w-20 h-8 bg-gray-200 rounded mb-3" />
							<div className="w-full h-4 bg-gray-200 rounded mb-2" />
							<div className="w-3/4 h-4 bg-gray-200 rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}

	// エラー表示
	if (error) {
		return (
			<div className="bg-red-50 border border-red-200 rounded-lg p-6">
				<div className="flex items-center space-x-2">
					<div className="text-red-600">
						<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fillRule="evenodd"
								d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
								clipRule="evenodd"
							/>
						</svg>
					</div>
					<div>
						<h3 className="text-sm font-medium text-red-800">
							サブスクリプションデータの取得に失敗しました
						</h3>
						<p className="text-sm text-red-700 mt-1">
							{error.message || "不明なエラーが発生しました"}
						</p>
					</div>
				</div>
			</div>
		);
	}

	// データが空の場合
	if (subscriptions.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="text-gray-400 mb-4">
					<svg
						className="w-16 h-16 mx-auto"
						fill="currentColor"
						viewBox="0 0 20 20"
					>
						<path
							fillRule="evenodd"
							d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2z"
							clipRule="evenodd"
						/>
					</svg>
				</div>
				<h3 className="text-lg font-medium text-gray-900 mb-2">
					{filter === "active"
						? "アクティブな"
						: filter === "inactive"
							? "非アクティブな"
							: ""}
					サブスクリプションがありません
				</h3>
				<p className="text-gray-600 mb-6">
					新しいサブスクリプションを登録して支出管理を始めましょう
				</p>
				<button
					type="button"
					onClick={() => {
						console.log("🟡 [DEBUG] 空状態ボタンクリック開始");
						onCreateNew?.();
						console.log("🟡 [DEBUG] 空状態ボタンクリック完了");
					}}
					className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
				>
					新規サブスクリプション
				</button>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			{/* ヘッダー */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 className="text-lg font-semibold text-gray-900">
						サブスクリプション一覧
						<span className="ml-2 text-sm font-normal text-gray-500">
							({subscriptions.length}件)
						</span>
					</h2>
					<p className="text-sm text-gray-600 mt-1">
						{displayPeriod === "monthly" ? "月間" : "年間"}合計:{" "}
						<span className="font-semibold text-gray-900">
							¥{Math.round(totalCost).toLocaleString()}
						</span>
					</p>
				</div>

				{/* 表示期間切り替え */}
				<div className="mt-4 sm:mt-0 flex rounded-md shadow-sm">
					<button
						type="button"
						onClick={() => handlePeriodChange("monthly")}
						className={`px-4 py-2 text-sm font-medium rounded-l-md border transition-colors ${
							displayPeriod === "monthly"
								? "bg-blue-50 text-blue-700 border-blue-200"
								: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
						}`}
					>
						月額表示
					</button>
					<button
						type="button"
						onClick={() => handlePeriodChange("yearly")}
						className={`px-4 py-2 text-sm font-medium rounded-r-md border-l-0 border transition-colors ${
							displayPeriod === "yearly"
								? "bg-blue-50 text-blue-700 border-blue-200"
								: "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
						}`}
					>
						年額表示
					</button>
				</div>
			</div>

			{/* サブスクリプションカード */}
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
				{subscriptions.map((subscription) => {
					const displayAmount = getDisplayAmount(subscription);
					const daysUntilNext = getDaysUntilNext(subscription);
					const nextBillingDate = getNextBillingDate(
						subscription.nextPaymentDate,
						subscription.frequency,
					);

					return (
						<div
							key={subscription.id}
							className={`bg-white border rounded-lg p-6 hover:shadow-md transition-shadow ${
								subscription.isActive
									? "border-gray-200"
									: "border-gray-300 bg-gray-50"
							}`}
						>
							{/* ヘッダー */}
							<div className="flex items-center justify-between mb-4">
								<h3
									className={`text-lg font-semibold ${
										subscription.isActive ? "text-gray-900" : "text-gray-600"
									}`}
								>
									{subscription.name}
								</h3>
								<div className="flex items-center space-x-2">
									<span
										className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
											subscription.isActive
												? "bg-green-100 text-green-800"
												: "bg-red-100 text-red-800"
										}`}
									>
										{subscription.isActive ? "アクティブ" : "非アクティブ"}
									</span>
								</div>
							</div>

							{/* 金額表示 */}
							<div className="mb-4">
								<div
									className={`text-2xl font-bold ${
										subscription.isActive ? "text-gray-900" : "text-gray-600"
									}`}
								>
									¥{Math.round(displayAmount).toLocaleString()}
									<span className="text-sm font-normal text-gray-500 ml-1">
										/ {displayPeriod === "monthly" ? "月" : "年"}
									</span>
								</div>
								<div className="text-sm text-gray-600">
									実際の請求: ¥{subscription.amount.toLocaleString()} /{" "}
									{getFrequencyLabel(subscription.frequency)}
								</div>
							</div>

							{/* 次回請求日 */}
							<div className="mb-4">
								<div className="text-sm text-gray-600">次回請求日</div>
								<div
									className={`text-sm font-medium ${
										daysUntilNext <= 7
											? "text-orange-600"
											: daysUntilNext <= 30
												? "text-blue-600"
												: "text-gray-700"
									}`}
								>
									{nextBillingDate.toLocaleDateString("ja-JP")}
									<span className="ml-1">
										({daysUntilNext > 0 ? `${daysUntilNext}日後` : "本日"})
									</span>
								</div>
							</div>

							{/* 説明 */}
							{subscription.description && (
								<div className="mb-4">
									<p
										className={`text-sm ${
											subscription.isActive ? "text-gray-600" : "text-gray-500"
										}`}
									>
										{subscription.description}
									</p>
								</div>
							)}

							{/* アクションボタン */}
							<SubscriptionActions
								subscription={subscription}
								onEdit={onEdit}
								compact={compact}
							/>
						</div>
					);
				})}
			</div>
		</div>
	);
}
