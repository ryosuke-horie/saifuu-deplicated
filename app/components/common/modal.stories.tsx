import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./modal";

const meta: Meta<typeof Modal> = {
	title: "Components/Common/Modal",
	component: Modal,
	parameters: {
		layout: "fullscreen",
		docs: {
			description: {
				component:
					"汎用モーダルコンポーネント。レスポンシブ対応、アニメーション、アクセシビリティ機能を備えた再利用可能なモーダルです。",
			},
		},
	},
	argTypes: {
		isOpen: {
			control: "boolean",
			description: "モーダルの表示状態",
		},
		onClose: {
			action: "onClose",
			description: "モーダルを閉じる際に呼び出される関数",
		},
		title: {
			control: "text",
			description: "モーダルのタイトル",
		},
		size: {
			control: { type: "select" },
			options: ["sm", "md", "lg"],
			description: "モーダルのサイズ",
		},
		children: {
			control: "text",
			description: "モーダルの内容",
		},
	},
	args: {
		title: "サンプルモーダル",
		children: "これはモーダルの内容です。",
		size: "md",
	},
	tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// コントロール可能なストーリー
const ModalWithControls = (args: any) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<div className="p-4">
			<button
				type="button"
				onClick={() => setIsOpen(true)}
				className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
			>
				モーダルを開く
			</button>
			<Modal {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
		</div>
	);
};

// 基本ストーリー
export const Default: Story = {
	render: ModalWithControls,
};

// 小サイズモーダル
export const Small: Story = {
	render: ModalWithControls,
	args: {
		size: "sm",
		title: "小サイズモーダル",
		children:
			"これは小サイズのモーダルです。短いメッセージや確認ダイアログに最適です。",
	},
};

// 大サイズモーダル
export const Large: Story = {
	render: ModalWithControls,
	args: {
		size: "lg",
		title: "大サイズモーダル",
		children: (
			<div>
				<p className="mb-4">
					これは大サイズのモーダルです。詳細な情報や複雑なフォームに使用できます。
				</p>
				<div className="space-y-4">
					<div>
						<label
							htmlFor="sample-input"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							サンプル入力フィールド
						</label>
						<input
							id="sample-input"
							type="text"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							placeholder="何か入力してください"
						/>
					</div>
					<div>
						<label
							htmlFor="sample-description"
							className="block text-sm font-medium text-gray-700 mb-2"
						>
							説明
						</label>
						<textarea
							id="sample-description"
							className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
							rows={4}
							placeholder="詳細を入力してください"
						/>
					</div>
					<div className="flex space-x-3">
						<button
							type="button"
							className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
						>
							保存
						</button>
						<button
							type="button"
							className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
						>
							キャンセル
						</button>
					</div>
				</div>
			</div>
		),
	},
};

// 長いコンテンツでのスクロール確認
export const LongContent: Story = {
	render: ModalWithControls,
	args: {
		title: "長いコンテンツのモーダル",
		children: (
			<div className="space-y-4">
				{Array.from({ length: 20 }, (_, i) => (
					// biome-ignore lint/suspicious/noArrayIndexKey: デモ用の静的リストのため
					<p key={`paragraph-${i}`} className="text-gray-700">
						これは長いコンテンツの{i + 1}番目の段落です。
						モーダル内でのスクロール動作を確認するためのサンプルテキストです。
						長いコンテンツが適切にスクロール可能であることを確認してください。
					</p>
				))}
			</div>
		),
	},
};

// 確認ダイアログのパターン
export const ConfirmDialog: Story = {
	render: ModalWithControls,
	args: {
		size: "sm",
		title: "確認",
		children: (
			<div className="space-y-4">
				<p className="text-gray-700">この操作を実行してもよろしいですか？</p>
				<div className="flex space-x-3 justify-end">
					<button
						type="button"
						className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
					>
						削除
					</button>
					<button
						type="button"
						className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					>
						キャンセル
					</button>
				</div>
			</div>
		),
	},
};

// フォームモーダルのパターン
export const FormModal: Story = {
	render: ModalWithControls,
	args: {
		title: "新しいアイテムを追加",
		children: (
			<form className="space-y-4">
				<div>
					<label
						htmlFor="item-name"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						名前 <span className="text-red-500">*</span>
					</label>
					<input
						id="item-name"
						type="text"
						required
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						placeholder="アイテム名を入力"
					/>
				</div>
				<div>
					<label
						htmlFor="item-category"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						カテゴリ
					</label>
					<select
						id="item-category"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="">選択してください</option>
						<option value="category1">カテゴリ1</option>
						<option value="category2">カテゴリ2</option>
						<option value="category3">カテゴリ3</option>
					</select>
				</div>
				<div>
					<label
						htmlFor="item-description"
						className="block text-sm font-medium text-gray-700 mb-2"
					>
						説明
					</label>
					<textarea
						id="item-description"
						className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
						rows={3}
						placeholder="アイテムの説明を入力（任意）"
					/>
				</div>
				<div className="flex space-x-3 justify-end pt-4">
					<button
						type="submit"
						className="px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
					>
						追加
					</button>
					<button
						type="button"
						className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
					>
						キャンセル
					</button>
				</div>
			</form>
		),
	},
};
