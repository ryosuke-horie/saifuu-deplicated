import { redirect } from "react-router";

/**
 * ルートページ（/）から /dashboard にリダイレクト
 * React Router v7のconvention-based routingに従う
 */
export function loader() {
	return redirect("/dashboard");
}
