import { Links, Meta, Outlet, Scripts } from "react-router";
import "./app.css";
import { AppProvider } from "./contexts/app-context";
import { QueryProvider } from "./lib/query/provider";

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				<link rel="icon" type="image/x-icon" href="/favicon.ico" />
				<Meta />
				<Links />
			</head>
			<body>
				{children}
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	return (
		<QueryProvider>
			<AppProvider>
				<Outlet />
			</AppProvider>
		</QueryProvider>
	);
}
