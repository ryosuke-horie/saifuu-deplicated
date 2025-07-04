import type { MetaFunction } from "react-router";
import { Links, Meta, Outlet, Scripts } from "react-router";
import "./app.css";
import { Header } from "./components/layout/header";
import { Modal } from "./components/ui/modal";
import { AppProvider, useUIActions, useUIState } from "./contexts/app-context";
import { QueryProvider } from "./lib/query/provider";

// グローバルメタタグ設定
// 検索エンジンによるインデックス化を完全に防止するため、
// 包括的なrobots metaタグを設定
export const meta: MetaFunction = () => {
	return [
		{
			name: "robots",
			content:
				"noindex, nofollow, noarchive, nosnippet, notranslate, noimageindex",
		},
	];
};

export function Layout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="ja">
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#4F46E5" />
				<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
				<link rel="icon" type="image/x-icon" href="/favicon.ico" />
				<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
				<link rel="manifest" href="/manifest.json" />
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

function AppContent() {
	const { isModalOpen, modalContent } = useUIState();
	const { closeModal } = useUIActions();

	return (
		<div className="min-h-screen bg-gray-50">
			{/* 固定ヘッダー */}
			<div className="sticky top-0 z-40">
				<Header showNavigation={true} />
			</div>
			{/* メインコンテンツエリア */}
			<main>
				<Outlet />
			</main>
			{/* グローバルモーダル */}
			<Modal isOpen={isModalOpen} onClose={closeModal}>
				{modalContent}
			</Modal>
		</div>
	);
}

export default function App() {
	return (
		<QueryProvider>
			<AppProvider>
				<AppContent />
			</AppProvider>
		</QueryProvider>
	);
}
