import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

// Storybook専用の最小限Vite設定
// React Router Viteプラグインを完全に除外
export default defineConfig({
	plugins: [
		tsconfigPaths(), // TypeScriptパス設定のみ
	],
	configFile: false, // ルートのvite.config.tsを無視
});
