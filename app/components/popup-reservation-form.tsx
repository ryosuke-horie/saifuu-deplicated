import { useEffect, useState } from "react";
import { Form, useActionData, useNavigation } from "react-router";
import { APP, COMPANY, TIME } from "../constants";
import { useReservation } from "../contexts/ReservationContext";
import type { ReservationFormData } from "../types/form";
import type { Lesson } from "../types/lesson";
import { extractDate } from "../utils/date-utils";
import {
	getDefaultFormValues,
	isFormSubmittable,
} from "../utils/form-transform";
import { extractTime } from "../utils/time-utils";

interface ActionData {
	message: string;
	errors?: string[];
}

/**
 * PopupReservationForm
 *
 * Props drillingを解消し、ReservationContextから直接状態と操作を取得する
 * これにより、Propsの数を大幅に削減（7個 → 0個）
 */
export function PopupReservationForm() {
	// Contextから必要な状態と操作を取得
	const {
		reservationState,
		clearSelection,
		closePopup,
		handleFormSubmission,
		toggleSecondChoice,
	} = useReservation();
	const actionData = useActionData() as ActionData | undefined;
	const navigation = useNavigation();
	const isSubmitting = navigation.state === "submitting";

	// 統合状態から必要な値を取得
	const selectedEvent = reservationState.firstChoice;
	const secondChoiceEvent = reservationState.secondChoice;
	const popupVisible = reservationState.isVisible;

	// selectedEventのnullチェック
	if (!selectedEvent) {
		// 第一希望が選択されていない場合はポップアップを表示しない
		return null;
	}

	// null safetyを改善: 空文字列ではなく、有効なデータがあるかをチェック
	const isSecondChoiceSelected =
		secondChoiceEvent !== null && secondChoiceEvent.title.trim() !== "";

	// フォーム状態管理
	const [formData, setFormData] = useState(() =>
		getDefaultFormValues(selectedEvent, secondChoiceEvent),
	);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const selectSecondChoice = () => {
		toggleSecondChoice();
	};

	// レッスン選択が変更された時にフォームを更新
	useEffect(() => {
		setFormData(getDefaultFormValues(selectedEvent, secondChoiceEvent));
		setErrors({});
	}, [selectedEvent, secondChoiceEvent]);

	// 成功したフォーム送信を処理
	useEffect(() => {
		if (actionData && actionData.message === "メール送信成功") {
			// 成功メッセージ表示後にフォームをクリアしポップアップを閉じる
			const timer = setTimeout(() => {
				setFormData(getDefaultFormValues(selectedEvent, secondChoiceEvent));
				setErrors({});
				handleFormSubmission();
				clearSelection(); // ポップアップを完全にクリアする
			}, TIME.SUCCESS_MESSAGE_TIMEOUT); // ユーザーが成功メッセージを読むための待機時間

			return () => clearTimeout(timer);
		}
	}, [
		actionData,
		handleFormSubmission,
		clearSelection,
		selectedEvent,
		secondChoiceEvent,
	]);

	// フォーム入力変更を処理
	const handleInputChange = (field: string, value: string) => {
		setFormData((prev) => ({ ...prev, [field]: value }));
		// ユーザーが入力を開始した時にこのフィールドのエラーをクリア
		if (errors[field]) {
			setErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	// 基本的なクライアント側バリデーション
	const validateForm = (): boolean => {
		const newErrors: Record<string, string> = {};

		if (!formData.applicantName?.trim()) {
			newErrors.applicantName = APP.VALIDATION.REQUIRED_NAME;
		}
		if (!formData.applicantEmail?.trim()) {
			newErrors.applicantEmail = APP.VALIDATION.REQUIRED_EMAIL;
		}
		if (!formData.applicantPhone?.trim()) {
			newErrors.applicantPhone = APP.VALIDATION.REQUIRED_PHONE;
		}

		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	// フォームが送信可能かチェック（UI フィードバック用）
	const canSubmit = isFormSubmittable(formData) && !isSubmitting;

	if (!popupVisible) {
		return null;
	}

	return (
		<div className="popup" data-testid="reservation-popup">
			<div className="popup-content" data-testid="popup-content">
				<h2>レッスン予約</h2>
				{/* サーバーレスポンスメッセージを表示 */}
				{actionData?.message === APP.MESSAGES.SUCCESS && (
					<div className="success-message" data-testid="success-message">
						<h3>{APP.MESSAGES.RESERVATION_ACCEPTED}</h3>
						<p>{APP.MESSAGES.RESERVATION_THANKS}</p>
						<p>{APP.MESSAGES.CONFIRMATION_EMAIL_SENT}</p>
						<p>{APP.MESSAGES.EMAIL_NOT_RECEIVED}</p>
						<p className="contact-info">📞 {COMPANY.PHONE}</p>
					</div>
				)}

				{actionData?.message && actionData.message !== APP.MESSAGES.SUCCESS && (
					<div className="error-message" data-testid="error-message">
						<h3>{APP.MESSAGES.SEND_ERROR}</h3>
						<p>{actionData.message}</p>
						{actionData.errors && (
							<div>
								<p>{APP.MESSAGES.CHECK_ITEMS}</p>
								<ul>
									{actionData.errors.map((error) => (
										<li key={error}>{error}</li>
									))}
								</ul>
							</div>
						)}
						<p className="retry-message">{APP.MESSAGES.PHONE_IF_UNRESOLVED}</p>
						<p className="contact-info">📞 {COMPANY.PHONE}</p>
					</div>
				)}

				{/* ローディング状態表示 */}
				{isSubmitting && (
					<div className="loading-message">
						<h3>{APP.MESSAGES.SENDING_EMAIL}</h3>
						<p>{APP.MESSAGES.PROCESSING_RESERVATION}</p>
					</div>
				)}
				<Form method="post" data-testid="reservation-form">
					{/* 第一希望レッスンデータの隠し入力 */}
					{/* 第一希望のフィールド - selectedEventはnullチェック済み */}
					<input
						type="hidden"
						name="first-choice-title"
						value={selectedEvent.title}
					/>
					<input
						type="hidden"
						name="first-choice-start"
						value={selectedEvent.start}
					/>
					<input
						type="hidden"
						name="first-choice-end"
						value={selectedEvent.end}
					/>
					<input
						type="hidden"
						name="first-choice-instructor"
						value={selectedEvent.instructor}
					/>

					{/* 第二希望レッスンデータの隠し入力 */}
					{/* 第二希望のフィールドはnull safetyを改善 */}
					<input
						type="hidden"
						name="second-choice-title"
						value={isSecondChoiceSelected ? secondChoiceEvent.title : ""}
					/>
					<input
						type="hidden"
						name="second-choice-start"
						value={isSecondChoiceSelected ? secondChoiceEvent.start : ""}
					/>
					<input
						type="hidden"
						name="second-choice-end"
						value={isSecondChoiceSelected ? secondChoiceEvent.end : ""}
					/>
					<input
						type="hidden"
						name="second-choice-instructor"
						value={isSecondChoiceSelected ? secondChoiceEvent.instructor : ""}
					/>

					<div>
						<span>第一希望：</span>
						<p>
							{selectedEvent.title} ({extractDate(selectedEvent.start)}{" "}
							{extractTime(selectedEvent.start)} -{" "}
							{extractTime(selectedEvent.end)})
						</p>
					</div>
					{isSecondChoiceSelected && (
						<div>
							<span>第二希望：</span>
							<p>
								{secondChoiceEvent.title} (
								{extractDate(secondChoiceEvent.start)}{" "}
								{extractTime(secondChoiceEvent.start)} -{" "}
								{extractTime(secondChoiceEvent.end)})
							</p>
						</div>
					)}
					{!isSecondChoiceSelected && (
						<div>
							<button type="button" onClick={selectSecondChoice}>
								{APP.MESSAGES.SELECT_SECOND_CHOICE}
								<br />
								{APP.MESSAGES.SELECT_SECOND_CHOICE_INSTRUCTION}
							</button>
						</div>
					)}

					{/* 申し込み者氏名フィールド */}
					<div>
						<label htmlFor="applicant-name">申し込み者の氏名：</label>
						<input
							id="applicant-name"
							name="applicant-name"
							type="text"
							value={formData.applicantName || ""}
							onChange={(e) =>
								handleInputChange("applicantName", e.target.value)
							}
							className={errors.applicantName ? "error" : ""}
							data-testid="name-input"
						/>
						{errors.applicantName && (
							<div className="validation-message">{errors.applicantName}</div>
						)}
					</div>

					{/* メールアドレスフィールド */}
					<div>
						<label htmlFor="applicant-email">メールアドレス：</label>
						<input
							id="applicant-email"
							name="applicant-email"
							type="email"
							value={formData.applicantEmail || ""}
							onChange={(e) =>
								handleInputChange("applicantEmail", e.target.value)
							}
							className={errors.applicantEmail ? "error" : ""}
							data-testid="email-input"
						/>
						{errors.applicantEmail && (
							<div className="validation-message">{errors.applicantEmail}</div>
						)}
					</div>

					{/* 電話番号フィールド */}
					<div>
						<label htmlFor="applicant-phone">電話番号：</label>
						<input
							id="applicant-phone"
							name="applicant-phone"
							type="tel"
							value={formData.applicantPhone || ""}
							onChange={(e) =>
								handleInputChange("applicantPhone", e.target.value)
							}
							className={errors.applicantPhone ? "error" : ""}
							data-testid="phone-input"
						/>
						{errors.applicantPhone && (
							<div className="validation-message">{errors.applicantPhone}</div>
						)}
					</div>

					{/* 送信ボタン */}
					<div>
						<button
							type="submit"
							disabled={!canSubmit}
							data-testid="submit-button"
						>
							{isSubmitting
								? APP.MESSAGES.SUBMITTING
								: APP.MESSAGES.CONFIRM_RESERVATION}
						</button>
						{!isSecondChoiceSelected && (
							<div className="validation-message">
								{APP.MESSAGES.SECOND_CHOICE_REQUIRED}
							</div>
						)}
						{errors.root && (
							<div className="validation-message">{errors.root}</div>
						)}
					</div>
					<p className="popup-mail-message">{APP.MESSAGES.MAIL_CONFIRMATION}</p>
				</Form>
				<button
					type="button"
					className="cancel-button"
					onClick={clearSelection}
				>
					キャンセル
				</button>
			</div>
		</div>
	);
}
