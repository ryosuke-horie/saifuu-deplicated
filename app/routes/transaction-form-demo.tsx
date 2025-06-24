import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { data, redirect, useSearchParams } from "react-router";
import { TransactionForm } from "../components/forms";
import { createTransactionRequestSchema } from "../lib/schemas/api-responses";

export const meta: MetaFunction = () => {
	return [
		{ title: "取引登録デモ | Saifuu" },
		{
			name: "description",
			content:
				"取引登録フォームのデモページです。実際にD1データベースに保存されます。",
		},
	];
};

/**
 * TransactionFormのデモページ
 *
 * 設計方針:
 * - フォームコンポーネントの動作確認用
 * - 支出と収入の両方のフォームを表示
 * - React Router v7のnative form機能を使用
 * - 実際のAPI経由でD1データベースに保存
 */

export async function action({ request }: ActionFunctionArgs) {
	// React Router v7 Native Formsからの送信をハンドル
	const formData = await request.formData();

	// FormDataから値を取得
	const transactionInput = {
		type: formData.get("type") as "income" | "expense",
		amount: Number(formData.get("amount")),
		categoryId: Number(formData.get("categoryId")),
		transactionDate: formData.get("transactionDate") as string,
		description: formData.get("description") as string,
		paymentMethod: formData.get("paymentMethod") as string,
	};

	// Zodスキーマでバリデーション
	const result = createTransactionRequestSchema.safeParse(transactionInput);

	if (!result.success) {
		// バリデーションエラーの場合、エラー情報を返す
		return data(
			{ errors: result.error.flatten().fieldErrors },
			{ status: 400 },
		);
	}

	try {
		// 取引作成API呼び出し
		const response = await fetch(new URL("/api/transactions", request.url), {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(result.data),
		});

		if (!response.ok) {
			const errorData = await response.json();
			return data(
				{ errors: { general: ["取引の作成に失敗しました"] } },
				{ status: response.status },
			);
		}

		// 成功時は同じページにリダイレクト（デモ用なので）
		return redirect("/transaction-form-demo?success=true");
	} catch (error) {
		console.error("取引作成エラー:", error);
		return data(
			{ errors: { general: ["ネットワークエラーが発生しました"] } },
			{ status: 500 },
		);
	}
}

export default function TransactionFormDemo() {
	const [searchParams] = useSearchParams();
	const isSuccess = searchParams.get("success") === "true";

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				{/* ページタイトル */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						支出・収入登録
					</h1>
					<p className="text-gray-600">
						支出や収入を記録して家計を管理しましょう
					</p>
				</div>

				{/* 成功メッセージ */}
				{isSuccess && (
					<div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
						<div className="flex">
							<div className="flex-shrink-0">
								<svg
									className="h-5 w-5 text-green-400"
									viewBox="0 0 20 20"
									fill="currentColor"
								>
									<path
										fillRule="evenodd"
										d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<div className="ml-3">
								<p className="text-sm font-medium text-green-800">
									取引が正常に登録されました！データベースに保存されています。
								</p>
							</div>
						</div>
					</div>
				)}

				{/* フォーム表示エリア */}
				<div className="grid md:grid-cols-2 gap-8">
					{/* 支出フォーム */}
					<div className="bg-white rounded-lg shadow-sm border">
						<div className="p-6">
							<TransactionForm
								type="expense"
								defaultValues={{
									description: "ランチ代",
								}}
							/>
						</div>
					</div>

					{/* 収入フォーム */}
					<div className="bg-white rounded-lg shadow-sm border">
						<div className="p-6">
							<TransactionForm
								type="income"
								defaultValues={{
									description: "給与",
								}}
							/>
						</div>
					</div>
				</div>

				{/* 入力ガイド */}
				<div className="mt-8 bg-blue-50 rounded-lg p-6">
					<h2 className="text-lg font-semibold text-blue-900 mb-3">
						入力ガイド
					</h2>
					<ul className="text-sm text-blue-800 space-y-2">
						<li>• 支出と収入の種類に応じて適切なフォームを選択してください</li>
						<li>• 金額は数値のみ入力可能で、自動的に3桁区切りで表示されます</li>
						<li>• カテゴリは収入・支出に応じて適切な選択肢が表示されます</li>
						<li>
							•
							すべての項目は入力チェックが行われ、エラーがある場合は案内が表示されます
						</li>
						<li>• このページは実際にD1データベースに取引を保存します</li>
						<li>
							•
							登録成功後は同じページがリロードされ、新しい取引を続けて登録できます
						</li>
						<li>• 本格的な取引管理は /transactions で確認できます</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
