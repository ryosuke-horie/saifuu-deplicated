import type { ZodSchema, z } from "zod";
import {
	type ErrorApiResponse,
	apiResponseSchema,
	errorApiResponseSchema,
} from "../schemas/api-responses";

/**
 * 型安全なAPIクライアント実装
 *
 * 設計方針:
 * - Fetch APIベースの軽量なクライアント
 * - Zodスキーマによる完全な型安全性
 * - 統一されたエラーハンドリング
 * - レスポンスの自動バリデーション
 * - リクエスト/レスポンスのインターセプト機能
 */

// ========================================
// 設定とエラー定義
// ========================================

export interface ApiClientConfig {
	baseUrl?: string;
	timeout?: number;
	headers?: Record<string, string>;
	onRequest?: (request: RequestInit) => RequestInit | Promise<RequestInit>;
	onResponse?: (response: Response) => Response | Promise<Response>;
	onError?: (error: ApiError) => void;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public status: number,
		public response?: ErrorApiResponse,
		public originalError?: Error,
	) {
		super(message);
		this.name = "ApiError";
	}
}

export class ValidationError extends Error {
	constructor(
		message: string,
		public validationErrors: z.ZodError,
	) {
		super(message);
		this.name = "ValidationError";
	}
}

// ========================================
// APIクライアント実装
// ========================================

export class ApiClient {
	private config: Required<ApiClientConfig>;
	// 複数の同時リクエストを管理するためのMap
	private activeRequests = new Map<string, AbortController>();

	constructor(config: ApiClientConfig = {}) {
		this.config = {
			baseUrl: "",
			timeout: 10000,
			headers: {
				"Content-Type": "application/json",
			},
			onRequest: (req) => req,
			onResponse: (res) => res,
			onError: () => {},
			...config,
		};
	}

	/**
	 * 汎用HTTPリクエストメソッド
	 * Zodスキーマによる型安全なレスポンス処理
	 *
	 * 修正内容:
	 * - リクエストごとに独立したAbortControllerを生成
	 * - タイムアウトIDの確実なクリーンアップ
	 * - 競合状態の回避（同時リクエスト対応）
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit,
		responseSchema: ZodSchema<T>,
	): Promise<T> {
		// リクエスト固有のIDを生成（重複リクエスト管理）
		const requestId =
			crypto?.randomUUID?.() ??
			`req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
		let abortController: AbortController | null = null;
		let timeoutId: NodeJS.Timeout | null = null;

		try {
			// リクエスト固有のAbortControllerを作成
			abortController = new AbortController();
			this.activeRequests.set(requestId, abortController);

			// タイムアウト設定
			timeoutId = setTimeout(
				() => abortController?.abort(),
				this.config.timeout,
			);

			// リクエスト設定を構築
			const url = `${this.config.baseUrl}${endpoint}`;
			const requestInit: RequestInit = {
				...options,
				headers: {
					...this.config.headers,
					...options.headers,
				},
				signal: abortController.signal,
			};

			// リクエストインターセプター
			const interceptedRequest = await this.config.onRequest(requestInit);

			// HTTPリクエスト実行
			const response = await fetch(url, interceptedRequest);

			// レスポンスインターセプター
			const interceptedResponse = await this.config.onResponse(response);

			// HTTPステータスエラーをチェック
			if (!interceptedResponse.ok) {
				await this.handleHttpError(interceptedResponse);
			}

			// レスポンスボディを解析
			const rawData = await interceptedResponse.json();

			// Zodスキーマでバリデーション
			const parseResult = responseSchema.safeParse(rawData);
			if (!parseResult.success) {
				throw new ValidationError(
					"レスポンスの形式が不正です",
					parseResult.error,
				);
			}

			return parseResult.data;
		} catch (error) {
			// エラーハンドリング
			const apiError = this.createApiError(error);
			this.config.onError(apiError);
			throw apiError;
		} finally {
			// 確実なクリーンアップ処理
			if (timeoutId) {
				clearTimeout(timeoutId);
			}
			if (requestId) {
				this.activeRequests.delete(requestId);
			}
		}
	}

	/**
	 * HTTPエラー処理
	 */
	private async handleHttpError(response: Response): Promise<never> {
		let errorResponse: ErrorApiResponse | undefined;

		try {
			const rawError = await response.json();
			const parseResult = errorApiResponseSchema.safeParse(rawError);
			if (parseResult.success) {
				errorResponse = parseResult.data;
			}
		} catch {
			// JSONパースに失敗した場合は無視
		}

		const status = response.status ?? 500;
		const message = errorResponse?.error || `HTTPエラー: ${status}`;
		throw new ApiError(message, status, errorResponse);
	}

