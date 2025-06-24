import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { Link, useLoaderData } from "react-router";
import { PageHeader } from "../components/layout/page-header";
import { TransactionList } from "../components/transactions/transaction-list";
import type { TransactionFilters, TransactionSort } from "../types";

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
	// URLパラメータからフィルターとソートを抽出
	const url = new URL(request.url);
	const searchParams = url.searchParams;

	// フィルター情報を構築
	const filters: Partial<TransactionFilters> = {};
	if (searchParams.get("from")) filters.from = searchParams.get("from")!;
	if (searchParams.get("to")) filters.to = searchParams.get("to")!;
	if (searchParams.get("type"))
		filters.type = searchParams.get("type") as "income" | "expense";
	if (searchParams.get("category_id"))
		filters.category_id = Number(searchParams.get("category_id"));
	if (searchParams.get("search")) filters.search = searchParams.get("search")!;

	// ソート情報を構築
	const sort: Partial<TransactionSort> = {
		sort_by:
			(searchParams.get("sort_by") as TransactionSort["sort_by"]) ||
			"transactionDate",
		sort_order:
			(searchParams.get("sort_order") as TransactionSort["sort_order"]) ||
			"desc",
	};

	return {
		filters,
		sort,
	};
}

export default function TransactionsPage() {
	const { filters, sort } = useLoaderData<typeof loader>();

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
		<>
			{/* ページヘッダー */}
			<PageHeader
				title="取引一覧"
				description="収入・支出の取引履歴を管理できます"
				actions={headerActions}
			/>

			{/* メインコンテンツ */}
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
				{/* TransactionListコンポーネントにURL由来の初期値を渡す */}
				<TransactionList
					initialFilters={filters}
					initialSort={sort}
					useUrlState={true}
				/>
			</div>
		</>
	);
}
