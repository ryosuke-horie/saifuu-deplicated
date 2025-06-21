/**
 * 取引タグのJSON処理ユーティリティ
 *
 * 設計方針:
 * - データベースではJSON文字列として保存、アプリケーションでは配列として扱う
 * - エラーハンドリングを含む安全なパース処理
 * - APIレスポンスとフロントエンド表示での一貫した処理
 * - 再利用可能な関数として定義
 */

/**
 * JSON文字列として保存されたタグを安全に配列として解析
 * 
 * @param tagsJson - データベースから取得したJSON文字列（例: '["外食", "会社"]'）
 * @param transactionId - エラーログ用の取引ID（オプション）
 * @returns 解析されたタグ配列、またはnull
 */
export function parseTransactionTags(
	tagsJson: string | null,
	transactionId?: number,
): string[] | null {
	if (!tagsJson) {
		return null;
	}

	try {
		const parsed = JSON.parse(tagsJson);
		
		// 配列であることを確認
		if (Array.isArray(parsed)) {
			return parsed.filter((tag) => typeof tag === "string");
		}
		
		// 配列でない場合はnullを返す
		console.warn(
			`取引ID ${transactionId ?? "不明"} のタグは配列ではありません:`,
			parsed,
		);
		return null;
	} catch (parseError) {
		// JSON解析に失敗した場合はログに記録し、nullを設定
		console.warn(
			`取引ID ${transactionId ?? "不明"} のタグJSON解析に失敗:`,
			parseError,
		);
		return null;
	}
}

/**
 * タグ配列をデータベース保存用のJSON文字列に変換
 * 
 * @param tags - タグ配列
 * @returns JSON文字列、またはnull
 */
export function stringifyTransactionTags(tags: string[] | undefined | null): string | null {
	if (!tags || tags.length === 0) {
		return null;
	}
	
	// 文字列のみをフィルタリングして重複を除去
	const validTags = Array.from(new Set(tags.filter((tag) => typeof tag === "string" && tag.trim().length > 0)));
	
	if (validTags.length === 0) {
		return null;
	}
	
	return JSON.stringify(validTags);
}

/**
 * 取引オブジェクトのタグをパースして新しいオブジェクトを返す
 * APIレスポンス処理で使用
 */
export function parseTransactionWithTags<T extends { id: number; tags: string | null }>(
	transaction: T,
): Omit<T, "tags"> & { tags: string[] | null } {
	return {
		...transaction,
		tags: parseTransactionTags(transaction.tags, transaction.id),
	};
}

/**
 * 複数の取引オブジェクトのタグを一括でパースする
 * APIレスポンス処理で使用
 */
export function parseTransactionsWithTags<T extends { id: number; tags: string | null }>(
	transactions: T[],
): Array<Omit<T, "tags"> & { tags: string[] | null }> {
	return transactions.map(parseTransactionWithTags);
}