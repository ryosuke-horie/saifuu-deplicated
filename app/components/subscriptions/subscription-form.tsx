import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
	useCreateSubscription,
	useUpdateSubscription,
} from "../../lib/hooks/use-subscriptions";
import type { SelectSubscription } from "../../types";

/**
 * サブスクリプション登録・編集フォームコンポーネント
 *
 * 設計方針:
 * - React Hook Form + Zodによるバリデーション
 * - 新規登録と編集の両対応
 * - リアルタイムバリデーションとエラー表示
 * - 既存フォームパターンの踏襲（TransactionForm等）
 * - アクセシブルなフォーム設計
 * - モーダル内での使用を想定
 */

// フォームデータのスキーマ定義
const subscriptionFormSchema = z.object({
	name: z
		.string()
		.min(1, "サービス名を入力してください")
		.max(100, "サービス名は100文字以内で入力してください"),
	amount: z
		.number({
			required_error: "金額を入力してください",
			invalid_type_error: "有効な金額を入力してください",
		})
		.min(1, "金額は1円以上で入力してください")
		.max(1000000, "金額は100万円以下で入力してください"),
	frequency: z.enum(["daily", "weekly", "monthly", "yearly"], {
		required_error: "請求頻度を選択してください",
	}),
	nextPaymentDate: z
		.string()
		.min(1, "次回支払日を入力してください")
		.refine(
			(date) => {
				const parsed = new Date(date);
				return !Number.isNaN(parsed.getTime());
			},
			{
				message: "有効な日付を入力してください",
			},
		),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional(),
});

type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

export interface SubscriptionFormProps {
	/**
	 * 編集対象のサブスクリプション（新規登録の場合はundefined）
	 */
	subscription?: SelectSubscription;
	/**
	 * フォーム送信成功時のコールバック
	 */
	onSuccess?: () => void;
	/**
	 * フォームキャンセル時のコールバック
	 */
	onCancel?: () => void;
	/**
	 * フォームのコンパクト表示
	 */
	compact?: boolean;
}

// 請求頻度のオプション
const frequencyOptions = [
	{ value: "daily", label: "日次" },
	{ value: "weekly", label: "週次" },
	{ value: "monthly", label: "月次" },
	{ value: "yearly", label: "年次" },
] as const;

export function SubscriptionForm({
	subscription,
	onSuccess,
	onCancel,
	compact = false,
}: SubscriptionFormProps) {
	const isEdit = Boolean(subscription);

	// React Hook Formの設定
	const {
		register,
		handleSubmit,
		formState: { errors, isSubmitting, isDirty, isValid },
		watch,
		setValue,
		reset,
	} = useForm<SubscriptionFormData>({
		resolver: zodResolver(subscriptionFormSchema),
		defaultValues: {
			name: "",
			amount: 0,
			frequency: "monthly",
			nextPaymentDate: new Date().toISOString().split("T")[0],
			description: "",
		},
	});

	// ミューテーション hooks
	const createMutation = useCreateSubscription();
	const updateMutation = useUpdateSubscription();

	// 編集時のデフォルト値設定
	useEffect(() => {
		if (subscription) {
			reset({
				name: subscription.name,
				amount: subscription.amount,
				frequency: subscription.frequency as SubscriptionFormData["frequency"],
				nextPaymentDate: subscription.nextPaymentDate,
				description: subscription.description || "",
			});
		}
	}, [subscription, reset]);

	// フォーム送信処理
	const onSubmit = async (data: SubscriptionFormData) => {
		try {
			if (isEdit && subscription) {
				await updateMutation.mutateAsync({
					id: subscription.id,
					data: {
						name: data.name,
						amount: data.amount,
						frequency: data.frequency,
						nextPaymentDate: data.nextPaymentDate,
						description: data.description || null,
					},
				});
			} else {
				await createMutation.mutateAsync({
					name: data.name,
					amount: data.amount,
					frequency: data.frequency,
					nextPaymentDate: data.nextPaymentDate,
					description: data.description || null,
				});
			}

			onSuccess?.();
		} catch (error) {
			// エラーハンドリングはミューテーション内で行われる
			console.error("Subscription form submission error:", error);
		}
	};

	// 年間コストの計算（リアルタイム表示用）
	const watchedAmount = watch("amount");
	const watchedFrequency = watch("frequency");

	const calculateAnnualCost = () => {
		if (!watchedAmount || !watchedFrequency) return 0;

		const multipliers = {
			daily: 365,
			weekly: 52,
			monthly: 12,
			yearly: 1,
		};

		return watchedAmount * multipliers[watchedFrequency];
	};

	const annualCost = calculateAnnualCost();

	return (
		<form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

			{/* サービス名 */}
			<div>
				<label
					htmlFor="name"
					className="block text-sm font-medium text-gray-700"
				>
					サービス名 <span className="text-red-500">*</span>
				</label>
				<input
					{...register("name")}
					type="text"
					id="name"
					placeholder="例: Netflix, Spotify, Adobe Creative Cloud"
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
						errors.name
							? "border-red-300 focus:ring-red-500 focus:border-red-500"
							: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					}`}
				/>
				{errors.name && (
					<p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
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
							{...register("amount", { valueAsNumber: true })}
							type="number"
							id="amount"
							min="1"
							max="1000000"
							step="1"
							placeholder="0"
							className={`block w-full pl-7 pr-3 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
								errors.amount
									? "border-red-300 focus:ring-red-500 focus:border-red-500"
									: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
							}`}
						/>
					</div>
					{errors.amount && (
						<p className="mt-1 text-sm text-red-600">{errors.amount.message}</p>
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
						{...register("frequency")}
						id="frequency"
						className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
							errors.frequency
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
					{errors.frequency && (
						<p className="mt-1 text-sm text-red-600">
							{errors.frequency.message}
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
					{...register("nextPaymentDate")}
					type="date"
					id="nextPaymentDate"
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
						errors.nextPaymentDate
							? "border-red-300 focus:ring-red-500 focus:border-red-500"
							: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					}`}
				/>
				{errors.nextPaymentDate && (
					<p className="mt-1 text-sm text-red-600">
						{errors.nextPaymentDate.message}
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
					{...register("description")}
					id="description"
					rows={3}
					placeholder="サブスクリプションの詳細や注意事項など"
					className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
						errors.description
							? "border-red-300 focus:ring-red-500 focus:border-red-500"
							: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
					}`}
				/>
				{errors.description && (
					<p className="mt-1 text-sm text-red-600">
						{errors.description.message}
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

			{/* エラー表示 */}
			{(createMutation.error || updateMutation.error) && (
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
								{createMutation.error?.message ||
									updateMutation.error?.message ||
									"登録に失敗しました"}
							</p>
						</div>
					</div>
				</div>
			)}

			{/* ボタン */}
			<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
				<button
					type="button"
					onClick={onCancel}
					className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
				>
					キャンセル
				</button>
				<button
					type="submit"
					disabled={isSubmitting || !isDirty || !isValid}
					className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
						isSubmitting || !isDirty || !isValid
							? "bg-gray-400 cursor-not-allowed"
							: "bg-blue-600 hover:bg-blue-700"
					}`}
				>
					{isSubmitting ? "保存中..." : isEdit ? "更新" : "登録"}
				</button>
			</div>
		</form>
	);
}
