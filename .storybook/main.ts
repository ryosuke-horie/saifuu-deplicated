import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const config: StorybookConfig = {
	// ストーリーファイルのパターン - app/components以下の全てのストーリーファイルを対象
	stories: ["../app/components/**/*.stories.@(js|jsx|ts|tsx)"],

	// 必須アドオンを設定
	addons: [
		"@storybook/addon-essentials", // 基本的なアドオン群（Controls, Actions, Docs等）
		"@storybook/addon-interactions", // インタラクションテスト用
	],

	// React + Viteフレームワークを使用
	framework: {
		name: "@storybook/react-vite",
		options: {
			viteConfigPath: false, // vite.config.tsを読み込まない
		},
	},

	// TypeScript対応
	typescript: {
		check: false, // ビルド時の型チェックを無効化（高速化のため）
		reactDocgen: "react-docgen-typescript", // React コンポーネントのドキュメント自動生成
		reactDocgenTypescriptOptions: {
			// プロップタイプの詳細な情報を含める
			shouldExtractLiteralValuesFromEnum: true,
			propFilter: (prop) =>
				prop.parent ? !/node_modules/.test(prop.parent.fileName) : true,
		},
	},

	// ドキュメント設定
	docs: {
		autodocs: "tag", // @storybook/addon-docs で自動ドキュメント生成を有効化
		defaultName: "Documentation", // デフォルトのドキュメントタブ名
	},

	// Storybook本体の設定
	core: {
		disableTelemetry: true, // テレメトリーを無効化（プライバシー保護）
	},

	// Vite設定のカスタマイズ - React Router v7の競合を回避
	viteFinal: async (config) => {
		// React Routerプラグインを除外（Storybookでは不要）
		if (config.plugins) {
			config.plugins = config.plugins.filter((plugin: any) => {
				return !plugin?.name?.includes("react-router");
			});
		}

		return mergeConfig(config, {
			plugins: [tsconfigPaths()], // パスエイリアス設定のみ
			resolve: {
				alias: {
					"~": resolve(__dirname, "../app"),
				},
			},
		});
	},
};

export default config;
