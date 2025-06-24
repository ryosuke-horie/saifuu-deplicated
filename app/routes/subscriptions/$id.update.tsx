import { data, redirect } from "react-router";
import { z } from "zod";
import { insertSubscriptionSchema } from "../../../db/schema";
import { SubscriptionFormNative } from "../../components/subscriptions/subscription-form-native";
import type { SelectSubscription } from "../../types";
import type { Route } from "./+types/$id.update";

/**
 * サブスクリプション編集ページ
 *
 * React Router v7 Native Formsを使用したサブスクリプション編集フォーム
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

export async function loader({ params, request }: Route.LoaderArgs) {
	const subscriptionId = Number(params.id);

	if (Number.isNaN(subscriptionId)) {
		throw new Response("Invalid subscription ID", { status: 400 });
	}

	try {
		// サブスクリプション詳細を取得
		const url = new URL(request.url);
		const response = await fetch(
			`${url.origin}/api/subscriptions/${subscriptionId}`,
		);

		if (!response.ok) {
			if (response.status === 404) {
				throw new Response("Subscription not found", { status: 404 });
			}
			throw new Error("Failed to load subscription");
		}

		const subscriptionData = (await response.json()) as {
			data: SelectSubscription;
		};
		return { subscription: subscriptionData.data };
	} catch (error) {
		console.error("Failed to load subscription:", error);
		throw new Response("Failed to load subscription", { status: 500 });
	}
}

export async function action({ request, params }: Route.ActionArgs) {
	const subscriptionId = Number(params.id);

	if (Number.isNaN(subscriptionId)) {
		return data(
			{ errors: { _form: ["無効なサブスクリプションIDです"] } },
			{ status: 400 },
		);
	}

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
		const response = await fetch(
			`${url.origin}/api/subscriptions/${subscriptionId}/update`,
			{
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(result.data),
			},
		);

		if (!response.ok) {
			const errorData = (await response.json()) as { error?: string };
			throw new Error(
				errorData.error || "サブスクリプションの更新に失敗しました",
			);
		}

		// 成功時はサブスクリプション一覧にリダイレクト
		return redirect("/subscriptions");
	} catch (error) {
		console.error("Subscription update error:", error);
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

export default function UpdateSubscriptionPage({
	loaderData,
	actionData,
}: Route.ComponentProps) {
	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<div className="bg-white shadow-sm rounded-lg p-6">
				<SubscriptionFormNative
					subscription={loaderData?.subscription}
					actionData={actionData}
				/>
			</div>
		</div>
	);
}
