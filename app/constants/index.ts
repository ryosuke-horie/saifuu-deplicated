/**
 * アプリケーション全体で使用される定数
 *
 * このファイルではマジックナンバーとハードコーディングされた値を一元管理します。
 * 設定の変更時は、このファイルを更新するだけで全体に反映されます。
 */

// ====== UI 定数 ======
export const UI = {
	// レイアウト寸法
	LAYOUT: {
		MAX_WIDTH: {
			MOBILE: "100%", // モバイル: フル幅
			TABLET: "90%", // タブレット: 余白を持たせる
			DESKTOP: 1200, // デスクトップ: 最大幅を拡張
		},
		POPUP_MAX_WIDTH: 500, // ポップアップの最大幅
		MIN_HEIGHT: 900, // 日コンテナの最小高さ
		DAY_COLUMN_MIN_HEIGHT: 800, // 日列の最小高さ
		DAY_COLUMN_MIN_WIDTH: {
			MOBILE: 120, // モバイル: タッチしやすい幅
			TABLET: 140, // タブレット: より広い幅
			DESKTOP: 160, // デスクトップ: 最も広い幅
		},
	},

	// タイポグラフィ
	TYPOGRAPHY: {
		FONT_SIZE: {
			H1: 2.5, // rem
			H1_MOBILE: 2, // rem
			HEADER_MENU: 14, // px
			FOOTER_COPYRIGHT: 10, // px
			EVENT_TIME: 0.6, // rem
			EVENT_TITLE: 0.7, // rem
			DATE_LABEL: 0.75, // rem
			POPUP_MAIL_MESSAGE: 0.7, // em
			SELECTION_MODE: 0.9, // em
			POPUP_TITLE: 1.5, // em
			POPUP_LABEL: 0.9, // em
			VALIDATION_MESSAGE: 0.8, // em
			SUCCESS_TITLE: 1.2, // em
			ERROR_TITLE: 1.2, // em
			LOADING_TITLE: 1.2, // em
			CONTACT_INFO: 1.1, // em
		},
	},

	// スペーシング
	SPACING: {
		PADDING: {
			SMALL: 4, // px
			MEDIUM: 8, // px
			LARGE: 10, // px
			XLARGE: 15, // px
			XXLARGE: 20, // px
		},
		MARGIN: {
			SMALL: 5, // px
			MEDIUM: 10, // px
			LARGE: 20, // px
			XLARGE: 30, // px
		},
		BORDER_WIDTH: 1, // px
		BORDER_RADIUS: {
			SMALL: 4, // px
			MEDIUM: 5, // px
			LARGE: 8, // px
			XLARGE: 10, // px
		},
		// タッチターゲット最小サイズ（アクセシビリティ基準）
		TOUCH_TARGET_MIN: 44, // px
	},

	// レスポンシブブレークポイント
	BREAKPOINTS: {
		MOBILE: 480, // px - スマートフォン縦
		MOBILE_LANDSCAPE: 730, // px - スマートフォン横
		TABLET: 768, // px - タブレット縦
		TABLET_LANDSCAPE: 1024, // px - タブレット横
		DESKTOP: 1200, // px - デスクトップ
	},

	// Z-index
	Z_INDEX: {
		POPUP: 1000,
	},

	// トランジション
	TRANSITIONS: {
		DURATION: 0.3, // s
	},
} as const;

