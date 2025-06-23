import { useMemo } from "react";
import { Link } from "react-router";
import type { SelectSubscription } from "../../../db/schema";
import {
	useActiveSubscriptions,
	useInactiveSubscriptions,
	useSubscriptionsTotalCost,
} from "../../lib/hooks/use-subscriptions";

/**
 * ダッシュボード用サブスクリプションウィジェットコンポーネント
 *
 * 設計方針:
 * - アクティブなサブスクリプション一覧を3-5件表示
 * - 今月の合計サブスク費用を上部に表示
 * - 停止中のサブスクも別セクションで表示
 * - 次回支払日による自動ソート（近い順）
 * - 状態によるステータス表示（アクティブ/停止中）
 * - 管理ページへのリンクを提供
 * - 既存のuseSubscriptionsフックを活用
 */

export interface SubscriptionWidgetProps {
	/**
	 * 表示するアクティブなサブスクリプションの最大件数
	 */
	maxActiveItems?: number;
	/**
	 * 表示する停止中のサブスクリプションの最大件数
	 */
	maxInactiveItems?: number;
	/**
	 * コンパクト表示かどうか
	 */
	compact?: boolean;
}

// サブスクリプション表示用のデータ型
interface SubscriptionDisplayItem {
	id: number;
	name: string;
	amount: number;
	nextPaymentDate: string;
	isActive: boolean;
	frequency: string;
	categoryName?: string;
	daysUntilPayment: number;
}

