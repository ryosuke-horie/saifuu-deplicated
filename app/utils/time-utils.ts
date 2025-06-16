// 時刻を抽出してフォーマットするメソッドを作成します
const extractTime = (dateTime: string) => {
	// "YYYY-MM-DD HH:MM" のフォーマットから "HH:MM" 部分だけを取り出します
	return dateTime.split(" ")[1];
};

export { extractTime };
