#!/bin/bash

# カバレッジ結果をPRコメントとして投稿するスクリプト
# GitHub ActionsのPRイベント時に使用する

set -e

# PRコメント機能が有効かチェック
if [ "$GITHUB_EVENT_NAME" != "pull_request" ]; then
  echo "PRイベント以外では実行されません"
  exit 0
fi

# テストとカバレッジを実行し、結果をキャプチャ
echo "ユニットテストを実行中..."
if TEST_OUTPUT=$(pnpm test:unit 2>&1); then
  TEST_STATUS="✅ 全テスト通過"
  
  # coverageディレクトリが存在する場合、HTML レポートのリンクを作成
  if [ -d "coverage" ]; then
    COVERAGE_INFO="📊 [カバレッジレポート詳細](./coverage/index.html)"
  else
    COVERAGE_INFO="📊 カバレッジレポートが生成されました"
  fi
else
  TEST_STATUS="❌ テストに失敗しました"
  COVERAGE_INFO="テスト失敗のため、カバレッジレポートは生成されませんでした"
fi

# テスト実行結果の行数をカウント
TOTAL_TESTS=$(echo "$TEST_OUTPUT" | grep -o "Test Files.*passed" | head -1 || echo "テスト統計取得失敗")
TEST_DETAILS=$(echo "$TEST_OUTPUT" | grep -o "Tests.*passed" | head -1 || echo "詳細統計取得失敗")

# PRコメント本文を作成
COMMENT_BODY="## 📋 ユニットテスト実行結果

### 🧪 テスト結果
${TEST_STATUS}

### 📊 テスト統計
- ${TOTAL_TESTS}
- ${TEST_DETAILS}

### 📈 カバレッジ情報
${COVERAGE_INFO}

---
*CI自動実行レポート* | $(date '+%Y-%m-%d %H:%M:%S')"

# GitHub CLIでPRコメントを投稿
echo "PRにテスト結果を投稿中..."
echo "$COMMENT_BODY" | gh pr comment "$GITHUB_EVENT_NUMBER" --body-file -

echo "テスト結果の投稿が完了しました"