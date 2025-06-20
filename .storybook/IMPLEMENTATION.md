# Saifuu Storybook + MSW 実装ドキュメント

## プロジェクト概要と達成された目標

### 概要
Saifuu家計管理アプリケーションにおけるStorybook + MSW（Mock Service Worker）統合実装です。コンポーネント開発、テスト、デザインシステムの効率化を目的とした包括的な開発環境を構築しました。

### 達成された目標

#### 1. 統合開発環境の構築
- **Storybook 8.6系** - 最新のStorybook環境でReact 19に対応
- **MSW 2.x系** - 最新のMock Service Worker APIモック機能
- **React Router v7** - フルスタックフレームワークとの統合
- **TanStack Query v5** - データフェッチライブラリとの統合
- **Tailwind CSS v4** - デザインシステムとの統合

#### 2. コンポーネント開発効率化
- **コンポーネント分離開発** - アプリケーションロジックから独立した開発
- **リアルタイムプレビュー** - インタラクティブなコンポーネント表示
- **プロパティ制御** - Controlsアドオンによる動的プロパティ操作
- **レスポンシブテスト** - 複数デバイスサイズでの表示確認

#### 3. 品質保証とテスト戦略
- **ビジュアルテスト** - コンポーネントの外観品質確保
- **インタラクションテスト** - ユーザー操作のテスト自動化  
- **アクセシビリティチェック** - a11yアドオンによる品質確保
- **エラーハンドリング検証** - 様々なデータ状態でのテスト

## 技術アーキテクチャ

### フレームワーク・ライブラリ構成

```
Storybook 8.6 (フロントエンド開発環境)
├── React 19 (UIライブラリ)
├── Vite 6.x (ビルドツール)
├── TanStack Query v5 (データフェッチ・状態管理)
├── React Router v7 (ルーティング)
├── MSW 2.x (APIモック)
├── Tailwind CSS v4 (スタイリング)
└── TypeScript 5.8 (型安全性)
```

### アドオン構成

#### 必須アドオン
- **@storybook/addon-essentials** - 基本機能パック
  - Controls: プロパティ動的制御
  - Actions: イベントハンドラー監視
  - Docs: 自動ドキュメント生成
  - Viewport: レスポンシブ表示切り替え
  - Backgrounds: 背景色制御

#### 品質・テスト用アドオン
- **@storybook/addon-interactions** - インタラクションテスト
- **@storybook/addon-a11y** - アクセシビリティ検証
- **msw-storybook-addon** - API モック統合

### アーキテクチャ設計原則

#### 1. 分離関心事 (Separation of Concerns)
```typescript
// コンポーネント: UIロジックのみ
// ストーリー: 表示パターンとモック
// MSWハンドラー: API動作定義
```

#### 2. 再利用可能性 (Reusability) 
```typescript
// 共通モックデータの統一管理
// ストーリーパターンの標準化
// デコレーターの共通化
```

#### 3. 型安全性 (Type Safety)
```typescript
// TypeScript完全対応
// Meta・StoryObj型の活用
// プロパティ型定義の自動生成
```

## ファイル構造と組織化

### ディレクトリ構造

```
.storybook/                     # Storybook設定ディレクトリ
├── main.ts                     # Storybook本体設定
├── preview.tsx                 # グローバル設定・デコレーター
├── preview-full.tsx            # 完全版プレビュー設定（予備）
├── vite.config.ts              # Storybook専用Vite設定
├── mocks/                      # MSWモックファイル群
│   ├── server.ts               # MSWサーバー設定とハンドラー統合
│   ├── handlers/              # APIハンドラー群
│   │   ├── categories.ts       # カテゴリAPI
│   │   ├── transactions.ts     # 取引API  
│   │   └── subscriptions.ts    # サブスクリプションAPI
│   └── data/                  # モックデータ定義
│       ├── categories.ts       # カテゴリマスター
│       ├── transactions.ts     # 取引データ
│       └── subscriptions.ts    # サブスク定義
├── IMPLEMENTATION.md           # 実装詳細（このファイル）
└── USAGE.md                   # 使用方法ガイド

app/components/                 # アプリケーションコンポーネント  
├── dashboard/                  # ダッシュボード関連
│   ├── summary-cards.tsx       # サマリーカード
│   └── summary-cards.stories.tsx # ストーリー定義
├── transactions/              # 取引関連
│   ├── transaction-list.tsx    # 取引一覧
│   ├── transaction-list.stories.tsx # ストーリー定義
│   ├── filter-panel.tsx       # フィルターパネル
│   └── filter-panel.stories.tsx # ストーリー定義
└── ...
```

