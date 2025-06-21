import { redirect } from "react-router";

/**
 * ルートページ（/）から /home にリダイレクト
 * React Router v7のconvention-based routingに従う
 */
export function loader() {
	return redirect("/home");
}
