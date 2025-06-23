import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link } from "react-router";
import { Header } from "../components/layout/header";
import { TransactionList } from "../components/transactions/transaction-list";

export const meta: MetaFunction = () => {
	return [
		{ title: "取引一覧 | Saifuu" },
		{
			name: "description",
			content: "収入・支出の取引一覧を表示・管理するページです。",
		},
	];
};

export async function loader({ request }: LoaderFunctionArgs) {
	// クエリパラメータを取得してTransactionListコンポーネントに渡す
	const url = new URL(request.url);
	const searchParams = Object.fromEntries(url.searchParams.entries());

	return {
		searchParams,
	};
}

export default function TransactionsPage() {
	// ヘッダーアクション
	const headerActions = (
		<Link
			to="/transactions/new"
			className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center"
		>
			<svg
				className="w-4 h-4 mr-2"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24"
			>
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M12 4v16m8-8H4"
				/>
			</svg>
			取引を登録
		</Link>
	);

	return (
		<div className="min-h-screen bg-gray-50">
			{/* 統一されたヘッダーコンポーネントを使用 */}
			<Header
				title="取引一覧"
				description="収入・支出の取引履歴を管理できます"
				actions={headerActions}
			/>

			{/* メインコンテンツ */}
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
				{/* TransactionListコンポーネントを使用 */}
				<TransactionList />
			</div>
		</div>
	);
}
