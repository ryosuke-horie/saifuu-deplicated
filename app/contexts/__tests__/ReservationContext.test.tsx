import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Lesson } from "../../types/lesson";
import { ReservationProvider, useReservation } from "../ReservationContext";

// テスト用レッスンデータ
const mockFirstLesson: Lesson = {
	title: "第一希望レッスン",
	start: "2024-01-15 10:00",
	end: "2024-01-15 11:00",
	instructor: "miyoshi",
	class: "class-a",
};

const mockSecondLesson: Lesson = {
	title: "第二希望レッスン",
	start: "2024-01-16 14:00",
	end: "2024-01-16 15:00",
	instructor: "miyaso",
	class: "class-b",
};

describe("ReservationContext", () => {
	const wrapper = ({ children }: { children: React.ReactNode }) => (
		<ReservationProvider>{children}</ReservationProvider>
	);

	it("初期状態が正しく設定される", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		expect(result.current.reservationState).toEqual({
			firstChoice: null,
			secondChoice: null,
			mode: "selecting_first",
			isVisible: false,
		});
	});

	it("第一希望レッスン選択時に状態が更新される", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		expect(result.current.reservationState).toEqual({
			firstChoice: mockFirstLesson,
			secondChoice: null,
			mode: "form_open",
			isVisible: true,
		});
	});

	it("第二希望選択モードに切り替わる", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// 第一希望を選択
		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		// 第二希望選択モードに切り替え
		act(() => {
			result.current.toggleSecondChoice();
		});

		expect(result.current.reservationState).toEqual({
			firstChoice: mockFirstLesson,
			secondChoice: null,
			mode: "selecting_second",
			isVisible: false,
		});
	});

	it("第二希望レッスン選択時に状態が更新される", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// 第一希望を選択
		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		// 第二希望選択モードに切り替え
		act(() => {
			result.current.toggleSecondChoice();
		});

		// 第二希望を選択
		act(() => {
			result.current.handleLessonClick(mockSecondLesson);
		});

		expect(result.current.reservationState).toEqual({
			firstChoice: mockFirstLesson,
			secondChoice: mockSecondLesson,
			mode: "form_open",
			isVisible: true,
		});
	});

	it("選択状態をクリアする", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// レッスンを選択
		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		// 選択をクリア
		act(() => {
			result.current.clearSelection();
		});

		expect(result.current.reservationState).toEqual({
			firstChoice: null,
			secondChoice: null,
			mode: "selecting_first",
			isVisible: false,
		});
	});

	it("ポップアップを閉じる（選択状態は保持）", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// レッスンを選択
		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		// ポップアップを閉じる
		act(() => {
			result.current.closePopup();
		});

		expect(result.current.reservationState).toEqual({
			firstChoice: mockFirstLesson,
			secondChoice: null,
			mode: "form_open",
			isVisible: false,
		});
	});

	it("ポップアップの表示状態を設定する", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// レッスンを選択
		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		// ポップアップを非表示に
		act(() => {
			result.current.setPopupVisible(false);
		});

		expect(result.current.reservationState.isVisible).toBe(false);

		// ポップアップを表示に
		act(() => {
			result.current.setPopupVisible(true);
		});

		expect(result.current.reservationState.isVisible).toBe(true);
	});

	it("フォーム送信処理を呼び出す", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// handleFormSubmissionは現在特別な処理を行わない
		// 将来的に実装される可能性があるため、エラーが発生しないことを確認
		act(() => {
			result.current.handleFormSubmission();
		});

		// エラーが発生しないことを確認
		expect(result.current.reservationState.firstChoice).toBeNull();
	});

	it("Provider外でuseReservationを使用するとエラーが発生", () => {
		// console.errorのモック（Vitest環境用）
		const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

		expect(() => {
			renderHook(() => useReservation());
		}).toThrow("useReservation must be used within a ReservationProvider");

		consoleSpy.mockRestore();
	});

	it("selecting_first状態では第一希望のみ選択される", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// 初期状態はselecting_first
		expect(result.current.reservationState.mode).toBe("selecting_first");

		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		// 第一希望が選択され、モードがform_openに変わる
		expect(result.current.reservationState.firstChoice).toEqual(
			mockFirstLesson,
		);
		expect(result.current.reservationState.secondChoice).toBeNull();
		expect(result.current.reservationState.mode).toBe("form_open");
	});

	it("selecting_second状態では第二希望のみ選択される", () => {
		const { result } = renderHook(() => useReservation(), { wrapper });

		// 第一希望を選択
		act(() => {
			result.current.handleLessonClick(mockFirstLesson);
		});

		// 第二希望選択モードに切り替え
		act(() => {
			result.current.toggleSecondChoice();
		});

		// 第二希望を選択
		act(() => {
			result.current.handleLessonClick(mockSecondLesson);
		});

		// 第一希望は変更されず、第二希望が選択される
		expect(result.current.reservationState.firstChoice).toEqual(
			mockFirstLesson,
		);
		expect(result.current.reservationState.secondChoice).toEqual(
			mockSecondLesson,
		);
		expect(result.current.reservationState.mode).toBe("form_open");
	});
});
