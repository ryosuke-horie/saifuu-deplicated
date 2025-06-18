import type { AppLoadContext } from "react-router";

export namespace Route {
	export interface ActionArgs {
		request: Request;
		context: AppLoadContext;
		params: { id: string };
	}
}
