import type { Config } from "@react-router/dev/config";

export default {
	ssr: true,
	// unstable_viteEnvironmentApi フラグを一時的に無効化
	// useContext エラーの原因となる可能性があるため
	// future: {
	// 	unstable_viteEnvironmentApi: true,
	// },
} satisfies Config;
