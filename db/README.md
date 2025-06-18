# Database Setup Guide

Saifuu家計管理アプリのデータベース設定と操作手順

## 🚀 クイックスタート

### 1. 依存関係のインストール

```bash
pnpm install
```

### 2. ローカルD1データベースの作成とマイグレーション

```bash
# D1データベースの作成（初回のみ）
pnpm exec wrangler d1 create saifuu-db

# スキーマからマイグレーションファイルを生成
pnpm run db:generate

# ローカルデータベースにマイグレーションを適用
pnpm run db:migrate:local

# 初期データ・サンプルデータの投入
pnpm run db:seed
```

### 3. 開発サーバーの起動

```bash
pnpm run dev
```

## 📋 利用可能なコマンド

### データベース管理

| コマンド | 説明 |
|----------|------|
| `pnpm run db:generate` | スキーマファイルからマイグレーションファイルを生成 |
| `pnpm run db:migrate` | マイグレーションを実行（Drizzle Kit） |
| `pnpm run db:migrate:local` | ローカルD1にマイグレーションを適用 |
| `pnpm run db:migrate:remote` | 本番D1にマイグレーションを適用 |
| `pnpm run db:push` | スキーマを直接データベースにプッシュ（開発時のみ） |
| `pnpm run db:studio` | Drizzle Studioを起動してデータを可視化 |
| `pnpm run db:seed` | ローカルデータベースに初期データを投入 |
| `pnpm run db:seed:remote` | 本番データベースに初期データを投入 |

### 開発フロー

1. **スキーマ変更** → `db/schema/index.ts` を編集
2. **マイグレーション生成** → `pnpm run db:generate`
3. **ローカル適用** → `pnpm run db:migrate:local`
4. **データ確認** → `pnpm run db:studio`

## 🗂️ ディレクトリ構造

```
db/
├── schema/           # データベーススキーマ定義
│   └── index.ts     # メインスキーマファイル
├── queries/         # データベースクエリ関数
│   ├── transactions.ts
│   └── subscriptions.ts
├── migrations/      # マイグレーションファイル（自動生成）
├── seeds/          # 初期データ投入用SQLファイル
│   ├── categories.sql
│   └── sample-data.sql
├── connection.ts   # データベース接続設定
├── examples.ts     # 使用例
├── seed.sql       # メインシードファイル
└── README.md      # このファイル
```

## 🏗️ データベース設計

### テーブル構成

1. **categories** - 収入・支出のカテゴリマスタ
2. **transactions** - 収入・支出の取引記録
3. **subscriptions** - サブスクリプション・定期支払い
4. **budgets** - 予算管理

### 主要な設計方針

- **型安全性**: DrizzleORMとZodスキーマによる完全な型サポート
- **柔軟性**: カテゴリは動的に追加・編集可能
- **パフォーマンス**: インデックスと効率的なクエリ設計
- **拡張性**: 将来の機能拡張を考慮した設計

## 🔄 データベース操作例

### トランザクション操作

```typescript
import { createDb } from "./db/connection";
import { createTransaction, getRecentTransactions } from "./db/queries/transactions";

// データベース接続
const db = createDb(env.DB);

// 新しい支出を作成
const expense = await createTransaction(db, {
  amount: 1500,
  type: "expense",
  categoryId: 1,
  description: "ランチ代",
  transactionDate: "2025-01-15",
  paymentMethod: "クレジットカード",
});

// 最近の取引を取得
const recent = await getRecentTransactions(db, 10);
```

### サブスクリプション操作

```typescript
import { createSubscription, getActiveSubscriptions } from "./db/queries/subscriptions";

// 新しいサブスクリプションを作成
const subscription = await createSubscription(db, {
  name: "Netflix",
  amount: 1980,
  categoryId: 8, // 娯楽費
  frequency: "monthly",
  nextPaymentDate: "2025-02-01",
});

// アクティブなサブスクリプションを取得
const active = await getActiveSubscriptions(db);
```

## 🚀 本番環境へのデプロイ

### 1. Cloudflare D1データベースの作成

```bash
# 本番用データベースを作成
pnpm exec wrangler d1 create saifuu-db-production

# wrangler.jsonc の database_id を実際のIDに更新
```

### 2. 本番環境でのマイグレーション

```bash
# 本番環境にマイグレーションを適用
pnpm run db:migrate:remote

# 本番環境に初期データを投入
pnpm run db:seed:remote
```

### 3. Workers のデプロイ

```bash
pnpm run deploy
```

## 🛠️ トラブルシューティング

### よくある問題と解決方法

1. **マイグレーションエラー**
   ```bash
   # マイグレーションファイルを再生成
   pnpm run db:generate
   ```

2. **ローカルD1が見つからない**
   ```bash
   # wrangler.jsonc の設定を確認
   # database_id と database_name が正しいか確認
   ```

3. **型エラー**
   ```bash
   # 型生成とチェックを実行
   pnpm run check:fix
   ```

## 📚 参考資料

- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)