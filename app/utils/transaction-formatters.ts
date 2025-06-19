/**
 * 取引データのフォーマット関連ユーティリティ関数
 *
 * 設計方針:
 * - 複数のコンポーネント間で共通利用される関数を集約
 * - 一貫したフォーマット処理を提供
 * - 日本のロケールに対応した表示形式
 */

/**
 * 金額をフォーマットして表示用文字列に変換
 * @param amount 金額（数値）
 * @param type 取引タイプ（"income" | "expense"）
 * @returns フォーマットされた金額文字列
 */
export const formatAmount = (
	amount: number,
	type: "income" | "expense",
): string => {
	const formattedAmount = amount.toLocaleString();
	return type === "income" ? `+¥${formattedAmount}` : `-¥${formattedAmount}`;
};

/**
 * 日付文字列を日本語フォーマットに変換
 * @param dateString ISO形式の日付文字列
 * @returns 日本語形式の日付文字列 (YYYY/MM/DD)
 */
export const formatDate = (dateString: string): string => {
	const date = new Date(dateString);
	return date.toLocaleDateString("ja-JP", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};

/**
 * 取引タイプを日本語ラベルに変換
 * @param type 取引タイプ（"income" | "expense"）
 * @returns 日本語ラベル
 */
export const getTypeLabel = (type: "income" | "expense"): string => {
	return type === "income" ? "収入" : "支出";
};

/**
 * 取引タイプに応じたCSSカラークラスを取得
 * @param type 取引タイプ（"income" | "expense"）
 * @returns Tailwind CSSクラス文字列
 */
export const getTypeColorClass = (type: "income" | "expense"): string => {
	return type === "income"
		? "text-green-600 bg-green-50"
		: "text-red-600 bg-red-50";
};

/**
 * カード表示用の境界線色クラスを取得
 * @param type 取引タイプ（"income" | "expense"）
 * @returns Tailwind CSSクラス文字列
 */
export const getCardBorderClass = (type: "income" | "expense"): string => {
	return type === "income"
		? "border-l-4 border-l-green-400"
		: "border-l-4 border-l-red-400";
};

/**
 * 金額表示用の色クラスを取得
 * @param type 取引タイプ（"income" | "expense"）
 * @returns Tailwind CSSクラス文字列
 */
export const getAmountColorClass = (type: "income" | "expense"): string => {
	return type === "income" ? "text-green-600" : "text-red-600";
};

/**
 * 合計金額をフォーマット（符号付き）
 * @param amount 合計金額
 * @returns フォーマットされた金額文字列
 */
export const formatTotalAmount = (amount: number): string => {
	const sign = amount >= 0 ? "+" : "";
	return `${sign}¥${Math.abs(amount).toLocaleString()}`;
};
