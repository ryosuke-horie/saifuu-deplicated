import { APP, COMPANY } from "../constants";

export function Footer() {
	return (
		<footer>
			<div className="shell shell-images">
				<div className="footer_logo">
					<img
						src={APP.IMAGES.FOOTER_LOGO_HIDESKICK}
						alt="ヒデズキックのロゴ"
					/>
				</div>
				<div className="try-force_logo">
					<img src={APP.IMAGES.FOOTER_LOGO_TRY_FORCE} alt="TRY-FORCEのロゴ" />
				</div>
			</div>
			<div className="shell">
				<p className="copy-right">{COMPANY.COPYRIGHT}</p>
			</div>
		</footer>
	);
}
