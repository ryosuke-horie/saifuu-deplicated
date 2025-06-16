import type { LessonChoice, ReservationFormData } from "../types/form";
import type { Lesson } from "../types/lesson";

/**
 * アプリケーション固有のバリデーションルール
 */
const VALIDATION_RULES = {
	/** メールアドレスの簡単なバリデーション */
	EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	/** 電話番号（ハイフン、スペース、括弧を許可） */
	PHONE_PATTERN: /^[\d\s\-\(\)\+]+$/,
	/** 最小文字数 */
	MIN_NAME_LENGTH: 1,
} as const;

/**
 * 日時文字列が有効かどうかをチェック
 */
function isValidDateTime(dateTime: string): boolean {
	if (!dateTime.trim()) return false;
	// ISO 8601形式または有効なDateオブジェクトに変換できるかチェック
	const date = new Date(dateTime);
	return !Number.isNaN(date.getTime());
}

/**
 * Type guard: Lessonオブジェクトが完全に有効かどうかをチェック
 * 全ての必須フィールドが非空であり、日時が有効であることを確認
 */
export function isValidLesson(lesson: Lesson | null): lesson is Lesson {
	return (
		lesson !== null &&
		lesson.title.trim() !== "" &&
		isValidDateTime(lesson.start) &&
		isValidDateTime(lesson.end) &&
		lesson.class.trim() !== "" &&
		lesson.instructor.trim() !== ""
	);
}

/**
 * 完全なnull safetyと全フィールドのバリデーション
 */
export function lessonToLessonChoice(
	lesson: Lesson | null,
): LessonChoice | undefined {
	if (!isValidLesson(lesson)) return undefined;

	return {
		title: lesson.title,
		start: lesson.start,
		end: lesson.end,
		instructor: lesson.instructor,
	};
}

/**
 * Transform form data to server FormData format for compatibility with existing server action
 */
export function transformToServerFormData(data: ReservationFormData): FormData {
	const formData = new FormData();

	// Applicant information
	formData.append("applicant-name", data.applicantName);
	formData.append("applicant-email", data.applicantEmail);
	formData.append("applicant-phone", data.applicantPhone);

	// First choice lesson
	if (data.firstChoice) {
		formData.append("first-choice-title", data.firstChoice.title);
		formData.append("first-choice-start", data.firstChoice.start);
		formData.append("first-choice-end", data.firstChoice.end);
		formData.append("first-choice-instructor", data.firstChoice.instructor);
	}

	// Second choice lesson (if provided)
	if (data.secondChoice) {
		formData.append("second-choice-title", data.secondChoice.title);
		formData.append("second-choice-start", data.secondChoice.start);
		formData.append("second-choice-end", data.secondChoice.end);
		formData.append("second-choice-instructor", data.secondChoice.instructor);
	}

	return formData;
}

/**
 * Get default form values from current lesson selections
 * クリーンな実装でnull safetyを呼び出し側で処理
 */
export function getDefaultFormValues(
	selectedEvent: Lesson | null,
	secondChoiceEvent: Lesson | null,
): Partial<ReservationFormData> {
	const firstChoice = lessonToLessonChoice(selectedEvent);
	const secondChoice = lessonToLessonChoice(secondChoiceEvent);

	return {
		applicantName: "",
		applicantEmail: "",
		applicantPhone: "",
		// クリーンな実装: null safetyを呼び出し側で処理
		firstChoice,
		secondChoice,
	};
}

/**
 * Type guard: LessonChoiceオブジェクトが完全に有効かどうかをチェック
 * 全ての必須フィールドが非空であり、日時が有効であることを確認
 */
export function isValidLessonChoice(
	choice: LessonChoice | undefined,
): choice is LessonChoice {
	return (
		choice !== undefined &&
		choice.title.trim() !== "" &&
		isValidDateTime(choice.start) &&
		isValidDateTime(choice.end) &&
		choice.instructor.trim() !== ""
	);
}

/**
 * 申込者情報が有効かどうかをチェック
 */
export function isValidApplicantInfo(
	data: Partial<ReservationFormData>,
): boolean {
	const name = data.applicantName?.trim();
	const email = data.applicantEmail?.trim();
	const phone = data.applicantPhone?.trim();

	return !!(
		name &&
		name.length >= VALIDATION_RULES.MIN_NAME_LENGTH &&
		email &&
		VALIDATION_RULES.EMAIL_PATTERN.test(email) &&
		phone &&
		VALIDATION_RULES.PHONE_PATTERN.test(phone)
	);
}

/**
 * Check if form has minimum required data for submission
 * 完全なバリデーションでフォーム送信可能性を判定
 */
export function isFormSubmittable(data: Partial<ReservationFormData>): boolean {
	const hasValidApplicantInfo = isValidApplicantInfo(data);
	const hasFirstChoice = isValidLessonChoice(data.firstChoice);
	// ビジネスルール: 第二希望の選択が必須
	const hasSecondChoice = isValidLessonChoice(data.secondChoice);

	return hasValidApplicantInfo && hasFirstChoice && hasSecondChoice;
}

/**
 * Extract field-specific error messages from server action errors
 */
export function mapServerErrorsToFields(
	serverErrors: string[] = [],
): Record<string, string> {
	const fieldErrors: Record<string, string> = {};

	for (const error of serverErrors) {
		// Map Japanese error messages to form fields
		if (error.includes("申し込み者の氏名") || error.includes("氏名")) {
			fieldErrors.applicantName = error;
		} else if (error.includes("メールアドレス")) {
			fieldErrors.applicantEmail = error;
		} else if (error.includes("電話番号")) {
			fieldErrors.applicantPhone = error;
		} else if (error.includes("第一希望")) {
			fieldErrors.firstChoice = error;
		} else if (error.includes("第二希望")) {
			fieldErrors.secondChoice = error;
		} else {
			// Generic error
			fieldErrors.root = error;
		}
	}

	return fieldErrors;
}

/**
 * Validate if lesson choices are different
 */
export function areLessonChoicesDifferent(
	firstChoice: LessonChoice,
	secondChoice: LessonChoice | undefined,
): boolean {
	if (!secondChoice) return true;

	return !(
		firstChoice.title === secondChoice.title &&
		firstChoice.start === secondChoice.start
	);
}