### 設定ファイル詳細

#### main.ts - Storybook本体設定
```typescript
// ストーリーファイルパターン
stories: ["../app/components/**/*.stories.@(js|jsx|ts|tsx)"]

// フレームワーク設定
framework: {
  name: "@storybook/react-vite",
  options: {
    viteConfigPath: ".storybook/vite.config.ts"
  }
}

// TypeScript設定
typescript: {
  check: false, // 高速化のため型チェック無効
  reactDocgen: "react-docgen-typescript"
}
```

#### preview.tsx - グローバル設定
```typescript
// デコレーター設定
decorators: [
  // React Query プロバイダー
  (Story) => <QueryClientProvider client={queryClient}><Story /></QueryClientProvider>,
  
  // React Router プロバイダー
  (Story) => <BrowserRouter><Story /></BrowserRouter>,
  
  // アプリケーションスタイル適用
  (Story) => <div className="min-h-screen bg-white dark:bg-gray-950">...</div>
]
```

## MSWモック戦略とAPI カバレッジ

### モック戦略設計

#### 1. 階層化アーキテクチャ
```typescript
// レイヤー1: データ定義
export const mockCategories = [...];

// レイヤー2: APIハンドラー
export const categoriesHandlers = [
  http.get('/api/categories', () => {...})
];

// レイヤー3: ストーリー統合
parameters: {
  msw: { handlers: [...categoriesHandlers] }
}
```

#### 2. データパターン網羅
- **成功パターン**: 正常なデータ取得・操作
- **エラーパターン**: ネットワークエラー、サーバーエラー
- **エッジケース**: 空データ、大量データ、境界値
- **ローディング状態**: 非同期処理中の表示

#### 3. 実データ整合性
```typescript
// 実際のDBスキーマに準拠
interface Transaction {
  id: number;
  amount: number;
  type: 'income' | 'expense';
  categoryId: number;
  description: string;
  transactionDate: string;
  // ... 実スキーマと同じ構造
}
```

### API カバレッジ

#### カテゴリAPI (/api/categories)
```typescript
// 取得系
GET /api/categories              # 一覧取得
GET /api/categories/:id          # 単体取得

// 更新系  
POST /api/categories             # 新規作成
PUT /api/categories/:id          # 更新
DELETE /api/categories/:id       # 削除
POST /api/categories/reorder     # 並び順変更
```

#### 取引API (/api/transactions)
```typescript
// 取得系
GET /api/transactions            # 一覧取得（フィルター・ページネーション対応）
GET /api/transactions/:id        # 単体取得

// 更新系
POST /api/transactions           # 新規作成
PUT /api/transactions/:id        # 更新  
DELETE /api/transactions/:id     # 削除
```

#### サブスクリプションAPI (/api/subscriptions)
```typescript
// 取得系
GET /api/subscriptions           # 一覧取得
GET /api/subscriptions/:id       # 単体取得

// 更新系
POST /api/subscriptions          # 新規作成
PUT /api/subscriptions/:id       # 更新
DELETE /api/subscriptions/:id    # 削除
POST /api/subscriptions/:id/activate   # 有効化
POST /api/subscriptions/:id/deactivate # 無効化
```

### 高度なモック機能

