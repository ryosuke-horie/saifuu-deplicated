# Saifuu - 家計管理アプリケーション

## プロジェクト概要

完全個人用の家計管理アプリケーション。支出・収入の記録と分析、サブスクリプション管理を行うためのWebアプリケーション。

## 機能

- 支出/収入を登録/編集/一覧するインターフェース
- 支出/収入を中心にデータベースに保存
- サブスクの管理

## 技術スタック

### フレームワーク・ランタイム
- **React Router v7** - フルスタックWebフレームワーク
- **React 19** - UIライブラリ
- **Cloudflare Workers** - エッジランタイム環境
- **TypeScript** - 型安全な開発

### スタイリング・UI
- **Tailwind CSS v4** - ユーティリティファーストCSSフレームワーク

### 開発ツール
- **Vite** - 高速なビルドツール
- **Biome** - コードフォーマッター・リンター
- **pnpm** - パッケージマネージャー

### テスト・開発ツール
- **Playwright** - E2Eテストフレームワーク
- **Vitest** - ユニットテストフレームワーク
- **React Testing Library** - Reactコンポーネントテスト
- **Storybook** - コンポーネント開発・テスト環境
- **MSW (Mock Service Worker)** - APIモック

### データベース・状態管理
- **Cloudflare D1** - SQLiteベースのエッジデータベース（予定）
- **Zod** - スキーマバリデーション

## 開発ルール

### 1. コメント規約
- コメントは必ず日本語で記載する
- 設計意図を明確に記載する
- なぜその実装を選択したのか、代替案は何かを記載する

```typescript
// 例: 
// この関数は支出データを集計するために使用される
// 月単位での集計を行い、カテゴリ別の内訳を返す
// 代替案: 日次集計も検討したが、UIの要件から月次で十分と判断
```

### 2. 型チェック・リント
- 必ず `pnpm check:fix` を実行してから作業を終える
- 型エラーとリントエラーを放置しない
- Biomeの設定に従う

### 3. コミット規約
- 頻繁にコミットする（機能の小さな単位で）
- コミットメッセージは以下のプレフィックスを使用し、日本語で記載する：
  - `feat:` 新機能
  - `fix:` バグ修正
  - `chore:` ビルドプロセスや補助ツールの変更
  - `docs:` ドキュメントの変更
  - `style:` コードの意味に影響しない変更（空白、フォーマット等）
  - `refactor:` バグ修正や機能追加を伴わないコードの変更
  - `test:` テストの追加や既存テストの修正

```bash
# 例:
git commit -m "feat: 支出登録フォームを追加"
git commit -m "fix: 収入一覧の表示バグを修正"
git commit -m "chore: ESLintからBiomeに移行"
```

### 4. 署名設定
- コミット時の署名は必ず `ryosuke-horie` のみとする
- Co-Authoredは設定しない
- 以下のGit設定を使用する：

```bash
git config user.name "ryosuke-horie"
git config user.email "あなたのメールアドレス"
```

## スクリプト

```bash
# 開発サーバー起動
pnpm dev

# 型チェックとリント修正
pnpm check:fix

# ビルド
pnpm build

# Storybook起動
pnpm storybook

# Storybookビルド
pnpm build-storybook

# E2Eテスト
pnpm test:e2e

# ユニットテスト
pnpm test:unit

# デプロイ（Cloudflare Workers）
pnpm deploy
```

## プロジェクト構造

```
saifuu/
├── app/                   # アプリケーションコード
│   ├── routes/            # ページコンポーネント
│   ├── components/        # 共通コンポーネント
│   │   ├── **/*.stories.tsx  # Storybookストーリー
│   │   └── **/*.tsx      # コンポーネント本体
│   ├── utils/             # ユーティリティ関数
│   ├── types/             # 型定義
│   └── root.tsx          # ルートコンポーネント
├── .storybook/           # Storybook設定
│   ├── main.ts           # Storybook設定ファイル
│   ├── preview.tsx       # グローバル設定・デコレーター
│   ├── mocks/            # MSWモックファイル
│   │   ├── server.ts     # MSWサーバー設定
│   │   ├── handlers/     # APIハンドラー
│   │   └── data/         # モックデータ
│   ├── IMPLEMENTATION.md # 実装詳細ドキュメント
│   └── USAGE.md         # 使用方法ガイド
├── tests/                # テストコード
│   └── e2e/             # E2Eテスト
├── public/               # 静的ファイル
├── workers/              # Cloudflare Workers設定
└── CLAUDE.md            # このファイル
```

## Storybook コンポーネント開発

### 概要
Storybookを使用したコンポーネント駆動開発により、UIコンポーネントの品質向上と開発効率化を実現します。

### 基本方針
- **コンポーネント分離開発** - アプリケーションロジックから独立したコンポーネント開発
- **ストーリー駆動設計** - 使用パターンを明確化したストーリー作成
- **MSWによるAPIモック** - 実際のAPIに依存しない開発環境
- **包括的テストパターン** - 正常系・異常系・エッジケースの網羅

### ストーリー作成ガイドライン

#### 1. ファイル配置
```bash
# ストーリーファイルはコンポーネントと同じディレクトリに配置
app/components/[category]/[component-name].stories.tsx
```

#### 2. 基本的なストーリー構造
```typescript
// app/components/example/example.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ExampleComponent } from "./example";

const meta: Meta<typeof ExampleComponent> = {
  title: "Components/ExampleComponent",
  component: ExampleComponent,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: "コンポーネントの説明とユースケース"
      }
    }
  },
  argTypes: {
    // プロパティ制御の定義
  },
  args: {
    // デフォルト値
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本ストーリー
export const Default: Story = {};

// バリエーション
export const Loading: Story = { ... };
export const Error: Story = { ... };
export const Empty: Story = { ... };
```

