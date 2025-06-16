/**
 * Focused test for specific validation edge cases
 */

import type { ParsedData } from "./email.server";
import { validateReservationData } from "./form-parser.server";

console.log("=== Focused Validation Tests ===");

// Test 1: Empty string validation for required fields
console.log("\n1. Empty string vs whitespace validation:");

const testCases = [
	{
		name: "Empty string",
		value: "",
		shouldHaveError: true,
	},
	{
		name: "Whitespace only",
		value: "   ",
		shouldHaveError: true,
	},
	{
		name: "Valid value",
		value: "田中太郎",
		shouldHaveError: false,
	},
];

for (const testCase of testCases) {
	const testData: ParsedData = {
		applicant: {
			name: testCase.value,
			email: "test@example.com",
			phone: "03-1234-5678",
		},
		firstChoice: {
			title: "キックボクシング初級",
			start: "2024/12/25 19:00",
			end: "2024/12/25 20:00",
			instructor: "小笠原瑛作",
		},
	};

	const validation = validateReservationData(testData);
	const hasNameError = validation.errors.some((e) =>
		e.includes("申込者の氏名"),
	);
	const correct = hasNameError === testCase.shouldHaveError;

	console.log(
		`  ${testCase.name}: ${correct ? "✓" : "✗"} (${hasNameError ? "Has error" : "No error"})`,
	);
}

// Test 2: Empty date/time validation
console.log("\n2. Empty date/time validation:");

const dateCases = [
	{
		name: "Empty string",
		start: "",
		end: "",
		shouldHaveStartError: true,
		shouldHaveEndError: true,
	},
	{
		name: "Whitespace only",
		start: "   ",
		end: "   ",
		shouldHaveStartError: true,
		shouldHaveEndError: true,
	},
	{
		name: "Valid datetime",
		start: "2024/12/25 19:00",
		end: "2024/12/25 20:00",
		shouldHaveStartError: false,
		shouldHaveEndError: false,
	},
	{
		name: "Invalid format",
		start: "2024-12-25 19:00",
		end: "2024-12-25 20:00",
		shouldHaveStartError: true,
		shouldHaveEndError: true,
	},
];

for (const testCase of dateCases) {
	const testData: ParsedData = {
		applicant: {
			name: "田中太郎",
			email: "test@example.com",
			phone: "03-1234-5678",
		},
		firstChoice: {
			title: "キックボクシング初級",
			start: testCase.start,
			end: testCase.end,
			instructor: "小笠原瑛作",
		},
	};

	const validation = validateReservationData(testData);
	const hasStartError = validation.errors.some((e) =>
		e.includes("第一希望の開始時刻"),
	);
	const hasEndError = validation.errors.some((e) =>
		e.includes("第一希望の終了時刻"),
	);

	const startCorrect = hasStartError === testCase.shouldHaveStartError;
	const endCorrect = hasEndError === testCase.shouldHaveEndError;

	console.log(`  ${testCase.name}:`);
	console.log(
		`    Start: ${startCorrect ? "✓" : "✗"} (${hasStartError ? "Has error" : "No error"})`,
	);
	console.log(
		`    End: ${endCorrect ? "✓" : "✗"} (${hasEndError ? "Has error" : "No error"})`,
	);
}

// Test 3: Empty vs Missing field validation
console.log("\n3. Empty vs Missing field validation:");

const emptyFieldData: ParsedData = {
	applicant: {
		name: "",
		email: "",
		phone: "",
	},
	firstChoice: {
		title: "",
		start: "",
		end: "",
		instructor: "",
	},
};

const validation = validateReservationData(emptyFieldData);
console.log(`Total validation errors: ${validation.errors.length}`);
console.log("Errors:");
for (const error of validation.errors) {
	console.log(`  - ${error}`);
}

console.log("\n=== Focused Tests Completed ===");
