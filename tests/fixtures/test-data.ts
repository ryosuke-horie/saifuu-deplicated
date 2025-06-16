/**
 * E2Eテスト用の包括的なテストデータフィクスチャ
 * 有効/無効なフォームデータ、異なるレッスンタイプ、エッジケースを含む
 */

import type { Lesson } from "../../app/types/lesson";
import type { ParsedData } from "../../app/utils/email.server";

// テスト申込者データのバリエーション
export const testApplicants = {
	valid: {
		name: "田中太郎",
		email: "ryosuke.horie37+tanaka@gmail.com",
		phone: "090-1234-5678",
	},
	validKatakana: {
		name: "タナカ　タロウ",
		email: "ryosuke.horie37+katakana@gmail.com",
		phone: "080-9876-5432",
	},
	validHiragana: {
		name: "たなか　たろう",
		email: "ryosuke.horie37+hiragana@gmail.com",
		phone: "070-1111-2222",
	},
	invalidEmail: {
		name: "山田花子",
		email: "invalid-email",
		phone: "090-1234-5678",
	},
	invalidPhone: {
		name: "佐藤次郎",
		email: "ryosuke.horie37+sato@gmail.com",
		phone: "123-456",
	},
	emptyName: {
		name: "",
		email: "ryosuke.horie37+empty@gmail.com",
		phone: "090-1234-5678",
	},
	longName: {
		name: "非常に長い名前を持つ人物の名前がここに入ります",
		email: "ryosuke.horie37+longname@gmail.com",
		phone: "090-1234-5678",
	},
	specialCharsName: {
		name: "田中<script>alert('test')</script>",
		email: "ryosuke.horie37+security@gmail.com",
		phone: "090-1234-5678",
	},
} as const;

// 実際の週間スケジュールに基づくテストレッスンデータ
export const testLessons = {
	sunday: {
		familyJiuJitsu: {
			start: "2024-01-07T11:45:00+09:00",
			end: "2024-01-07T13:00:00+09:00",
			title: "親子柔術",
			class: "family-jiu-jitsu",
			instructor: "miyoshi",
		},
		kickBoxing: {
			start: "2024-01-07T14:00:00+09:00",
			end: "2024-01-07T14:50:00+09:00",
			title: "キック★★★",
			class: "kick-boxing",
			instructor: "miyoshi",
		},
		girls: {
			start: "2024-01-07T15:00:00+09:00",
			end: "2024-01-07T15:50:00+09:00",
			title: "ガールズ",
			class: "girls",
			instructor: "kazuki",
		},
		kids: {
			start: "2024-01-07T16:00:00+09:00",
			end: "2024-01-07T16:50:00+09:00",
			title: "キッズ",
			class: "kids",
			instructor: "kazuki",
		},
	},
	monday: {
		kickBoxingMorning: {
			start: "2024-01-08T14:00:00+09:00",
			end: "2024-01-08T15:00:00+09:00",
			title: "キック★",
			class: "kick-boxing",
			instructor: "miyoshi",
		},
		wrestling: {
			start: "2024-01-08T18:30:00+09:00",
			end: "2024-01-08T20:00:00+09:00",
			title: "レスリング",
			class: "wrestling",
			instructor: "miyoshi",
		},
		kickBoxingEvening: {
			start: "2024-01-08T20:00:00+09:00",
			end: "2024-01-08T21:30:00+09:00",
			title: "キック★★",
			class: "kick-boxing",
			instructor: "ryosuke",
		},
		kickMMA: {
			start: "2024-01-08T22:00:00+09:00",
			end: "2024-01-08T23:00:00+09:00",
			title: "キック&MMA★★★",
			class: "kick-mma",
			instructor: "miyoshi",
		},
	},
	tuesday: {
		kickBoxingLong: {
			start: "2024-01-09T10:00:00+09:00",
			end: "2024-01-09T13:00:00+09:00",
			title: "キック★",
			class: "kick-boxing",
			instructor: "miyoshi",
		},
		openMat: {
			start: "2024-01-09T14:00:00+09:00",
			end: "2024-01-09T16:00:00+09:00",
			title: "オープンマット",
			class: "open-mat",
			instructor: "miyoshi",
		},
		jiuJitsuNogi: {
			start: "2024-01-09T20:00:00+09:00",
			end: "2024-01-09T21:30:00+09:00",
			title: "柔術&NOGI",
			class: "jiu-jitsu-nogi",
			instructor: "miyoshi",
		},
	},
	// Past lessons for testing validation
	pastLesson: {
		start: "2023-12-01T20:00:00+09:00",
		end: "2023-12-01T21:30:00+09:00",
		title: "過去のレッスン",
		class: "kick-boxing",
		instructor: "miyoshi",
	},
} as const;