// ====== 色設定 ======
export const COLORS = {
	// ライトモード
	LIGHT: {
		HEADER_BG: "#333333",
		HEADER_TEXT: "#ffffff",
		HEADER_HOVER: "#ff0000",
		FOOTER_BG: "#333333",
		FOOTER_TEXT: "#ffffff",
		CONTENT_BG: "#ffffff",
		CONTENT_TEXT: "#333333",
		BORDER_COLOR: "#ddd",
		NOTICE_BG: "#f9f9f9",
		NOTICE_BORDER: "pink",
		NOTICE_ACCENT: "#ff0000",
		POPUP_BG: "white",
		POPUP_TEXT: "#333",
		POPUP_LABEL: "#444",
		POPUP_BUTTON: "#42b983",
		POPUP_BUTTON_HOVER: "#367b63",
		POPUP_CANCEL: "#f44336",
		POPUP_CANCEL_HOVER: "#d32f2f",
		TIMELINE_BG: "#f9f9f9",
		EVENT_BG: "#fff",
		EVENT_PAST: "#f0f0f0",
		EVENT_TEXT: "#555",
		VALIDATION_COLOR: "#f44336",
		SUCCESS_BG: "#d4edda",
		SUCCESS_TEXT: "#155724",
		SUCCESS_BORDER: "#c3e6cb",
		ERROR_BG: "#f8d7da",
		ERROR_TEXT: "#721c24",
		ERROR_BORDER: "#f5c6cb",
	},

	// ダークモード
	DARK: {
		HEADER_BG: "#1a1a1a",
		HEADER_TEXT: "#e5e5e5",
		HEADER_HOVER: "#cc0000",
		FOOTER_BG: "#1a1a1a",
		FOOTER_TEXT: "#e5e5e5",
		CONTENT_BG: "#1f1f1f",
		CONTENT_TEXT: "#e5e5e5",
		BORDER_COLOR: "#444",
		NOTICE_BG: "#2a2a2a",
		NOTICE_BORDER: "#ff69b4",
		NOTICE_ACCENT: "#ff4444",
		POPUP_BG: "#2a2a2a",
		POPUP_TEXT: "#e5e5e5",
		POPUP_LABEL: "#c5c5c5",
		POPUP_BUTTON: "#4a9d75",
		POPUP_BUTTON_HOVER: "#3a7c5c",
		POPUP_CANCEL: "#d73027",
		POPUP_CANCEL_HOVER: "#b82820",
		TIMELINE_BG: "#2a2a2a",
		EVENT_BG: "#333",
		EVENT_PAST: "#2a2a2a",
		EVENT_TEXT: "#c5c5c5",
		VALIDATION_COLOR: "#ff6b6b",
		SUCCESS_BG: "#1b4332",
		SUCCESS_TEXT: "#c7f9cc",
		SUCCESS_BORDER: "#2d7e3e",
		ERROR_BG: "#5c1b1b",
		ERROR_TEXT: "#fec5c5",
		ERROR_BORDER: "#7e2d2d",
	},

	// イベントクラス別カラー
	EVENT_CLASSES: {
		MASTER_CLASS: "#9c27b0",
		FAMILY_JIU_JITSU: "#2196f3",
		KICK_BOXING: "#e91e63",
		KICK_MMA: "#4caf50",
		GIRLS: "#ff9800",
		KIDS: "#85dfff",
		NOGI: "#00bcd4",
		OPEN_MAT: "#c6e0b4",
		JIU_JITSU_NOGI: "#607d8b",
		GRAPPLING: "#795548",
		WRESTLING: "#ff5722",
	},
} as const;

// ====== 時間関連定数 ======
export const TIME = {
	// タイムライン表示設定
	TIMELINE_START_HOUR: 10, // タイムライン開始時刻
	TIMELINE_OFFSET: 60, // タイムライン上部オフセット (px)
	MINUTES_PER_PIXEL: 1, // 1ピクセルあたりの分数

	// 週間ナビゲーション
	DAYS_PER_WEEK: 7,
	WEEK_DAYS_ADVANCE: 7,
	WEEK_DAYS_BACK: -7,
	WEEK_END_OFFSET: 6, // 週の終わりを計算するためのオフセット

	// タイムアウト設定
	SUCCESS_MESSAGE_TIMEOUT: 3000, // ms
} as const;

// ====== 曜日 ======
export const DAYS_OF_WEEK = ["日", "月", "火", "水", "木", "金", "土"] as const;

