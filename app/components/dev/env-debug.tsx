/**
 * 開発時環境デバッグ情報表示コンポーネント
 * 開発環境でのみ表示され、環境変数と設定状況を確認できる
 *
 * 設計方針:
 * - 本番環境では絶対に表示されない
 * - 開発時のトラブルシューティングを支援
 * - MSWの状態など重要な情報を可視化
 */

import { useEffect, useState } from "react";

interface EnvInfo {
	nodeEnv: string;
	isDevelopment: boolean;
	isProduction: boolean;
	isBrowser: boolean;
	mswStatus: "enabled" | "disabled" | "unknown";
	buildTime: string;
}

export function EnvDebug() {
	const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null);
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// 本番環境では何も表示しない
		const currentEnv = process.env.NODE_ENV as string;
		if (currentEnv === "production") {
			return;
		}

		// 環境情報を収集
		const info: EnvInfo = {
			nodeEnv: currentEnv || "unknown",
			isDevelopment: currentEnv === "development",
			isProduction: currentEnv === "production",
			isBrowser: typeof window !== "undefined",
			mswStatus: getMSWStatus(),
			buildTime: new Date().toISOString(),
		};

		setEnvInfo(info);

		// 開発環境での警告ログ
		if (info.isDevelopment) {
			console.log("🔧 Development mode active");
			console.log("📊 Environment info:", info);

			// MSW関連の警告
			if (info.mswStatus === "unknown") {
				console.warn("⚠️  MSW status unknown - check initialization");
			}
		}
	}, []);

	// MSWの状態を取得
	function getMSWStatus(): "enabled" | "disabled" | "unknown" {
		if (typeof window === "undefined") return "unknown";

		// MSWが初期化されているかチェック
		// Service Workerの存在確認
		if ("serviceWorker" in navigator) {
			return navigator.serviceWorker.controller ? "enabled" : "disabled";
		}

		return "unknown";
	}

	// 本番環境では何も表示しない
	if (!envInfo || envInfo.isProduction) {
		return null;
	}

	return (
		<div className="fixed bottom-4 right-4 z-50">
			{/* トグルボタン */}
			<button
				type="button"
				onClick={() => setIsVisible(!isVisible)}
				className="mb-2 rounded-full bg-blue-500 px-3 py-1 text-xs text-white hover:bg-blue-600"
				title="Environment Debug Info"
			>
				🔧 Debug
			</button>

			{/* デバッグ情報パネル */}
			{isVisible && (
				<div className="rounded-lg bg-black/90 p-4 text-xs text-white shadow-lg backdrop-blur">
					<div className="mb-2 font-bold text-blue-400">Environment Debug</div>

					<div className="space-y-1">
						<div>
							<span className="text-gray-400">NODE_ENV:</span>{" "}
							<span
								className={
									envInfo.isDevelopment
										? "text-yellow-400"
										: envInfo.isProduction
											? "text-red-400"
											: "text-gray-400"
								}
							>
								{envInfo.nodeEnv}
							</span>
						</div>

						<div>
							<span className="text-gray-400">Browser:</span>{" "}
							<span
								className={
									envInfo.isBrowser ? "text-green-400" : "text-red-400"
								}
							>
								{envInfo.isBrowser ? "Yes" : "No"}
							</span>
						</div>

						<div>
							<span className="text-gray-400">MSW:</span>{" "}
							<span
								className={
									envInfo.mswStatus === "enabled"
										? "text-green-400"
										: envInfo.mswStatus === "disabled"
											? "text-yellow-400"
											: "text-red-400"
								}
							>
								{envInfo.mswStatus}
							</span>
						</div>

						<div className="border-t border-gray-600 pt-2 text-gray-500">
							Build: {new Date(envInfo.buildTime).toLocaleTimeString("ja-JP")}
						</div>
					</div>

					{/* 警告表示 */}
					{envInfo.mswStatus === "enabled" && envInfo.isDevelopment && (
						<div className="mt-2 rounded bg-yellow-500/20 px-2 py-1 text-yellow-300">
							⚠️ MSW is active (development only)
						</div>
					)}

					{envInfo.mswStatus === "enabled" && !envInfo.isDevelopment && (
						<div className="mt-2 rounded bg-red-500/20 px-2 py-1 text-red-300">
							🚨 MSW in non-development environment!
						</div>
					)}
				</div>
			)}
		</div>
	);
}
