import type { Preview } from "@storybook/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { initialize, mswLoader } from "msw-storybook-addon";
import { BrowserRouter } from "react-router-dom";
import "../app/app.css"; // Tailwind CSS と カスタムスタイルをインポート
import { handlers } from "./mocks/server";

/**
 * MSW（Mock Service Worker）を初期化
 * Storybook環境でのAPI呼び出しをモック
 *
 * 設計方針:
 * - ブラウザ環境でのサービスワーカーを使用してAPIリクエストをインターセプト
 * - 実際のAPIエンドポイントと同じレスポンス形式を返す
 * - ストーリーごとに異なるハンドラーを適用可能
 * - エラーケースや異なるデータパターンのテストを支援
 */
initialize({
	onUnhandledRequest: "bypass", // 未処理のリクエストはそのまま通す
	// デフォルトハンドラーを設定（各ストーリーで上書き可能）
	handlers,
});

/**
 * React Query用のクライアントを作成
 * 各ストーリーで独立したクエリキャッシュを使用するため
 */
const createQueryClient = () =>
	new QueryClient({
		defaultOptions: {
			queries: {
				retry: false, // ストーリーブック内ではリトライしない
				staleTime: Number.POSITIVE_INFINITY, // データを永続的にフレッシュとして扱う
				gcTime: Number.POSITIVE_INFINITY, // ガベージコレクションを無効化
			},
		},
	});

const preview: Preview = {
	// グローバルデコレーター - 全ストーリーに適用される
	decorators: [
		// React Query プロバイダーでラップ
		(Story) => {
			const queryClient = createQueryClient();

			return (
				<QueryClientProvider client={queryClient}>
					<Story />
				</QueryClientProvider>
			);
		},

		// React Router でラップ（ナビゲーション関連のコンポーネント用）
		(Story) => (
			<BrowserRouter>
				<Story />
			</BrowserRouter>
		),

		// アプリケーション全体のコンテキスト用ラッパー
		(Story) => (
			<div className="min-h-screen bg-white dark:bg-gray-950">
				{/* ストーリーブック用のコンテナ */}
				<div className="p-4">
					<Story />
				</div>
			</div>
		),
	],

	// グローバルパラメーター
	parameters: {
		// アクション（イベントハンドラーなど）の設定
		actions: {
			argTypesRegex: "^on[A-Z].*", // onXxx形式のプロパティを自動的にアクションとして扱う
		},

		// コントロール（プロパティ編集UI）の設定
		controls: {
			matchers: {
				color: /(background|color)$/i, // 色関連のプロパティを色選択UIで表示
				date: /Date$/, // Date型のプロパティを日付選択UIで表示
			},
		},

		// レスポンシブデザインのビューポート設定
		viewport: {
			viewports: {
				// モバイル
				mobile: {
					name: "Mobile",
					styles: {
						width: "375px",
						height: "667px",
					},
				},
				// タブレット
				tablet: {
					name: "Tablet",
					styles: {
						width: "768px",
						height: "1024px",
					},
				},
				// デスクトップ
				desktop: {
					name: "Desktop",
					styles: {
						width: "1200px",
						height: "800px",
					},
				},
			},
			// デフォルトビューポート
			defaultViewport: "desktop",
		},

		// 背景色の設定
		backgrounds: {
			default: "light",
			values: [
				{
					name: "light",
					value: "#ffffff",
				},
				{
					name: "dark",
					value: "#1f1f1f",
				},
			],
		},

		// ドキュメント設定
		docs: {
			// ドキュメントページでのストーリーの表示方法
			source: {
				type: "dynamic", // 動的にソースコードを生成
				excludeDecorators: true, // デコレーターをソースコードから除外
			},
		},

		// MSW設定 - ストーリーレベルでのハンドラー上書きを可能にする
		msw: {
			handlers: [],
		},
	},

	// MSWローダーを設定
	loaders: [mswLoader],

	// グローバルarg types（全ストーリーで使用可能なプロパティ設定）
	argTypes: {
		// className プロパティの設定
		className: {
			control: "text",
			description: "追加のCSSクラス",
			table: {
				type: { summary: "string" },
				defaultValue: { summary: "undefined" },
			},
		},
		// children プロパティの設定（React要素）
		children: {
			control: false, // 子要素は編集不可
			description: "子要素",
			table: {
				type: { summary: "React.ReactNode" },
			},
		},
	},

	// タグ設定
	tags: ["autodocs"], // 自動ドキュメント生成を有効化
};

export default preview;
