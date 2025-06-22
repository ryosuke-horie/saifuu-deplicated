import type { Config } from "@react-router/dev/config";

export default {
	appDirectory: "app",
	ssr: true,
	buildDirectory: "dist",
	// React 19との互換性を最大化
	future: {
		unstable_viteEnvironmentApi: false,
	},
} satisfies Config;
