import { useEffect, useState } from "react";

/**
 * React Query DevtoolsのProps型定義
 * @tanstack/react-query-devtoolsのReactQueryDevtoolsPropsから主要なプロパティを抽出
 */
export interface ReactQueryDevtoolsProps {
	initialIsOpen?: boolean;
	position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
	panelProps?: Record<string, unknown>;
	toggleButtonProps?: Record<string, unknown>;
	closeButtonProps?: Record<string, unknown>;
}

/**
 * SSR対応のReact Query Devtoolsコンポーネント
 *
 * SSR環境では何もレンダリングせず、クライアントサイドでのみDevtoolsを表示する
 * 開発環境でのみ動作し、プロダクション環境では無効化される
 * ハイドレーション後にDevtoolsを動的にマウントすることでSSRエラーを回避
 *
 * 名前の由来: 元のReactQueryDevtoolsと区別するためSSRプレフィックスを付与
 */
export function SSRReactQueryDevtools(props: ReactQueryDevtoolsProps = {}) {
	const [isClient, setIsClient] = useState(false);

	// クライアントサイドでのみDevtoolsをマウント
	useEffect(() => {
		setIsClient(true);
	}, []);

	// 開発環境以外では何もレンダリングしない
	if (process.env.NODE_ENV !== "development") {
		return null;
	}

	// SSR中は何もレンダリングしない
	if (!isClient) {
		return null;
	}

	// クライアントサイドでのみReact Query Devtoolsを動的インポート・レンダリング
	const DevtoolsComponent = () => {
		const {
			ReactQueryDevtools: RQDevtools,
		} = require("@tanstack/react-query-devtools");

		// デフォルトpropsと渡されたpropsをマージ
		const devtoolsProps = {
			initialIsOpen: false,
			position: "bottom-right" as const,
			...props,
		};

		return <RQDevtools {...devtoolsProps} />;
	};

	return <DevtoolsComponent />;
}

// 元のコンポーネント名でのエクスポートも維持（後方互換性のため）
export const ReactQueryDevtools = SSRReactQueryDevtools;
