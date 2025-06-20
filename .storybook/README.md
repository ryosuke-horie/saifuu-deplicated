# Saifuu Storybook 設定

このディレクトリには、Saifuu家計管理アプリケーション用のStorybookの設定ファイルが含まれています。

## 設定ファイル

### `main.ts`
- Storybook本体の設定ファイル
- ストーリーファイルの場所、使用するアドオン、フレームワーク設定などを定義
- Vite設定の統合とパスエイリアス（`~/*` → `./app/*`）を設定

### `preview.tsx`
- 全ストーリーに適用されるグローバル設定
- React Query プロバイダー、React Router、アプリケーション全体のスタイリングを提供
- MSW（Mock Service Worker）の設定でAPI呼び出しをモック化

## 使用方法

### Storybook の起動
```bash
pnpm storybook
```

### Storybookのビルド（本番用）
```bash
pnpm build-storybook
```

## ストーリーファイルの作成

### 基本的なストーリーファイルの構造
```typescript
// app/components/example/example.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ExampleComponent } from "./example";

const meta: Meta<typeof ExampleComponent> = {
  title: "Components/ExampleComponent",
  component: ExampleComponent,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // コンポーネントのプロパティ
  },
};
```

### API呼び出しを含むコンポーネントのストーリー
```typescript
import { http, HttpResponse } from "msw";

export const WithApiData: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/example", () => {
          return HttpResponse.json({ data: "mock data" });
        }),
      ],
    },
  },
};
```

## 設定されたアドオン

- **@storybook/addon-essentials** - 基本的なアドオン群（Controls、Actions、Docs等）
- **@storybook/addon-interactions** - インタラクションテスト用
- **@storybook/addon-a11y** - アクセシビリティチェック用
- **@storybook/addon-docs** - ドキュメント生成用
- **msw-storybook-addon** - API モック用

## ファイル配置ルール

ストーリーファイルは以下の場所に配置してください：
- `app/components/**/*.stories.@(js|jsx|ts|tsx)`

例：
- `app/components/dashboard/summary-cards.stories.tsx`
- `app/components/forms/transaction-form.stories.tsx`

## レスポンシブテスト

Storybookではレスポンシブデザインのテストができます：
- **Mobile**: 375px × 667px
- **Tablet**: 768px × 1024px  
- **Desktop**: 1200px × 800px

## ダークモードテスト

背景色の切り替えができます：
- **Light**: 白背景
- **Dark**: ダーク背景

## 注意事項

1. **パスエイリアス**: `~/` を使用してアプリケーションのファイルをインポートできます
2. **React Query**: 全ストーリーでReact Queryプロバイダーが利用可能です
3. **MSW**: API呼び出しはMSWでモック化されています
4. **Tailwind CSS**: アプリケーションと同じスタイリングが適用されます
5. **自動ドキュメント**: `tags: ["autodocs"]` を設定すると自動的にドキュメントが生成されます