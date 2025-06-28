import { data, redirect } from "react-router";
import { z } from "zod";
import { createDb } from "../../../db/connection";
import { getCategoriesByType } from "../../../db/queries/categories";
import {
	getSubscriptionById,
	updateSubscription,
} from "../../../db/queries/subscriptions";
import { insertSubscriptionSchema } from "../../../db/schema";
import { PageHeader } from "../../components/layout/page-header";
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

export async function loader({ params, context }: Route.LoaderArgs) {
	const subscriptionId = Number(params.id);

	if (Number.isNaN(subscriptionId)) {
		throw new Response("Invalid subscription ID", { status: 400 });
	}

	try {
		// 直接DB操作でサブスクリプション詳細とカテゴリ一覧を取得
		const db = createDb(context.cloudflare.env.DB);
		const [subscription, categories] = await Promise.all([
			getSubscriptionById(db, subscriptionId),
			getCategoriesByType(db, "expense"),
		]);

		if (!subscription) {
			throw new Response("Subscription not found", { status: 404 });
		}

		return { subscription, categories };
	} catch (error) {
		console.error("Failed to load subscription:", error);
		if (error instanceof Response) {
			throw error;
		}
		throw new Response("Failed to load subscription", { status: 500 });
	}
}

export async function action({ request, params, context }: Route.ActionArgs) {
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
		categoryId: Number(formData.get("categoryId")),
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
		// 直接DB操作でサブスクリプション更新
		const db = createDb(context.cloudflare.env.DB);
		await updateSubscription(db, subscriptionId, result.data);

		// 成功時はサブスクリプション一覧にリダイレクト
		return redirect("/subscriptions");
	} catch (error) {
		console.error("Subscription update error:", error);

		// データベース制約エラーの詳細ハンドリング
		if (error instanceof Error) {
			// 外部キー制約エラー（カテゴリIDが無効）
			if (error.message.includes("FOREIGN KEY constraint failed")) {
				return data(
					{
						errors: {
							_form: ["指定されたカテゴリIDが無効です"],
						},
					},
					{ status: 400 },
				);
			}

			// NOT NULL制約エラー
			if (error.message.includes("NOT NULL constraint failed")) {
				return data(
					{
						errors: {
							_form: ["必須項目が不足しています"],
						},
					},
					{ status: 400 },
				);
			}

			// CHECK制約エラー（金額が負の値など）
			if (error.message.includes("CHECK constraint failed")) {
				return data(
					{
						errors: {
							_form: ["金額は正の整数で入力してください"],
						},
					},
					{ status: 400 },
				);
			}

			// レコードが見つからない場合
			if (error.message.includes("not found")) {
				return data(
					{
						errors: {
							_form: ["更新対象のサブスクリプションが見つかりません"],
						},
					},
					{ status: 404 },
				);
			}
		}

		return data(
			{
				errors: {
					_form: [
						error instanceof Error
							? error.message
							: "サブスクリプションの更新中にエラーが発生しました",
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
}: any) {
	const subscription = loaderData?.subscription;

	return (
		<>
			{/* ページヘッダー */}
			<PageHeader
				title="サブスクリプション編集"
				description={
					subscription
						? `${subscription.name}の設定を編集します`
						: "サブスクリプションの設定を編集"
				}
			/>

			{/* フォームコンテンツ */}
			<div className="max-w-2xl mx-auto px-4 py-8">
				<div className="bg-white shadow-sm rounded-lg p-6">
					<SubscriptionFormNative
						subscription={subscription}
						categories={loaderData?.categories || []}
						actionData={actionData}
					/>
				</div>
			</div>
		</>
	);
}
