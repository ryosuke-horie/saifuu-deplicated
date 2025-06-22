import type { Config } from "@react-router/dev/config";

export default {
	appDirectory: "app",
	ssr: true,
	buildDirectory: "dist",
	// React Router v7での開発サーバー安定性向上のため無効化
	// future: {
	// 	unstable_viteEnvironmentApi: true,
	// },
} satisfies Config;
