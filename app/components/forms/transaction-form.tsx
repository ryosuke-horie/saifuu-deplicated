import { useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import {
	FIXED_EXPENSE_CATEGORIES,
	FIXED_INCOME_CATEGORIES,
} from "../../constants/fixed-categories";
import type { CreateTransactionRequest, TransactionType } from "../../types";

/**
 * 支出/収入登録フォームコンポーネント
 *
 * 設計方針:
 * - React Router v7のネイティブフォーム実装
 * - サーバーサイドバリデーションとクライアントサイドUX
 * - モバイルファーストのレスポンシブデザイン
 * - リアルタイムフィードバック
 * - 金額入力は3桁カンマ表示対応
 * - 固定カテゴリによる即座な表示
 */

interface TransactionFormProps {
	type: TransactionType;
	defaultValues?: Partial<CreateTransactionRequest>;
}

export function TransactionForm({ type, defaultValues }: TransactionFormProps) {
	// React Router v7のネイティブフォーム用の状態管理
	const [amount, setAmount] = useState<string>(
		defaultValues?.amount?.toString() || "",
	);
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
		defaultValues?.categoryId?.toString() || "",
	);
	const [transactionDate, setTransactionDate] = useState<string>(
		defaultValues?.transactionDate || new Date().toISOString().split("T")[0],
	);
	const [description, setDescription] = useState<string>(
		defaultValues?.description || "",
	);
	const [paymentMethod, setPaymentMethod] = useState<string>(
		defaultValues?.paymentMethod || "",
	);

	// React Router v7のフック
	const actionData = useActionData<{
		errors?: {
			amount?: string[];
			categoryId?: string[];
			transactionDate?: string[];
			description?: string[];
			paymentMethod?: string[];
			general?: string[];
		};
	}>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	// ボタン活性化条件（必須項目のチェック）
	const isFormReady =
		amount &&
		Number.parseFloat(amount) > 0 &&
		selectedCategoryId &&
		transactionDate;

	// 固定カテゴリリストを使用（Issue #120対応）
	// APIへの依存を解消し、即座に表示可能
	const fixedCategories =
		type === "expense" ? FIXED_EXPENSE_CATEGORIES : FIXED_INCOME_CATEGORIES;

	// 金額入力の3桁カンマ表示処理
	const formatAmount = (value: string) => {
		const numValue = Number.parseFloat(value);
		// 数値でない場合や0以下の場合は空文字を返す
		if (!numValue || numValue <= 0) return "";
		return numValue.toLocaleString("ja-JP");
	};

	return (
		<Form method="post" className="space-y-6 max-w-md mx-auto p-4">
			{/* 取引種別を隠しフィールドで送信 */}
			<input type="hidden" name="type" value={type} />
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
						type="number"
						id="amount"
						name="amount"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="0"
						className={`w-full px-3 py-2 border rounded-md text-right text-gray-900 bg-white ${
							actionData?.errors?.amount
								? "border-red-500 focus:border-red-500 focus:ring-red-500"
								: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
						} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
					/>
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<span className="text-gray-500 text-sm">¥</span>
					</div>
				</div>
				{amount && Number.parseFloat(amount) > 0 && (
					<p className="text-xs text-gray-500 text-right">
						{formatAmount(amount)}円
					</p>
				)}
				{actionData?.errors?.amount && (
					<p className="text-sm text-red-600">{actionData.errors.amount[0]}</p>
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
					id="categoryId"
					name="categoryId"
					value={selectedCategoryId}
					onChange={(e) => setSelectedCategoryId(e.target.value)}
					className={`w-full px-3 py-2 border rounded-md ${
						actionData?.errors?.categoryId
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				>
					<option value="">カテゴリを選択してください</option>
					{fixedCategories.map((category) => (
						<option key={category.id} value={category.id}>
							{category.name}
						</option>
					))}
				</select>
				{actionData?.errors?.categoryId && (
					<p className="text-sm text-red-600">
						{actionData.errors.categoryId[0]}
					</p>
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
					type="date"
					id="transactionDate"
					name="transactionDate"
					value={transactionDate}
					onChange={(e) => setTransactionDate(e.target.value)}
					className={`w-full px-3 py-2 border rounded-md ${
						actionData?.errors?.transactionDate
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				/>
				{actionData?.errors?.transactionDate && (
					<p className="text-sm text-red-600">
						{actionData.errors.transactionDate[0]}
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
					id="description"
					name="description"
					value={description}
					onChange={(e) => setDescription(e.target.value)}
					rows={3}
					placeholder="取引の詳細を入力してください（任意）"
					className={`w-full px-3 py-2 border rounded-md resize-none ${
						actionData?.errors?.description
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				/>
				{actionData?.errors?.description && (
					<p className="text-sm text-red-600">
						{actionData.errors.description[0]}
					</p>
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
					id="paymentMethod"
					name="paymentMethod"
					value={paymentMethod}
					onChange={(e) => setPaymentMethod(e.target.value)}
					className={`w-full px-3 py-2 border rounded-md ${
						actionData?.errors?.paymentMethod
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
				{actionData?.errors?.paymentMethod && (
					<p className="text-sm text-red-600">
						{actionData.errors.paymentMethod[0]}
					</p>
				)}
			</div>

			{/* 一般的なエラーメッセージ */}
			{actionData?.errors?.general && (
				<div className="bg-red-50 border border-red-200 rounded-md p-3">
					<p className="text-sm text-red-600">{actionData.errors.general[0]}</p>
				</div>
			)}

			{/* 送信ボタン */}
			<div className="pt-4">
				<button
					type="submit"
					disabled={isSubmitting || !isFormReady}
					className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
						isSubmitting || !isFormReady
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
		</Form>
	);
}
