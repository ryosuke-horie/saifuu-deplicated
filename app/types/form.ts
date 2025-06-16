// Simple form data types without Zod dependency

export interface ReservationFormData {
	applicantName: string;
	applicantEmail: string;
	applicantPhone: string;
	firstChoice?: LessonChoice;
	secondChoice?: LessonChoice;
}

export interface LessonChoice {
	title: string;
	start: string;
	end: string;
	instructor: string;
}
