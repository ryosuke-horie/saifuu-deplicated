import type { Config } from "@react-router/dev/config";

export default {
	appDirectory: "app",
	ssr: true,
	buildDirectory: "dist",
	// React 19 + React Router v7互換性向上のための設定
	future: {
		// Vite Environment APIは無効化（React 19との互換性問題回避）
		unstable_viteEnvironmentApi: false,
	},
	// 開発サーバー設定の調整
	dev: {
		// React 19での問題回避のためport指定
		port: 5173,
	},
} satisfies Config;