// Valid form data combinations
export const validFormData = {
	// Standard reservation with both choices
	complete: {
		applicant: testApplicants.valid,
		firstChoice: {
			title: testLessons.monday.kickBoxingMorning.title,
			start: "2024/01/08 14:00",
			end: "2024/01/08 15:00",
			instructor: testLessons.monday.kickBoxingMorning.instructor,
		},
		secondChoice: {
			title: testLessons.monday.wrestling.title,
			start: "2024/01/08 18:30",
			end: "2024/01/08 20:00",
			instructor: testLessons.monday.wrestling.instructor,
		},
	},
	// Reservation with only first choice
	firstChoiceOnly: {
		applicant: testApplicants.validKatakana,
		firstChoice: {
			title: testLessons.tuesday.openMat.title,
			start: "2024/01/09 14:00",
			end: "2024/01/09 16:00",
			instructor: testLessons.tuesday.openMat.instructor,
		},
		secondChoice: undefined,
	},
	// Family class reservation
	familyClass: {
		applicant: testApplicants.validHiragana,
		firstChoice: {
			title: testLessons.sunday.familyJiuJitsu.title,
			start: "2024/01/07 11:45",
			end: "2024/01/07 13:00",
			instructor: testLessons.sunday.familyJiuJitsu.instructor,
		},
		secondChoice: {
			title: testLessons.sunday.kids.title,
			start: "2024/01/07 16:00",
			end: "2024/01/07 16:50",
			instructor: testLessons.sunday.kids.instructor,
		},
	},
	// Advanced classes
	advancedClass: {
		applicant: testApplicants.valid,
		firstChoice: {
			title: testLessons.monday.kickMMA.title,
			start: "2024/01/08 22:00",
			end: "2024/01/08 23:00",
			instructor: testLessons.monday.kickMMA.instructor,
		},
		secondChoice: {
			title: testLessons.sunday.kickBoxing.title,
			start: "2024/01/07 14:00",
			end: "2024/01/07 14:50",
			instructor: testLessons.sunday.kickBoxing.instructor,
		},
	},
} as const;

// Invalid form data for testing validation
export const invalidFormData = {
	// Invalid email format
	invalidEmail: {
		applicant: testApplicants.invalidEmail,
		firstChoice: validFormData.complete.firstChoice,
		secondChoice: undefined,
	},
	// Invalid phone format
	invalidPhone: {
		applicant: testApplicants.invalidPhone,
		firstChoice: validFormData.complete.firstChoice,
		secondChoice: undefined,
	},
	// Empty name
	emptyName: {
		applicant: testApplicants.emptyName,
		firstChoice: validFormData.complete.firstChoice,
		secondChoice: undefined,
	},
	// Missing first choice
	missingFirstChoice: {
		applicant: testApplicants.valid,
		firstChoice: undefined,
		secondChoice: validFormData.complete.secondChoice,
	},
	// Past lesson selection
	pastLesson: {
		applicant: testApplicants.valid,
		firstChoice: {
			title: testLessons.pastLesson.title,
			start: "2023/12/01 20:00",
			end: "2023/12/01 21:30",
			instructor: testLessons.pastLesson.instructor,
		},
		secondChoice: undefined,
	},
	// Special characters in name (potential XSS)
	specialChars: {
		applicant: testApplicants.specialCharsName,
		firstChoice: validFormData.complete.firstChoice,
		secondChoice: undefined,
	},
	// Very long name
	longName: {
		applicant: testApplicants.longName,
		firstChoice: validFormData.complete.firstChoice,
		secondChoice: undefined,
	},
} as const;

// Edge case scenarios
export const edgeCaseData = {
	// Same lesson for both choices
	sameLesson: {
		applicant: testApplicants.valid,
		firstChoice: validFormData.complete.firstChoice,
		secondChoice: validFormData.complete.firstChoice, // Same as first choice
	},
	// Very early lesson
	earlyLesson: {
		applicant: testApplicants.valid,
		firstChoice: {
			title: testLessons.tuesday.kickBoxingLong.title,
			start: "2024/01/09 10:00",
			end: "2024/01/09 13:00",
			instructor: testLessons.tuesday.kickBoxingLong.instructor,
		},
		secondChoice: undefined,
	},
	// Very late lesson
	lateLesson: {
		applicant: testApplicants.valid,
		firstChoice: {
			title: testLessons.monday.kickMMA.title,
			start: "2024/01/08 22:00",
			end: "2024/01/08 23:00",
			instructor: testLessons.monday.kickMMA.instructor,
		},
		secondChoice: undefined,
	},
} as const;

