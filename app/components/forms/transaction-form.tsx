import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useCategoriesByType } from "../../lib/hooks/use-categories";
import { createTransactionRequestSchema } from "../../lib/schemas/api-responses";
import type { CreateTransactionRequest, TransactionType } from "../../types";

/**
 * 支出/収入登録フォームコンポーネント
 *
 * 設計方針:
 * - React Hook Form + Zodで型安全なフォーム実装
 * - モバイルファーストのレスポンシブデザイン
 * - リアルタイムバリデーション
 * - 金額入力は3桁カンマ表示対応
 * - カテゴリ選択はAPI連携
 */

interface TransactionFormProps {
	type: TransactionType;
	onSubmit: (data: CreateTransactionRequest) => void | Promise<void>;
	defaultValues?: Partial<CreateTransactionRequest>;
	isSubmitting?: boolean;
}

export function TransactionForm({
	type,
	onSubmit,
	defaultValues,
	isSubmitting = false,
}: TransactionFormProps) {
	// React Hook Formの設定
	const {
		register,
		handleSubmit,
		formState: { errors, isDirty, isValid },
		watch,
		setValue,
	} = useForm<CreateTransactionRequest>({
		resolver: zodResolver(createTransactionRequestSchema),
		defaultValues: {
			type,
			amount: 0,
			categoryId: undefined,
			description: "",
			transactionDate: new Date().toISOString().split("T")[0],
			paymentMethod: "",
			...defaultValues,
		},
	});

	// カテゴリデータを取得
	const { data: categoriesResponse, isLoading: categoriesLoading } =
		useCategoriesByType(type, {
			// クライアント側でのみ実行されるようにする（SSR時の問題を回避）
			enabled: typeof window !== 'undefined',
		} as any);

	// 金額フィールドの監視（3桁カンマ表示用）
	const amountValue = watch("amount");

	// 金額入力の3桁カンマ表示処理
	const formatAmount = (value: number) => {
		return value.toLocaleString("ja-JP");
	};

	// フォーム送信処理
	const onFormSubmit = async (data: CreateTransactionRequest) => {
		try {
			await onSubmit(data);
		} catch (error) {
			console.error("Form submission error:", error);
		}
	};

	return (
		<form
			onSubmit={handleSubmit(onFormSubmit)}
			className="space-y-6 max-w-md mx-auto p-4"
		>
			{/* フォームタイトル */}
			<div className="text-center">
				<h2 className="text-2xl font-bold text-gray-900">
					{type === "expense" ? "支出を登録" : "収入を登録"}
				</h2>
			</div>

			{/* 金額入力 */}
			<div className="space-y-2">
				<label
					htmlFor="amount"
					className="block text-sm font-medium text-gray-700"
				>
					金額 <span className="text-red-500">*</span>
				</label>
				<div className="relative">
					<input
						{...register("amount", {
							valueAsNumber: true,
						})}
						type="number"
						id="amount"
						placeholder="0"
						className={`w-full px-3 py-2 border rounded-md text-right text-gray-900 bg-white ${
							errors.amount
								? "border-red-500 focus:border-red-500 focus:ring-red-500"
								: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
						} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
					/>
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<span className="text-gray-500 text-sm">¥</span>
					</div>
				</div>
				{amountValue >= 0 && (
					<p className="text-xs text-gray-500 text-right">
						{formatAmount(amountValue)}円
					</p>
				)}
				{errors.amount && (
					<p className="text-sm text-red-600">{errors.amount.message}</p>
				)}
			</div>

			{/* カテゴリ選択 */}
			<div className="space-y-2">
				<label
					htmlFor="categoryId"
					className="block text-sm font-medium text-gray-700"
				>
					カテゴリ <span className="text-red-500">*</span>
				</label>
				<select
					{...register("categoryId", {
						valueAsNumber: true,
						setValueAs: (value) => (value === "" ? undefined : value),
					})}
					id="categoryId"
					disabled={categoriesLoading}
					className={`w-full px-3 py-2 border rounded-md ${
						errors.categoryId
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				>
					<option value="">カテゴリを選択してください</option>
					{categoriesResponse?.data.map((category) => (
						<option key={category.id} value={category.id}>
							{category.icon && `${category.icon} `}
							{category.name}
						</option>
					))}
				</select>
				{errors.categoryId && (
					<p className="text-sm text-red-600">{errors.categoryId.message}</p>
				)}
			</div>

			{/* 取引日 */}
			<div className="space-y-2">
				<label
					htmlFor="transactionDate"
					className="block text-sm font-medium text-gray-700"
				>
					取引日 <span className="text-red-500">*</span>
				</label>
				<input
					{...register("transactionDate")}
					type="date"
					id="transactionDate"
					className={`w-full px-3 py-2 border rounded-md ${
						errors.transactionDate
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				/>
				{errors.transactionDate && (
					<p className="text-sm text-red-600">
						{errors.transactionDate.message}
					</p>
				)}
			</div>

			{/* 説明・メモ */}
			<div className="space-y-2">
				<label
					htmlFor="description"
					className="block text-sm font-medium text-gray-700"
				>
					説明・メモ
				</label>
				<textarea
					{...register("description")}
					id="description"
					rows={3}
					placeholder="取引の詳細を入力してください（任意）"
					className={`w-full px-3 py-2 border rounded-md resize-none ${
						errors.description
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				/>
				{errors.description && (
					<p className="text-sm text-red-600">{errors.description.message}</p>
				)}
			</div>

			{/* 支払い方法 */}
			<div className="space-y-2">
				<label
					htmlFor="paymentMethod"
					className="block text-sm font-medium text-gray-700"
				>
					支払い方法
				</label>
				<select
					{...register("paymentMethod")}
					id="paymentMethod"
					className={`w-full px-3 py-2 border rounded-md ${
						errors.paymentMethod
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				>
					<option value="">選択してください</option>
					<option value="cash">現金</option>
					<option value="credit_card">クレジットカード</option>
					<option value="debit_card">デビットカード</option>
					<option value="bank_transfer">銀行振込</option>
					<option value="electronic_money">電子マネー</option>
					<option value="other">その他</option>
				</select>
				{errors.paymentMethod && (
					<p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
				)}
			</div>

			{/* 送信ボタン */}
			<div className="pt-4">
				<button
					type="submit"
					disabled={isSubmitting || (!isDirty && !isValid)}
					className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
						isSubmitting || (!isDirty && !isValid)
							? "bg-gray-300 text-gray-500 cursor-not-allowed"
							: type === "expense"
								? "bg-red-600 hover:bg-red-700 text-white"
								: "bg-green-600 hover:bg-green-700 text-white"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50 ${
						type === "expense" ? "focus:ring-red-500" : "focus:ring-green-500"
					}`}
				>
					{isSubmitting
						? "登録中..."
						: type === "expense"
							? "支出を登録"
							: "収入を登録"}
				</button>
			</div>

			{/* キーボードショートカットのヒント */}
			<div className="text-xs text-gray-500 text-center space-y-1">
				<p>💡 ショートカット</p>
				<p>Tab: 次の項目へ移動 | Enter: フォーム送信</p>
			</div>
		</form>
	);
}
