# 技術スタック移行計画

## 現状
- React Router v7 でSSRを実装
- Cloudflare Workers でホスティング
- データベース・API未実装

## 移行後のアーキテクチャ

### バックエンド
- **Hono** - 軽量で高速なWebフレームワーク（既存のCloudflare Workers上で動作）
- **Drizzle ORM** - TypeScript型安全なORM
- **Cloudflare D1** - SQLiteベースのエッジデータベース

### フロントエンド
- **React 19** - UIライブラリ（維持）
- **Tailwind CSS v4** - スタイリング（維持）
- **Zod** - バリデーション（維持）

### 実装方針
- HonoはReact Routerと同じWorkers内で動作（別Workersは不要）
- `/api/*`パスでHonoがリクエストを処理
- それ以外のパスはReact Routerが処理
- 認証機能は実装しない（完全個人用）

## 移行ステップ

### Phase 1: 基盤整備
1. Honoサーバーのセットアップ
2. Drizzle ORMとD1の設定
3. データベーススキーマの設計

### Phase 2: API開発
1. 支出/収入のCRUD API
2. サブスクリプション管理API
3. カテゴリマスタAPI

### Phase 3: フロントエンド実装
1. APIクライアントの実装
2. 各種フォームコンポーネント
3. 一覧・詳細画面
4. ダッシュボード

### Phase 4: 運用準備
1. エラーハンドリング
2. ログ設定
3. バックアップ戦略
4. デプロイ自動化

## データベーススキーマ（案）

```sql
-- 支出/収入
CREATE TABLE transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  date TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- サブスクリプション
CREATE TABLE subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  billing_cycle TEXT NOT NULL CHECK(billing_cycle IN ('monthly', 'yearly')),
  next_billing_date TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- カテゴリマスタ
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense', 'both')),
  color TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0
);
```

## 技術的な考慮事項

1. **セキュリティ**: 認証なし（完全個人用として運用）
2. **データ形式**: 金額はすべて整数（円単位）で管理
3. **日付**: ISO 8601形式で統一
4. **API設計**: シンプルなRESTful API
5. **キャッシュ**: Cloudflare Workersのキャッシュを活用
6. **Workers構成**: 単一のWorkersでReact RouterとHonoを共存