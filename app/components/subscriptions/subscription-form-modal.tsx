import { useCallback, useMemo, useState } from "react";
import { z } from "zod";
import { useActiveCategories } from "../../lib/hooks/use-categories";
import type { SelectCategory, SelectSubscription } from "../../types";

/**
 * サブスクリプション新規登録・編集用のフォームモーダルコンポーネント
 *
 * 設計方針:
 * - 新規作成と編集の両方に対応する統一インターフェース
 * - DBスキーマに合わせたフォームフィールドとZodバリデーション
 * - リアルタイム年間コスト計算でユーザビリティ向上
 * - カテゴリを支出用のみに制限（サブスクは支出のため）
 * - 適切なエラーハンドリングとユーザーフィードバック
 */

// フォームデータのZodスキーマ
const subscriptionFormSchema = z.object({
	categoryId: z.number().min(1, "カテゴリを選択してください"),
	name: z
		.string()
		.min(1, "サービス名を入力してください")
		.max(100, "サービス名は100文字以内で入力してください"),
	amount: z
		.number()
		.int()
		.min(1, "金額は1円以上で入力してください")
		.max(1000000, "金額は100万円以下で入力してください"),
	frequency: z.enum(["daily", "weekly", "monthly", "yearly"], {
		required_error: "請求頻度を選択してください",
	}),
	nextPaymentDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, "正しい日付形式で入力してください"),
	description: z
		.string()
		.max(500, "説明は500文字以内で入力してください")
		.optional(),
});

export type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>;

export interface SubscriptionFormModalProps {
	/**
	 * モーダルの表示状態
	 */
	isOpen: boolean;
	/**
	 * モーダルを閉じるコールバック
	 */
	onClose: () => void;
	/**
	 * フォームのモード（新規作成または編集）
	 */
	mode: "create" | "edit";
	/**
	 * 編集時の初期データ（editモードの場合必須）
	 */
	initialData?: SelectSubscription;
	/**
	 * フォーム送信時のコールバック
	 */
	onSubmit: (data: SubscriptionFormData) => Promise<void>;
}

// 請求頻度のオプション
const frequencyOptions = [
	{ value: "daily", label: "日次" },
	{ value: "weekly", label: "週次" },
	{ value: "monthly", label: "月次" },
	{ value: "yearly", label: "年次" },
] as const;

