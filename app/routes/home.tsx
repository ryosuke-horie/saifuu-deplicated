import { handleReservationSubmission } from "../actions/reservation.server";
import { TimetableControls } from "../components/TimetableControls";
import { WeeklyTimetable } from "../components/WeeklyTimetable";
import { Footer } from "../components/footer";
import { Header } from "../components/header";
import { NoticeBox } from "../components/notice-box";
import { PopupReservationForm } from "../components/popup-reservation-form";
import { ReservationProvider } from "../contexts/ReservationContext";
import { useTimetableData } from "../hooks/useTimetableData";
import { useWeekNavigation } from "../hooks/useWeekNavigation";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
	return [
		{ title: "レッスン体験申し込み - ヒデズキック格闘技ジム" },
		{
			name: "description",
			content:
				"ヒデズキック格闘技ジムのレッスン体験申し込みページです。週間タイムテーブルからお好きなレッスンを選択してお申し込みください。",
		},
	];
}

/**
 * Server Action to handle form submission
 * Delegates to the extracted reservation handler
 */
export async function action(args: Route.ActionArgs) {
	return handleReservationSubmission(args);
}

export default function Home() {
	// Week navigation logic extracted to custom hook
	const { currentStartOfWeek, advanceWeek, weekDisplay } = useWeekNavigation();

	// Timetable data processing logic extracted to custom hook
	const { days, daysOfWeek, isPastEvent, getEventStyle } =
		useTimetableData(currentStartOfWeek);

	return (
		<ReservationProvider>
			<div>
				<Header />
				<h1>レッスン体験申し込み</h1>

				<NoticeBox />
				<div className="timeline-calendar">
					<TimetableControls
						weekDisplay={weekDisplay}
						onAdvanceWeek={advanceWeek}
					/>

					<WeeklyTimetable
						days={days}
						daysOfWeek={daysOfWeek}
						isPastEvent={isPastEvent}
						getEventStyle={getEventStyle}
					/>
				</div>

				<PopupReservationForm />

				<Footer />
			</div>
		</ReservationProvider>
	);
}