// Form data for different lesson types
export const lessonTypeData = {
	kickBoxing: {
		applicant: testApplicants.valid,
		firstChoice: {
			title: "キック★",
			start: "2024/01/08 14:00",
			end: "2024/01/08 15:00",
			instructor: "miyoshi",
		},
		secondChoice: {
			title: "キック★★",
			start: "2024/01/08 20:00",
			end: "2024/01/08 21:30",
			instructor: "ryosuke",
		},
	},
	jiuJitsu: {
		applicant: testApplicants.validKatakana,
		firstChoice: {
			title: "柔術&NOGI",
			start: "2024/01/09 20:00",
			end: "2024/01/09 21:30",
			instructor: "miyoshi",
		},
		secondChoice: undefined,
	},
	wrestling: {
		applicant: testApplicants.validHiragana,
		firstChoice: {
			title: "レスリング",
			start: "2024/01/08 18:30",
			end: "2024/01/08 20:00",
			instructor: "miyoshi",
		},
		secondChoice: undefined,
	},
	kids: {
		applicant: testApplicants.valid,
		firstChoice: {
			title: "キッズ",
			start: "2024/01/07 16:00",
			end: "2024/01/07 16:50",
			instructor: "kazuki",
		},
		secondChoice: undefined,
	},
	girls: {
		applicant: testApplicants.validKatakana,
		firstChoice: {
			title: "ガールズ",
			start: "2024/01/07 15:00",
			end: "2024/01/07 15:50",
			instructor: "kazuki",
		},
		secondChoice: undefined,
	},
	openMat: {
		applicant: testApplicants.validHiragana,
		firstChoice: {
			title: "オープンマット",
			start: "2024/01/09 14:00",
			end: "2024/01/09 16:00",
			instructor: "miyoshi",
		},
		secondChoice: undefined,
	},
} as const;

// Convert test data to ParsedData format for backend testing
export function convertToParseData(
	formData: (typeof validFormData)[keyof typeof validFormData],
): ParsedData {
	return {
		applicant: formData.applicant,
		firstChoice: formData.firstChoice,
		secondChoice: formData.secondChoice,
	} as ParsedData;
}

// Form data for HTML form submission
export function createFormData(
	testData: (typeof validFormData)[keyof typeof validFormData],
): FormData {
	const formData = new FormData();

	// Applicant data
	formData.append("name", testData.applicant.name);
	formData.append("email", testData.applicant.email);
	formData.append("phone", testData.applicant.phone);

	// First choice
	if (testData.firstChoice) {
		formData.append("firstChoice.title", testData.firstChoice.title);
		formData.append("firstChoice.start", testData.firstChoice.start);
		formData.append("firstChoice.end", testData.firstChoice.end);
		formData.append("firstChoice.instructor", testData.firstChoice.instructor);
	}

	// Second choice (optional)
	if (testData.secondChoice) {
		formData.append("secondChoice.title", testData.secondChoice.title);
		formData.append("secondChoice.start", testData.secondChoice.start);
		formData.append("secondChoice.end", testData.secondChoice.end);
		formData.append(
			"secondChoice.instructor",
			testData.secondChoice.instructor,
		);
	}

	return formData;
}

// Test scenarios for E2E testing
export const testScenarios = {
	// Happy path scenarios
	happyPath: {
		completeReservation: validFormData.complete,
		firstChoiceOnly: validFormData.firstChoiceOnly,
		familyClass: validFormData.familyClass,
		advancedClass: validFormData.advancedClass,
	},
	// Validation scenarios
	validation: {
		invalidEmail: invalidFormData.invalidEmail,
		invalidPhone: invalidFormData.invalidPhone,
		emptyName: invalidFormData.emptyName,
		missingFirstChoice: invalidFormData.missingFirstChoice,
		pastLesson: invalidFormData.pastLesson,
	},
	// Edge cases
	edgeCases: {
		sameLesson: edgeCaseData.sameLesson,
		earlyLesson: edgeCaseData.earlyLesson,
		lateLesson: edgeCaseData.lateLesson,
		longName: invalidFormData.longName,
	},
	// Security testing
	security: {
		specialChars: invalidFormData.specialChars,
	},
	// Lesson type specific
	lessonTypes: lessonTypeData,
} as const;

// Mock lesson data generator for specific dates
export function generateLessonsForDate(date: Date): Lesson[] {
	const dayOfWeek = date.getDay();
	const lessons: Lesson[] = [];

	// Add lessons based on day of week (simplified version)
	switch (dayOfWeek) {
		case 0: // Sunday
			lessons.push({
				start: new Date(date.getTime() + 11 * 60 * 60 * 1000).toISOString(),
				end: new Date(date.getTime() + 13 * 60 * 60 * 1000).toISOString(),
				title: "親子柔術",
				class: "family-jiu-jitsu",
				instructor: "miyoshi",
			});
			break;
		case 1: // Monday
			lessons.push({
				start: new Date(date.getTime() + 14 * 60 * 60 * 1000).toISOString(),
				end: new Date(date.getTime() + 15 * 60 * 60 * 1000).toISOString(),
				title: "キック★",
				class: "kick-boxing",
				instructor: "miyoshi",
			});
			break;
		// Add more days as needed
	}

	return lessons;
}
