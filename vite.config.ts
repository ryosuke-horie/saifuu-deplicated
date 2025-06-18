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
	test: {
		environment: "jsdom",
		globals: true,
		include: ["app/**/*.{test,spec}.{ts,tsx}"],
		// Viteサーバーが正常に終了するように設定
		pool: "forks",
	},
});