#### 3. 必須ストーリーパターン
- **Default**: 基本的な使用状態
- **Loading**: ローディング状態（該当する場合）
- **Error**: エラー状態（該当する場合）
- **Empty**: 空データ状態（該当する場合）
- **Edge Cases**: 境界値・特殊ケース

#### 4. APIモックの使用
```typescript
// MSWを使用したAPIモック
export const WithApiData: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/endpoint", () => {
          return HttpResponse.json({ data: "mock data" });
        }),
      ],
    },
  },
};
```

#### 5. インタラクションテスト
```typescript
import { expect, userEvent, within } from "@storybook/test";

export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // ユーザー操作
    await userEvent.click(canvas.getByRole("button"));
    
    // 結果検証
    await expect(canvas.getByText("期待される結果")).toBeInTheDocument();
  },
};
```

### コンポーネント分類

#### Components/ (汎用コンポーネント)
- **Forms/** - フォーム関連コンポーネント
- **Display/** - 表示専用コンポーネント
- **Navigation/** - ナビゲーション関連
- **Feedback/** - フィードバック・通知

#### [Feature]/ (機能固有コンポーネント)
- **Dashboard/** - ダッシュボード固有
- **Transactions/** - 取引機能固有
- **Subscriptions/** - サブスク機能固有

### テスト戦略

#### 1. テストピラミッド統合
```
E2Eテスト (Playwright)          # 正常系のみ・最小限
    ↑
ストーリーテスト (Storybook)      # コンポーネントテスト  
    ↑
ユニットテスト (Vitest)          # 単体テスト・エラー系
```

#### 2. 責務分担
- **Vitest**: ロジック・ユーティリティ関数・バリデーション・エラーハンドリング
- **Storybook**: コンポーネント表示・インタラクション・レスポンシブ
- **Playwright**: 正常系の主要ユーザーフローのみ

#### 3. E2Eテスト制限方針（重要）
GitHub Actions無料枠を効率的に使用するため、E2Eテストは最小限に制限：

- **対象**: 正常系の主要ユーザーフローのみ
- **ブラウザ**: CI環境ではChromiumのみ（ローカルは複数ブラウザ可）
- **テストケース**: 基本的な取引登録・確認フローのみ
- **除外項目**: エラーハンドリング、レスポンシブ、パフォーマンス

#### 4. E2E以外での品質担保
- **エラーハンドリング**: ユニットテスト・統合テストで検証
- **レスポンシブデザイン**: Storybookでの視覚的確認・ユニットテスト
- **パフォーマンス**: ローカル環境での手動確認・Lighthouse等
- **バリデーション**: ユニットテスト・統合テスト

#### 5. MSWモック戦略
- **共通データ**: `.storybook/mocks/data/` で統一管理
- **ハンドラー分離**: API別にハンドラーを分割
- **エラーパターン**: ネットワーク・サーバーエラーの包括的対応

### 開発ワークフロー

#### 1. 新コンポーネント開発
```bash
1. コンポーネント設計・実装
2. 基本ストーリー作成
3. Storybookで動作確認
4. エッジケース・エラーパターン追加
5. インタラクションテスト追加
6. ドキュメント更新
```

#### 2. 既存コンポーネント修正
```bash
1. 既存ストーリーで影響確認
2. 必要に応じて新ストーリー追加
3. インタラクションテスト更新
4. 全ストーリーで動作確認
```

### ベストプラクティス

#### 1. ストーリー命名
- **意味のある名前**: 状態や用途が明確
- **一貫した命名**: プロジェクト全体で統一
- **階層化**: カテゴリ・サブカテゴリで整理

#### 2. モックデータ設計
- **現実的なデータ**: 実際の使用パターンに即したデータ
- **エッジケース**: 境界値・特殊ケースのカバー
- **パフォーマンス**: 適切なデータ量での動作確認

#### 3. アクセシビリティ
- **a11y アドオン**: 自動アクセシビリティチェック
- **セマンティックHTML**: 適切なHTML要素の使用
- **キーボード操作**: Tab・Enter等での操作確認

### 詳細ドキュメント
- **実装詳細**: `.storybook/IMPLEMENTATION.md`
- **使用方法**: `.storybook/USAGE.md`

## セルフホストランナー運用ルール

### 重要な制約
- **キャッシュ無効**: セルフホストランナーのマシン性能の都合により、`cache: 'pnpm'` や Node.js キャッシュは使用しない
- **パフォーマンス優先**: キャッシュによる遅延を避けるため、毎回クリーンインストールを実行
- **設定例**:
```yaml
# ❌ 使用禁止
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'
    cache: 'pnpm'  # セルフホストでは無効化

# ✅ 正しい設定
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '22'  # キャッシュ設定なし
```

## 開発の進め方

1. 新機能開発時は、まず設計意図をコメントで記載
2. **Storybookでコンポーネント分離開発**
3. 小さな単位で実装し、都度 `pnpm check:fix` を実行
4. テストを書く（Storybook・ユニット・E2E）
5. 機能の完成度に応じて頻繁にコミット
6. プルリクエストを作成してレビュー

## 注意事項

- 個人情報や機密情報をコミットしない
- 環境変数は `.env` ファイルで管理し、サンプルは `.env.example` に記載
- Cloudflare Workersのシークレットは `wrangler secret` で管理