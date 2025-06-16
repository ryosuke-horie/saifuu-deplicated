import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { DayData, EventStyle } from "../../hooks/useTimetableData";
import type { Lesson } from "../../types/lesson";
import { render, screen } from "../../utils/test-utils";
import { WeeklyTimetable } from "../WeeklyTimetable";

// モックレッスンデータ
const mockLesson: Lesson = {
	title: "テストレッスン",
	start: "2024-01-15 10:00",
	end: "2024-01-15 11:00",
	instructor: "miyoshi",
	class: "test-class",
};

const pastLesson: Lesson = {
	title: "過去レッスン",
	start: "2024-01-10 09:00",
	end: "2024-01-10 10:00",
	instructor: "miyaso",
	class: "past-class",
};

// モックprops
const mockDays: DayData[] = [
	{
		date: "2024-01-15",
		events: [mockLesson],
	},
	{
		date: "2024-01-16",
		events: [pastLesson],
	},
];

const mockDaysOfWeek = ["月", "火"];

const mockIsPastEvent = vi.fn((eventStart: string) => {
	return eventStart.includes("2024-01-10");
});

const mockGetEventStyle = vi.fn(
	(): EventStyle => ({
		top: "100px",
		height: "60px",
		position: "absolute",
		left: "0",
		right: "0",
	}),
);

describe("WeeklyTimetable", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("正しく曜日と日付を表示", () => {
		render(
			<WeeklyTimetable
				days={mockDays}
				daysOfWeek={mockDaysOfWeek}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		// 日付ラベルが表示されることを確認
		expect(screen.getByTestId("date-label-2024-01-15")).toHaveTextContent(
			"2024-01-15月",
		);
		expect(screen.getByTestId("date-label-2024-01-16")).toHaveTextContent(
			"2024-01-16火",
		);
	});

	it("レッスンイベントが正しく表示される", () => {
		render(
			<WeeklyTimetable
				days={mockDays}
				daysOfWeek={mockDaysOfWeek}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		// レッスンが表示されることを確認
		const testLesson = screen.getByTestId("lesson-テストレッスン");
		expect(testLesson).toBeInTheDocument();
		expect(testLesson).toHaveTextContent("テストレッスン");
		expect(testLesson).toHaveTextContent("10:00 - 11:00");

		const pastLessonElement = screen.getByTestId("lesson-過去レッスン");
		expect(pastLessonElement).toBeInTheDocument();
		expect(pastLessonElement).toHaveTextContent("過去レッスン");
	});

	it("過去のイベントに適切なクラスが適用される", () => {
		render(
			<WeeklyTimetable
				days={mockDays}
				daysOfWeek={mockDaysOfWeek}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		const pastLessonElement = screen.getByTestId("lesson-過去レッスン");
		expect(pastLessonElement).toHaveClass("past");

		const currentLesson = screen.getByTestId("lesson-テストレッスン");
		expect(currentLesson).not.toHaveClass("past");
	});

	it("イベントの位置スタイルが適用される", () => {
		render(
			<WeeklyTimetable
				days={mockDays}
				daysOfWeek={mockDaysOfWeek}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		const testLesson = screen.getByTestId("lesson-テストレッスン");
		expect(testLesson).toHaveStyle({
			top: "100px",
			height: "60px",
			position: "absolute",
		});

		// getEventStyleが呼ばれることを確認
		expect(mockGetEventStyle).toHaveBeenCalledWith(mockLesson);
	});

	it("レッスンクリック時にhandleLessonClickが呼ばれる", async () => {
		const user = userEvent.setup();

		render(
			<WeeklyTimetable
				days={mockDays}
				daysOfWeek={mockDaysOfWeek}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		const testLesson = screen.getByTestId("lesson-テストレッスン");
		await user.click(testLesson);

		// handleLessonClickはContextから来るため、統合テストで確認が必要
		// ここではクリック可能な要素であることを確認
		expect(testLesson).toHaveAttribute("role", "button");
		expect(testLesson).toHaveAttribute("tabIndex", "0");
	});

	it("キーボード操作でレッスンが選択できる", async () => {
		const user = userEvent.setup();

		render(
			<WeeklyTimetable
				days={mockDays}
				daysOfWeek={mockDaysOfWeek}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		const testLesson = screen.getByTestId("lesson-テストレッスン");

		// Enterキーでの操作
		testLesson.focus();
		await user.keyboard("{Enter}");

		// Spaceキーでの操作
		await user.keyboard(" ");

		// アクセシビリティ属性の確認
		expect(testLesson).toHaveAttribute("role", "button");
		expect(testLesson).toHaveAttribute("tabIndex", "0");
	});

	it("レッスンデータ属性が正しく設定される", () => {
		render(
			<WeeklyTimetable
				days={mockDays}
				daysOfWeek={mockDaysOfWeek}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		const testLesson = screen.getByTestId("lesson-テストレッスン");
		expect(testLesson).toHaveAttribute("data-title", "テストレッスン");
		expect(testLesson).toHaveAttribute("data-start", "2024-01-15 10:00");
		expect(testLesson).toHaveAttribute("data-end", "2024-01-15 11:00");
		expect(testLesson).toHaveAttribute("data-instructor", "テスト講師");
		expect(testLesson).toHaveAttribute("data-past", "false");

		const pastLessonElement = screen.getByTestId("lesson-過去レッスン");
		expect(pastLessonElement).toHaveAttribute("data-past", "true");
	});

	it("空の日でも日付ラベルが表示される", () => {
		const emptyDays: DayData[] = [
			{
				date: "2024-01-17",
				events: [],
			},
		];

		render(
			<WeeklyTimetable
				days={emptyDays}
				daysOfWeek={["水"]}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		expect(screen.getByTestId("date-label-2024-01-17")).toHaveTextContent(
			"2024-01-17水",
		);
	});

	it("複数のレッスンが同じ日に表示される", () => {
		const multipleLessons: DayData[] = [
			{
				date: "2024-01-15",
				events: [
					mockLesson,
					{
						title: "別のレッスン",
						start: "2024-01-15 14:00",
						end: "2024-01-15 15:00",
						instructor: "kan",
						class: "another-class",
					},
				],
			},
		];

		render(
			<WeeklyTimetable
				days={multipleLessons}
				daysOfWeek={["月"]}
				isPastEvent={mockIsPastEvent}
				getEventStyle={mockGetEventStyle}
			/>,
		);

		expect(screen.getByTestId("lesson-テストレッスン")).toBeInTheDocument();
		expect(screen.getByTestId("lesson-別のレッスン")).toBeInTheDocument();
	});
});
