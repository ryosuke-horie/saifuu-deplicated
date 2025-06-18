import type { Route } from "./+types/create";

declare module "./create" {
	export const action: Route.ActionFunction;
}