// 日付を加算するユーティリティ関数
const addDays = (date: Date, days: number): Date => {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
};

// 日付と時刻をフォーマットするユーティリティ関数
const formatDate = (
	date: Date,
	hours: number,
	minutes: number | string,
): string => {
	const newDate = new Date(date);
	newDate.setHours(
		hours,
		typeof minutes === "string" ? Number.parseInt(minutes) : minutes,
		0,
	);

	const year = newDate.getFullYear();
	const month = String(newDate.getMonth() + 1).padStart(2, "0");
	const day = String(newDate.getDate()).padStart(2, "0");
	const hour = String(newDate.getHours()).padStart(2, "0");
	const minute = String(newDate.getMinutes()).padStart(2, "0");

	return `${year}/${month}/${day} ${hour}:${minute}`;
};

// 日付を抽出してフォーマットするメソッド
const extractDate = (dateTime: string) => {
	// "YYYY-MM-DD HH:MM" のフォーマットから "YYYY/MM/DD" 部分だけを取り出し、フォーマットを変更します
	const datePart = dateTime.split(" ")[0];
	const [year] = datePart.split("-");
	return year;
};

export { addDays, formatDate, extractDate };