#### 1. 動的レスポンス生成
```typescript
// ページネーション対応
const createPaginatedResponse = (data, page, limit, filters) => {
  // フィルター適用
  let filteredData = applyFilters(data, filters);
  
  // ソート適用
  let sortedData = applySorting(filteredData, sortOptions);
  
  // ページネーション適用
  return paginateData(sortedData, page, limit);
};
```

#### 2. フィルタリング・ソート対応
```typescript
// 複合フィルター
if (filters.type) filteredData = filteredData.filter(t => t.type === filters.type);
if (filters.category_id) filteredData = filteredData.filter(t => t.categoryId === filters.category_id);  
if (filters.from) filteredData = filteredData.filter(t => t.transactionDate >= filters.from);
if (filters.search) filteredData = filteredData.filter(t => t.description.includes(filters.search));
```

#### 3. エラーシミュレーション
```typescript
// ネットワークエラー
http.get('/api/transactions', () => {
  return HttpResponse.json({ error: 'Network Error' }, { status: 500 });
});

// タイムアウト
http.get('/api/transactions', async () => {
  await delay(10000); // 10秒遅延
  return HttpResponse.json(data);
});
```

## ストーリーパターンと規約

### ストーリー命名規約

#### 1. 基本パターン
```typescript
// デフォルト状態
export const Default: Story = { ... };

// 機能別状態
export const WithFilters: Story = { ... };
export const LoadingState: Story = { ... };
export const ErrorState: Story = { ... };
export const EmptyState: Story = { ... };
```

#### 2. データパターン
```typescript
// データ量別
export const SmallDataset: Story = { ... };   // 少量データ
export const LargeDataset: Story = { ... };   // 大量データ
export const SingleItem: Story = { ... };     // 単一アイテム

// 状態別
export const SuccessState: Story = { ... };   // 成功状態
export const PendingState: Story = { ... };   // 処理中状態
export const FailureState: Story = { ... };   // 失敗状態
```

#### 3. インタラクション別
```typescript
// ユーザー操作
export const WithUserInteraction: Story = { ... };
export const FormValidation: Story = { ... };
export const ButtonClicks: Story = { ... };
```

### ストーリー構造パターン

#### 1. 基本構造
```typescript
const meta: Meta<typeof ComponentName> = {
  title: "Category/ComponentName",
  component: ComponentName,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "コンポーネントの説明..."
      }
    }
  },
  argTypes: {
    // プロパティ定義
  },
  args: {
    // デフォルト値
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;
```

#### 2. インタラクションテスト
```typescript
export const WithInteractions: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // ユーザー操作シミュレーション
    await userEvent.click(canvas.getByRole('button'));
    
    // 結果検証
    await expect(canvas.getByText('期待される結果')).toBeInTheDocument();
  },
};
```

### コンポーネント分類体系

```
Components/                     # 基本コンポーネント
├── Forms/                      # フォーム関連
│   ├── TransactionForm         # 取引フォーム
│   └── FilterPanel            # フィルターパネル
├── Display/                   # 表示専用
│   ├── TransactionList        # 取引一覧  
│   ├── TransactionCards       # 取引カード
│   └── SummaryCards          # サマリーカード
├── Navigation/                # ナビゲーション
└── Feedback/                  # フィードバック

Dashboard/                     # ダッシュボード固有
├── Charts/                    # グラフ・チャート
├── Widgets/                   # ウィジェット
└── Layouts/                   # レイアウト

Transactions/                  # 取引機能固有
├── List/                      # リスト表示
├── Forms/                     # 入力フォーム
└── Filters/                   # フィルター

Subscriptions/                 # サブスク機能固有
├── Cards/                     # カード表示
├── Forms/                     # 管理フォーム
└── Actions/                   # アクション
```

## 既存テストセットアップとの統合

### テスト戦略統合

#### 1. テストピラミッド構成
```
E2Eテスト (Playwright)          # 統合テスト
    ↑
ストーリーテスト (Storybook)      # コンポーネントテスト  
    ↑
ユニットテスト (Vitest)          # 単体テスト
```

