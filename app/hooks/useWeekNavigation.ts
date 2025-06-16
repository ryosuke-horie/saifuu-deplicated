import { useMemo, useState } from "react";
import { TIME } from "../constants";
import { addDays } from "../utils/date-utils";

/**
 * Custom hook for handling week navigation logic
 * Provides current week state, navigation functions, and display utilities
 */
export function useWeekNavigation() {
	/**
	 * Get the start of the current week (Sunday)
	 */
	const getStartOfWeek = () => {
		const now = new Date();
		const sundayDay = 0;
		const daysUntilSunday = (7 + now.getDay() - sundayDay) % 7;
		const startOfWeek = new Date(now);
		startOfWeek.setDate(now.getDate() - daysUntilSunday);
		return startOfWeek;
	};

	// State for the current week's start date
	const [currentStartOfWeek, setCurrentStartOfWeek] = useState(
		getStartOfWeek(),
	);

	/**
	 * Advance the week by specified number of days
	 * @param days - Number of days to advance (can be negative to go back)
	 */
	const advanceWeek = (days: number) => {
		setCurrentStartOfWeek(addDays(currentStartOfWeek, days));
	};

	/**
	 * Calculate the week display string (start date - end date)
	 */
	const weekDisplay = useMemo(() => {
		const endOfWeek = addDays(currentStartOfWeek, TIME.WEEK_END_OFFSET);
		return `${currentStartOfWeek.getFullYear()}/${currentStartOfWeek.getMonth() + 1}/${currentStartOfWeek.getDate()} - ${endOfWeek.getFullYear()}/${endOfWeek.getMonth() + 1}/${endOfWeek.getDate()}`;
	}, [currentStartOfWeek]);

	return {
		currentStartOfWeek,
		advanceWeek,
		weekDisplay,
		getStartOfWeek,
	};
}

export type UseWeekNavigationReturn = ReturnType<typeof useWeekNavigation>;
