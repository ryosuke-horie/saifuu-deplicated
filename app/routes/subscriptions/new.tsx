import { data, redirect } from "react-router";
import { z } from "zod";
import { createDb } from "../../../db/connection";
import { getCategoriesByType } from "../../../db/queries/categories";
import { createSubscription } from "../../../db/queries/subscriptions";
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

export async function action({ request, context }: Route.ActionArgs) {
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
		// 直接DB操作でサブスクリプション作成
		const db = createDb(context.cloudflare.env.DB);
		await createSubscription(db, result.data);

		// 成功時はサブスクリプション一覧にリダイレクト
		return redirect("/subscriptions");
	} catch (error) {
		console.error("Subscription creation error:", error);

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
		}

		return data(
			{
				errors: {
					_form: [
						error instanceof Error
							? error.message
							: "サブスクリプションの作成中にエラーが発生しました",
					],
				},
			},
			{ status: 500 },
		);
	}
}

// ローダー関数を追加してカテゴリデータを取得
export async function loader({ context }: Route.LoaderArgs) {
	try {
		const db = createDb(context.cloudflare.env.DB);
		const categories = await getCategoriesByType(db, "expense");
		return { categories };
	} catch (error) {
		console.error("Failed to load categories:", error);
		throw new Response("Failed to load categories", { status: 500 });
	}
}

export default function NewSubscriptionPage({ loaderData, actionData }: any) {
	return (
		<div className="max-w-2xl mx-auto px-4 py-8">
			<div className="bg-white shadow-sm rounded-lg p-6">
				<h2 className="text-2xl font-bold text-gray-900 mb-6">
					新規サブスクリプション登録
				</h2>
				<SubscriptionFormNative
					categories={loaderData?.categories || []}
					actionData={actionData}
				/>
			</div>
		</div>
	);
}
