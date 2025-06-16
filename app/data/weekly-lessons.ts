import type { Lesson } from "../types/lesson";
import { addDays, formatDate } from "../utils/date-utils";

/**
 * タイムライン形式スケジュールを1週間分のイベントの配列として計算する
 * @returns {Lesson[]} 1週間分のレッスンの配列
 */
export const getWeeklyLessons = (currentStartOfWeek: Date): Lesson[] => {
	// レッスンの配列
	const lessons: Lesson[] = [];

	// 1週間分のレッスンを定義
	for (let i = 0; i < 7; i++) {
		const day = addDays(currentStartOfWeek, i);

		// 日曜日
		if (i === 0) {
			lessons.push(
				{
					start: formatDate(day, 11, 45),
					end: formatDate(day, 13, 0),
					title: "親子柔術",
					class: "family-jiu-jitsu",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 14, 0),
					end: formatDate(day, 14, 50),
					title: "キック★★★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 15, 0),
					end: formatDate(day, 15, 50),
					title: "ガールズ",
					class: "girls",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 16, 0),
					end: formatDate(day, 16, 50),
					title: "キッズ",
					class: "kids",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 17, 0),
					end: formatDate(day, 18, 30),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
			);
		}

		// 月曜日
		if (i === 1) {
			lessons.push(
				{
					start: formatDate(day, 14, 0),
					end: formatDate(day, 15, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 15, 0),
					end: formatDate(day, 15, 45),
					title: "キック★★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 18, 30),
					end: formatDate(day, 20, 0),
					title: "レスリング",
					class: "wrestling",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 20, 0),
					end: formatDate(day, 21, 30),
					title: "キック★★",
					class: "kick-boxing",
					instructor: "ryosuke",
				},
				{
					start: formatDate(day, 22, 0),
					end: formatDate(day, 23, 0),
					title: "キック&MMA★★★",
					class: "kick-mma",
					instructor: "miyoshi",
				},
			);
		}

		// 火曜日
		if (i === 2) {
			lessons.push(
				{
					start: formatDate(day, 10, 0),
					end: formatDate(day, 13, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 14, 0),
					end: formatDate(day, 16, 0),
					title: "オープンマット",
					class: "open-mat",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 17, 0),
					end: formatDate(day, 17, 50),
					title: "キッズ",
					class: "kids",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 18, 30),
					end: formatDate(day, 20, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 20, 0),
					end: formatDate(day, 21, 30),
					title: "柔術&NOGI",
					class: "jiu-jitsu-nogi",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 22, 0),
					end: formatDate(day, 23, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "kazuki",
				},
			);
		}

		// 水曜日
		if (i === 3) {
			lessons.push(
				{
					start: formatDate(day, 12, 0),
					end: formatDate(day, 12, 50),
					title: "ガールズ",
					class: "girls",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 14, 0),
					end: formatDate(day, 15, 45),
					title: "柔術&NOGI",
					class: "jiu-jitsu-nogi",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 18, 30),
					end: formatDate(day, 20, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 20, 0),
					end: formatDate(day, 21, 30),
					title: "キック★★",
					class: "kick-boxing",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 22, 0),
					end: formatDate(day, 23, 0),
					title: "キック&MMA★★★",
					class: "kick-mma",
					instructor: "miyoshi",
				},
			);
		}

		// 木曜日
		if (i === 4) {
			lessons.push(
				{
					start: formatDate(day, 10, 0),
					end: formatDate(day, 13, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 14, 0),
					end: formatDate(day, 16, 0),
					title: "オープンマット",
					class: "open-mat",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 17, 0),
					end: formatDate(day, 17, 50),
					title: "キッズ",
					class: "kids",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 18, 30),
					end: formatDate(day, 20, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 20, 0),
					end: formatDate(day, 21, 30),
					title: "柔術&NOGI",
					class: "jiu-jitsu-nogi",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 22, 0),
					end: formatDate(day, 23, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "kazuki",
				},
			);
		}

		// 金曜日
		if (i === 5) {
			lessons.push(
				{
					start: formatDate(day, 12, 0),
					end: formatDate(day, 12, 50),
					title: "ガールズ",
					class: "girls",
					instructor: "kazuki",
				},
				{
					start: formatDate(day, 14, 0),
					end: formatDate(day, 15, 0),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 15, 0),
					end: formatDate(day, 15, 45),
					title: "キック★★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 18, 30),
					end: formatDate(day, 20, 0),
					title: "キック★★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 20, 0),
					end: formatDate(day, 21, 30),
					title: "グラップリング",
					class: "grappling",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 22, 0),
					end: formatDate(day, 23, 0),
					title: "キック&MMA★★★",
					class: "kick-mma",
					instructor: "miyoshi",
				},
			);
		}

		// 土曜日
		if (i === 6) {
			lessons.push(
				{
					start: formatDate(day, 17, 0),
					end: formatDate(day, 18, 30),
					title: "キック★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 18, 30),
					end: formatDate(day, 20, 0),
					title: "柔術&NOGI",
					class: "jiu-jitsu-nogi",
					instructor: "miyoshi",
				},
				{
					start: formatDate(day, 20, 0),
					end: formatDate(day, 21, 30),
					title: "キック★★★",
					class: "kick-boxing",
					instructor: "miyoshi",
				},
			);
		}
	}
	return lessons;
};
