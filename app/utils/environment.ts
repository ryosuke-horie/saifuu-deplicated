/**
 * 環境関連のユーティリティ関数
 *
 * 設計方針:
 * - 本番環境の判定や開発者向けルートの保護など、環境に依存する処理を集約
 * - React Router v7のResponse APIを使用したエラーハンドリング
 * - テスト可能性を考慮した関数設計
 */

/**
 * 現在の環境が本番環境かどうかを判定する
 * @returns 本番環境の場合はtrue
 */
export function isProduction(): boolean {
	return process.env.NODE_ENV === "production";
}

/**
 * 本番環境でアクセスされた場合に404エラーを投げる
 * 開発者向けページやテスト用ルートの保護に使用
 *
 * @throws {Response} 本番環境の場合は404 Not Foundレスポンス
 */
export function redirectIfProduction(): void {
	if (isProduction()) {
		throw new Response("Not Found", { status: 404 });
	}
}
