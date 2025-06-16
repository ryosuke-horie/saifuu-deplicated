import { SESClient, SendEmailCommand } from "workers-ses";

// AWSシークレットを含むために自動生成されたEnvタイプを拡張
export interface ExtendedEnv extends Env {
	AWS_ACCESS_KEY_ID: string;
	AWS_SECRET_ACCESS_KEY: string;
}

// 実行時にシークレットを含む環境変数にアクセスするためのタイプ
type EnvWithSecrets = Env & {
	AWS_ACCESS_KEY_ID?: string;
	AWS_SECRET_ACCESS_KEY?: string;
	USE_MOCK_EMAIL?: string;
	[key: string]: unknown;
};

// バックエンド仕様に基づいたデータタイプ
export type ParsedData = {
	applicant: {
		name: string; // 申込者氏名
		email: string; // 申込者メールアドレス
		phone: string; // 申込者電話番号
	};
	firstChoice: {
		title: string; // レッスンタイトル
		start: string; // 開始日時 "YYYY/MM/DD HH:MM"
		end: string; // 終了日時 "YYYY/MM/DD HH:MM"
		instructor: string; // インストラクター名
	};
	secondChoice?: {
		// 第二希望（オプショナル）
		title: string;
		start: string;
		end: string;
		instructor: string;
	};
};

// workers-sesを使用したSESクライアントのセットアップ
const createSESClient = (env: ExtendedEnv): SESClient => {
	// 環境オブジェクトから直接シークレットにアクセス
	// シークレットは生成されたタイプに含まれていないため、拡張タイプにキャストする必要がある
	const envWithSecrets = env as EnvWithSecrets;
	const accessKeyId = envWithSecrets.AWS_ACCESS_KEY_ID;
	const secretAccessKey = envWithSecrets.AWS_SECRET_ACCESS_KEY;

	// デバッグ: 環境変数の利用可能性をログ出力（実際の値はログに出力しない）
	console.log("Environment debug:", {
		hasAccessKey: !!accessKeyId,
		hasSecretKey: !!secretAccessKey,
		region: env.AWS_REGION,
		fromEmail: env.SES_FROM_EMAIL,
		envKeys: Object.keys(envWithSecrets).sort(),
		envType: typeof env,
		envConstructor: env.constructor.name,
	});

	// デバッグ用: 完全な環境構造をログ出力（実際の値は除去）
	const envDebug = { ...envWithSecrets };
	if (envDebug.AWS_ACCESS_KEY_ID) envDebug.AWS_ACCESS_KEY_ID = "***";
	if (envDebug.AWS_SECRET_ACCESS_KEY) envDebug.AWS_SECRET_ACCESS_KEY = "***";
	console.log("Full environment structure:", envDebug);

	// 必要な環境変数を検証
	if (!accessKeyId) {
		console.error(
			"AWS_ACCESS_KEY_ID is missing. Available env keys:",
			Object.keys(envWithSecrets),
		);
		throw new Error("AWS_ACCESS_KEY_ID environment variable is not configured");
	}

	if (!secretAccessKey) {
		console.error(
			"AWS_SECRET_ACCESS_KEY is missing. Available env keys:",
			Object.keys(envWithSecrets),
		);
		throw new Error(
			"AWS_SECRET_ACCESS_KEY environment variable is not configured",
		);
	}

	// workers-sesクライアントの設定
	return new SESClient({
		region: "ap-northeast-1", // 指定された東京リージョン
		credentials: {
			accessKeyId: accessKeyId,
			secretAccessKey: secretAccessKey,
		},
	});
};

// メールテンプレート関数
export const createMailBodyToGym = (eventData: ParsedData): string => {
	let mailBody = `申込者情報：
氏名：${eventData.applicant.name}
メール：${eventData.applicant.email}
電話番号：${eventData.applicant.phone}
第一希望：${eventData.firstChoice.title}（${eventData.firstChoice.start} ~ ${eventData.firstChoice.end}）`;

	// 第二希望があれば追加
	if (eventData.secondChoice) {
		mailBody += `
第二希望：${eventData.secondChoice.title}（${eventData.secondChoice.start} ~ ${eventData.secondChoice.end}）`;
	}

	return mailBody;
};

