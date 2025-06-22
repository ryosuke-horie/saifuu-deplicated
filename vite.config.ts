/// <reference types="vitest" />
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
	plugins: [
		cloudflare({ viteEnvironment: { name: "ssr" } }),
		tailwindcss(),
		reactRouter(),
		tsconfigPaths(),
	],
	// React 19 + React Router v7の互換性修正
	define: {
		__DEV__: "false",
	},
	esbuild: {
		jsx: "automatic",
		// jsxDev完全無効化: React 19とReact Router v7の互換性問題を回避
		jsxDev: false,
		jsxImportSource: "react",
	},
	// SSR環境での設定調整
	ssr: {
		noExternal: ["react", "react-dom", "react-router"],
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
