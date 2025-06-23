import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { redirect, useSearchParams } from "react-router";
import { TransactionForm } from "../../components/forms/transaction-form";
import { PageHeader } from "../../components/layout/page-header";
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
		<>
			{/* ページヘッダー */}
			<PageHeader title="取引登録" description="新しい収入・支出を登録します" />

			<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
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
		</>
	);
}
