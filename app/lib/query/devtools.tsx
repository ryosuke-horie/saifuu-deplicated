import { useEffect, useState } from "react";

/**
 * SSR対応のReact Query Devtoolsコンポーネント
 *
 * SSR環境では何もレンダリングせず、クライアントサイドでのみDevtoolsを表示する
 * 開発環境でのみ動作し、プロダクション環境では無効化される
 * ハイドレーション後にDevtoolsを動的にマウントすることでSSRエラーを回避
 */
export function ReactQueryDevtools() {
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
		return <RQDevtools initialIsOpen={false} />;
	};

	return <DevtoolsComponent />;
}
