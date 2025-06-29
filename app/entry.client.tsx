import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

console.log("🚀 [DEBUG] entry.client.tsx loaded - ハイドレーション開始");
console.log("🚀 [DEBUG] document状態:", {
	readyState: document.readyState,
	hasDOM: !!document.getElementById,
	location: window.location.href,
});

try {
	console.log("🚀 [DEBUG] ハイドレーション実行中...");
	hydrateRoot(
		document,
		<StrictMode>
			<HydratedRouter />
		</StrictMode>,
	);
	console.log("✅ [DEBUG] ハイドレーション完了");
} catch (error) {
	console.error("❌ [DEBUG] ハイドレーションエラー:", error);
}
