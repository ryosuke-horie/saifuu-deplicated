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
	private abortController: AbortController | null = null;

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
	 */
	private async request<T>(
		endpoint: string,
		options: RequestInit,
		responseSchema: ZodSchema<T>,
	): Promise<T> {
		try {
			// アボートコントローラーをセットアップ
			this.abortController = new AbortController();
			const timeoutId = setTimeout(
				() => this.abortController?.abort(),
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
				signal: this.abortController.signal,
			};

			// リクエストインターセプター
			const interceptedRequest = await this.config.onRequest(requestInit);

			// HTTPリクエスト実行
			const response = await fetch(url, interceptedRequest);
			clearTimeout(timeoutId);

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
			this.abortController = null;
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

		const message = errorResponse?.error || `HTTPエラー: ${response.status}`;
		throw new ApiError(message, response.status, errorResponse);
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
	 */
	cancelRequest(): void {
		if (this.abortController) {
			this.abortController.abort();
		}
	}

	/**
	 * クライアント設定を更新
	 */
	updateConfig(config: Partial<ApiClientConfig>): void {
		this.config = { ...this.config, ...config };
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
