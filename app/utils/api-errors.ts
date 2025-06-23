/**
 * API エラーハンドリングユーティリティ
 *
 * 設計方針:
 * - データベース関連エラーの詳細診断機能
 * - D1バインディング問題の特定と解決策提示
 * - ユーザーフレンドリーなエラーメッセージと開発者向けデバッグ情報の分離
 * - 本番環境では機密情報の漏洩を防ぎ、開発環境では詳細な診断情報を提供
 */

/**
 * データベースエラーの種類
 */
export type DatabaseErrorType =
	| "CONNECTION_FAILED"
	| "D1_BINDING_MISSING"
	| "D1_BINDING_INVALID"
	| "QUERY_EXECUTION_FAILED"
	| "MIGRATION_FAILED"
	| "SCHEMA_VALIDATION_FAILED"
	| "TRANSACTION_FAILED"
	| "DATABASE_LOCKED"
	| "UNKNOWN_DATABASE_ERROR";

/**
 * エラー診断結果の構造
 */
interface ErrorDiagnostics {
	errorType: DatabaseErrorType;
	userMessage: string;
	debugMessage: string;
	suggestions: string[];
	technicalDetails?: Record<string, any>;
	healthStatus: "healthy" | "degraded" | "unhealthy";
}

/**
 * データベース接続の健全性チェック
 */
