import { useState } from "react";
import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "react-router";
import { Link, redirect, useLoaderData } from "react-router";
import { TransactionForm } from "../../components/forms/transaction-form";
import type { ApiTransaction } from "../../lib/schemas/api-responses";

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	const transaction = data?.transaction;
	return [
		{ title: `取引詳細: ${transaction?.description || "取引"} | Saifuu` },
		{
			name: "description",
			content: "取引の詳細情報を表示・編集するページです。",
		},
	];
};

export async function loader({
	params,
}: LoaderFunctionArgs): Promise<{ transaction: ApiTransaction }> {
	const { id } = params;

	if (!id) {
		throw new Response("取引IDが指定されていません", { status: 400 });
	}

	try {
		// 取引詳細APIを呼び出し
		const response = await fetch(
			`${process.env.NODE_ENV === "development" ? "http://localhost:5173" : ""}/api/transactions/${id}`,
		);

		if (!response.ok) {
			throw new Response("取引が見つかりません", { status: 404 });
		}

		const data = await response.json();
		return {
			transaction: data.data, // APIレスポンスのdataフィールドから取引データを取得
		};
	} catch (error) {
		throw new Response("取引の取得に失敗しました", { status: 500 });
	}
}

export async function action({ request, params }: ActionFunctionArgs) {
	const { id } = params;
	const formData = await request.formData();
	const intent = formData.get("intent");

	if (intent === "delete") {
		// 削除処理
		try {
			const response = await fetch(
				`${process.env.NODE_ENV === "development" ? "http://localhost:5173" : ""}/api/transactions/${id}/delete`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				return redirect("/transactions");
			}
		} catch (error) {
			// エラーハンドリング
		}
	}

	// 編集の場合は更新後に詳細ページに戻る
	return redirect(`/transactions/${id}`);
}

export default function TransactionDetailPage() {
	const { transaction } = useLoaderData<typeof loader>();
	const [isEditing, setIsEditing] = useState(false);

	if (isEditing) {
		return (
			<div className="min-h-screen bg-gray-50">
				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
					<div className="mb-6 flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">取引編集</h1>
							<p className="mt-2 text-sm text-gray-600">取引情報を編集します</p>
						</div>
						<button
							type="button"
							onClick={() => setIsEditing(false)}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
						>
							キャンセル
						</button>
					</div>

					<div className="bg-white shadow-sm rounded-lg">
						<TransactionForm
							type={transaction.type}
							defaultValues={{
								amount: transaction.amount,
								categoryId: transaction.categoryId,
								description: transaction.description,
								transactionDate: transaction.transactionDate,
								paymentMethod: transaction.paymentMethod,
								type: transaction.type,
							}}
							onSubmit={async (data) => {
								try {
									// 取引更新API呼び出し
									const response = await fetch(
										`/api/transactions/${transaction.id}`,
										{
											method: "PUT",
											headers: {
												"Content-Type": "application/json",
											},
											body: JSON.stringify(data),
										},
									);
									if (response.ok) {
										setIsEditing(false);
										// ページをリロードして最新データを表示
										window.location.reload();
									}
								} catch (error) {
									console.error("更新エラー:", error);
								}
							}}
						/>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<Link
						to="/transactions"
						className="text-sm font-medium text-indigo-600 hover:text-indigo-500 mb-4 inline-block"
					>
						← 取引一覧に戻る
					</Link>
					<div className="flex items-center justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900">取引詳細</h1>
							<p className="mt-2 text-sm text-gray-600">取引の詳細情報</p>
						</div>
						<div className="flex space-x-3">
							<button
								type="button"
								onClick={() => setIsEditing(true)}
								className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
							>
								編集
							</button>
						</div>
					</div>
				</div>

				<div className="bg-white shadow-sm rounded-lg">
					<div className="px-6 py-8">
						<dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
							<div>
								<dt className="text-sm font-medium text-gray-500">説明</dt>
								<dd className="mt-1 text-lg text-gray-900">
									{transaction.description}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">金額</dt>
								<dd
									className={`mt-1 text-lg font-semibold ${
										transaction.type === "income"
											? "text-green-600"
											: "text-red-600"
									}`}
								>
									{transaction.type === "income" ? "+" : "-"}¥
									{transaction.amount.toLocaleString()}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">種別</dt>
								<dd className="mt-1 text-lg text-gray-900">
									{transaction.type === "income" ? "収入" : "支出"}
								</dd>
							</div>
							<div>
								<dt className="text-sm font-medium text-gray-500">日付</dt>
								<dd className="mt-1 text-lg text-gray-900">
									{new Date(transaction.transactionDate).toLocaleDateString(
										"ja-JP",
									)}
								</dd>
							</div>
							{transaction.category && (
								<div className="sm:col-span-2">
									<dt className="text-sm font-medium text-gray-500">
										カテゴリ
									</dt>
									<dd className="mt-1 text-lg text-gray-900 flex items-center">
										<span className="mr-2">{transaction.category.icon}</span>
										{transaction.category.name}
									</dd>
								</div>
							)}
							{transaction.tags && transaction.tags.length > 0 && (
								<div className="sm:col-span-2">
									<dt className="text-sm font-medium text-gray-500">タグ</dt>
									<dd className="mt-1">
										<div className="flex flex-wrap gap-2">
											{transaction.tags.map((tag: string) => (
												<span
													key={tag}
													className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
												>
													{tag}
												</span>
											))}
										</div>
									</dd>
								</div>
							)}
						</dl>
					</div>
				</div>
			</div>
		</div>
	);
}