export function SubscriptionWidget({
	maxActiveItems = 5,
	maxInactiveItems = 3,
	compact = false,
}: SubscriptionWidgetProps) {
	// アクティブなサブスクリプション取得
	const {
		data: activeSubscriptionsResponse,
		isLoading: isActiveLoading,
		error: activeError,
	} = useActiveSubscriptions({
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== "undefined",
	} as any);

	// 停止中のサブスクリプション取得
	const {
		data: inactiveSubscriptionsResponse,
		isLoading: isInactiveLoading,
		error: inactiveError,
	} = useInactiveSubscriptions({
		// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
		enabled: typeof window !== "undefined",
	} as any);

	// 合計コスト取得
	const { monthlyTotal, yearlyTotal } = useSubscriptionsTotalCost();

	// 表示用データの整形とソート
	const { activeItems, inactiveItems } = useMemo(() => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		// アクティブなサブスクリプションの処理
		const activeSubscriptions = activeSubscriptionsResponse?.data || [];
		const processedActive = activeSubscriptions
			.map((subscription): SubscriptionDisplayItem => {
				const nextPaymentDate = new Date(subscription.nextPaymentDate);
				const timeDiff = nextPaymentDate.getTime() - today.getTime();
				const daysUntilPayment = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

				return {
					id: subscription.id,
					name: subscription.name,
					amount: subscription.amount,
					nextPaymentDate: subscription.nextPaymentDate,
					isActive: subscription.isActive,
					frequency: subscription.frequency,
					daysUntilPayment,
				};
			})
			.sort((a, b) => a.daysUntilPayment - b.daysUntilPayment)
			.slice(0, maxActiveItems);

		// 停止中のサブスクリプションの処理
		const inactiveSubscriptions = inactiveSubscriptionsResponse?.data || [];
		const processedInactive = inactiveSubscriptions
			.map(
				(subscription): SubscriptionDisplayItem => ({
					id: subscription.id,
					name: subscription.name,
					amount: subscription.amount,
					nextPaymentDate: subscription.nextPaymentDate,
					isActive: subscription.isActive,
					frequency: subscription.frequency,
					daysUntilPayment: 0, // 停止中は支払日計算不要
				}),
			)
			.slice(0, maxInactiveItems);

		return {
			activeItems: processedActive,
			inactiveItems: processedInactive,
		};
	}, [
		activeSubscriptionsResponse?.data,
		inactiveSubscriptionsResponse?.data,
		maxActiveItems,
		maxInactiveItems,
	]);

	// 頻度の日本語ラベル取得
	const getFrequencyLabel = (frequency: string): string => {
		const labels: Record<string, string> = {
			daily: "日次",
			weekly: "週次",
			monthly: "月次",
			yearly: "年次",
		};
		return labels[frequency] || frequency;
	};

	// 次回支払日の表示テキスト取得
	const getPaymentDateDisplay = (
		dateString: string,
		daysUntilPayment: number,
	): { text: string; colorClass: string } => {
		const date = new Date(dateString);
		const formattedDate = date.toLocaleDateString("ja-JP", {
			month: "short",
			day: "numeric",
		});

		if (daysUntilPayment < 0) {
			return {
				text: `${formattedDate} (期限切れ)`,
				colorClass: "text-red-600",
			};
		}
		if (daysUntilPayment === 0) {
			return {
				text: `${formattedDate} (今日)`,
				colorClass: "text-orange-600",
			};
		}
		if (daysUntilPayment <= 7) {
			return {
				text: `${formattedDate} (${daysUntilPayment}日後)`,
				colorClass: "text-yellow-600",
			};
		}
		return {
			text: `${formattedDate} (${daysUntilPayment}日後)`,
			colorClass: "text-gray-600",
		};
	};

	// エラー表示
	if (activeError || inactiveError) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-6">
				<div className="flex items-center space-x-2 text-red-600">
					<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
						<path
							fillRule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clipRule="evenodd"
						/>
					</svg>
					<span className="text-sm font-medium">
						サブスクリプションデータの取得に失敗しました
					</span>
				</div>
			</div>
		);
	}

	// ローディング表示
	if (isActiveLoading || isInactiveLoading) {
		return (
			<div className="bg-white rounded-lg shadow-sm border p-6 animate-pulse">
				<div className="flex items-center justify-between mb-4">
					<div className="w-32 h-6 bg-gray-200 rounded" />
					<div className="w-16 h-4 bg-gray-200 rounded" />
				</div>
				<div className="w-24 h-8 bg-gray-200 rounded mb-4" />
				<div className="space-y-3">
					{["loading-1", "loading-2", "loading-3"].map((loadingKey) => (
						<div key={loadingKey} className="flex items-center justify-between">
							<div className="w-20 h-4 bg-gray-200 rounded" />
							<div className="w-16 h-4 bg-gray-200 rounded" />
						</div>
					))}
				</div>
			</div>
		);
	}

	return (
		<div className="bg-white rounded-lg shadow-sm border">
			{/* ヘッダー */}
			<div className="px-6 py-4 border-b border-gray-200">
				<div className="flex items-center justify-between">
					<h3 className="text-lg font-semibold text-gray-900">
						サブスクリプション
					</h3>
					<Link
						to="/subscriptions"
						className="text-sm text-blue-600 hover:text-blue-800 font-medium"
					>
						管理 →
					</Link>
				</div>
			</div>

			<div className="p-6">
				{/* 月間合計コスト */}
				<div className="mb-6">
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-600">今月の合計</span>
						<span className="text-2xl font-bold text-gray-900">
							¥{monthlyTotal.toLocaleString()}
						</span>
					</div>
					{!compact && (
						<div className="text-xs text-gray-500 mt-1 text-right">
							年間: ¥{yearlyTotal.toLocaleString()}
						</div>
					)}
				</div>

				{/* アクティブなサブスクリプション */}
				{activeItems.length > 0 && (
					<div className="mb-6">
						<h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
							<div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
							アクティブ ({activeItems.length}件)
						</h4>
						<div className="space-y-3">
							{activeItems.map((item) => {
								const paymentDisplay = getPaymentDateDisplay(
									item.nextPaymentDate,
									item.daysUntilPayment,
								);
								return (
									<div
										key={`active-${item.id}`}
										className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
									>
										<div className="flex-1 min-w-0">
											<div className="flex items-center space-x-2">
												<span className="font-medium text-gray-900 truncate">
													{item.name}
												</span>
												<span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
													{getFrequencyLabel(item.frequency)}
												</span>
											</div>
											{!compact && (
												<div
													className={`text-xs mt-1 ${paymentDisplay.colorClass}`}
												>
													{paymentDisplay.text}
												</div>
											)}
										</div>
										<div className="text-right ml-4">
											<div className="font-semibold text-gray-900">
												¥{item.amount.toLocaleString()}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					</div>
				)}

				{/* 停止中のサブスクリプション */}
				{inactiveItems.length > 0 && (
					<div className="mb-4">
						<h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
							<div className="w-2 h-2 bg-gray-400 rounded-full mr-2" />
							停止中 ({inactiveItems.length}件)
						</h4>
						<div className="space-y-2">
							{inactiveItems.map((item) => (
								<div
									key={`inactive-${item.id}`}
									className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md opacity-60"
								>
									<div className="flex-1 min-w-0">
										<div className="flex items-center space-x-2">
											<span className="font-medium text-gray-700 truncate">
												{item.name}
											</span>
											<span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
												停止中
											</span>
										</div>
									</div>
									<div className="text-right ml-4">
										<div className="font-semibold text-gray-600 line-through">
											¥{item.amount.toLocaleString()}
										</div>
									</div>
								</div>
							))}
						</div>
					</div>
				)}

				{/* データがない場合の表示 */}
				{activeItems.length === 0 && inactiveItems.length === 0 && (
					<div className="text-center py-8">
						<svg
							className="mx-auto h-12 w-12 text-gray-400"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
							/>
						</svg>
						<h3 className="mt-2 text-sm font-medium text-gray-900">
							サブスクリプションがありません
						</h3>
						<p className="mt-1 text-sm text-gray-500">
							新しいサブスクリプションを追加して管理を始めましょう
						</p>
						<div className="mt-4">
							<Link
								to="/subscriptions"
								className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
							>
								<svg
									className="w-4 h-4 mr-2"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
								サブスクを追加
							</Link>
						</div>
					</div>
				)}

				{/* フッター（管理リンク） */}
				{(activeItems.length > 0 || inactiveItems.length > 0) && (
					<div className="pt-4 border-t border-gray-200">
						<Link
							to="/subscriptions"
							className="w-full flex items-center justify-center px-4 py-2 text-sm text-blue-600 hover:text-blue-800 font-medium hover:bg-blue-50 rounded-md transition-colors"
						>
							<svg
								className="w-4 h-4 mr-2"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
								/>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
								/>
							</svg>
							すべてのサブスクを管理
						</Link>
					</div>
				)}
			</div>
		</div>
	);
}
