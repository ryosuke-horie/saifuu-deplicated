import type { Route } from "./+types/$id";

declare module "./$id" {
	export const loader: Route.LoaderFunction;
}