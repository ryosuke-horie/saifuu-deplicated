import { APP, COMPANY } from "../constants";

export function Header() {
	return (
		<div className="header">
			<div className="header_contents">
				<a href={COMPANY.WEBSITE.BASE}>
					<img
						width={APP.IMAGES.HEADER_LOGO_WIDTH}
						height={APP.IMAGES.HEADER_LOGO_HEIGHT}
						src={APP.IMAGES.HEADER_LOGO}
						alt=""
					/>
				</a>
				<div className="header_menu">
					<a href={COMPANY.WEBSITE.PRICE} target="_blank" rel="noreferrer">
						<span>料金</span>
					</a>
					<a href={COMPANY.WEBSITE.JOIN} target="_blank" rel="noreferrer">
						<span>入会案内</span>
					</a>
					<a href={COMPANY.WEBSITE.TIMETABLE} target="_blank" rel="noreferrer">
						<span>タイムテーブル</span>
					</a>
					<a href={COMPANY.WEBSITE.INSTRUCTOR} target="_blank" rel="noreferrer">
						<span>インストラクター</span>
					</a>
					<a href={COMPANY.WEBSITE.BLOG} target="_blank" rel="noreferrer">
						<span>ブログ</span>
					</a>
				</div>
			</div>
		</div>
	);
}
