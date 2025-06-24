import { Form, useActionData, useNavigation } from "react-router";
import { useState, useMemo } from "react";
import {
	FIXED_EXPENSE_CATEGORIES,
	FIXED_INCOME_CATEGORIES,
} from "../../constants/fixed-categories";
import type { TransactionType } from "../../types";

/**
 * 支出/収入登録フォームコンポーネント (React Router v7 Native Forms)
 *
 * 設計方針:
 * - React Router v7のネイティブForm機能を使用
 * - FormDataベースの自然なHTML仕様準拠
 * - サーバーアクションとの完全統合
 * - Progressive Enhancementサポート
 * - リアルタイム機能は最小限のuseStateで実装
 */

interface TransactionFormNativeProps {
	type: TransactionType;
	// React Router v7では、onSubmitの代わりにaction関数を使用
	defaultValues?: {
		amount?: number;
		categoryId?: number;
		description?: string;
		transactionDate?: string;
		paymentMethod?: string;
	};
}

export function TransactionFormNative({
	type,
	defaultValues,
}: TransactionFormNativeProps) {
	// React Router v7のhooks
	const actionData = useActionData<{
		errors?: {
			amount?: string[];
			categoryId?: string[];
			transactionDate?: string[];
			description?: string[];
			paymentMethod?: string[];
		};
	}>();
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	// リアルタイム機能のための最小限の状態管理
	const [amount, setAmount] = useState<string>(defaultValues?.amount?.toString() || "");
	const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
		defaultValues?.categoryId?.toString() || ""
	);

	// 固定カテゴリリストを使用（Issue #120対応）
	const fixedCategories =
		type === "expense" ? FIXED_EXPENSE_CATEGORIES : FIXED_INCOME_CATEGORIES;

	// 金額の3桁カンマ表示処理（現在の実装を保持）
	const formatAmount = (value: number) => {
		if (!value || value <= 0) return "";
		return value.toLocaleString("ja-JP");
	};

	// リアルタイム金額フォーマット表示
	const formattedAmount = useMemo(() => {
		const numAmount = parseFloat(amount);
		if (isNaN(numAmount) || numAmount <= 0) return "";
		return formatAmount(numAmount);
	}, [amount]);

	// ボタン活性化条件（現在の実装を保持）
	const isFormReady = amount && parseFloat(amount) > 0;

	return (
		<Form method="post" className="space-y-6 max-w-md mx-auto p-4">
			{/* フォームタイプを隠しフィールドで送信 */}
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
						name="amount"
						id="amount"
						value={amount}
						onChange={(e) => setAmount(e.target.value)}
						placeholder="0"
						required
						min="1"
						step="1"
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
				{formattedAmount && (
					<p className="text-xs text-gray-500 text-right">
						{formattedAmount}円
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
					name="categoryId"
					id="categoryId"
					value={selectedCategoryId}
					onChange={(e) => setSelectedCategoryId(e.target.value)}
					required
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
					<p className="text-sm text-red-600">{actionData.errors.categoryId[0]}</p>
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
					name="transactionDate"
					id="transactionDate"
					defaultValue={defaultValues?.transactionDate || new Date().toISOString().split("T")[0]}
					required
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
					name="description"
					id="description"
					rows={3}
					defaultValue={defaultValues?.description || ""}
					placeholder="取引の詳細を入力してください（任意）"
					className={`w-full px-3 py-2 border rounded-md resize-none ${
						actionData?.errors?.description
							? "border-red-500 focus:border-red-500 focus:ring-red-500"
							: "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
					} focus:outline-none focus:ring-2 focus:ring-opacity-50`}
				/>
				{actionData?.errors?.description && (
					<p className="text-sm text-red-600">{actionData.errors.description[0]}</p>
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
					name="paymentMethod"
					id="paymentMethod"
					defaultValue={defaultValues?.paymentMethod || ""}
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
					<p className="text-sm text-red-600">{actionData.errors.paymentMethod[0]}</p>
				)}
			</div>

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