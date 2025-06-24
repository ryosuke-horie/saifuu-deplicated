import { useMemo, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import type { SelectSubscription } from "../../types";

/**
 * サブスクリプション登録・編集フォームコンポーネント (React Router v7 Native Forms)
 *
 * 設計方針:
 * - React Router v7のネイティブForm機能を使用
 * - FormDataベースの自然なHTML仕様準拠
 * - サーバーアクションとの完全統合
 * - Progressive Enhancementサポート
 * - リアルタイム年間コスト計算は最小限のuseStateで実装
 */

export interface SubscriptionFormNativeProps {
	/**
	 * 編集対象のサブスクリプション（新規登録の場合はundefined）
	 */
	subscription?: SelectSubscription;
	/**
	 * サーバーアクションからのエラーデータ
	 */
	actionData?: {
		errors?: {
			name?: string[];
			amount?: string[];
			frequency?: string[];
			nextPaymentDate?: string[];
			description?: string[];
			_form?: string[];
		};
	};
}

// 請求頻度のオプション
const frequencyOptions = [
	{ value: "daily", label: "日次" },
	{ value: "weekly", label: "週次" },
	{ value: "monthly", label: "月次" },
	{ value: "yearly", label: "年次" },
] as const;

export function SubscriptionFormNative({
	subscription,
	actionData,
}: SubscriptionFormNativeProps) {
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";
	const isEdit = Boolean(subscription);

	// リアルタイム年間コスト計算のための状態管理
	const [amount, setAmount] = useState<string>(
		subscription?.amount?.toString() || "",
	);
	const [frequency, setFrequency] = useState<string>(
		subscription?.frequency || "monthly",
	);

	// 年間コストの計算（リアルタイム表示用）
	const annualCost = useMemo(() => {
		const numAmount = Number(amount);
		if (!numAmount || numAmount <= 0 || !frequency) return 0;

		const multipliers = {
			daily: 365,
			weekly: 52,
			monthly: 12,
			yearly: 1,
		};

		return numAmount * multipliers[frequency as keyof typeof multipliers];
	}, [amount, frequency]);

	return (
		<Form method="post" className="space-y-6">
			{/* ヘッダー */}
			<div>
				<h3 className="text-lg font-semibold text-gray-900">
					{isEdit ? "サブスクリプション編集" : "新規サブスクリプション登録"}
				</h3>
				<p className="text-sm text-gray-600 mt-1">
					{isEdit
						? "サブスクリプション情報を編集してください"
						: "新しいサブスクリプションを登録してください"}
				</p>
			</div>

			{/* フォーム全体のエラー表示 */}
			{actionData?.errors?._form && (
				<div className="bg-red-50 border border-red-200 rounded-lg p-4">
					<div className="flex items-center">
						<div className="text-red-600">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm text-red-800">
								{actionData.errors._form[0]}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* サービス名 */}
			<div>
				<label
					htmlFor="name"
					className="block text-sm font-medium text-gray-700"
				>
					サービス名 <span className="text-red-500">*</span>
				</label>
				<input
					type="text"
					name="name"
					id="name"
					defaultValue={subscription?.name || ""}
					placeholder="例: Netflix, Spotify, Adobe Creative Cloud"
					required
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
						actionData?.errors?.name
							? "border-red-300 focus:ring-red-500 focus:border-red-500"
							: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					}`}
				/>
				{actionData?.errors?.name && (
					<p className="mt-1 text-sm text-red-600">
						{actionData.errors.name[0]}
					</p>
				)}
			</div>

			{/* 金額と請求頻度 */}
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<div>
					<label
						htmlFor="amount"
						className="block text-sm font-medium text-gray-700"
					>
						金額 <span className="text-red-500">*</span>
					</label>
					<div className="mt-1 relative rounded-md shadow-sm">
						<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
							<span className="text-gray-500 sm:text-sm">¥</span>
						</div>
						<input
							type="number"
							name="amount"
							id="amount"
							value={amount}
							onChange={(e) => setAmount(e.target.value)}
							min="1"
							max="1000000"
							step="1"
							placeholder="0"
							required
							className={`block w-full pl-7 pr-3 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
								actionData?.errors?.amount
									? "border-red-300 focus:ring-red-500 focus:border-red-500"
									: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
							}`}
						/>
					</div>
					{actionData?.errors?.amount && (
						<p className="mt-1 text-sm text-red-600">
							{actionData.errors.amount[0]}
						</p>
					)}
				</div>

				<div>
					<label
						htmlFor="frequency"
						className="block text-sm font-medium text-gray-700"
					>
						請求頻度 <span className="text-red-500">*</span>
					</label>
					<select
						name="frequency"
						id="frequency"
						value={frequency}
						onChange={(e) => setFrequency(e.target.value)}
						required
						className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
							actionData?.errors?.frequency
								? "border-red-300 focus:ring-red-500 focus:border-red-500"
								: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
						}`}
					>
						{frequencyOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
					{actionData?.errors?.frequency && (
						<p className="mt-1 text-sm text-red-600">
							{actionData.errors.frequency[0]}
						</p>
					)}
				</div>
			</div>

			{/* 次回支払日 */}
			<div>
				<label
					htmlFor="nextPaymentDate"
					className="block text-sm font-medium text-gray-700"
				>
					次回支払日 <span className="text-red-500">*</span>
				</label>
				<input
					type="date"
					name="nextPaymentDate"
					id="nextPaymentDate"
					defaultValue={
						subscription?.nextPaymentDate ||
						new Date().toISOString().split("T")[0]
					}
					required
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
						actionData?.errors?.nextPaymentDate
							? "border-red-300 focus:ring-red-500 focus:border-red-500"
							: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					}`}
				/>
				{actionData?.errors?.nextPaymentDate && (
					<p className="mt-1 text-sm text-red-600">
						{actionData.errors.nextPaymentDate[0]}
					</p>
				)}
			</div>

			{/* 説明（オプション） */}
			<div>
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700"
				>
					説明（オプション）
				</label>
				<textarea
					name="description"
					id="description"
					rows={3}
					defaultValue={subscription?.description || ""}
					placeholder="サブスクリプションの詳細や注意事項など"
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
						actionData?.errors?.description
							? "border-red-300 focus:ring-red-500 focus:border-red-500"
							: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					}`}
				/>
				{actionData?.errors?.description && (
					<p className="mt-1 text-sm text-red-600">
						{actionData.errors.description[0]}
					</p>
				)}
			</div>

			{/* 年間コスト表示 */}
			{annualCost > 0 && (
				<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
					<div className="flex items-center">
						<div className="text-blue-600">
							<svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
								<path
									fillRule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clipRule="evenodd"
								/>
							</svg>
						</div>
						<div className="ml-3">
							<p className="text-sm text-blue-800">
								<span className="font-medium">年間コスト予測:</span> ¥
								{annualCost.toLocaleString()}
							</p>
							<p className="text-xs text-blue-700 mt-1">
								月平均: ¥{Math.round(annualCost / 12).toLocaleString()}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* ボタン */}
			<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
				<button
					type="button"
					onClick={() => window.history.back()}
					className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={isSubmitting}
					className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
						isSubmitting
							? "bg-gray-400 cursor-not-allowed"
							: "bg-blue-600 hover:bg-blue-700"
					}`}
				>
					{isSubmitting ? "保存中..." : isEdit ? "更新" : "登録"}
				</button>
			</div>

			{/* キーボードショートカットのヒント */}
			<div className="text-xs text-gray-500 text-center space-y-1">
				<p>💡 ショートカット</p>
				<p>Tab: 次の項目へ移動 | Enter: フォーム送信</p>
			</div>
		</Form>
	);
}
