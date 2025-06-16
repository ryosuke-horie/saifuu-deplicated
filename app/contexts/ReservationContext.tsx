import { type ReactNode, createContext, useContext, useState } from "react";
import type { Lesson } from "../types/lesson";

/**
 * 予約状態のモード定義
 * selecting_first: 第一希望選択中
 * selecting_second: 第二希望選択中
 * form_open: フォーム表示中
 */
type ReservationMode = "selecting_first" | "selecting_second" | "form_open";

/**
 * 統合予約状態オブジェクト
 * 関連する状態を1つのオブジェクトに統合し、状態間の整合性を保つ
 */
interface ReservationState {
	firstChoice: Lesson | null;
	secondChoice: Lesson | null;
	mode: ReservationMode;
	isVisible: boolean;
}

/**
 * 予約に関する状態と操作を統合管理するContextの型定義
 * Props drillingを解消し、コンポーネント間での状態共有を効率化
 */
interface ReservationContextValue {
	// 統合予約状態
	reservationState: ReservationState;

	// レッスン選択操作
	handleLessonClick: (lesson: Lesson) => void;
	toggleSecondChoice: () => void;
	clearSelection: () => void;

	// ポップアップ制御
	setPopupVisible: (visible: boolean) => void;
	closePopup: () => void;

	// フォーム送信処理
	handleFormSubmission: () => void;
}

// 初期予約状態
const initialReservationState: ReservationState = {
	firstChoice: null,
	secondChoice: null,
	mode: "selecting_first",
	isVisible: false,
};

// Context作成
const ReservationContext = createContext<ReservationContextValue | undefined>(
	undefined,
);

/**
 * ReservationContextProviderのプロパティ
 */
interface ReservationProviderProps {
	children: ReactNode;
}

/**
 * 予約関連の状態管理を提供するContextProvider
 *
 * 機能:
 * - レッスン選択状態の管理（第一希望、第二希望）
 * - 第二希望選択モードの切り替え
 * - ポップアップの表示/非表示制御
 * - フォーム送信後の処理
 *
 * @param children - プロバイダーでラップする子コンポーネント
 */
export function ReservationProvider({ children }: ReservationProviderProps) {
	// 統合予約状態管理
	const [reservationState, setReservationState] = useState<ReservationState>(
		initialReservationState,
	);

	/**
	 * レッスンクリック時のハンドラ
	 * 統合状態を使用して選択モードに応じてレッスンを設定
	 */
	const handleLessonClick = (lesson: Lesson) => {
		if (reservationState.mode === "selecting_first") {
			// 第一希望を選択
			setReservationState({
				...reservationState,
				firstChoice: lesson,
				mode: "form_open",
				isVisible: true,
			});
		} else if (reservationState.mode === "selecting_second") {
			// 第二希望を選択し、フォーム表示モードに移行
			setReservationState({
				...reservationState,
				secondChoice: lesson,
				mode: "form_open",
				isVisible: true,
			});
		}
	};

	/**
	 * 第二希望選択モードをトグル
	 * フォーム表示時は第二希望選択モードに切り替えてポップアップを閉じる
	 */
	const toggleSecondChoice = () => {
		setReservationState({
			...reservationState,
			mode: "selecting_second",
			isVisible: false,
		});
	};

	/**
	 * 選択状態を完全にクリアし、ポップアップを閉じる
	 */
	const clearSelection = () => {
		setReservationState(initialReservationState);
	};

	/**
	 * ポップアップのみを閉じる（選択状態は保持）
	 */
	const closePopup = () => {
		setReservationState({
			...reservationState,
			isVisible: false,
		});
	};

	/**
	 * ポップアップの表示状態を設定
	 */
	const setPopupVisible = (visible: boolean) => {
		setReservationState({
			...reservationState,
			isVisible: visible,
		});
	};

	/**
	 * フォーム送信後のハンドラ
	 * PopupReservationFormが内部で成功/エラー処理を行うため、
	 * 現在は特別な処理は不要
	 */
	const handleFormSubmission = () => {
		// PopupReservationFormが自動的にメッセージ表示とクローズ処理を行う
	};

	// レガシーgetters削除 - 全て reservationState を直接使用する

	const contextValue: ReservationContextValue = {
		// 統合状態
		reservationState,
		// 操作
		handleLessonClick,
		toggleSecondChoice,
		clearSelection,
		setPopupVisible,
		closePopup,
		handleFormSubmission,
	};

	return (
		<ReservationContext.Provider value={contextValue}>
			{children}
		</ReservationContext.Provider>
	);
}

/**
 * ReservationContextを使用するためのカスタムフック
 *
 * @throws {Error} Provider外で使用された場合
 * @returns {ReservationContextValue} 予約関連の状態と操作
 */
export function useReservation(): ReservationContextValue {
	const context = useContext(ReservationContext);
	if (context === undefined) {
		throw new Error("useReservation must be used within a ReservationProvider");
	}
	return context;
}