	/**
	 * 統一されたエラー作成
	 */
	private createApiError(error: unknown): ApiError {
		if (error instanceof ApiError) {
			return error;
		}

		if (error instanceof ValidationError) {
			return new ApiError(
				"レスポンスの検証に失敗しました",
				500,
				undefined,
				error,
			);
		}

		if (error instanceof Error) {
			if (error.name === "AbortError") {
				return new ApiError("リクエストがタイムアウトしました", 408);
			}
			return new ApiError(
				"ネットワークエラーが発生しました",
				0,
				undefined,
				error,
			);
		}

		return new ApiError("不明なエラーが発生しました", 500);
	}

	/**
	 * GETリクエスト
	 */
	async get<T>(endpoint: string, schema: ZodSchema<T>): Promise<T> {
		return this.request(endpoint, { method: "GET" }, schema);
	}

	/**
	 * POSTリクエスト
	 */
	async post<T, U = unknown>(
		endpoint: string,
		data: U,
		schema: ZodSchema<T>,
	): Promise<T> {
		return this.request(
			endpoint,
			{
				method: "POST",
				body: JSON.stringify(data),
			},
			schema,
		);
	}

	/**
	 * PUTリクエスト
	 */
	async put<T, U = unknown>(
		endpoint: string,
		data: U,
		schema: ZodSchema<T>,
	): Promise<T> {
		return this.request(
			endpoint,
			{
				method: "PUT",
				body: JSON.stringify(data),
			},
			schema,
		);
	}

	/**
	 * DELETEリクエスト
	 */
	async delete<T>(endpoint: string, schema: ZodSchema<T>): Promise<T> {
		return this.request(endpoint, { method: "DELETE" }, schema);
	}

	/**
	 * 進行中のリクエストをキャンセル
	 *
	 * 修正内容:
	 * - 全ての進行中リクエストを適切にキャンセル
	 * - 個別リクエストのキャンセル機能も追加
	 */
	cancelRequest(): void {
		// 全ての進行中リクエストをキャンセル
		for (const [requestId, controller] of this.activeRequests) {
			controller.abort();
		}
		this.activeRequests.clear();
	}

	/**
	 * 特定のリクエストIDをキャンセル（将来の拡張用）
	 *
	 * @param requestId - キャンセルするリクエストの一意識別子
	 * @returns リクエストが見つかってキャンセルされた場合はtrue、見つからない場合はfalse
	 *
	 * 副作用:
	 * - 対象リクエストのAbortControllerがabortされる
	 * - activeRequestsから該当エントリが削除される
	 * - アクティブリクエスト数が1つ減少する
	 */
	cancelRequestById(requestId: string): boolean {
		const controller = this.activeRequests.get(requestId);
		if (controller) {
			controller.abort();
			this.activeRequests.delete(requestId);
			return true;
		}
		return false;
	}

	/**
	 * 進行中のリクエスト数を取得
	 */
	getActiveRequestCount(): number {
		return this.activeRequests.size;
	}

	/**
	 * クライアント設定を更新
	 */
	updateConfig(config: Partial<ApiClientConfig>): void {
		this.config = {
			...this.config,
			...config,
			headers: {
				...this.config.headers,
				...config.headers,
			},
		};
	}
}

// ========================================
// デフォルトクライアントインスタンス
// ========================================

export const apiClient = new ApiClient({
	baseUrl: "/api",
	onError: (error) => {
		// 本番環境では適切なロギングを実装
		console.error("API Error:", error);
	},
});

// ========================================
// ユーティリティ関数
// ========================================

/**
 * クエリパラメータを構築
 */
export function buildQueryParams(
	params: Record<string, string | number | boolean | undefined>,
): string {
	const searchParams = new URLSearchParams();

	for (const [key, value] of Object.entries(params)) {
		if (value !== undefined && value !== null) {
			searchParams.append(key, String(value));
		}
	}

	const queryString = searchParams.toString();
	return queryString ? `?${queryString}` : "";
}

/**
 * APIエラーが特定のステータスコードかチェック
 */
export function isApiError(error: unknown, status?: number): error is ApiError {
	if (!(error instanceof ApiError)) {
		return false;
	}
	return status === undefined || error.status === status;
}

/**
 * バリデーションエラーかチェック
 */
export function isValidationError(error: unknown): error is ValidationError {
	return error instanceof ValidationError;
}