#### 2. 責務分担
- **Vitest**: ロジック・ユーティリティ関数のテスト
- **Storybook**: コンポーネントの表示・インタラクションテスト
- **Playwright**: フルフロー・統合テスト

#### 3. 共通モック戦略
```typescript
// tests/mocks/ - ユニットテスト用
// .storybook/mocks/ - Storybook用
// 両者で共通データを使用して整合性確保
```

### TanStack Query統合

#### 1. プロバイダー設定
```typescript
// ストーリー用QueryClient設定
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,                          // リトライ無効
      staleTime: Number.POSITIVE_INFINITY,   # データ永続化
      gcTime: Number.POSITIVE_INFINITY,      # GC無効
    },
  },
});
```

#### 2. カスタムフック対応
```typescript
// React Query フックをStorybookで直接テスト可能
export const WithQueryHook: Story = {
  render: () => {
    const { data, isLoading, error } = useTransactions();
    return <ComponentWithData data={data} loading={isLoading} error={error} />;
  },
};
```

### React Router統合

#### 1. ナビゲーション対応
```typescript
// BrowserRouterでラップしてリンク動作確保
decorators: [
  (Story) => (
    <BrowserRouter>
      <Story />
    </BrowserRouter>
  ),
];
```

#### 2. ルーティング依存コンポーネント
```typescript
// useNavigate, useParams等のフック対応
// モックナビゲーション動作の確認
```

## パフォーマンス考慮事項

### 1. ビルド最適化
```typescript
// TypeScript型チェック無効化（高速化）
typescript: {
  check: false,
}

// 不要なストーリー除外
stories: [
  "../app/components/**/*.stories.@(js|jsx|ts|tsx)",
  "!../node_modules/**"
]
```

### 2. メモリ使用量最適化
```typescript
// QueryClient設定でメモリリーク防止
gcTime: Number.POSITIVE_INFINITY, // 開発時のみ
```

### 3. MSWパフォーマンス
```typescript
// 必要最小限のハンドラーのみ登録
// ストーリー固有ハンドラーで上書き
```

## セキュリティ考慮事項

### 1. MSWセキュリティ
```typescript
// 本番環境でのMSW無効化確認
if (process.env.NODE_ENV === 'development') {
  // MSW起動
}
```

### 2. 機密情報の除外
```typescript
// 実データ・認証情報は使用せず
// ダミーデータのみ使用
const mockData = {
  // 実際のPII (個人識別情報) は含めない
  name: "テスト太郎",
  email: "test@example.com"
};
```

## 今後の拡張計画

### 1. 機能拡張
- **ビジュアルリグレッションテスト** - Chromatic統合
- **パフォーマンステスト** - Core Web Vitals測定
- **モバイル対応強化** - デバイス固有テスト

### 2. 自動化強化
- **CI/CD統合** - 自動ストーリーテスト実行
- **デザインシステム連携** - Figma・デザイントークン統合
- **ドキュメント自動生成** - コンポーネント仕様書

### 3. 開発体験向上
- **ホットリロード最適化** - 高速開発サイクル
- **デバッグ支援** - React DevTools統合
- **コード生成** - ストーリーテンプレート自動生成

## トラブルシューティング

### よくある問題と解決策

#### 1. MSWハンドラーが動作しない
```bash
# MSW初期化確認
console.log('MSW initialized:', mswInitialized);

# ハンドラー登録確認  
console.log('Handlers:', handlers);
```

#### 2. React Query データが取得できない
```typescript
// QueryClient設定確認
// ネットワークタブでリクエスト確認
// MSWレスポンス確認
```

#### 3. ストーリー表示されない
```bash
# コンソールエラー確認
# ファイルパス確認
# インポート文確認
```

#### 4. 型エラー
```bash
# TypeScript設定確認
pnpm run typecheck

# 型定義ファイル確認
# React Router型定義確認
```

以上が、Saifuu Storybook + MSW統合実装の包括的な実装ドキュメントです。本ドキュメントを参考に、効率的なコンポーネント開発とテスト戦略を推進してください。