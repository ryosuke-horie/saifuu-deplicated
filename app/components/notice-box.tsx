import { APP, COMPANY } from "../constants";

export function NoticeBox() {
	return (
		<div className="notice-box">
			<div className="notice-box__content">
				<p>
					<strong className="notice_box__content__strong">
						{APP.MESSAGES.MAIN_INSTRUCTION}
					</strong>
					<br />
					<br />
					{APP.MESSAGES.TRIAL_DESCRIPTION}
					<br />
					{APP.MESSAGES.EMAIL_CONTACT_INFO}
					<br />
					{APP.MESSAGES.STAFF_SUPPORT}
					<br />
					<br />
					{APP.MESSAGES.BUSINESS_RESPONSE}
					<br />
					{APP.MESSAGES.EMAIL_DELAY_WARNING}
					<br />
					{APP.MESSAGES.PHONE_CONTACT_REQUEST}
				</p>
				<div className="notice-box__phone">
					<p>■{APP.MESSAGES.PHONE_CONTACT}</p>
					<p>
						TEL: <a href={`tel:${COMPANY.PHONE}`}>{COMPANY.PHONE}</a>
					</p>
				</div>
			</div>
		</div>
	);
}
