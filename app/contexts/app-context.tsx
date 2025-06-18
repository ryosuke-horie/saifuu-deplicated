import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * アプリケーション全体の状態管理コンテキスト
 *
 * 設計方針:
 * - UI状態の管理（モーダル、サイドバー、テーマなど）
 * - 一時的なフォーム状態の管理
 * - TanStack Queryでは管理しない軽量な状態を扱う
 * - 過度な複雑化を避け、必要最小限の状態のみ管理
 */

// ========================================
// 型定義
// ========================================

interface AppState {
	// UI状態
	isSidebarOpen: boolean;
	isModalOpen: boolean;
	modalContent: ReactNode | null;
	theme: "light" | "dark" | "system";

	// フィルター状態（取引一覧などで使用）
	transactionFilters: {
		startDate?: string;
		endDate?: string;
		categoryId?: number;
		type?: "income" | "expense";
		search?: string;
	};

	// ソート状態
	transactionSort: {
		sortBy: "transactionDate" | "amount" | "createdAt";
		sortOrder: "asc" | "desc";
	};

	// ページネーション状態
	pagination: {
		page: number;
		limit: number;
	};
}

interface AppActions {
	// UI操作
	toggleSidebar: () => void;
	setSidebarOpen: (open: boolean) => void;
	openModal: (content: ReactNode) => void;
	closeModal: () => void;
	setTheme: (theme: AppState["theme"]) => void;

	// フィルター操作
	updateTransactionFilters: (
		filters: Partial<AppState["transactionFilters"]>,
	) => void;
	clearTransactionFilters: () => void;

	// ソート操作
	updateTransactionSort: (sort: Partial<AppState["transactionSort"]>) => void;

	// ページネーション操作
	updatePagination: (pagination: Partial<AppState["pagination"]>) => void;
	resetPagination: () => void;

	// 全体リセット
	resetAppState: () => void;
}

type AppContextValue = AppState & AppActions;

// ========================================
// デフォルト値
// ========================================

const defaultAppState: AppState = {
	// UI状態のデフォルト値
	isSidebarOpen: false,
	isModalOpen: false,
	modalContent: null,
	theme: "system",

	// フィルター状態のデフォルト値
	transactionFilters: {},

	// ソート状態のデフォルト値
	transactionSort: {
		sortBy: "transactionDate",
		sortOrder: "desc",
	},

	// ページネーション状態のデフォルト値
	pagination: {
		page: 1,
		limit: 20,
	},
};

// ========================================
// コンテキスト定義
// ========================================

const AppContext = createContext<AppContextValue | undefined>(undefined);

// ========================================
// プロバイダーコンポーネント
// ========================================

interface AppProviderProps {
	children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
	const [state, setState] = useState<AppState>(defaultAppState);

	// UI操作のアクション
	const toggleSidebar = () => {
		setState((prev) => ({
			...prev,
			isSidebarOpen: !prev.isSidebarOpen,
		}));
	};

	const setSidebarOpen = (open: boolean) => {
		setState((prev) => ({
			...prev,
			isSidebarOpen: open,
		}));
	};

	const openModal = (content: ReactNode) => {
		setState((prev) => ({
			...prev,
			isModalOpen: true,
			modalContent: content,
		}));
	};

	const closeModal = () => {
		setState((prev) => ({
			...prev,
			isModalOpen: false,
			modalContent: null,
		}));
	};

	const setTheme = (theme: AppState["theme"]) => {
		setState((prev) => ({
			...prev,
			theme,
		}));

		// テーマをローカルストレージに保存
		if (typeof window !== "undefined") {
			localStorage.setItem("theme", theme);
		}
	};

	// フィルター操作のアクション
	const updateTransactionFilters = (
		filters: Partial<AppState["transactionFilters"]>,
	) => {
		setState((prev) => ({
			...prev,
			transactionFilters: {
				...prev.transactionFilters,
				...filters,
			},
			// フィルター変更時はページをリセット
			pagination: {
				...prev.pagination,
				page: 1,
			},
		}));
	};

	const clearTransactionFilters = () => {
		setState((prev) => ({
			...prev,
			transactionFilters: {},
			pagination: {
				...prev.pagination,
				page: 1,
			},
		}));
	};

	// ソート操作のアクション
	const updateTransactionSort = (sort: Partial<AppState["transactionSort"]>) => {
		setState((prev) => ({
			...prev,
			transactionSort: {
				...prev.transactionSort,
				...sort,
			},
			// ソート変更時はページをリセット
			pagination: {
				...prev.pagination,
				page: 1,
			},
		}));
	};

	// ページネーション操作のアクション
	const updatePagination = (pagination: Partial<AppState["pagination"]>) => {
		setState((prev) => ({
			...prev,
			pagination: {
				...prev.pagination,
				...pagination,
			},
		}));
	};

	const resetPagination = () => {
		setState((prev) => ({
			...prev,
			pagination: defaultAppState.pagination,
		}));
	};

	// 全体リセットのアクション
	const resetAppState = () => {
		setState(defaultAppState);
	};

	// コンテキスト値
	const contextValue: AppContextValue = {
		...state,
		toggleSidebar,
		setSidebarOpen,
		openModal,
		closeModal,
		setTheme,
		updateTransactionFilters,
		clearTransactionFilters,
		updateTransactionSort,
		updatePagination,
		resetPagination,
		resetAppState,
	};

	return (
		<AppContext.Provider value={contextValue}>{children}</AppContext.Provider>
	);
}

// ========================================
// カスタムフック
// ========================================

/**
 * アプリケーションコンテキストを使用するフック
 */
export function useAppContext() {
	const context = useContext(AppContext);
	if (context === undefined) {
		throw new Error("useAppContext は AppProvider 内で使用する必要があります");
	}
	return context;
}

/**
 * UI状態のみを取得するフック
 */
export function useUIState() {
	const { isSidebarOpen, isModalOpen, modalContent, theme } = useAppContext();
	return { isSidebarOpen, isModalOpen, modalContent, theme };
}

/**
 * UI操作のみを取得するフック
 */
export function useUIActions() {
	const { toggleSidebar, setSidebarOpen, openModal, closeModal, setTheme } =
		useAppContext();
	return { toggleSidebar, setSidebarOpen, openModal, closeModal, setTheme };
}

/**
 * 取引フィルター状態のみを取得するフック
 */
export function useTransactionFilterState() {
	const { transactionFilters, transactionSort, pagination } = useAppContext();
	return { transactionFilters, transactionSort, pagination };
}

/**
 * 取引フィルター操作のみを取得するフック
 */
export function useTransactionFilterActions() {
	const {
		updateTransactionFilters,
		clearTransactionFilters,
		updateTransactionSort,
		updatePagination,
		resetPagination,
	} = useAppContext();
	return {
		updateTransactionFilters,
		clearTransactionFilters,
		updateTransactionSort,
		updatePagination,
		resetPagination,
	};
}

// ========================================
// 型エクスポート
// ========================================

export type { AppState, AppActions, AppContextValue };