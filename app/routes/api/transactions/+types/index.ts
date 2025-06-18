import type { AppLoadContext } from "react-router";

export namespace Route {
	export interface LoaderArgs {
		request: Request;
		context: AppLoadContext;
		params: Record<string, string>;
	}
}
