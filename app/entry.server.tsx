import { isbot } from "isbot";
import { createElement } from "react";
import ReactDOMServer from "react-dom/server";
import type { AppLoadContext, EntryContext } from "react-router";
import { ServerRouter } from "react-router";

// React 19互換性のため、シンプルな renderToString を使用
const { renderToString } = ReactDOMServer;

export default async function handleRequest(
	request: Request,
	responseStatusCode: number,
	responseHeaders: Headers,
	routerContext: EntryContext,
	_loadContext: AppLoadContext,
) {
	try {
		// サーバーサイドレンダリング実行
		const html = renderToString(
			createElement(ServerRouter, {
				context: routerContext,
				url: request.url,
			}),
		);

		responseHeaders.set("Content-Type", "text/html");
		return new Response(html, {
			headers: responseHeaders,
			status: responseStatusCode,
		});
	} catch (error) {
		console.error("Server rendering error:", error);
		responseHeaders.set("Content-Type", "text/html");
		return new Response("Internal Server Error", {
			headers: responseHeaders,
			status: 500,
		});
	}
}
