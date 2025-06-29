import { useEffect, useState } from "react";

/**
 * Remixパターン: クライアントサイドでのみレンダリングするコンポーネント
 * 
 * 設計方針:
 * - SSRとCSRの差異を回避
 * - ブラウザAPIに依存するコンポーネントを安全に使用
 * - ハイドレーション不一致を防ぐ
 * 
 * 参考: https://remix.run/docs/en/main/guides/migrating-react-router-app#client-only-components
 */

interface ClientOnlyProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
	const [hasMounted, setHasMounted] = useState(false);

	useEffect(() => {
		console.log("🔄 [DEBUG] ClientOnly useEffect実行");
		setHasMounted(true);
	}, []);

	if (!hasMounted) {
		console.log("🔄 [DEBUG] ClientOnly: サーバーサイド/ハイドレーション前");
		return <>{fallback}</>;
	}

	console.log("🔄 [DEBUG] ClientOnly: クライアントサイドレンダリング");
	return <>{children}</>;
}