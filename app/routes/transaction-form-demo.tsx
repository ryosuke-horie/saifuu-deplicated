import { TransactionForm } from "../components/forms";
import type { CreateTransactionRequest } from "../types";

/**
 * TransactionFormのデモページ
 *
 * 設計方針:
 * - フォームコンポーネントの動作確認用
 * - 支出と収入の両方のフォームを表示
 * - 実際のAPI連携なしでUIを確認
 */

export default function TransactionFormDemo() {
	// フォーム送信処理のモック
	const handleSubmit = async (data: CreateTransactionRequest) => {
		console.log("Form submitted:", data);
		alert(
			`${data.type === "expense" ? "支出" : "収入"}を登録しました:\n金額: ¥${data.amount.toLocaleString()}\nカテゴリID: ${data.categoryId}\n取引日: ${data.transactionDate}`,
		);
	};

	return (
		<div className="min-h-screen bg-gray-50 py-8">
			<div className="max-w-4xl mx-auto px-4">
				{/* ページタイトル */}
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-gray-900 mb-2">
						Transaction Form Demo
					</h1>
					<p className="text-gray-600">支出/収入登録フォームの動作確認</p>
				</div>

				{/* フォーム表示エリア */}
				<div className="grid md:grid-cols-2 gap-8">
					{/* 支出フォーム */}
					<div className="bg-white rounded-lg shadow-sm border">
						<div className="p-6">
							<TransactionForm
								type="expense"
								onSubmit={handleSubmit}
								defaultValues={{
									amount: 1000,
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
								onSubmit={handleSubmit}
								defaultValues={{
									amount: 50000,
									description: "給与",
								}}
							/>
						</div>
					</div>
				</div>

				{/* 使用方法の説明 */}
				<div className="mt-8 bg-blue-50 rounded-lg p-6">
					<h2 className="text-lg font-semibold text-blue-900 mb-3">使用方法</h2>
					<ul className="text-sm text-blue-800 space-y-2">
						<li>• 左側は支出フォーム、右側は収入フォーム</li>
						<li>• 金額は3桁カンマで表示されます</li>
						<li>• カテゴリはタイプに応じて絞り込まれます</li>
						<li>• リアルタイムバリデーションが動作します</li>
						<li>• フォーム送信時はアラートで内容を確認できます</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
