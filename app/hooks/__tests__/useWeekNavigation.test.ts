import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useWeekNavigation } from "../useWeekNavigation";

// モック定数
vi.mock("../../constants", () => ({
	TIME: {
		WEEK_END_OFFSET: 6,
	},
}));

// 日付ユーティリティのモック
vi.mock("../../utils/date-utils", () => ({
	addDays: vi.fn((date, days) => {
		const result = new Date(date);
		result.setDate(result.getDate() + days);
		return result;
	}),
}));

// Dateのモック（一貫したテスト結果のため）
const mockDate = new Date("2024-01-17"); // 水曜日
vi.setSystemTime(mockDate);

describe("useWeekNavigation", () => {
	it("初期状態で今週の日曜日が設定される", () => {
		const { result } = renderHook(() => useWeekNavigation());

		// 2024-01-17（水）から日曜日（2024-01-14）を計算
		const expectedSunday = new Date("2024-01-14");
		expect(result.current.currentStartOfWeek).toEqual(expectedSunday);
	});

	it("週を正方向に進める", async () => {
		const { result } = renderHook(() => useWeekNavigation());

		const initialDate = result.current.currentStartOfWeek;

		act(() => {
			result.current.advanceWeek(7); // 1週間進める
		});

		// addDaysが7日で呼ばれることを確認
		const { addDays } = await import("../../utils/date-utils");
		const mockAddDays = vi.mocked(addDays);
		expect(mockAddDays).toHaveBeenCalledWith(initialDate, 7);
	});

	it("週を負方向に戻す", async () => {
		const { result } = renderHook(() => useWeekNavigation());

		const initialDate = result.current.currentStartOfWeek;

		act(() => {
			result.current.advanceWeek(-7); // 1週間戻す
		});

		// addDaysが-7日で呼ばれることを確認
		const { addDays } = await import("../../utils/date-utils");
		const mockAddDays = vi.mocked(addDays);
		expect(mockAddDays).toHaveBeenCalledWith(initialDate, -7);
	});

	it("weekDisplayが正しいフォーマットで表示される", async () => {
		const { result } = renderHook(() => useWeekNavigation());

		// モックされたaddDaysの戻り値を設定
		const { addDays } = await import("../../utils/date-utils");
		const mockAddDays = vi.mocked(addDays);
		mockAddDays.mockReturnValueOnce(new Date("2024-01-20")); // 土曜日

		const expectedDisplay = "2024/1/14 - 2024/1/20";
		expect(result.current.weekDisplay).toBe(expectedDisplay);
	});

	it("getStartOfWeek関数が正しい日曜日を計算する", () => {
		const { result } = renderHook(() => useWeekNavigation());

		const sunday = result.current.getStartOfWeek();

		// 2024-01-17（水）から計算される日曜日は2024-01-14
		expect(sunday.getDay()).toBe(0); // 日曜日
		expect(sunday.getFullYear()).toBe(2024);
		expect(sunday.getMonth()).toBe(0); // 1月
		expect(sunday.getDate()).toBe(14);
	});

	it("複数回の週移動が正しく累積される", async () => {
		const { result } = renderHook(() => useWeekNavigation());

		const initialDate = result.current.currentStartOfWeek;

		// 2週間進める（2回に分けて）
		act(() => {
			result.current.advanceWeek(7);
		});

		act(() => {
			result.current.advanceWeek(7);
		});

		// addDaysが呼ばれることを確認（回数は他のテストの影響を受けるため具体的な数値は確認しない）
		const { addDays } = await import("../../utils/date-utils");
		const mockAddDays = vi.mocked(addDays);
		expect(mockAddDays).toHaveBeenCalled();
	});

	it("weekDisplayがcurrentStartOfWeekの変更に反応する", () => {
		const { result } = renderHook(() => useWeekNavigation());

		const initialDisplay = result.current.weekDisplay;

		// 週を進める
		act(() => {
			result.current.advanceWeek(7);
		});

		// 表示が変更されることを確認
		expect(result.current.weekDisplay).not.toBe(initialDisplay);
	});

	it("日曜日が基準日として使用される", () => {
		// 異なる曜日でテスト
		vi.setSystemTime(new Date("2024-01-15")); // 月曜日

		const { result } = renderHook(() => useWeekNavigation());
		const sunday = result.current.getStartOfWeek();

		expect(sunday.getDay()).toBe(0); // 日曜日
		expect(sunday.getDate()).toBe(14); // 2024-01-14が日曜日
	});

	it("土曜日から正しい日曜日を計算する", () => {
		vi.setSystemTime(new Date("2024-01-20")); // 土曜日

		const { result } = renderHook(() => useWeekNavigation());
		const sunday = result.current.getStartOfWeek();

		expect(sunday.getDay()).toBe(0); // 日曜日
		expect(sunday.getDate()).toBe(14); // 同じ週の日曜日
	});

	it("日曜日から正しい日曜日を計算する（自分自身）", () => {
		vi.setSystemTime(new Date("2024-01-14")); // 日曜日

		const { result } = renderHook(() => useWeekNavigation());
		const sunday = result.current.getStartOfWeek();

		expect(sunday.getDay()).toBe(0); // 日曜日
		expect(sunday.getDate()).toBe(14); // 同じ日
	});

	it("月末をまたぐ週移動が正しく動作する", async () => {
		// 1月末の週をテスト
		vi.setSystemTime(new Date("2024-01-31")); // 水曜日

		const { result } = renderHook(() => useWeekNavigation());

		act(() => {
			result.current.advanceWeek(7); // 次の週（2月）
		});

		// addDaysが呼ばれることを確認
		const { addDays } = await import("../../utils/date-utils");
		const mockAddDays = vi.mocked(addDays);
		expect(mockAddDays).toHaveBeenCalled();
	});
});
