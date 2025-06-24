import { useState } from "react";
import type {
	ActionFunctionArgs,
	LoaderFunctionArgs,
	MetaFunction,
} from "react-router";
import {
	Link,
	data,
	redirect,
	useLoaderData,
	useSearchParams,
} from "react-router";
import { TransactionFormNative } from "../../components/forms/transaction-form-native";
import { PageHeader } from "../../components/layout/page-header";
import { createTransactionRequestSchema } from "../../lib/schemas/api-responses";
import type {
	ApiTransaction,
	TransactionDetailResponse,
} from "../../lib/schemas/api-responses";
import type { TransactionType } from "../../types";

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

		const data = (await response.json()) as TransactionDetailResponse;
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
	} else {
		// 編集処理（React Router v7 Native Forms）
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
				{ status: 400 },
			);
		}

		try {
			// 取引更新API呼び出し
			const response = await fetch(
				new URL(`/api/transactions/${id}`, request.url),
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(result.data),
				},
			);

			if (!response.ok) {
				return data(
					{ errors: { general: ["取引の更新に失敗しました"] } },
					{ status: response.status },
				);
			}

			// 成功時は詳細ページに戻る（編集モードを解除）
			return redirect(`/transactions/${id}`);
		} catch (error) {
			console.error("取引更新エラー:", error);
			return data(
				{ errors: { general: ["ネットワークエラーが発生しました"] } },
				{ status: 500 },
			);
		}
	}

	// フォールバック
	return redirect(`/transactions/${id}`);
}

export default function TransactionDetailPage() {
	const { transaction } = useLoaderData<typeof loader>();
	const [searchParams] = useSearchParams();
	const isEditing = searchParams.get("edit") === "true";

	if (isEditing) {
		return (
			<>
				<PageHeader
					title="取引編集"
					description="取引情報を編集します"
					actions={
						<Link
							to={`/transactions/${transaction.id}`}
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
						>
							キャンセル
						</Link>
					}
				/>

				<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
					<div className="bg-white shadow-sm rounded-lg">
						<TransactionFormNative
							type={transaction.type as TransactionType}
							defaultValues={{
								amount: transaction.amount,
								categoryId: transaction.categoryId ?? undefined,
								description: transaction.description || undefined,
								transactionDate: transaction.transactionDate,
								paymentMethod: transaction.paymentMethod || undefined,
							}}
						/>
					</div>
				</div>
			</>
		);
	}

	return (
		<>
			<PageHeader
				title="取引詳細"
				description="取引の詳細情報"
				actions={
					<div className="flex space-x-3">
						<Link
							to="/transactions"
							className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
						>
							← 一覧に戻る
						</Link>
						<Link
							to={`/transactions/${transaction.id}?edit=true`}
							className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700"
						>
							編集
						</Link>
					</div>
				}
			/>

			<div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
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
							{transaction.categoryId && (
								<div className="sm:col-span-2">
									<dt className="text-sm font-medium text-gray-500">
										カテゴリID
									</dt>
									<dd className="mt-1 text-lg text-gray-900">
										{transaction.categoryId}
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
		</>
	);
}
