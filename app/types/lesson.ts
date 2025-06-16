// インストラクターとして登録されている人の名前
export type Instructor =
	| "miyoshi"
	| "miyaso"
	| "kan"
	| "kazuki"
	| "sato"
	| "ogura"
	| "ozawa"
	| "ise"
	| "ryosuke";

// Lessonオブジェクトのコアインターフェース
// 注意: すべてのフィールドは空文字列ではなく有効な値を持つべき
export interface Lesson {
	start: string; // 開始時刻 (ISO 8601形式推奨)
	end: string; // 終了時刻 (ISO 8601形式推奨)
	title: string; // レッスンタイトル (非空文字列)
	class: string; // CSSクラス (非空文字列)
	instructor: Instructor; // インストラクター名
}

export interface ApplicantInfo {
	name: string;
	email: string;
	phone: string;
}
