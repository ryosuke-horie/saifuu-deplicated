# Saifuu Storybook 使用方法ガイド

## 概要

このガイドでは、Saifuu家計管理アプリケーションでのStorybook使用方法を実践的に説明します。コンポーネント開発、テスト、デバッグの効率的な手法を習得できます。

## 目次

1. [Storybookの起動と基本操作](#storybookの起動と基本操作)
2. [新しいストーリーの作成](#新しいストーリーの作成)
3. [MSWモックのカスタマイズ](#mswモックのカスタマイズ)
4. [コンポーネントインタラクションテスト](#コンポーネントインタラクションテスト)
5. [トラブルシューティング](#トラブルシューティング)
6. [ベストプラクティス](#ベストプラクティス)

## Storybookの起動と基本操作

### 起動方法

```bash
# 開発サーバーの起動
pnpm storybook

# 本番用ビルド
pnpm build-storybook

# ビルド結果の確認
pnpm preview-storybook
```

### 基本操作

#### 1. ストーリー選択
```
左サイドバー > Components > [カテゴリ] > [コンポーネント名]
```

#### 2. コントロールパネル
```
画面下部 > Controls タブ
- プロパティをリアルタイムで編集
- 値の変更を即座に反映
```

#### 3. アクションパネル
```
画面下部 > Actions タブ  
- イベントハンドラーの呼び出し履歴
- クリック・フォーム送信等のログ
```

#### 4. ドキュメント確認
```
各ストーリー > Docs タブ
- コンポーネントの使用方法
- プロパティ一覧
- 使用例
```

## 新しいストーリーの作成

### 1. 基本的なストーリーファイル

```typescript
// app/components/example/example.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { ExampleComponent } from "./example";

/**
 * ExampleComponent のストーリー定義
 * 
 * 設計方針:
 * - 各使用パターンを網羅的にカバー
 * - プロパティの組み合わせパターンを検証
 * - エラー状態・境界値のテスト
 */
const meta: Meta<typeof ExampleComponent> = {
  title: "Components/ExampleComponent",
  component: ExampleComponent,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component: `
**ExampleComponent**

このコンポーネントは○○を表示するために使用されます。

## 使用場面
- ○○画面での表示
- ○○フォームでの入力

## 注意事項
- ○○の場合は△△プロパティが必要
- ××環境では□□制限があります
        `,
      },
    },
  },
  argTypes: {
    // プロパティ制御の定義
    title: {
      control: "text",
      description: "表示タイトル",
      table: {
        type: { summary: "string" },
        defaultValue: { summary: "未設定" },
      },
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "danger"],
      description: "表示バリエーション",
    },
    disabled: {
      control: "boolean",
      description: "無効状態",
    },
    onClick: {
      action: "clicked",
      description: "クリック時のコールバック",
    },
  },
  args: {
    // デフォルト値
    title: "サンプルタイトル",
    variant: "primary",
    disabled: false,
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// ストーリー定義群
export const Default: Story = {};

export const Secondary: Story = {
  args: {
    variant: "secondary",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const LongTitle: Story = {
  args: {
    title: "非常に長いタイトルを設定した場合の表示確認のためのサンプルテキスト",
  },
};
```

### 2. API依存コンポーネントのストーリー

```typescript
// app/components/data-component/data-component.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { http, HttpResponse } from "msw";
import { DataComponent } from "./data-component";

const meta: Meta<typeof DataComponent> = {
  title: "Components/DataComponent",
  component: DataComponent,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 正常データ取得
export const Default: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/data", () => {
          return HttpResponse.json({
            success: true,
            data: [
              { id: 1, name: "アイテム1", value: 100 },
              { id: 2, name: "アイテム2", value: 200 },
            ],
          });
        }),
      ],
    },
  },
};

// ローディング状態
export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/data", async () => {
          // 無限ローディング
          await new Promise(() => {});
          return HttpResponse.json({ data: [] });
        }),
      ],
    },
  },
};

// エラー状態
export const Error: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/data", () => {
          return HttpResponse.json(
            { error: "データ取得に失敗しました" },
            { status: 500 }
          );
        }),
      ],
    },
  },
};

// 空データ
export const Empty: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/data", () => {
          return HttpResponse.json({
            success: true,
            data: [],
          });
        }),
      ],
    },
  },
};
```

### 3. フォームコンポーネントのストーリー

```typescript
// app/components/form-component/form-component.stories.tsx
import type { Meta, StoryObj } from "@storybook/react";
import { expect, userEvent, within } from "@storybook/test";
import { FormComponent } from "./form-component";

const meta: Meta<typeof FormComponent> = {
  title: "Components/FormComponent",
  component: FormComponent,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 基本フォーム
export const Default: Story = {
  args: {
    onSubmit: (data) => {
      console.log("送信データ:", data);
    },
  },
};

// バリデーションエラー
export const WithValidationErrors: Story = {
  args: {
    initialErrors: {
      email: "メールアドレスが正しくありません",
      password: "パスワードは8文字以上で入力してください",
    },
  },
};

// インタラクションテスト
export const InteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // フォーム入力操作
    await userEvent.type(
      canvas.getByLabelText("メールアドレス"),
      "test@example.com"
    );
    
    await userEvent.type(
      canvas.getByLabelText("パスワード"),
      "password123"
    );
    
    // 送信ボタンクリック
    await userEvent.click(canvas.getByRole("button", { name: "送信" }));
    
    // 結果確認
    await expect(canvas.getByText("送信完了")).toBeInTheDocument();
  },
};
```

## MSWモックのカスタマイズ

### 1. 基本的なハンドラー作成

```typescript
// .storybook/mocks/handlers/custom-api.ts
import { http, HttpResponse } from "msw";

export const customApiHandlers = [
  // GET リクエスト
  http.get("/api/custom", ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");
    
    return HttpResponse.json({
      success: true,
      data: { id, name: `カスタムデータ ${id}` },
    });
  }),

  // POST リクエスト
  http.post("/api/custom", async ({ request }) => {
    const body = await request.json();
    
    return HttpResponse.json({
      success: true,
      data: { id: Date.now(), ...body },
    });
  }),

  // エラーレスポンス
  http.get("/api/custom/error", () => {
    return HttpResponse.json(
      { error: "カスタムエラーが発生しました" },
      { status: 400 }
    );
  }),
];
```

### 2. 条件分岐ハンドラー

```typescript
// 条件に応じて異なるレスポンス
http.get("/api/transactions", ({ request }) => {
  const url = new URL(request.url);
  const type = url.searchParams.get("type");
  
  if (type === "income") {
    return HttpResponse.json({
      data: mockIncomeTransactions,
    });
  }
  
  if (type === "expense") {
    return HttpResponse.json({
      data: mockExpenseTransactions,
    });
  }
  
  return HttpResponse.json({
    data: [...mockIncomeTransactions, ...mockExpenseTransactions],
  });
});
```

### 3. 動的データ生成

```typescript
// ページネーション対応
http.get("/api/transactions", ({ request }) => {
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = Number(url.searchParams.get("limit")) || 20;
  
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedData = mockTransactions.slice(startIndex, endIndex);
  
  return HttpResponse.json({
    data: paginatedData,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(mockTransactions.length / limit),
      totalCount: mockTransactions.length,
      hasNextPage: endIndex < mockTransactions.length,
      hasPrevPage: page > 1,
    },
  });
});
```

### 4. 遅延・タイムアウトシミュレーション

```typescript
// 遅延レスポンス
http.get("/api/slow-endpoint", async () => {
  await new Promise(resolve => setTimeout(resolve, 3000));
  return HttpResponse.json({ data: "遅延データ" });
});

// ランダム遅延
http.get("/api/random-delay", async () => {
  const delay = Math.random() * 2000 + 500; // 500-2500ms
  await new Promise(resolve => setTimeout(resolve, delay));
  return HttpResponse.json({ data: "ランダム遅延データ" });
});

// タイムアウト
http.get("/api/timeout", async () => {
  await new Promise(() => {}); // 永続的な待機
  return HttpResponse.json({ data: "到達しない" });
});
```

## コンポーネントインタラクションテスト

### 1. 基本的なインタラクションテスト

```typescript
import { expect, userEvent, within } from "@storybook/test";

export const ButtonClickTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // 初期状態確認
    const button = canvas.getByRole("button", { name: "クリック" });
    expect(button).toBeInTheDocument();
    
    // クリック操作
    await userEvent.click(button);
    
    // 結果確認
    await expect(canvas.getByText("クリックされました")).toBeInTheDocument();
  },
};
```

### 2. フォーム操作テスト

```typescript
export const FormSubmissionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // フォーム要素の取得
    const nameInput = canvas.getByLabelText("名前");
    const emailInput = canvas.getByLabelText("メールアドレス");
    const submitButton = canvas.getByRole("button", { name: "送信" });
    
    // 入力操作
    await userEvent.type(nameInput, "テスト太郎");
    await userEvent.type(emailInput, "test@example.com");
    
    // 送信操作
    await userEvent.click(submitButton);
    
    // バリデーション確認
    await expect(canvas.getByText("送信完了")).toBeInTheDocument();
  },
};
```

### 3. 複雑なインタラクション

```typescript
export const ComplexInteractionTest: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // 1. フィルター選択
    const categoryFilter = canvas.getByLabelText("カテゴリ");
    await userEvent.selectOptions(categoryFilter, "食費");
    
    // 2. 日付範囲設定
    const fromDate = canvas.getByLabelText("開始日");
    const toDate = canvas.getByLabelText("終了日");
    await userEvent.type(fromDate, "2024-01-01");
    await userEvent.type(toDate, "2024-01-31");
    
    // 3. 検索実行
    const searchButton = canvas.getByRole("button", { name: "検索" });
    await userEvent.click(searchButton);
    
    // 4. 結果確認
    await expect(canvas.getByText("検索結果: 5件")).toBeInTheDocument();
    
    // 5. 詳細表示
    const firstResult = canvas.getByText("スーパーマーケット");
    await userEvent.click(firstResult);
    
    // 6. モーダル確認
    await expect(canvas.getByRole("dialog")).toBeInTheDocument();
  },
};
```

### 4. 非同期処理テスト

```typescript
export const AsyncLoadingTest: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get("/api/data", async () => {
          await new Promise(resolve => setTimeout(resolve, 1000));
          return HttpResponse.json({ data: ["アイテム1", "アイテム2"] });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    
    // 初期ローディング確認
    expect(canvas.getByText("読み込み中...")).toBeInTheDocument();
    
    // データ読み込み完了まで待機
    await expect(canvas.getByText("アイテム1")).toBeInTheDocument();
    
    // ローディング状態の終了確認
    expect(canvas.queryByText("読み込み中...")).not.toBeInTheDocument();
  },
};
```

## トラブルシューティング

### よくある問题と解決策

#### 1. ストーリーが表示されない

**症状**: ストーリーがサイドバーに表示されない

**原因と解決策**:
```typescript
// ❌ 間違い - ファイル名パターン不一致
app/components/example.story.tsx

// ✅ 正しい - 正規表現パターンに一致
app/components/example.stories.tsx

// ❌ 間違い - exportされていない
const meta = { ... };

// ✅ 正しい - default export
export default meta;
```

#### 2. MSWハンドラーが動作しない

**症状**: APIリクエストがモックされない

**解決策**:
```typescript
// 1. ハンドラーの登録確認
parameters: {
  msw: {
    handlers: [
      // ハンドラーが正しく設定されているか確認
      http.get("/api/endpoint", () => { ... })
    ],
  },
},

// 2. URLパターンの確認
// ❌ 間違い - パス不一致
http.get("/endpoint", () => { ... })

// ✅ 正しい - 完全なURLパス
http.get("/api/endpoint", () => { ... })

// 3. レスポンス形式の確認
// ❌ 間違い - HttpResponse使用していない
return { data: [] };

// ✅ 正しい - HttpResponse使用
return HttpResponse.json({ data: [] });
```

#### 3. React Query データが取得できない

**症状**: useQuery フックでデータが取得されない

**解決策**:
```typescript
// 1. QueryClient設定確認
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // ストーリーでは無効化
      staleTime: Infinity, // データ永続化
    },
  },
});

// 2. デコレーター設定確認
decorators: [
  (Story) => (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  ),
];

// 3. キーの一致確認
// フック側
const { data } = useQuery({ queryKey: ['transactions'] });

// MSWハンドラー側  
http.get('/api/transactions', () => { ... })
```

#### 4. 型エラーが発生する

**症状**: TypeScript エラーが多発する

**解決策**:
```typescript
// 1. 型定義の確認
type Story = StoryObj<typeof meta>;

// 2. args の型確認
const meta: Meta<typeof Component> = {
  args: {
    // Component のプロパティと一致させる
    title: "string",
    count: 0,
  },
};

// 3. パラメーター型の確認
parameters: {
  msw: {
    handlers: Handler[], // 正しい型使用
  },
},
```

#### 5. スタイルが適用されない

**症状**: Tailwind CSS等のスタイルが反映されない

**解決策**:
```typescript
// preview.tsx でスタイルインポート確認
import "../app/app.css";

// Tailwind設定確認
// vite.config.ts に @tailwindcss/vite が設定されているか

// コンポーネント側でクラス名確認
className="bg-blue-500 text-white" // 正しいクラス名か
```

#### 6. インタラクションテストが失敗する

**症状**: play 関数内でのテストが失敗する

**解決策**:
```typescript
// 1. 要素の取得方法確認
// ❌ 間違い - 要素が見つからない
canvas.getByText("存在しないテキスト");

// ✅ 正しい - 存在する要素を取得
canvas.getByRole("button", { name: "送信" });

// 2. 非同期処理の待機
// ❌ 間違い - 待機なし
userEvent.click(button);
expect(result).toBeInTheDocument();

// ✅ 正しい - await使用
await userEvent.click(button);
await expect(result).toBeInTheDocument();

// 3. タイミング問題の解決
// DOM更新を待機
await waitFor(() => {
  expect(canvas.getByText("更新済み")).toBeInTheDocument();
});
```

### デバッグ方法

#### 1. コンソールログ
```typescript
// ストーリー内でのデバッグ
export const DebugStory: Story = {
  play: async ({ canvasElement }) => {
    console.log("canvasElement:", canvasElement);
    
    const canvas = within(canvasElement);
    console.log("canvas methods:", Object.keys(canvas));
    
    // 要素が存在するか確認
    try {
      const element = canvas.getByText("探しているテキスト");
      console.log("element found:", element);
    } catch (error) {
      console.log("element not found:", error);
    }
  },
};
```

#### 2. ネットワークタブ確認
```
ブラウザ開発者ツール > Network タブ
- APIリクエストが発生しているか
- MSWでインターセプトされているか
- レスポンス内容の確認
```

#### 3. React DevTools
```
React Developer Tools拡張機能で:
- コンポーネントの状態確認
- プロパティの値確認
- フックの状態確認
```

## ベストプラクティス

### 1. ストーリー構成

#### 適切なストーリー分割
```typescript
// ✅ 良い例 - 目的別に分割
export const Default: Story = {};
export const Loading: Story = {};
export const Error: Story = {};
export const Empty: Story = {};

// ❌ 悪い例 - 1つのストーリーで全て
export const AllStates: Story = {
  // 複数の状態を1つに詰め込み
};
```

#### 意味のある名前付け
```typescript
// ✅ 良い例 - 状態や用途が明確
export const WithLongProductName: Story = {};
export const MobileViewport: Story = {};
export const HighVolumeData: Story = {};

// ❌ 悪い例 - 意味不明
export const Story1: Story = {};
export const Test: Story = {};
export const Sample: Story = {};
```

### 2. モックデータ設計

#### 現実的なデータ使用
```typescript
// ✅ 良い例 - 実際のデータパターン
const mockTransaction = {
  id: 1,
  amount: 1500,
  description: "スーパーマーケットでの買い物",
  transactionDate: "2024-12-25",
  categoryId: 1,
};

// ❌ 悪い例 - 意味のないテストデータ
const mockTransaction = {
  id: 1,
  amount: 999999,
  description: "test",
  transactionDate: "1970-01-01",
  categoryId: 999,
};
```

#### エッジケースのカバー
```typescript
// 境界値テスト
export const MaxLengthText: Story = {
  args: {
    title: "a".repeat(100), // 最大文字数
  },
};

export const ZeroAmount: Story = {
  args: {
    amount: 0, // ゼロ値
  },
};

export const FutureDate: Story = {
  args: {
    date: "2030-12-31", // 未来日付
  },
};
```

### 3. パフォーマンス考慮

#### 必要最小限のモック
```typescript
// ✅ 良い例 - 必要なハンドラーのみ
parameters: {
  msw: {
    handlers: [
      http.get("/api/categories", () => { ... }),
      // このストーリーで必要なもののみ
    ],
  },
},

// ❌ 悪い例 - 全てのハンドラーを含む
parameters: {
  msw: {
    handlers: [...allHandlers], // 過剰
  },
},
```

#### 軽量なテストデータ
```typescript
// ✅ 良い例 - 適切なデータ量
const mockData = Array.from({ length: 10 }, (_, i) => ({ ... }));

// ❌ 悪い例 - 過剰なデータ量
const mockData = Array.from({ length: 10000 }, (_, i) => ({ ... }));
```

### 4. アクセシビリティ考慮

#### 適切なアクセシビリティテスト
```typescript
// Role-based セレクター使用
canvas.getByRole("button", { name: "送信" });
canvas.getByRole("textbox", { name: "メールアドレス" });
canvas.getByRole("heading", { level: 1 });

// Label-based セレクター使用
canvas.getByLabelText("パスワード");
canvas.getByLabelText("利用規約に同意する");
```

#### a11y アドオン活用
```typescript
// ストーリーレベルでアクセシビリティ設定
parameters: {
  a11y: {
    config: {
      rules: [
        {
          id: "color-contrast",
          enabled: true,
        },
      ],
    },
  },
},
```

### 5. メンテナンス性向上

#### 共通パターンの抽出
```typescript
// 共通設定の定義
const commonMeta = {
  parameters: {
    layout: "padded",
    docs: { ... },
  },
  tags: ["autodocs"],
};

// 各ストーリーで再利用
const meta: Meta<typeof Component> = {
  ...commonMeta,
  title: "Components/SpecificComponent",
  component: SpecificComponent,
};
```

#### 型安全性の確保
```typescript
// 型定義を活用
interface StoryProps {
  title: string;
  variant: "primary" | "secondary";
  disabled?: boolean;
}

const meta: Meta<StoryProps> = {
  // 型安全なプロパティ設定
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary"], // 型と一致
    },
  },
};
```

以上が、Saifuu Storybookの実践的な使用方法ガイドです。このガイドを参考に、効率的なコンポーネント開発を進めてください。