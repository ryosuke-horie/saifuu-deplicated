/// <reference types="vitest" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => ({
	plugins: [
		// プラグイン順序を最適化: React Routerを先に、Cloudflareを後に配置
		reactRouter(),
		tailwindcss(),
		tsconfigPaths(),
		// Cloudflareプラグインを一時的に無効化
		// React Router v7のビルド順序問題により、プラグインのファイル存在チェックが失敗する
		// デプロイ時は別途wranglerコマンドを直接使用
		// ...(mode === "production" ? [cloudflare()] : []),
	],
	// React 19 + React Router v7の互換性修正
	define: {
		__DEV__: "false",
		// CommonJS互換性のための定義
		"process.env.NODE_ENV": JSON.stringify(
			process.env.NODE_ENV || "development",
		),
	},
	// ESモジュールフォーマットを明示的に指定
	build: {
		target: "es2022",
		rollupOptions: {
			output: {
				format: "es",
			},
		},
	},
	esbuild: {
		jsx: "automatic",
		jsxImportSource: "react",
	},
	// SSR環境での設定調整
	ssr: {
		target: "node",
	},
	// クライアントサイドビルド設定
	optimizeDeps: {
		include: ["react", "react-dom", "react-router"],
	},
	// HMR設定
	server: {
		hmr: true,
	},
	// Vitestテスト設定
	test: {
		environment: "jsdom",
		globals: true,
		include: ["app/**/*.{test,spec}.{ts,tsx}", "db/**/*.{test,spec}.{ts,tsx}"],
		// Viteサーバーが正常に終了するように設定
		pool: "forks",
		setupFiles: ["./tests/setup.ts"],
		poolOptions: {
			forks: {
				singleFork: true,
			},
		},
		coverage: {
			reporter: ["text"],
			exclude: ["node_modules/", "tests/", "**/*.config.{js,ts}", "**/*.d.ts"],
		},
	},
}));
