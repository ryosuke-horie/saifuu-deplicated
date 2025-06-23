import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { redirect, useSearchParams } from "react-router";
import { TransactionForm } from "../../components/forms/transaction-form";
import type { TransactionType } from "../../types";

export const meta: MetaFunction = () => {
	return [
		{ title: "取引登録 | Saifuu" },
		{ name: "description", content: "新しい収入・支出を登録するページです。" },
	];
};

export async function action({ request }: ActionFunctionArgs) {
	// TransactionFormからの送信をハンドル
	const formData = await request.formData();
	const type = formData.get("type") as "income" | "expense";

	// フォーム送信後は取引一覧にリダイレクト
	return redirect("/transactions");
}

export default function NewTransactionPage() {
	// URLパラメータから取引タイプを取得（デフォルトは支出）
	const [searchParams] = useSearchParams();
	const type = (searchParams.get("type") as TransactionType) || "expense";

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900">取引登録</h1>
					<p className="mt-2 text-sm text-gray-600">
						新しい収入・支出を登録します
					</p>
				</div>

				{/* TransactionFormコンポーネントを使用 */}
				<div className="bg-white shadow-sm rounded-lg">
					<TransactionForm
						type={type}
						onSubmit={async (data) => {
							try {
								// 取引作成API呼び出し
								const response = await fetch("/api/transactions", {
									method: "POST",
									headers: {
										"Content-Type": "application/json",
									},
									body: JSON.stringify(data),
								});
								if (response.ok) {
									// 成功時は取引一覧ページにリダイレクト
									window.location.href = "/transactions";
								}
							} catch (error) {
								console.error("登録エラー:", error);
							}
						}}
					/>
				</div>
			</div>
		</div>
	);
}
