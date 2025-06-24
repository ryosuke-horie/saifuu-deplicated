import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";

export interface ActionArgs extends ActionFunctionArgs {
	context: {
		cloudflare: {
			env: {
				DB: D1Database;
			};
		};
	};
}
export interface LoaderArgs extends LoaderFunctionArgs {}

export interface ComponentProps {
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
