import type { Route } from "../routes/+types/home";
import { sendReservationEmails } from "../utils/email.server";
import type { ExtendedEnv } from "../utils/email.server";
import {
	parseFormDataToReservation,
	validateReservationData,
} from "../utils/form-parser.server";

/**
 * Server Action to handle reservation form submission
 * Processes reservation form data and sends emails via AWS SES
 */
export async function handleReservationSubmission({
	request,
	context,
}: Route.ActionArgs) {
	// Only handle POST requests
	if (request.method !== "POST") {
		return new Response(JSON.stringify({ message: "Method not allowed" }), {
			status: 405,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});
	}

	try {
		// Parse form data from the request
		const formData = await request.formData();
		const parsedData = parseFormDataToReservation(formData);

		// Validate form data
		const validation = validateReservationData(parsedData);
		if (!validation.isValid) {
			console.log("Validation failed for form data:", parsedData);
			console.log("Validation errors:", validation.errors);
			return new Response(
				JSON.stringify({
					message: "バリデーションエラー",
					errors: validation.errors,
				}),
				{
					status: 400,
					headers: {
						"Content-Type": "application/json",
						"Access-Control-Allow-Origin": "*",
					},
				},
			);
		}

		// Send emails using AWS SES
		// Access environment variables through context.cloudflare.env
		await sendReservationEmails(
			parsedData,
			context.cloudflare.env as ExtendedEnv,
		);

		// Return success response
		return new Response(JSON.stringify({ message: "メール送信成功" }), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error) {
		// Log error for debugging
		console.error("Error processing form submission:", error);

		// Provide more detailed error message for debugging
		const errorMessage =
			error instanceof Error ? error.message : "不明なエラーが発生しました";
		console.error("Error details:", errorMessage);

		// Return error response with more details in development
		return new Response(
			JSON.stringify({
				message: "フォーム送信中にエラーが発生しました",
				error: errorMessage,
			}),
			{
				status: 500,
				headers: {
					"Content-Type": "application/json",
					"Access-Control-Allow-Origin": "*",
				},
			},
		);
	}
}
