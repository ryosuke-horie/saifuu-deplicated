/// <reference types="vitest" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		// Cloudflareプラグインを有効化してローカルD1データベースを使用
		cloudflare(),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
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
		// jsxDev完全無効化: React 19とReact Router v7の互換性問題を回避
		jsxDev: false,
		jsxImportSource: "react",
	},
	// SSR環境での設定調整 - React 19のmodule問題を回避
	ssr: {
		// React関連を外部化してCommonJS/ESM問題を回避
		external: ["react", "react-dom"],
		noExternal: ["react-router"],
		target: "node",
	},
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
});
