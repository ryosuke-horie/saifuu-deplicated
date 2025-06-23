import type { LoaderFunctionArgs, MetaFunction } from "react-router";
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
	return (
		<div className="min-h-screen bg-gray-50">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
				<div className="mb-6">
					<h1 className="text-3xl font-bold text-gray-900">取引一覧</h1>
					<p className="mt-2 text-sm text-gray-600">
						収入・支出の取引履歴を管理できます
					</p>
				</div>

				{/* TransactionListコンポーネントを使用 */}
				<TransactionList />
			</div>
		</div>
	);
}
