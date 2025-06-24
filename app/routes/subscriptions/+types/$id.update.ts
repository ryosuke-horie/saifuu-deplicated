import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { SelectSubscription } from "../../../types";

export interface ActionArgs extends ActionFunctionArgs {
	context: {
		cloudflare: {
			env: {
				DB: D1Database;
			};
		};
	};
}
export interface LoaderArgs extends LoaderFunctionArgs {
	context: {
		cloudflare: {
			env: {
				DB: D1Database;
			};
		};
	};
}

export interface ComponentProps {
	loaderData?: {
		subscription: SelectSubscription;
	};
	actionData?: {
		errors?: {
			name?: string[];
			amount?: string[];
			frequency?: string[];
			nextPaymentDate?: string[];
			description?: string[];
			_form?: string[];
		};
	};
}

export namespace Route {
	export type ActionArgs = ActionFunctionArgs;
	export type LoaderArgs = LoaderFunctionArgs;
	export type ComponentProps = {
		loaderData?: {
			subscription: SelectSubscription;
		};
		actionData?: {
			errors?: {
				name?: string[];
				amount?: string[];
				frequency?: string[];
				nextPaymentDate?: string[];
				description?: string[];
				_form?: string[];
			};
		};
	};
}