export async function checkDatabaseHealth(d1?: D1Database): Promise<{
	isHealthy: boolean;
	status: "healthy" | "degraded" | "unhealthy";
	diagnostics: string[];
}> {
	const diagnostics: string[] = [];

	try {
		// D1バインディングの存在確認
		if (!d1) {
			diagnostics.push(
				"D1バインディングが見つかりません（開発環境またはバインディング設定エラー）",
			);
			return {
				isHealthy: false,
				status: "unhealthy",
				diagnostics,
			};
		}

		// D1バインディングの基本的な健全性チェック
		if (typeof d1.prepare !== "function") {
			diagnostics.push(
				"D1バインディングが無効です（prepareメソッドが存在しません）",
			);
			return {
				isHealthy: false,
				status: "unhealthy",
				diagnostics,
			};
		}

		// 簡単なクエリでデータベース接続を確認
		const healthCheckQuery = d1.prepare("SELECT 1 as test");
		const result = await healthCheckQuery.first();

		if (!result || result.test !== 1) {
			diagnostics.push("データベース基本クエリが失敗しました");
			return {
				isHealthy: false,
				status: "degraded",
				diagnostics,
			};
		}

		// テーブル存在確認（マイグレーション状態のチェック）
		const tableCheckQuery = d1.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name IN ('categories', 'transactions', 'subscriptions')
    `);
		const tables = await tableCheckQuery.all();

		const expectedTables = ["categories", "transactions", "subscriptions"];
		const existingTables = tables.results.map((row: any) => row.name);
		const missingTables = expectedTables.filter(
			(table) => !existingTables.includes(table),
		);

		if (missingTables.length > 0) {
			diagnostics.push(
				`必要なテーブルが見つかりません: ${missingTables.join(", ")}`,
			);
			return {
				isHealthy: false,
				status: "degraded",
				diagnostics: [
					...diagnostics,
					"マイグレーションが未実行の可能性があります",
				],
			};
		}

		diagnostics.push("データベース接続正常");
		return {
			isHealthy: true,
			status: "healthy",
			diagnostics,
		};
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : "不明なエラー";
		diagnostics.push(`データベース健全性チェック中にエラー: ${errorMessage}`);

		return {
			isHealthy: false,
			status: "unhealthy",
			diagnostics,
		};
	}
}

/**
 * エラーの詳細診断を行い、適切なエラータイプと解決策を特定
 */
export function diagnoseError(
	error: unknown,
	d1?: D1Database,
): ErrorDiagnostics {
	const errorMessage = error instanceof Error ? error.message : String(error);
	const errorStack = error instanceof Error ? error.stack : undefined;

	// D1バインディング関連エラーの診断
	if (!d1) {
		return {
			errorType: "D1_BINDING_MISSING",
			userMessage: "データベース接続の設定に問題があります",
			debugMessage: "D1バインディングが見つかりません",
			suggestions: [
				"wrangler.toml または wrangler.jsonc でD1バインディングが正しく設定されているか確認してください",
				"開発環境では --local フラグでD1エミュレーターが起動しているか確認してください",
				"cloudflare/env/DB が正しくバインドされているか確認してください",
			],
			technicalDetails: {
				bindingExists: false,
				environment: process.env.NODE_ENV || "unknown",
			},
			healthStatus: "unhealthy",
		};
	}

	// D1バインディングの型チェック
	if (typeof d1.prepare !== "function") {
		return {
			errorType: "D1_BINDING_INVALID",
			userMessage: "データベース接続の設定に問題があります",
			debugMessage:
				"D1バインディングが無効です（prepareメソッドが存在しません）",
			suggestions: [
				"D1バインディングが正しい型で設定されているか確認してください",
				"wrangler.toml のバインディング設定を確認してください",
				"Cloudflare Workers環境変数が正しく設定されているか確認してください",
			],
			technicalDetails: {
				bindingType: typeof d1,
				availableMethods: Object.getOwnPropertyNames(d1),
			},
			healthStatus: "unhealthy",
		};
	}

	// Drizzle ORM固有のエラーパターン
	if (errorMessage.includes("no such table")) {
		return {
			errorType: "MIGRATION_FAILED",
			userMessage: "データベースの初期化に問題があります",
			debugMessage: `必要なテーブルが存在しません: ${errorMessage}`,
			suggestions: [
				"データベースマイグレーションが正しく実行されているか確認してください",
				"wrangler d1 migrations apply コマンドでマイグレーションを実行してください",
				"ローカル環境では --local フラグでマイグレーションを実行してください",
			],
			technicalDetails: {
				sqlError: errorMessage,
				errorType: "table_missing",
			},
			healthStatus: "degraded",
		};
	}

	// SQLite固有のエラーパターン
	if (errorMessage.includes("database is locked")) {
		return {
			errorType: "DATABASE_LOCKED",
			userMessage: "データベースが一時的に利用できません",
			debugMessage: "データベースがロックされています",
			suggestions: [
				"少し時間をおいて再試行してください",
				"複数の同時リクエストが発生している可能性があります",
				"データベース接続プールの設定を確認してください",
			],
			technicalDetails: {
				sqlError: errorMessage,
				retryable: true,
			},
			healthStatus: "degraded",
		};
	}

	// 一般的なSQL実行エラー
	if (errorMessage.includes("SQLITE_") || errorMessage.includes("SQL")) {
		return {
			errorType: "QUERY_EXECUTION_FAILED",
			userMessage: "データベース処理中にエラーが発生しました",
			debugMessage: `SQLクエリの実行に失敗しました: ${errorMessage}`,
			suggestions: [
				"データベーススキーマが最新の状態か確認してください",
				"クエリパラメータが正しい形式か確認してください",
				"データベース接続が安定しているか確認してください",
			],
			technicalDetails: {
				sqlError: errorMessage,
				errorStack: errorStack?.split("\n").slice(0, 5), // スタックトレースの最初の5行のみ
			},
			healthStatus: "degraded",
		};
	}

	// ネットワーク関連エラー
	if (
		errorMessage.includes("fetch") ||
		errorMessage.includes("network") ||
		errorMessage.includes("timeout")
	) {
		return {
			errorType: "CONNECTION_FAILED",
			userMessage: "データベースへの接続に問題があります",
			debugMessage: `ネットワーク接続エラー: ${errorMessage}`,
			suggestions: [
				"インターネット接続を確認してください",
				"Cloudflare D1サービスの状態を確認してください",
				"タイムアウト設定を調整してください",
			],
			technicalDetails: {
				networkError: errorMessage,
				retryable: true,
			},
			healthStatus: "unhealthy",
		};
	}

	// 不明なエラー
	return {
		errorType: "UNKNOWN_DATABASE_ERROR",
		userMessage: "データベース処理中に予期しないエラーが発生しました",
		debugMessage: `不明なエラー: ${errorMessage}`,
		suggestions: [
			"エラーログを確認してください",
			"データベース接続設定を確認してください",
			"システム管理者にお問い合わせください",
		],
		technicalDetails: {
			originalError: errorMessage,
			errorStack:
				process.env.NODE_ENV === "development"
					? errorStack?.split("\n").slice(0, 5)
					: undefined, // 開発環境でのみスタックトレース表示
			timestamp: new Date().toISOString(),
		},
		healthStatus: "unhealthy",
	};
}

/**
 * 詳細なエラー情報を含むAPIレスポンスを生成
 */
export async function createErrorResponse(
	error: unknown,
	userFriendlyMessage: string,
	d1?: D1Database,
	includeHealthCheck = true,
): Promise<Response> {
	const diagnostics = diagnoseError(error, d1);

	// データベース健全性チェック（オプション）
	let healthCheck = null;
	if (includeHealthCheck) {
		try {
			healthCheck = await checkDatabaseHealth(d1);
		} catch (healthError) {
			// 健全性チェック自体がエラーの場合は無視
			console.warn("データベース健全性チェックでエラー:", healthError);
		}
	}

	// 本番環境では機密情報を除外
	const isProduction = process.env.NODE_ENV === "production";

	const errorResponse = {
		error: userFriendlyMessage,
		details: diagnostics.userMessage,
		errorType: diagnostics.errorType,
		...(isProduction
			? {}
			: {
					// 開発環境でのみ詳細情報を含める
					debugInfo: {
						debugMessage: diagnostics.debugMessage,
						suggestions: diagnostics.suggestions,
						technicalDetails: diagnostics.technicalDetails,
						healthStatus: diagnostics.healthStatus,
						...(healthCheck && {
							databaseHealth: {
								isHealthy: healthCheck.isHealthy,
								status: healthCheck.status,
								diagnostics: healthCheck.diagnostics,
							},
						}),
					},
				}),
	};

	// ログ出力（開発環境では詳細、本番環境では最小限）
	if (isProduction) {
		console.error(
			`[${diagnostics.errorType}] ${userFriendlyMessage}:`,
			diagnostics.userMessage,
		);
	} else {
		console.error(`[${diagnostics.errorType}] ${userFriendlyMessage}:`, {
			debugMessage: diagnostics.debugMessage,
			suggestions: diagnostics.suggestions,
			technicalDetails: diagnostics.technicalDetails,
			healthCheck,
		});
	}

	return new Response(JSON.stringify(errorResponse), {
		status: getStatusCodeForErrorType(diagnostics.errorType),
		headers: { "Content-Type": "application/json" },
	});
}

/**
 * エラータイプに応じた適切なHTTPステータスコードを取得
 */
function getStatusCodeForErrorType(errorType: DatabaseErrorType): number {
	switch (errorType) {
		case "D1_BINDING_MISSING":
		case "D1_BINDING_INVALID":
		case "MIGRATION_FAILED":
			return 503; // Service Unavailable
		case "CONNECTION_FAILED":
		case "DATABASE_LOCKED":
			return 503; // Service Unavailable
		case "QUERY_EXECUTION_FAILED":
		case "SCHEMA_VALIDATION_FAILED":
			return 500; // Internal Server Error
		case "TRANSACTION_FAILED":
			return 409; // Conflict
		default:
			return 500; // Internal Server Error
	}
}

/**
 * 成功レスポンスの統一フォーマット
 */
export function createSuccessResponse(
	data: any,
	additionalFields?: Record<string, any>,
): Response {
	const response = {
		success: true,
		data,
		...additionalFields,
	};

	return new Response(JSON.stringify(response), {
		status: 200,
		headers: { "Content-Type": "application/json" },
	});
}
