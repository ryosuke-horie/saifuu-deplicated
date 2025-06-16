import { useMemo } from "react";
import { DAYS_OF_WEEK, TIME } from "../constants";
import { getWeeklyLessons } from "../data/weekly-lessons";
import type { Lesson } from "../types/lesson";
import { addDays, formatDate } from "../utils/date-utils";
import { extractTime } from "../utils/time-utils";

export interface DayData {
	date: string;
	events: Lesson[];
}

export interface EventStyle {
	top: string;
	height: string;
	position: "absolute";
	left: string;
	right: string;
}

export interface UseTimetableDataReturn {
	weeklyLessons: Lesson[];
	days: DayData[];
	daysOfWeek: string[];
	isPastEvent: (eventStart: string) => boolean;
	getEventStyle: (classEvent: Lesson) => EventStyle;
}

/**
 * Custom hook to handle timetable data processing logic
 * Extracts all data processing, memoization, and event organization logic
 *
 * @param currentStartOfWeek - The start date of the current week being displayed
 * @returns Object containing processed timetable data and utility functions
 */
export function useTimetableData(
	currentStartOfWeek: Date,
): UseTimetableDataReturn {
	// 週間レッスンデータを計算
	const weeklyLessons = useMemo(() => {
		return getWeeklyLessons(currentStartOfWeek);
	}, [currentStartOfWeek]);

	// 曜日の配列
	const daysOfWeek = useMemo(() => [...DAYS_OF_WEEK], []);

	// 日付ごとのイベントを計算
	const days = useMemo(() => {
		return daysOfWeek.map((dayLabel, index) => {
			const currentDay = addDays(currentStartOfWeek, index);
			const dateString = formatDate(currentDay, 0, 0).split(" ")[0];

			return {
				date: dateString,
				events: weeklyLessons.filter((event) => {
					const eventStartDateString = event.start.split(" ")[0];
					return eventStartDateString === dateString;
				}),
			};
		});
	}, [currentStartOfWeek, weeklyLessons, daysOfWeek]);

	// 過去のイベントかどうかを判定
	const isPastEvent = useMemo(() => {
		return (eventStart: string): boolean => {
			const eventStartTime = new Date(eventStart);
			return eventStartTime < new Date();
		};
	}, []);

	// レッスンの位置とサイズを計算
	const getEventStyle = useMemo(() => {
		return (classEvent: Lesson): EventStyle => {
			const eventStart = classEvent.start.split(" ")[1];
			const eventEnd = classEvent.end.split(" ")[1];

			const [startHour, startMinute] = eventStart.split(":").map(Number);
			const [endHour, endMinute] = eventEnd.split(":").map(Number);

			// タイムライン開始時刻とオフセットを定数から取得
			const top =
				(startHour - TIME.TIMELINE_START_HOUR) * TIME.TIMELINE_OFFSET +
				startMinute +
				TIME.TIMELINE_OFFSET;
			const height =
				(endHour - startHour) * TIME.TIMELINE_OFFSET +
				(endMinute - startMinute);

			return {
				top: `${top}px`,
				height: `${height}px`,
				position: "absolute" as const,
				left: "0",
				right: "0",
			};
		};
	}, []);

	return {
		weeklyLessons,
		days,
		daysOfWeek,
		isPastEvent,
		getEventStyle,
	};
}
