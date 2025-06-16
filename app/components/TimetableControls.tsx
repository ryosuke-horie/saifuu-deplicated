import { useReservation } from "../contexts/ReservationContext";

interface TimetableControlsProps {
	weekDisplay: string;
	onAdvanceWeek: (days: number) => void;
}

/**
 * タイムテーブルのナビゲーションとコントロール機能を処理するコンポーネント
 * 週間ナビゲーションと現在の週の範囲表示を含む
 *
 * Props drillingを解消：selectingSecondChoiceをContextから取得
 */
export function TimetableControls({
	weekDisplay,
	onAdvanceWeek,
}: TimetableControlsProps) {
	// Contextから第二希望選択状態を取得
	const { reservationState } = useReservation();
	const selectingSecondChoice = reservationState.mode === "selecting_second";
	return (
		<div className="timetable-controls" data-testid="timetable-controls">
			{/* 週間ナビゲーションコントロール */}
			<div className="week-selector" data-testid="week-selector">
				<button
					type="button"
					className="week-button"
					onClick={() => onAdvanceWeek(-7)}
					aria-label="前の週"
					data-testid="prev-week-button"
				>
					&lt;
				</button>
				<span className="week-display" data-testid="current-week-display">
					{weekDisplay}
				</span>
				<button
					type="button"
					className="week-button"
					onClick={() => onAdvanceWeek(7)}
					aria-label="次の週"
					data-testid="next-week-button"
				>
					&gt;
				</button>
			</div>

			{/* 選択モード表示 */}
			{selectingSecondChoice && (
				<div
					className="selection-mode-indicator"
					data-testid="selection-mode-indicator"
				>
					<span
						className="selection-mode-text"
						data-testid="selection-mode-text"
					>
						第二希望を選択してください
					</span>
				</div>
			)}
		</div>
	);
}
