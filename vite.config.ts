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
	optimizeDeps: {
		exclude: ["workers-ses"],
	},
	test: {
		environment: "jsdom",
		setupFiles: ["./app/utils/test-setup.ts"],
		globals: true,
		include: ["app/**/*.test.{ts,tsx}"],
		exclude: [
			"app/utils/form-parser.test.ts",
			"app/utils/form-parser-test-summary.test.ts",
			"app/utils/form-validation-comprehensive.test.ts",
			"app/utils/form-validation-focused.test.ts",
			"app/components/__tests__/*.tsx",
			"app/contexts/__tests__/*.tsx",
		],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			exclude: [
				"**/*.test.{ts,tsx}",
				"**/*.spec.{ts,tsx}",
				"**/node_modules/**",
				"**/.dev.vars",
				"**/build/**",
				"**/public/**",
				"**/test-results/**",
				"**/playwright-report/**",
				"**/coverage/**",
				"app/utils/test-setup.ts",
				"app/utils/test-utils.tsx",
				"app/welcome/**",
				"*.config.{ts,js}",
				"app/entry.server.tsx",
			],
			thresholds: {
				global: {
					branches: 70,
					functions: 70,
					lines: 70,
					statements: 70,
				},
			},
		},
	},
});
