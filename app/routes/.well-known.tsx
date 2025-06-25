// Chrome DevToolsの.well-knownリクエストを処理
// 404エラーを防ぐためのキャッチオールルート

export function loader() {
	// 204 No Content を返して正常終了
	return new Response(null, { status: 204 });
}

export default function WellKnownRoute() {
	// このコンポーネントは実際にはレンダリングされない
	return null;
}
