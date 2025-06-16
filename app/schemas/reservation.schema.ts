import { z } from "zod";

// Japanese error messages for validation
const ValidationMessages = {
	required: "この項目は必須です",
	invalidEmail: "有効なメールアドレスを入力してください",
	invalidPhone: "有効な電話番号を入力してください",
	nameTooShort: "氏名は2文字以上で入力してください",
	nameTooLong: "氏名は50文字以内で入力してください",
	emailTooLong: "メールアドレスは100文字以内で入力してください",
	phoneTooShort: "電話番号は10桁以上で入力してください",
	phoneTooLong: "電話番号は15桁以内で入力してください",
} as const;

// Phone number validation regex (Japanese phone numbers)
const phoneRegex = /^[\d\-\+\(\)\s]+$/;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Lesson choice schema
const LessonChoiceSchema = z.object({
	title: z.string().min(1, ValidationMessages.required),
	start: z.string().min(1, ValidationMessages.required),
	end: z.string().min(1, ValidationMessages.required),
	instructor: z.string().min(1, ValidationMessages.required),
});

// Main reservation form schema
export const ReservationFormSchema = z.object({
	// Applicant information
	applicantName: z
		.string()
		.min(1, ValidationMessages.required)
		.min(2, ValidationMessages.nameTooShort)
		.max(50, ValidationMessages.nameTooLong)
		.trim(),

	applicantEmail: z
		.string()
		.min(1, ValidationMessages.required)
		.max(100, ValidationMessages.emailTooLong)
		.regex(emailRegex, ValidationMessages.invalidEmail)
		.toLowerCase()
		.trim(),

	applicantPhone: z
		.string()
		.min(1, ValidationMessages.required)
		.min(10, ValidationMessages.phoneTooShort)
		.max(15, ValidationMessages.phoneTooLong)
		.regex(phoneRegex, ValidationMessages.invalidPhone)
		.trim(),

	// First choice lesson (required)
	firstChoice: LessonChoiceSchema,

	// Second choice lesson (optional but recommended)
	secondChoice: LessonChoiceSchema.optional(),
});

// Type inference from schema
export type ReservationFormData = z.infer<typeof ReservationFormSchema>;

// Lesson choice type
export type LessonChoice = z.infer<typeof LessonChoiceSchema>;

// Schema for server-side validation (with hidden fields)
export const ServerReservationSchema = z.object({
	"applicant-name": z.string().min(1),
	"applicant-email": z.string().email(),
	"applicant-phone": z.string().min(1),
	"first-choice-title": z.string().min(1),
	"first-choice-start": z.string().min(1),
	"first-choice-end": z.string().min(1),
	"first-choice-instructor": z.string().min(1),
	"second-choice-title": z.string().optional(),
	"second-choice-start": z.string().optional(),
	"second-choice-end": z.string().optional(),
	"second-choice-instructor": z.string().optional(),
});

export type ServerReservationData = z.infer<typeof ServerReservationSchema>;

// Custom validation for second choice consistency
export const validateSecondChoiceConsistency = (
	data: ReservationFormData,
): boolean => {
	if (!data.secondChoice) return true;

	// If any second choice field is provided, all must be provided
	const { title, start, end, instructor } = data.secondChoice;
	const hasAnyField = !!(title || start || end || instructor);
	const hasAllFields = !!(title && start && end && instructor);

	return !hasAnyField || hasAllFields;
};

// Validation error types
export interface ValidationError {
	field: string;
	message: string;
}

// Enhanced validation with custom rules
export const validateReservationForm = (
	data: ReservationFormData,
): ValidationError[] => {
	const errors: ValidationError[] = [];

	// Basic schema validation is handled by Zod
	// Add custom business logic validation here

	if (!validateSecondChoiceConsistency(data)) {
		errors.push({
			field: "secondChoice",
			message: "第二希望を選択する場合は、すべての項目を入力してください",
		});
	}

	// Check if first and second choices are different
	if (
		data.secondChoice &&
		data.firstChoice.title === data.secondChoice.title &&
		data.firstChoice.start === data.secondChoice.start
	) {
		errors.push({
			field: "secondChoice",
			message: "第一希望と第二希望は異なるレッスンを選択してください",
		});
	}

	return errors;
};
