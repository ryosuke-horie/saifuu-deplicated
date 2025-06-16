import type { Instructor } from "../types/lesson";
import type { ParsedData } from "./email.server";

// Instructor mapping from code to Japanese name
// Based on the project description: 小笠原瑛作、榎本真也、小笠原陸斗、石岡小夏、芝哲平、山本雄紀、木村拓海、吉田龍、宮木佑太、藤田大地、佐々木蓮
const INSTRUCTOR_MAP: Record<Instructor, string> = {
	miyoshi: "小笠原瑛作",
	miyaso: "榎本真也",
	kan: "小笠原陸斗",
	kazuki: "石岡小夏",
	sato: "芝哲平",
	ogura: "山本雄紀",
	ozawa: "木村拓海",
	ise: "吉田龍",
	ryosuke: "宮木佑太",
} as const;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone validation regex (basic Japanese phone number format)
const PHONE_REGEX = /^[\d\-\+\(\)\s]+$/;

/**
 * Parse React Router FormData into reservation data structure
 * @param formData - FormData from React Router form submission
 * @returns ParsedData structure for email functions
 */
export function parseFormDataToReservation(formData: FormData): ParsedData {
	// Extract applicant information
	const applicantName = formData.get("applicant-name")?.toString() || "";
	const applicantEmail = formData.get("applicant-email")?.toString() || "";
	const applicantPhone = formData.get("applicant-phone")?.toString() || "";

	// Extract first choice lesson data
	const firstChoiceTitle = formData.get("first-choice-title")?.toString() || "";
	const firstChoiceStart = formData.get("first-choice-start")?.toString() || "";
	const firstChoiceEnd = formData.get("first-choice-end")?.toString() || "";
	const firstChoiceInstructor =
		formData.get("first-choice-instructor")?.toString() || "";

	// Extract optional second choice lesson data
	const secondChoiceTitle = formData.get("second-choice-title")?.toString();
	const secondChoiceStart = formData.get("second-choice-start")?.toString();
	const secondChoiceEnd = formData.get("second-choice-end")?.toString();
	const secondChoiceInstructor = formData
		.get("second-choice-instructor")
		?.toString();

	// Convert instructor codes to Japanese names
	const firstInstructorName =
		INSTRUCTOR_MAP[firstChoiceInstructor as Instructor] ||
		firstChoiceInstructor;
	const secondInstructorName = secondChoiceInstructor
		? INSTRUCTOR_MAP[secondChoiceInstructor as Instructor] ||
			secondChoiceInstructor
		: undefined;

	// Build the parsed data structure
	const parsedData: ParsedData = {
		applicant: {
			name: applicantName,
			email: applicantEmail,
			phone: applicantPhone,
		},
		firstChoice: {
			title: firstChoiceTitle,
			start: firstChoiceStart,
			end: firstChoiceEnd,
			instructor: firstInstructorName,
		},
	};

	// Add second choice if all required fields are present
	if (
		secondChoiceTitle &&
		secondChoiceStart &&
		secondChoiceEnd &&
		secondInstructorName
	) {
		parsedData.secondChoice = {
			title: secondChoiceTitle,
			start: secondChoiceStart,
			end: secondChoiceEnd,
			instructor: secondInstructorName,
		};
	}

	return parsedData;
}

/**
 * Validate parsed reservation data
 * @param data - ParsedData to validate
 * @returns Validation result with errors if any
 */
