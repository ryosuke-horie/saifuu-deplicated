import { TransactionForm } from "../components/forms";
import type { CreateTransactionRequest } from "../types";
import { redirectIfProduction } from "../utils/environment";

/**
 * TransactionFormのデモページ
 *
 * 設計方針:
 * - フォームコンポーネントの動作確認用
 * - 支出と収入の両方のフォームを表示
 * - 実際のAPI連携なしでUIを確認
 */

export default function TransactionFormDemo() {
	// 本番環境では404リダイレクト
	redirectIfProduction();
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
						支出・収入登録
					</h1>
					<p className="text-gray-600">
						支出や収入を記録して家計を管理しましょう
					</p>
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
						<li>• 登録内容は確認画面で最終確認できます</li>
					</ul>
				</div>
			</div>
		</div>
	);
}
