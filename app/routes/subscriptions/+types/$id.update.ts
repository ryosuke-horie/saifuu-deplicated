import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import type { SelectSubscription } from "../../../types";

export interface ActionArgs extends ActionFunctionArgs {}
export interface LoaderArgs extends LoaderFunctionArgs {}

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
