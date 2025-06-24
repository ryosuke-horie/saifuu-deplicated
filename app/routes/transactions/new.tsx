import type { ActionFunctionArgs, MetaFunction } from "react-router";
import { data, redirect, useSearchParams } from "react-router";
import { TransactionFormNative } from "../../components/forms/transaction-form-native";
import { PageHeader } from "../../components/layout/page-header";
import { createTransactionRequestSchema } from "../../lib/schemas/api-responses";
import type { TransactionType } from "../../types";

export const meta: MetaFunction = () => {
	return [
		{ title: "取引登録 | Saifuu" },
		{ name: "description", content: "新しい収入・支出を登録するページです。" },
	];
};

export async function action({ request }: ActionFunctionArgs) {
	// React Router v7 Native Formsからの送信をハンドル
	const formData = await request.formData();
	
	// FormDataから値を取得
	const rawData = {
		type: formData.get("type") as "income" | "expense",
		amount: Number(formData.get("amount")),
		categoryId: Number(formData.get("categoryId")),
		transactionDate: formData.get("transactionDate") as string,
		description: formData.get("description") as string,
		paymentMethod: formData.get("paymentMethod") as string,
	};

	// Zodスキーマでバリデーション
	const result = createTransactionRequestSchema.safeParse(rawData);
	
	if (!result.success) {
		// バリデーションエラーの場合、エラー情報を返す
		return data(
			{ errors: result.error.flatten().fieldErrors },
			{ status: 400 }
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
				{ status: response.status }
			);
		}

		// 成功時は取引一覧ページにリダイレクト
		return redirect("/transactions");
	} catch (error) {
		console.error("取引作成エラー:", error);
		return data(
			{ errors: { general: ["ネットワークエラーが発生しました"] } },
			{ status: 500 }
		);
	}
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
				{/* React Router v7 Native Forms使用 */}
				<div className="bg-white shadow-sm rounded-lg">
					<TransactionFormNative type={type} />
				</div>
			</div>
		</>
	);
}
