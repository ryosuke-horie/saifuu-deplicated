import { redirect } from "react-router";

// 旧homeルートからルートページへのリダイレクト
// ダッシュボード機能は現在 "/" (ルートページ) で提供
export function loader() {
	return redirect("/");
}
