import type { Route } from "./+types/index";

declare module "./index" {
	export const loader: Route.LoaderFunction;
}