export const createMailBodyToApplicant = (eventData: ParsedData): string => {
	let mailBody = `${eventData.applicant.name} 様
この度はヒデズキックの体験・見学のご予約をいただきありがとうございます。
以下の内容で受付いたしました。
第一希望：${eventData.firstChoice.title}（${eventData.firstChoice.start} ~ ${eventData.firstChoice.end}）`;

	// 第二希望があれば追加
	if (eventData.secondChoice) {
		mailBody += `
第二希望：${eventData.secondChoice.title}（${eventData.secondChoice.start} ~ ${eventData.secondChoice.end}）`;
	}

	mailBody += `
後ほど担当スタッフからメールでご連絡を差し上げます。
今しばらくお待ちください。
このメールは自動送信です。
============================================
ヒデズキック
〒160-0023
新宿区西新宿6-20-11 梅月マンション2F
TEL: 03-5323-3934
============================================`;

	return mailBody;
};

// SESメール送信関数
export const sendMailToGym = async (
	eventData: ParsedData,
	env: ExtendedEnv,
): Promise<void> => {
	const sesClient = createSESClient(env);
	const mailBody = createMailBodyToGym(eventData);

	const sendEmailCommand = new SendEmailCommand({
		Source: "no-reply@timetable-hideskick.net",
		Destination: {
			ToAddresses: ["ryosuke.horie37@gmail.com"],
		},
		Message: {
			Subject: { Data: "体験・見学の申し込みがありました" },
			Body: {
				Text: { Data: mailBody },
			},
		},
	});

	try {
		const response = await sesClient.send(sendEmailCommand);
		console.log(response);
	} catch (error) {
		console.log(error);
		throw error;
	} finally {
		console.log("以下申し込み内容");
		console.log(eventData);
		console.log("ses sendEmail function has been called");
	}
};

export const sendMailToApplicant = async (
	eventData: ParsedData,
	env: ExtendedEnv,
): Promise<void> => {
	const sesClient = createSESClient(env);
	const mailBody = createMailBodyToApplicant(eventData);

	const sendEmailCommand = new SendEmailCommand({
		Source: "no-reply@timetable-hideskick.net",
		Destination: {
			ToAddresses: [eventData.applicant.email],
		},
		Message: {
			Subject: { Data: "【ヒデズキック】体験・見学のご予約を承りました" },
			Body: {
				Text: { Data: mailBody },
			},
		},
	});

	try {
		const response = await sesClient.send(sendEmailCommand);
		console.log(response);
	} catch (error) {
		console.log(error);
		throw error; // エラーをハンドリングまたはログに記録するために再スロー
	} finally {
		console.log("以下申し込み内容");
		console.log(eventData);
		console.log("ses sendEmail function has been called");
	}
};

// 両方のメール関数を順次呼び出すメイン関数
export const sendReservationEmails = async (
	eventData: ParsedData,
	env: ExtendedEnv,
): Promise<void> => {
	// モックメールサービスを使用するかチェック（テスト用）
	const envWithSecrets = env as EnvWithSecrets;
	const useMockEmail = envWithSecrets.USE_MOCK_EMAIL === "true";

	if (useMockEmail) {
		console.log("[MOCK] Using mock email service for testing");
		// テスト用にメールを送信する代わりにログ出力するだけ
		console.log("[MOCK] Would send to gym:", createMailBodyToGym(eventData));
		console.log(
			"[MOCK] Would send to applicant:",
			createMailBodyToApplicant(eventData),
		);
		return; // 成功 - テストモードでは実際にメールを送信しない
	}

	try {
		// 最初にジムに送信（元のLambda実装に合わせて）
		await sendMailToGym(eventData, env);

		// 次に申し込み者に送信
		await sendMailToApplicant(eventData, env);
	} catch (error) {
		console.log(error);
		throw error;
	}
};
