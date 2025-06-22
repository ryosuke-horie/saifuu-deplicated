import { redirect } from "react-router";

// 旧homeルートから新dashboardルートへのリダイレクト
// React Router v7の内部キャッシュ問題を回避するための一時的な対処
export function loader() {
	return redirect("/dashboard");
}

export default function Home() {
	// この関数は呼ばれることはない（リダイレクトされるため）
	return null;
}
