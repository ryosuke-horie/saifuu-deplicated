/**
 * ダッシュボード用サマリーカードコンポーネント（簡易版）
 *
 * 設計方針:
 * - サブスクリプション管理に特化したダッシュボード
 * - レスポンシブデザインでモバイルファーストを採用
 * - アイコンとカラーリングで視覚的な分かりやすさを重視
 */

export interface SummaryCardsProps {
	/**
	 * カードの表示を簡潔にするかどうか
	 */
	compact?: boolean;
}

export function SummaryCards({ compact = false }: SummaryCardsProps) {
	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
			<div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
				<div className="flex items-center">
					<div className="p-2 rounded-lg bg-blue-50">
						<div className="text-blue-600">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
					</div>
					<div className="ml-4 flex-1">
						<p className="text-sm font-medium text-gray-600">サブスク管理</p>
						<p className="text-2xl font-bold text-gray-900">準備完了</p>
					</div>
				</div>
			</div>
			<div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
				<div className="flex items-center">
					<div className="p-2 rounded-lg bg-green-50">
						<div className="text-green-600">
							<svg
								className="w-6 h-6"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						</div>
					</div>
					<div className="ml-4 flex-1">
						<p className="text-sm font-medium text-gray-600">状態</p>
						<p className="text-2xl font-bold text-gray-900">正常稼働</p>
					</div>
				</div>
			</div>
		</div>
	);
}
