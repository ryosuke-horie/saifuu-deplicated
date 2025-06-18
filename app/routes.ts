import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
	index("routes/home.tsx"),

	// カテゴリAPIエンドポイント
	route("api/categories", "routes/api/categories/index.ts"),
	route("api/categories/create", "routes/api/categories/create.ts"),
	route("api/categories/reorder", "routes/api/categories/reorder.ts"),
	route("api/categories/:id/update", "routes/api/categories/$id.update.ts"),
	route("api/categories/:id/delete", "routes/api/categories/$id.delete.ts"),

	// 取引APIエンドポイント
	route("api/transactions", "routes/api/transactions/index.ts"),
	route("api/transactions/create", "routes/api/transactions/create.ts"),
	route("api/transactions/:id", "routes/api/transactions/$id.ts"),
	route("api/transactions/:id/update", "routes/api/transactions/$id.update.ts"),
	route("api/transactions/:id/delete", "routes/api/transactions/$id.delete.ts"),
] satisfies RouteConfig;
