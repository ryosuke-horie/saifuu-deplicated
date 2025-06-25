import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/_index.tsx"),

	// Chrome DevToolsの.well-knownリクエスト対応
	route(".well-known/*", "routes/.well-known.tsx"),

	route("subscriptions", "routes/subscriptions.tsx"),

	// カテゴリAPIエンドポイント
	route("api/categories", "routes/api/categories/index.ts"),
	route("api/categories/create", "routes/api/categories/create.ts"),
	route("api/categories/reorder", "routes/api/categories/reorder.ts"),
	route("api/categories/:id/update", "routes/api/categories/$id.update.ts"),
	route("api/categories/:id/delete", "routes/api/categories/$id.delete.ts"),

	// サブスクリプションAPIエンドポイント
	route("api/subscriptions", "routes/api/subscriptions/index.ts"),
	route("api/subscriptions/create", "routes/api/subscriptions/create.ts"),
	route("api/subscriptions/:id", "routes/api/subscriptions/$id.ts"),
	route(
		"api/subscriptions/:id/update",
		"routes/api/subscriptions/$id.update.ts",
	),
	route(
		"api/subscriptions/:id/delete",
		"routes/api/subscriptions/$id.delete.ts",
	),
	route("api/subscriptions/activate", "routes/api/subscriptions/activate.ts"),
	route(
		"api/subscriptions/deactivate",
		"routes/api/subscriptions/deactivate.ts",
	),
] satisfies RouteConfig;
