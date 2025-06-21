import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createRequestHandler } from "react-router";

declare module "react-router" {
	export interface AppLoadContext {
		cloudflare: {
			env: Env;
			ctx: ExecutionContext;
		};
	}
}

// Honoアプリケーションの初期化
// APIエンドポイントの処理とミドルウェア設定を行う
const api = new Hono<{ Bindings: Env }>();

// CORS設定 - フロントエンドからのリクエストを許可
api.use(
	"/*",
	cors({
		origin: "*", // 開発環境用、本番環境では具体的なドメインを指定
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization"],
	}),
);

// ログ出力設定 - リクエストの詳細をログに記録
api.use("/*", logger());

// エラーハンドリングミドルウェア
// APIエラーを統一的な形式でレスポンス
api.onError((err, c) => {
	console.error("API Error:", err);
	return c.json(
		{
			error: "Internal Server Error",
			message: err.message,
		},
		500,
	);
});

// ヘルスチェックエンドポイント
// システムの稼働状況とデータベース接続確認
api.get("/health", async (c) => {
	try {
		// データベース接続テスト
		const db = c.env.DB;
		await db.prepare("SELECT 1").first();

		return c.json({
			status: "healthy",
			timestamp: new Date().toISOString(),
			database: "connected",
		});
	} catch (error) {
		console.error("Health check failed:", error);
		return c.json(
			{
				status: "unhealthy",
				timestamp: new Date().toISOString(),
				database: "disconnected",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			503,
		);
	}
});

// API情報エンドポイント
api.get("/", (c) => {
	return c.json({
		name: "Saifuu API",
		version: "1.0.0",
		description: "家計管理アプリケーションのAPI",
		endpoints: {
			health: "/api/health",
			info: "/api/",
		},
	});
});

// React Routerのリクエストハンドラー
const requestHandler = createRequestHandler(
	() => import("virtual:react-router/server-build"),
	import.meta.env.MODE,
);

export default {
	async fetch(
		request: Request,
		env: Env,
		ctx: ExecutionContext,
	): Promise<Response> {
		const url = new URL(request.url);

		// ヘルスチェックエンドポイントのみHonoで処理
		if (url.pathname === "/api/health") {
			return api.fetch(request, env, ctx);
		}

		// その他の全てのルート（APIルートを含む）はReact Routerで処理
		return requestHandler(request, {
			cloudflare: { env, ctx },
		});
	},
} satisfies ExportedHandler<Env>;
