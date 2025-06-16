import { useReservation } from "../contexts/ReservationContext";
import type { DayData, EventStyle } from "../hooks/useTimetableData";
import type { Lesson } from "../types/lesson";
import { extractTime } from "../utils/time-utils";

export interface WeeklyTimetableProps {
	/** 各日の日付とイベントを含む日データの配列 */
	days: DayData[];
	/** 曜日ラベルの配列 (日, 月, 火, etc.) */
	daysOfWeek: string[];
	/** イベントが過去かどうかをチェックする関数 */
	isPastEvent: (eventStart: string) => boolean;
	/** イベントの位置決め用CSSスタイルを取得する関数 */
	getEventStyle: (event: Lesson) => EventStyle;
}

/**
 * メインのタイムテーブルビューをレンダリングするコンポーネント
 * 日付と時間で整理されたレッスンを含む週間カレンダーを表示
 *
 * Props drillingを解消：onLessonClickをContextから取得
 */
export function WeeklyTimetable({
	days,
	daysOfWeek,
	isPastEvent,
	getEventStyle,
}: WeeklyTimetableProps) {
	// Contextからレッスンクリックハンドラを取得
	const { handleLessonClick } = useReservation();
	return (
		<div className="days-container" data-testid="weekly-timetable">
			{days.map((day, index) => (
				<div
					key={day.date}
					className="day-column"
					data-testid={`day-column-${index}`}
				>
					<div className="date-label" data-testid={`date-label-${day.date}`}>
						{day.date}
						{daysOfWeek[index]}
					</div>
					{/* 
					Note: useSemanticElementsルールを意図的に無視
					理由: タイムライン表示での複雑なレイアウト要件
					- 時間とタイトルの2要素表示
					- 絶対位置指定によるタイムライン配置
					- button要素では実現困難なデザイン要件
					アクセシビリティ対応: tabIndex, role="button", onKeyDownで代替実装
					*/}
					{day.events.map((event) => (
						<div
							key={event.start}
							className={`event ${isPastEvent(event.start) ? "past" : ""} ${event.class}`}
							style={getEventStyle(event)}
							onClick={() => handleLessonClick(event)}
							onKeyDown={(e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleLessonClick(event);
								}
							}}
							tabIndex={0}
							role="button"
							data-testid={`lesson-${event.title}`}
							data-title={event.title}
							data-start={event.start}
							data-end={event.end}
							data-instructor={event.instructor}
							data-past={isPastEvent(event.start).toString()}
						>
							<div className="event-time">
								{extractTime(event.start)} - {extractTime(event.end)}
							</div>
							<div className="event-title">{event.title}</div>
						</div>
					))}
				</div>
			))}
		</div>
	);
}