export function SubscriptionFormModal({
	isOpen,
	onClose,
	mode,
	initialData,
	onSubmit,
}: SubscriptionFormModalProps) {
	// カテゴリ一覧を取得（支出用のみ）
	const {
		data: categoriesResponse,
		isLoading: isCategoriesLoading,
		error: categoriesError,
	} = useActiveCategories();

	// 支出用カテゴリのみをフィルタリング
	const expenseCategories = useMemo(() => {
		return categoriesResponse?.data.filter(
			(category) => category.type === "expense",
		);
	}, [categoriesResponse]);

	// フォーム状態の管理
	const [formData, setFormData] = useState<SubscriptionFormData>(() => ({
		categoryId: initialData?.categoryId || 0,
		name: initialData?.name || "",
		amount: initialData?.amount || 0,
		frequency:
			(initialData?.frequency as SubscriptionFormData["frequency"]) ||
			"monthly",
		nextPaymentDate:
			initialData?.nextPaymentDate || new Date().toISOString().split("T")[0],
		description: initialData?.description || "",
	}));

	const [errors, setErrors] = useState<
		Partial<Record<keyof SubscriptionFormData, string>>
	>({});
	const [isSubmitting, setIsSubmitting] = useState(false);

	// リアルタイム年間コスト計算
	const annualCost = useMemo(() => {
		if (!formData.amount || formData.amount <= 0 || !formData.frequency)
			return 0;

		const multipliers = {
			daily: 365,
			weekly: 52,
			monthly: 12,
			yearly: 1,
		} as const;

		return formData.amount * multipliers[formData.frequency];
	}, [formData.amount, formData.frequency]);

	// 月平均コストの計算
	const monthlyAverage = useMemo(() => {
		return annualCost > 0 ? Math.round(annualCost / 12) : 0;
	}, [annualCost]);

	// フォームフィールド更新用のハンドラー
	const updateField = useCallback(
		<K extends keyof SubscriptionFormData>(
			field: K,
			value: SubscriptionFormData[K],
		) => {
			setFormData((prev) => ({ ...prev, [field]: value }));
			// エラーがある場合はクリア
			if (errors[field]) {
				setErrors((prev) => ({ ...prev, [field]: undefined }));
			}
		},
		[errors],
	);

	// バリデーション関数
	const validateForm = useCallback(() => {
		try {
			subscriptionFormSchema.parse(formData);
			setErrors({});
			return true;
		} catch (error) {
			if (error instanceof z.ZodError) {
				const formErrors: Partial<Record<keyof SubscriptionFormData, string>> =
					{};
				for (const issue of error.issues) {
					const fieldName = issue.path[0] as keyof SubscriptionFormData;
					formErrors[fieldName] = issue.message;
				}
				setErrors(formErrors);
			}
			return false;
		}
	}, [formData]);

	// フォーム送信ハンドラー
	const handleSubmit = useCallback(
		async (e: React.FormEvent) => {
			e.preventDefault();

			if (!validateForm()) return;

			setIsSubmitting(true);
			try {
				await onSubmit(formData);
				onClose();
			} catch (error) {
				console.error("フォーム送信エラー:", error);
				// エラーハンドリングは親コンポーネントで処理される想定
			} finally {
				setIsSubmitting(false);
			}
		},
		[formData, validateForm, onSubmit, onClose],
	);

	// フォームリセット
	const resetForm = useCallback(() => {
		setFormData({
			categoryId: initialData?.categoryId || 0,
			name: initialData?.name || "",
			amount: initialData?.amount || 0,
			frequency:
				(initialData?.frequency as SubscriptionFormData["frequency"]) ||
				"monthly",
			nextPaymentDate:
				initialData?.nextPaymentDate || new Date().toISOString().split("T")[0],
			description: initialData?.description || "",
		});
		setErrors({});
		setIsSubmitting(false);
	}, [initialData]);

	// モーダルが閉じられた時にフォームをリセット
	const handleClose = useCallback(() => {
		resetForm();
		onClose();
	}, [resetForm, onClose]);

	// モーダルが表示されていない場合は何も表示しない
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-50 overflow-y-auto">
			{/* バックドロップ */}
			<div
				className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
				onClick={handleClose}
				onKeyDown={(e) => {
					if (e.key === "Escape") {
						handleClose();
					}
				}}
				role="button"
				tabIndex={0}
				aria-label="モーダルを閉じる"
			/>

			{/* モーダルコンテンツ */}
			<div className="flex min-h-full items-center justify-center p-4">
				<div className="relative w-full max-w-lg transform rounded-lg bg-white p-6 shadow-xl transition-all">
					{/* ヘッダー */}
					<div className="flex items-center justify-between mb-6">
						<h2 className="text-xl font-semibold text-gray-900">
							{mode === "create"
								? "新規サブスクリプション登録"
								: "サブスクリプション編集"}
						</h2>
						<button
							type="button"
							onClick={handleClose}
							className="rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							<span className="sr-only">閉じる</span>
							<svg className="h-6 w-6" fill="none" viewBox="0 0 24 24">
								<path
									stroke="currentColor"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</button>
					</div>

					{/* フォーム */}
					<form onSubmit={handleSubmit} className="space-y-4">
						{/* カテゴリ選択 */}
						<div>
							<label
								htmlFor="categoryId"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								カテゴリ <span className="text-red-500">*</span>
							</label>
							<select
								id="categoryId"
								value={formData.categoryId || ""}
								onChange={(e) =>
									updateField("categoryId", Number(e.target.value))
								}
								disabled={isCategoriesLoading}
								className={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
									errors.categoryId
										? "border-red-300 focus:ring-red-500 focus:border-red-500"
										: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
								}`}
							>
								<option value="">カテゴリを選択してください</option>
								{expenseCategories?.map((category) => (
									<option key={category.id} value={category.id}>
										{category.name}
									</option>
								))}
							</select>
							{errors.categoryId && (
								<p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
							)}
							{categoriesError && (
								<p className="mt-1 text-sm text-red-600">
									カテゴリの読み込みに失敗しました
								</p>
							)}
						</div>

						{/* サービス名 */}
						<div>
							<label
								htmlFor="name"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								サービス名 <span className="text-red-500">*</span>
							</label>
							<input
								type="text"
								id="name"
								value={formData.name}
								onChange={(e) => updateField("name", e.target.value)}
								placeholder="例: Netflix, Spotify, Adobe Creative Cloud"
								className={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
									errors.name
										? "border-red-300 focus:ring-red-500 focus:border-red-500"
										: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
								}`}
							/>
							{errors.name && (
								<p className="mt-1 text-sm text-red-600">{errors.name}</p>
							)}
						</div>

						{/* 金額と請求頻度 */}
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							{/* 金額 */}
							<div>
								<label
									htmlFor="amount"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									金額 <span className="text-red-500">*</span>
								</label>
								<div className="relative rounded-md shadow-sm">
									<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
										<span className="text-gray-500 sm:text-sm">¥</span>
									</div>
									<input
										type="number"
										id="amount"
										value={formData.amount || ""}
										onChange={(e) =>
											updateField("amount", Number(e.target.value))
										}
										min="1"
										max="1000000"
										step="1"
										placeholder="0"
										className={`w-full pl-7 pr-3 py-2 rounded-md border shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
											errors.amount
												? "border-red-300 focus:ring-red-500 focus:border-red-500"
												: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
										}`}
									/>
								</div>
								{errors.amount && (
									<p className="mt-1 text-sm text-red-600">{errors.amount}</p>
								)}
							</div>

							{/* 請求頻度 */}
							<div>
								<label
									htmlFor="frequency"
									className="block text-sm font-medium text-gray-700 mb-1"
								>
									請求頻度 <span className="text-red-500">*</span>
								</label>
								<select
									id="frequency"
									value={formData.frequency}
									onChange={(e) =>
										updateField(
											"frequency",
											e.target.value as SubscriptionFormData["frequency"],
										)
									}
									className={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
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
										{errors.frequency}
									</p>
								)}
							</div>
						</div>

						{/* 次回支払日 */}
						<div>
							<label
								htmlFor="nextPaymentDate"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								次回支払日 <span className="text-red-500">*</span>
							</label>
							<input
								type="date"
								id="nextPaymentDate"
								value={formData.nextPaymentDate}
								onChange={(e) => updateField("nextPaymentDate", e.target.value)}
								className={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
									errors.nextPaymentDate
										? "border-red-300 focus:ring-red-500 focus:border-red-500"
										: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
								}`}
							/>
							{errors.nextPaymentDate && (
								<p className="mt-1 text-sm text-red-600">
									{errors.nextPaymentDate}
								</p>
							)}
						</div>

						{/* 説明（オプション） */}
						<div>
							<label
								htmlFor="description"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								説明（オプション）
							</label>
							<textarea
								id="description"
								value={formData.description || ""}
								onChange={(e) => updateField("description", e.target.value)}
								rows={3}
								placeholder="サブスクリプションの詳細や注意事項など"
								className={`w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm ${
									errors.description
										? "border-red-300 focus:ring-red-500 focus:border-red-500"
										: "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
								}`}
							/>
							{errors.description && (
								<p className="mt-1 text-sm text-red-600">
									{errors.description}
								</p>
							)}
						</div>

						{/* 年間コスト表示 */}
						{annualCost > 0 && (
							<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
								<div className="flex items-center">
									<div className="text-blue-600">
										<svg
											className="w-5 h-5"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
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
											月平均: ¥{monthlyAverage.toLocaleString()}
										</p>
									</div>
								</div>
							</div>
						)}

						{/* ボタン */}
						<div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
							<button
								type="button"
								onClick={handleClose}
								disabled={isSubmitting}
								className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
								{isSubmitting
									? "保存中..."
									: mode === "create"
										? "登録"
										: "更新"}
							</button>
						</div>
					</form>
				</div>
			</div>
		</div>
	);
}
