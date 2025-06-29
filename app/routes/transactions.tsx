import type { MetaFunction } from "react-router";
import { PageHeader } from "../components/layout/page-header";
import {
	TransactionFormModal,
	useTransactionModal,
} from "../components/transactions";

/**
 * 収支管理画面（メインページ）
 *
 * 設計方針:
 * - 収入・支出の登録と一覧を統合管理するダッシュボード
 * - モーダルベースのUI（ページ遷移なし）でスムーズな操作感を実現
 * - サブスクリプション管理画面の実装パターンを踏襲した統一性のあるデザイン
 * - 既存のコンポーネント（PageHeader、Modal等）を再利用し開発効率を向上
 */

export const meta: MetaFunction = () => {
	return [
		{ title: "収支管理 | Saifuu - 家計管理アプリ" },
		{
			name: "description",
			content:
				"収入・支出を簡単に登録・管理できる画面。家計の収支バランスを効率的に管理しましょう。",
		},
	];
};

export default function TransactionsPage() {
	// モーダルの状態管理
	const {
		isOpen,
		transactionType,
		openIncomeModal,
		openExpenseModal,
		closeModal,
	} = useTransactionModal();

	// ヘッダーアクション - 収入・支出登録ボタン
	const headerActions = (
		<div className="flex flex-wrap gap-3">
			<button
				type="button"
				onClick={openIncomeModal}
				className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
			>
				収入登録
			</button>
			<button
				type="button"
				onClick={openExpenseModal}
				className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
			>
				支出登録
			</button>
		</div>
	);

	return (
		<>
			{/* ページヘッダー */}
			<PageHeader
				title="収支管理"
				description="収入・支出を一元管理し、家計のバランスを最適化しましょう"
				actions={headerActions}
			/>

			{/* メインコンテンツ */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* TODO: 収支サマリーカード */}
				<div className="mb-8">
					<div className="bg-white rounded-lg shadow-sm border p-6">
						<div className="text-center">
							<h3 className="text-lg font-semibold text-gray-900 mb-2">
								収支管理機能
							</h3>
							<p className="text-gray-600">
								収入・支出の登録機能を準備中です。
								上部のボタンから登録を開始できるようになります。
							</p>
						</div>
					</div>
				</div>

				{/* TODO: 収支一覧・検索・フィルター機能 */}
			</div>

			{/* 取引登録モーダル */}
			<TransactionFormModal
				isOpen={isOpen}
				transactionType={transactionType}
				onClose={closeModal}
			/>
		</>
	);
}
