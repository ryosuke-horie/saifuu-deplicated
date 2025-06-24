/**
 * ページ固有のヘッダーコンポーネント
 *
 * 設計方針:
 * - 固定ヘッダーとは分離したページタイトルエリア
 * - 各ページでタイトル・説明・アクションを個別に設定可能
 * - 統一されたスタイリングとレイアウト
 * - 既存のデザインパターンを維持
 */

export interface PageHeaderProps {
	/** ページタイトル */
	title?: string;
	/** 説明文 */
	description?: string;
	/** 追加のアクション要素 */
	actions?: React.ReactNode;
	/** 背景色を設定するかどうか */
	withBackground?: boolean;
}

export function PageHeader({
	title,
	description,
	actions,
	withBackground = true,
}: PageHeaderProps) {
	if (!title && !description && !actions) {
		return null;
	}

	return (
		<div className={withBackground ? "bg-white border-b border-gray-200" : ""}>
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-3">
				<div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
					<div>
						{title && (
							<h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
								{title}
							</h1>
						)}
						{description && <p className="text-gray-600 mt-2">{description}</p>}
					</div>
					{actions && <div className="mt-4 lg:mt-0">{actions}</div>}
				</div>
			</div>
		</div>
	);
}