export function validateReservationData(data: ParsedData): {
	isValid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	// Validate applicant information
	if (!data.applicant.name.trim()) {
		errors.push("申込者の氏名が入力されていません");
	}

	if (!data.applicant.email.trim()) {
		errors.push("メールアドレスが入力されていません");
	} else if (!EMAIL_REGEX.test(data.applicant.email)) {
		errors.push("メールアドレスの形式が正しくありません");
	}

	if (!data.applicant.phone.trim()) {
		errors.push("電話番号が入力されていません");
	} else if (!PHONE_REGEX.test(data.applicant.phone)) {
		errors.push("電話番号の形式が正しくありません");
	}

	// Validate first choice (required)
	if (!data.firstChoice.title.trim()) {
		errors.push("第一希望のレッスンタイトルが設定されていません");
	}

	if (!data.firstChoice.start.trim()) {
		errors.push("第一希望の開始時刻が設定されていません");
	}

	if (!data.firstChoice.end.trim()) {
		errors.push("第一希望の終了時刻が設定されていません");
	}

	if (!data.firstChoice.instructor.trim()) {
		errors.push("第一希望のインストラクターが設定されていません");
	}

	// Validate date/time format for first choice
	if (
		data.firstChoice.start.trim() &&
		!isValidDateTimeFormat(data.firstChoice.start)
	) {
		errors.push(
			"第一希望の開始時刻の形式が正しくありません (YYYY/MM/DD HH:MM形式で入力してください)",
		);
	}

	if (
		data.firstChoice.end.trim() &&
		!isValidDateTimeFormat(data.firstChoice.end)
	) {
		errors.push(
			"第一希望の終了時刻の形式が正しくありません (YYYY/MM/DD HH:MM形式で入力してください)",
		);
	}

	// Validate second choice if provided (all fields must be present or all must be empty)
	if (data.secondChoice) {
		if (!data.secondChoice.title.trim()) {
			errors.push("第二希望のレッスンタイトルが設定されていません");
		}

		if (!data.secondChoice.start.trim()) {
			errors.push("第二希望の開始時刻が設定されていません");
		}

		if (!data.secondChoice.end.trim()) {
			errors.push("第二希望の終了時刻が設定されていません");
		}

		if (!data.secondChoice.instructor.trim()) {
			errors.push("第二希望のインストラクターが設定されていません");
		}

		// Validate date/time format for second choice
		if (
			data.secondChoice.start.trim() &&
			!isValidDateTimeFormat(data.secondChoice.start)
		) {
			errors.push(
				"第二希望の開始時刻の形式が正しくありません (YYYY/MM/DD HH:MM形式で入力してください)",
			);
		}

		if (
			data.secondChoice.end.trim() &&
			!isValidDateTimeFormat(data.secondChoice.end)
		) {
			errors.push(
				"第二希望の終了時刻の形式が正しくありません (YYYY/MM/DD HH:MM形式で入力してください)",
			);
		}
	}

	return {
		isValid: errors.length === 0,
		errors,
	};
}

/**
 * Validate date/time format (YYYY/MM/DD HH:MM)
 * @param dateTime - Date/time string to validate
 * @returns True if format is valid
 */
function isValidDateTimeFormat(dateTime: string): boolean {
	// Expected format: YYYY/MM/DD HH:MM
	const dateTimeRegex = /^\d{4}\/\d{2}\/\d{2} \d{2}:\d{2}$/;

	if (!dateTimeRegex.test(dateTime)) {
		return false;
	}

	// Try to parse the date to ensure it's a valid date
	try {
		const [datePart, timePart] = dateTime.split(" ");
		const [year, month, day] = datePart.split("/").map(Number);
		const [hour, minute] = timePart.split(":").map(Number);

		const date = new Date(year, month - 1, day, hour, minute);

		// Check if the parsed date matches the input (to catch invalid dates like 2024/13/01)
		return (
			date.getFullYear() === year &&
			date.getMonth() === month - 1 &&
			date.getDate() === day &&
			date.getHours() === hour &&
			date.getMinutes() === minute
		);
	} catch {
		return false;
	}
}

/**
 * Helper function to format lesson data for form submission
 * @param lesson - Lesson object to format
 * @param fieldPrefix - Prefix for form field names ("first-choice" or "second-choice")
 * @returns Object with form field names and values
 */
export function formatLessonForForm(
	lesson: { title: string; start: string; end: string; instructor: string },
	fieldPrefix: "first-choice" | "second-choice",
): Record<string, string> {
	return {
		[`${fieldPrefix}-title`]: lesson.title,
		[`${fieldPrefix}-start`]: lesson.start,
		[`${fieldPrefix}-end`]: lesson.end,
		[`${fieldPrefix}-instructor`]: lesson.instructor,
	};
}
