import type { Meta, StoryObj } from "@storybook/react";
import { HeaderLogo, IconLogo, LargeLogo, Logo } from "./logo";

/**
 * Saifuu ロゴコンポーネントのストーリー
 *
 * 設計方針:
 * - 財布をモチーフにしたアイコンデザインの表示確認
 * - 様々なサイズでの視認性テスト
 * - アクセシビリティ対応の検証
 * - レスポンシブ表示の確認
 */

const meta: Meta<typeof Logo> = {
	title: "UI/Logo",
	component: Logo,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Saifuu 家計管理アプリのロゴコンポーネント。財布をモチーフにしたデザインで、様々なサイズに対応。",
			},
		},
	},
	argTypes: {
		size: {
			control: { type: "range", min: 16, max: 256, step: 8 },
			description: "ロゴのサイズ（px単位）",
		},
		clickable: {
			control: "boolean",
			description: "クリック可能にするかどうか",
		},
		className: {
			control: "text",
			description: "追加のCSSクラス名",
		},
	},
	args: {
		size: 128,
		clickable: false,
		className: "",
		ariaLabel: "Saifuu - 家計管理アプリ",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本的なロゴ表示
export const Default: Story = {};

// サイズバリエーション
export const Small: Story = {
	args: {
		size: 32,
	},
};

export const Medium: Story = {
	args: {
		size: 64,
	},
};

export const Large: Story = {
	args: {
		size: 128,
	},
};

export const ExtraLarge: Story = {
	args: {
		size: 256,
	},
};

// クリック可能なロゴ
export const Clickable: Story = {
	args: {
		clickable: true,
		onClick: () => alert("ロゴがクリックされました！"),
	},
};

// 事前定義されたコンポーネント
export const HeaderLogoVariant: Story = {
	render: () => (
		<div className="flex items-center space-x-4">
			<HeaderLogo onClick={() => alert("ヘッダーロゴクリック")} />
			<div>
				<h1 className="text-xl font-bold text-gray-900">Saifuu</h1>
				<p className="text-sm text-gray-600">家計管理アプリ</p>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "ヘッダー用の小さなロゴコンポーネント（40px）",
			},
		},
	},
};

export const IconLogoVariant: Story = {
	render: () => (
		<div className="flex items-center space-x-2">
			<IconLogo />
			<span className="text-sm text-gray-700">アイコンサイズ</span>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "アイコンサイズのロゴコンポーネント（24px）",
			},
		},
	},
};

export const LargeLogoVariant: Story = {
	render: () => (
		<div className="text-center">
			<LargeLogo onClick={() => alert("大きなロゴクリック")} />
			<p className="mt-4 text-gray-600">ランディングページ用の大きなロゴ</p>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "ランディングページ用の大きなロゴコンポーネント（128px）",
			},
		},
	},
};

// 複数サイズの比較
export const SizeComparison: Story = {
	render: () => (
		<div className="space-y-6">
			<div className="flex items-end space-x-4">
				<div className="text-center">
					<Logo size={16} />
					<p className="text-xs text-gray-500 mt-1">16px</p>
				</div>
				<div className="text-center">
					<Logo size={24} />
					<p className="text-xs text-gray-500 mt-1">24px</p>
				</div>
				<div className="text-center">
					<Logo size={32} />
					<p className="text-xs text-gray-500 mt-1">32px</p>
				</div>
				<div className="text-center">
					<Logo size={48} />
					<p className="text-xs text-gray-500 mt-1">48px</p>
				</div>
				<div className="text-center">
					<Logo size={64} />
					<p className="text-xs text-gray-500 mt-1">64px</p>
				</div>
				<div className="text-center">
					<Logo size={128} />
					<p className="text-xs text-gray-500 mt-1">128px</p>
				</div>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "様々なサイズでのロゴ表示比較",
			},
		},
	},
};

// ダークテーマでの表示
export const DarkTheme: Story = {
	args: {
		size: 128,
	},
	parameters: {
		backgrounds: {
			default: "dark",
			values: [{ name: "dark", value: "#1f2937" }],
		},
	},
	decorators: [
		(Story) => (
			<div className="p-8 bg-gray-800 rounded-lg">
				<Story />
			</div>
		),
	],
};

// アクセシビリティテスト
export const AccessibilityTest: Story = {
	render: () => (
		<div className="space-y-4">
			<div>
				<h3 className="text-lg font-semibold mb-2">キーボードナビゲーション</h3>
				<Logo
					size={64}
					clickable={true}
					onClick={() => alert("キーボードでアクセス可能")}
				/>
				<p className="text-sm text-gray-600 mt-2">
					Tabキーでフォーカス、Enter/Spaceキーで実行
				</p>
			</div>
			<div>
				<h3 className="text-lg font-semibold mb-2">スクリーンリーダー対応</h3>
				<Logo size={64} ariaLabel="Saifuu - 家計管理アプリケーション ロゴ" />
				<p className="text-sm text-gray-600 mt-2">
					適切なaria-labelとalt属性を設定
				</p>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story: "アクセシビリティ機能のテスト",
			},
		},
	},
};
