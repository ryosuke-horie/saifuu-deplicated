/**
 * テスト用モックメールサービス
 * テスト中に実際のメール送信を避けるため、AWS SES呼び出しをモック実装で置き換え
 */

import type { ExtendedEnv, ParsedData } from "../../app/utils/email.server";

// テスト用モックメールストレージ
export interface MockEmailData {
	to: string[];
	from: string;
	subject: string;
	body: string;
	timestamp: Date;
	status: "sent" | "failed";
	error?: string;
}

// モックメール用インメモリストレージ
let mockEmailStorage: MockEmailData[] = [];

// モックメールサービスの設定
export interface MockEmailConfig {
	shouldFail: boolean;
	failureRate: number; // 0-1、失敗すべきメールの割合
	delay: number; // ネットワーク遅延をシミュレートするミリ秒
	maxEmails: number; // 保存するメールの最大数
}

let mockConfig: MockEmailConfig = {
	shouldFail: false,
	failureRate: 0,
	delay: 0,
	maxEmails: 100,
};

/**
 * モックメールサービスの動作を設定
 */
export function configureMockEmail(config: Partial<MockEmailConfig>): void {
	mockConfig = { ...mockConfig, ...config };
}

/**
 * テスト中に送信されたすべてのモックメールを取得
 */
export function getMockEmails(): MockEmailData[] {
	return [...mockEmailStorage];
}

/**
 * Get mock emails filtered by recipient
 */
export function getMockEmailsTo(email: string): MockEmailData[] {
	return mockEmailStorage.filter((emailData) => emailData.to.includes(email));
}

/**
 * Get mock emails filtered by subject
 */
export function getMockEmailsBySubject(subject: string): MockEmailData[] {
	return mockEmailStorage.filter((emailData) =>
		emailData.subject.includes(subject),
	);
}

/**
 * Clear all mock emails from storage
 */
export function clearMockEmails(): void {
	mockEmailStorage = [];
}

/**
 * Get the latest mock email sent
 */
export function getLatestMockEmail(): MockEmailData | undefined {
	return mockEmailStorage[mockEmailStorage.length - 1];
}

/**
 * Count mock emails by status
 */
export function getMockEmailStats(): {
	total: number;
	sent: number;
	failed: number;
} {
	return {
		total: mockEmailStorage.length,
		sent: mockEmailStorage.filter((email) => email.status === "sent").length,
		failed: mockEmailStorage.filter((email) => email.status === "failed")
			.length,
	};
}

/**
 * Simulate network delay for testing
 */
async function simulateDelay(): Promise<void> {
	if (mockConfig.delay > 0) {
		await new Promise((resolve) => setTimeout(resolve, mockConfig.delay));
	}
}

/**
 * Determine if email should fail based on configuration
 */
function shouldEmailFail(): boolean {
	if (mockConfig.shouldFail) return true;
	if (mockConfig.failureRate > 0) {
		return Math.random() < mockConfig.failureRate;
	}
	return false;
}

/**
 * Store mock email in memory
 */
function storeMockEmail(emailData: MockEmailData): void {
	mockEmailStorage.push(emailData);

	// Limit storage size
	if (mockEmailStorage.length > mockConfig.maxEmails) {
		mockEmailStorage = mockEmailStorage.slice(-mockConfig.maxEmails);
	}
}

/**
 * Mock implementation of sendMailToGym
 */
export async function mockSendMailToGym(
	eventData: ParsedData,
	env: ExtendedEnv,
): Promise<void> {
	await simulateDelay();

	const emailData: MockEmailData = {
		to: ["ryosuke.horie37@gmail.com"], // Test recipient as per original code
		from: "no-reply@timetable-hideskick.net",
		subject: "体験・見学の申し込みがありました",
		body: createMockMailBodyToGym(eventData),
		timestamp: new Date(),
		status: "sent",
	};

	if (shouldEmailFail()) {
		emailData.status = "failed";
		emailData.error = "Mock SES failure simulation";
		storeMockEmail(emailData);
		throw new Error("Mock SES failure simulation");
	}

	storeMockEmail(emailData);
	console.log("[MOCK] Email to gym sent:", emailData.subject);
}

/**
 * Mock implementation of sendMailToApplicant
 */
export async function mockSendMailToApplicant(
	eventData: ParsedData,
	env: ExtendedEnv,
): Promise<void> {
	await simulateDelay();

	const emailData: MockEmailData = {
		to: [eventData.applicant.email],
		from: "no-reply@timetable-hideskick.net",
		subject: "【ヒデズキック】体験・見学のご予約を承りました",
		body: createMockMailBodyToApplicant(eventData),
		timestamp: new Date(),
		status: "sent",
	};

	if (shouldEmailFail()) {
		emailData.status = "failed";
		emailData.error = "Mock SES failure simulation";
		storeMockEmail(emailData);
		throw new Error("Mock SES failure simulation");
	}

	storeMockEmail(emailData);
	console.log("[MOCK] Email to applicant sent:", emailData.subject);
}

/**
 * Mock implementation of sendReservationEmails
 */
export async function mockSendReservationEmails(
	eventData: ParsedData,
	env: ExtendedEnv,
): Promise<void> {
	try {
		// Send to gym first (as per original implementation)
		await mockSendMailToGym(eventData, env);

		// Then send to applicant
		await mockSendMailToApplicant(eventData, env);
	} catch (error) {
		console.log("[MOCK] Email sending failed:", error);
		throw error;
	}
}

/**
 * Create mock mail body for gym (matches original implementation)
 */
function createMockMailBodyToGym(eventData: ParsedData): string {
	let mailBody = `申込者情報：
氏名：${eventData.applicant.name}
メール：${eventData.applicant.email}
電話番号：${eventData.applicant.phone}
第一希望：${eventData.firstChoice.title}（${eventData.firstChoice.start} ~ ${eventData.firstChoice.end}）`;

	// 第二希望があれば追加
	if (eventData.secondChoice) {
		mailBody += `
第二希望：${eventData.secondChoice.title}（${eventData.secondChoice.start} ~ ${eventData.secondChoice.end}）`;
	}

	return mailBody;
}

/**
 * Create mock mail body for applicant (matches original implementation)
 */
function createMockMailBodyToApplicant(eventData: ParsedData): string {
	let mailBody = `${eventData.applicant.name} 様
この度はヒデズキックの体験・見学のご予約をいただきありがとうございます。
以下の内容で受付いたしました。
第一希望：${eventData.firstChoice.title}（${eventData.firstChoice.start} ~ ${eventData.firstChoice.end}）`;

	// 第二希望があれば追加
	if (eventData.secondChoice) {
		mailBody += `
第二希望：${eventData.secondChoice.title}（${eventData.secondChoice.start} ~ ${eventData.secondChoice.end}）`;
	}

	mailBody += `
後ほど担当スタッフからメールでご連絡を差し上げます。
今しばらくお待ちください。
このメールは自動送信です。
============================================
ヒデズキック
〒160-0023
新宿区西新宿6-20-11 梅月マンション2F
TEL: 03-5323-3934
============================================`;

	return mailBody;
}

/**
 * Reset mock email service to default state
 */
export function resetMockEmailService(): void {
	clearMockEmails();
	mockConfig = {
		shouldFail: false,
		failureRate: 0,
		delay: 0,
		maxEmails: 100,
	};
}