// ====== 会社情報 ======
export const COMPANY = {
	NAME: "HIDE'S KICK!",
	PHONE: "03-5323-3934",
	ADDRESS: "〒160-0023 新宿区西新宿6-20-11 梅月マンション2F",
	COPYRIGHT: "HIDE'S KICK!© 2024 All Rights Reserved",

	// URL関連
	WEBSITE: {
		BASE: "https://www.hidemiyoshi.jp",
		PRICE: "https://www.hidemiyoshi.jp/price/",
		JOIN: "https://www.hidemiyoshi.jp/join/",
		TIMETABLE: "https://www.hidemiyoshi.jp/timetable/",
		INSTRUCTOR: "https://www.hidemiyoshi.jp/instructor/",
		BLOG: "https://www.hidemiyoshi.jp/blog/",
	},

	// 営業日関連
	BUSINESS_RESPONSE_DAYS: 2,
} as const;

// ====== アプリケーション設定 ======
export const APP = {
	// 画像パス
	IMAGES: {
		HEADER_LOGO: "/header-logo.webp",
		FOOTER_LOGO_HIDESKICK: "/footer-logo-hideskick.webp",
		FOOTER_LOGO_TRY_FORCE: "/footer-logo-try-force.webp",
		HEADER_LOGO_WIDTH: 300,
		HEADER_LOGO_HEIGHT: 50,
	},

	// メッセージ
	MESSAGES: {
		SUCCESS: "メール送信成功",
		SUBMITTING: "送信中...",
		CONFIRM_RESERVATION: "予約を確定する",
		PHONE_CONTACT: "お電話でのお問い合わせはこちら",
		BUSINESS_RESPONSE: "お問い合わせに2営業日以内に返信いたします。",
		EMAIL_DELAY_WARNING:
			"2営業日を過ぎても返信がない場合、メールが正常に届いていない可能性がありますので、",
		PHONE_CONTACT_REQUEST: "お電話でご連絡をお願いいたします。",
		MAIL_CONFIRMATION: "記載いただいたメール宛てに確認メールを送信します。",
		STAFF_SUPPORT: "＊来館時はスタッフがご対応させていただきます。",
		MAIN_INSTRUCTION:
			"レッスンをクリックしてフォームにご入力いただきお申込みいただけます。",
		TRIAL_DESCRIPTION:
			"当施設のご利用を検討されているお客様で、ご入会前に一度施設について知りたいという方は、こちらのページから、もしくはお電話にて体験のお申込みを承っております。",
		EMAIL_CONTACT_INFO:
			"こちらのページからお申込みをいただいた場合は、メールでのご連絡をさせていただきます。",
		SECOND_CHOICE_REQUIRED: "予約確定には第二希望の選択が必要です",
		SELECT_SECOND_CHOICE: "第二希望を選択する",
		SELECT_SECOND_CHOICE_INSTRUCTION:
			"（レッスンを選んでクリックしてください）",

		// Success/Error messages
		RESERVATION_ACCEPTED: "✅ 予約を受け付けました",
		RESERVATION_THANKS: "ご予約いただきありがとうございます。",
		CONFIRMATION_EMAIL_SENT:
			"確認メールを送信いたしましたので、ご確認ください。",
		EMAIL_NOT_RECEIVED:
			"もし確認メールが届かない場合は、お電話にてお問い合わせください。",
		SEND_ERROR: "❌ 送信エラー",
		CHECK_ITEMS: "以下の項目をご確認ください：",
		PHONE_IF_UNRESOLVED: "解決しない場合は、お電話でお問い合わせください。",
		SENDING_EMAIL: "📧 送信中...",
		PROCESSING_RESERVATION:
			"予約情報を処理しています。しばらくお待ちください。",
	},

	// バリデーションメッセージ
	VALIDATION: {
		REQUIRED_NAME: "氏名を入力してください",
		REQUIRED_EMAIL: "メールアドレスを入力してください",
		REQUIRED_PHONE: "電話番号を入力してください",
	},
} as const;

// ====== 型定義 ======
export type ColorTheme = keyof typeof COLORS;
export type EventClass = keyof typeof COLORS.EVENT_CLASSES;
export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
