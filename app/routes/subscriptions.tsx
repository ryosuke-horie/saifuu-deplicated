import { useCallback, useEffect, useState } from "react";
import type { MetaFunction } from "react-router";
import { PageHeader } from "../components/layout/page-header";
import {
	SubscriptionCards,
	type SubscriptionFormData,
	SubscriptionFormModal,
} from "../components/subscriptions";
import {
	useCreateSubscription,
	useSubscriptions,
	useUpdateSubscription,
} from "../lib/hooks/use-subscriptions";
import type { SelectSubscription } from "../types";

/**
 * サブスクリプション管理ページ
 *
 * 設計方針:
 * - サブスクリプションの包括的な管理インターフェースを提供
 * - カード形式での一覧表示とCRUD操作
 * - 統一されたモーダルによる新規作成・編集機能
 * - APIフックとの完全連携によるリアルタイム更新
 * - エラーハンドリングとユーザーフィードバック
 * - 月額/年額の表示切り替え機能
 * - アクティブ/非アクティブ状態の管理
 * - 次回請求日とコスト計算の可視化
 */

export const meta: MetaFunction = () => {
	return [
		{ title: "サブスクリプション管理 | Saifuu - 家計管理アプリ" },
		{
			name: "description",
			content:
				"サブスクリプション（定期支払い）の管理画面。登録・編集・一時停止・解約予定の設定が可能です。月額・年額の切り替え表示で総コストを把握できます。",
		},
		// robots meta タグは root.tsx で設定済み
	];
};

