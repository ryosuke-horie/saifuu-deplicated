import { resolve } from "path";
import type { StorybookConfig } from "@storybook/react-vite";
import { mergeConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

const config: StorybookConfig = {
	// ストーリーファイルのパターン - app/components以下の全てのストーリーファイルを対象
	stories: ["../app/components/**/*.stories.@(js|jsx|ts|tsx)"],

	// 必須アドオンを設定
	addons: [
		"@storybook/addon-essentials", // 基本的なアドオン群（Controls, Actions, Docs等）
		"@storybook/addon-interactions", // インタラクションテスト用
		"@storybook/addon-a11y", // アクセシビリティチェック用
		"@storybook/addon-docs", // ドキュメント生成用
		"msw-storybook-addon", // API モック用（将来的にAPI呼び出しが必要な場合）
	],

	// React + Viteフレームワークを使用
	framework: {
		name: "@storybook/react-vite",
		options: {},
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
