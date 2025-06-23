/// <reference types="vitest" />
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

/**
 * Vitest専用設定
 * React Routerプラグインを除外してテスト環境での問題を回避
 */
export default defineConfig({
	plugins: [tailwindcss(), tsconfigPaths()],
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
			reporter: ["text", "html", "json"],
			exclude: ["node_modules/", "tests/", "**/*.config.{js,ts}", "**/*.d.ts"],
		},
	},
});
