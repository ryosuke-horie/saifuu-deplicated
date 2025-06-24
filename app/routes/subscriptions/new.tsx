import { data, redirect } from "react-router";
import { z } from "zod";
import { insertSubscriptionSchema } from "../../../db/schema";
import { SubscriptionFormNative } from "../../components/subscriptions/subscription-form-native";
import type { Route } from "./+types/new";

/**
 * サブスクリプション新規作成ページ
 *
 * React Router v7 Native Formsを使用したサブスクリプション作成フォーム
 */

// フォームバリデーション用のスキーマ（サーバーサイド）
const subscriptionFormSchema = insertSubscriptionSchema.extend({
	nextPaymentDate: z
		.string()
		.min(1, "次回支払日を入力してください")
		.refine(
			(date) => {
				const parsed = new Date(date);
				const today = new Date();
				today.setHours(0, 0, 0, 0);
				return parsed >= today;
			},
			{
				message: "次回支払日は今日以降の日付を選択してください",
			},
		),
});

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();

	// FormDataから値を抽出
	const rawData = {
		name: formData.get("name"),
		amount: Number(formData.get("amount")),
		frequency: formData.get("frequency"),
		nextPaymentDate: formData.get("nextPaymentDate"),
		description: formData.get("description") || null,
	};

	// バリデーション
	const result = subscriptionFormSchema.safeParse(rawData);

	if (!result.success) {
		return data(
			{ errors: result.error.flatten().fieldErrors },
			{ status: 400 },
		);
	}

	try {
		// API呼び出し
		const url = new URL(request.url);
		const response = await fetch(`${url.origin}/api/subscriptions/create`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(result.data),
		});

		if (!response.ok) {
			const errorData = (await response.json()) as { error?: string };
			throw new Error(
				errorData.error || "サブスクリプションの作成に失敗しました",
			);
		}

		// 成功時はサブスクリプション一覧にリダイレクト
		return redirect("/subscriptions");
	} catch (error) {
		console.error("Subscription creation error:", error);
		return data(
			{
				errors: {
					_form: [
						error instanceof Error
							? error.message
							: "予期しないエラーが発生しました",
					],
				},
			},
			{ status: 500 },
		);
	}
}

export default function NewSubscriptionPage({
	actionData,
}: Route.ComponentProps) {
	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<div className="bg-white shadow-sm rounded-lg p-6">
				<SubscriptionFormNative actionData={actionData} />
			</div>
		</div>
	);
}
