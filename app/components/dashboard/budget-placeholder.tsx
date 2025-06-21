/**
 * 予算プレースホルダーコンポーネント
 *
 * 設計方針:
 * - 予算機能未実装時の適切なプレースホルダー表示
 * - 将来の予算機能実装への準備
 * - テスタビリティとコンポーネント分離を考慮
 *
 * Issue #59対応: ハードコードされた偽データ問題の修正
 */

interface BudgetPlaceholderProps {
	onSetBudgetClick?: () => void;
}

export function BudgetPlaceholder({
	onSetBudgetClick,
}: BudgetPlaceholderProps) {
	return (
		<div className="bg-white rounded-lg shadow-sm border p-6">
			<h3 className="text-lg font-semibold text-gray-900 mb-4">今月の予算</h3>
			{/* 予算機能未実装時の適切なプレースホルダー表示 */}
			<div className="text-center py-8" data-testid="budget-placeholder">
				<div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
					<svg
						className="w-8 h-8 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
						data-testid="budget-icon"
					>
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
						/>
					</svg>
				</div>
				<p className="text-gray-600 mb-4">予算が設定されていません</p>
				<p className="text-sm text-gray-500 mb-6">
					月ごとの支出予算を設定して、支出管理を始めましょう
				</p>
				<button
					type="button"
					className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					onClick={onSetBudgetClick}
					data-testid="budget-cta-button"
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
							d="M12 6v6m0 0v6m0-6h6m-6 0H6"
						/>
					</svg>
					予算を設定する
				</button>
			</div>
		</div>
	);
}