export default function SubscriptionsPage() {
	console.log("🏠 [DEBUG] SubscriptionsPage レンダリング開始");

	// ハイドレーション対応: 動的コンテンツ用のクライアント専用状態
	const [isClient, setIsClient] = useState(false);
	const [currentTime, setCurrentTime] = useState<string>("");
	const [randomNumber, setRandomNumber] = useState<string>("");

	// サブスクリプション一覧の再読み込み用
	const { refetch: refetchSubscriptions } = useSubscriptions();

	// ミューテーションフック
	const createMutation = useCreateSubscription();
	const updateMutation = useUpdateSubscription();

	// モーダルの状態管理
	const [modalState, setModalState] = useState<{
		isOpen: boolean;
		mode: "create" | "edit";
		initialData?: SelectSubscription;
	}>({
		isOpen: false,
		mode: "create",
		initialData: undefined,
	});

	// ハイドレーション完了後にクライアント専用コンテンツを初期化
	useEffect(() => {
		console.log("🔄 [DEBUG] クライアント側useEffect実行");
		setIsClient(true);
		setCurrentTime(new Date().toLocaleTimeString());
		setRandomNumber(Math.random().toFixed(3));
		
		// 時刻を定期更新
		const interval = setInterval(() => {
			setCurrentTime(new Date().toLocaleTimeString());
		}, 1000);
		
		return () => clearInterval(interval);
	}, []);

	// モーダル状態の変更を監視
	useEffect(() => {
		console.log("🔄 [DEBUG] modalState変更:", modalState);
	}, [modalState]);

	// 新規作成モーダルを開く
	const handleOpenCreateModal = useCallback(() => {
		console.log("🚀 [DEBUG] 新規作成ボタンがクリックされました");

		setModalState({
			isOpen: true,
			mode: "create",
			initialData: undefined,
		});

		console.log("✅ [DEBUG] モーダル状態を更新しました:", {
			isOpen: true,
			mode: "create",
			initialData: undefined,
		});
	}, []);

	// 編集モーダルを開く
	const handleEdit = useCallback((subscription?: SelectSubscription) => {
		if (!subscription) return;

		setModalState({
			isOpen: true,
			mode: "edit",
			initialData: subscription,
		});
	}, []);

	// モーダルを閉じる
	const handleCloseModal = useCallback(() => {
		setModalState({
			isOpen: false,
			mode: "create",
			initialData: undefined,
		});
	}, []);

	// フォーム送信処理
	const handleFormSubmit = useCallback(
		async (data: SubscriptionFormData) => {
			try {
				if (modalState.mode === "create") {
					// 新規作成
					await createMutation.mutateAsync({
						categoryId: data.categoryId,
						name: data.name,
						amount: data.amount,
						frequency: data.frequency,
						nextPaymentDate: data.nextPaymentDate,
						description: data.description || null,
					});
				} else if (modalState.mode === "edit" && modalState.initialData) {
					// 更新
					await updateMutation.mutateAsync({
						id: modalState.initialData.id,
						data: {
							categoryId: data.categoryId,
							name: data.name,
							amount: data.amount,
							frequency: data.frequency,
							nextPaymentDate: data.nextPaymentDate,
							description: data.description || null,
						},
					});
				}

				// 成功時の処理
				await refetchSubscriptions();
			} catch (error) {
				// エラーハンドリングはミューテーションフック内で処理されるため
				// 必要に応じて追加の処理を行う
				console.error("Subscription form submit error:", error);
				throw error; // モーダル側でエラー表示するために再throw
			}
		},
		[
			modalState.mode,
			modalState.initialData,
			createMutation,
			updateMutation,
			refetchSubscriptions,
		],
	);

	// ヘッダーアクション（統一された新規作成ボタン）
	const headerActions = (
		<div className="flex flex-wrap gap-3">
			<button
				type="button"
				className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium flex items-center disabled:opacity-50 disabled:cursor-not-allowed relative z-10"
				onClick={() => {
					console.log("🔴 [DEBUG] ヘッダーボタンクリック開始");
					alert("🔴 ボタンクリック確認！");
					handleOpenCreateModal();
					console.log("🔴 [DEBUG] ヘッダーボタンクリック完了");
				}}
				onMouseEnter={() => console.log("🔴 [DEBUG] ボタンにマウスオーバー")}
				disabled={createMutation.isPending || updateMutation.isPending}
				style={{ pointerEvents: "auto" }}
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
				新規サブスクリプション
			</button>
			<button
				type="button"
				className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors text-sm font-medium flex items-center"
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
						d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 00-2 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"
					/>
				</svg>
				年間コスト分析
			</button>
		</div>
	);

	return (
		<>
			{/* 🔧 DEBUG: ハイドレーション対応JavaScriptテスト */}
			<div className="bg-red-100 p-4 text-center border-4 border-red-500">
				<h2 className="text-lg font-bold mb-4">🔧 JavaScript実行テスト (ハイドレーション対応)</h2>

				{isClient ? (
					<>
						{/* 最も基本的なHTML onclick */}
						<button
							type="button"
							className="bg-red-600 text-white px-4 py-2 rounded mr-2 mb-2"
							onClick={() => alert("HTMLクリック動作")}
						>
							1️⃣ HTML onclick
						</button>

						{/* React onClickハンドラー */}
						<button
							type="button"
							className="bg-orange-600 text-white px-4 py-2 rounded mr-2 mb-2"
							onClick={() => alert("React onClick動作")}
						>
							2️⃣ React onClick
						</button>

						{/* 複雑なReactハンドラー */}
						<button
							type="button"
							className="bg-purple-600 text-white px-4 py-2 rounded mr-2 mb-2"
							onClick={() => {
								console.log("🔥 [DEBUG] 複雑ボタンクリック");
								alert("🔥 複雑ハンドラー動作");
								handleOpenCreateModal();
							}}
						>
							3️⃣ 複雑ハンドラー
						</button>

						{/* JavaScript実行確認 */}
						<div className="mt-4 p-2 bg-yellow-100 rounded">
							<p>現在時刻: <span id="current-time">{currentTime}</span></p>
							<p>React動作中: {randomNumber}</p>
						</div>
					</>
				) : (
					<p className="text-gray-600">クライアント側読み込み中...</p>
				)}
			</div>

			{/* ページヘッダー */}
			<PageHeader
				title="サブスクリプション管理"
				description="定期支払いサービスを一元管理し、支出を最適化しましょう"
				actions={headerActions}
			/>

			{/* メインコンテンツ */}
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				{/* サブスクリプション一覧 */}
				<div className="space-y-6">
					<SubscriptionCards
						onEdit={handleEdit}
						onCreateNew={handleOpenCreateModal}
					/>
				</div>
			</div>

			{/* サブスクリプションフォームモーダル */}
			<SubscriptionFormModal
				isOpen={modalState.isOpen}
				onClose={handleCloseModal}
				mode={modalState.mode}
				initialData={modalState.initialData}
				onSubmit={handleFormSubmit}
			/>
		</>
	);
}
