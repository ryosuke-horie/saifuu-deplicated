import { TIME } from "../constants";

interface WeekSelectorProps {
	weekDisplay: string;
	onAdvanceWeek: (days: number) => void;
}

export function WeekSelector({
	weekDisplay,
	onAdvanceWeek,
}: WeekSelectorProps) {
	return (
		<div className="week-selector">
			<button
				type="button"
				className="week-button"
				onClick={() => onAdvanceWeek(TIME.WEEK_DAYS_BACK)}
			>
				&lt;
			</button>
			<span className="week-display">{weekDisplay}</span>
			<button
				type="button"
				className="week-button"
				onClick={() => onAdvanceWeek(TIME.WEEK_DAYS_ADVANCE)}
			>
				&gt;
			</button>
		</div>
	);
}
