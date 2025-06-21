#!/bin/bash

# カバレッジ結果をPRコメントとして投稿するスクリプト
# GitHub ActionsのPRイベント時に使用する

set -e

# PRコメント機能が有効かチェック
if [ "$GITHUB_EVENT_NAME" != "pull_request" ]; then
  echo "PRイベント以外では実行されません"
  exit 0
fi

# テスト実行と結果をキャプチャ
echo "ユニットテストを実行中..."
if TEST_OUTPUT=$(pnpm test:unit 2>&1); then
  TEST_STATUS="✅ 全テスト通過"
else
  TEST_STATUS="❌ テストに失敗しました"
fi

# 既存のカバレッジディレクトリをチェック
if [ -d "coverage" ] && [ -f "coverage/index.html" ]; then
  COVERAGE_AVAILABLE=true
  echo "既存のカバレッジレポートを使用します。"
else
  COVERAGE_AVAILABLE=false
  echo "カバレッジレポートが見つかりません。テスト結果のみ報告します。"
fi

# ANSIカラーコードを除去する関数
strip_ansi() {
  echo "$1" | sed 's/\x1b\[[0-9;]*[mGKHF]//g'
}

# テスト統計を抽出（ANSIコードを除去）
CLEAN_TEST_OUTPUT=$(strip_ansi "$TEST_OUTPUT")
TOTAL_TESTS=$(echo "$CLEAN_TEST_OUTPUT" | grep -o "Test Files [0-9]* passed" | head -1 || echo "テスト統計取得失敗")
TEST_DETAILS=$(echo "$CLEAN_TEST_OUTPUT" | grep -o "Tests [0-9]* passed" | head -1 || echo "詳細統計取得失敗")

# カバレッジ情報を抽出
if [ "$COVERAGE_AVAILABLE" = true ]; then
  # HTMLファイルからカバレッジ数値を抽出
  HTML_CONTENT=$(cat coverage/index.html 2>/dev/null || echo "")
  
  # HTMLから数値を抽出（簡易パターンマッチング）
  STATEMENTS_COV=$(echo "$HTML_CONTENT" | grep -o "Statements[^0-9]*[0-9]*\.[0-9]*%" | head -1 || echo "")
  BRANCHES_COV=$(echo "$HTML_CONTENT" | grep -o "Branches[^0-9]*[0-9]*\.[0-9]*%" | head -1 || echo "")
  FUNCTIONS_COV=$(echo "$HTML_CONTENT" | grep -o "Functions[^0-9]*[0-9]*\.[0-9]*%" | head -1 || echo "")
  LINES_COV=$(echo "$HTML_CONTENT" | grep -o "Lines[^0-9]*[0-9]*\.[0-9]*%" | head -1 || echo "")
  
  # 数値のみを抽出してステータス判定
  get_coverage_status() {
    local coverage_line="$1"
    local percentage=$(echo "$coverage_line" | grep -o "[0-9]*\.[0-9]*%" | sed 's/%//')
    
    if [ -n "$percentage" ] && [ -n "$coverage_line" ]; then
      # bc が利用できない場合は、awkを使用
      local status
      if command -v bc >/dev/null 2>&1; then
        if (( $(echo "$percentage >= 90" | bc -l 2>/dev/null || echo "0") )); then
          status="✅ (優秀)"
        elif (( $(echo "$percentage >= 80" | bc -l 2>/dev/null || echo "0") )); then
          status="⚠️ (要改善)"  
        else
          status="❌ (不十分)"
        fi
      else
        # 簡易的な比較（整数部のみ）
        local int_part=$(echo "$percentage" | cut -d'.' -f1)
        if [ "$int_part" -ge 90 ]; then
          status="✅ (優秀)"
        elif [ "$int_part" -ge 80 ]; then
          status="⚠️ (要改善)"
        else
          status="❌ (不十分)"
        fi
      fi
      echo "$coverage_line $status"
    else
      echo "$coverage_line"
    fi
  }
  
  # カバレッジ詳細
  COVERAGE_DETAILS=""
  [ -n "$STATEMENTS_COV" ] && COVERAGE_DETAILS+="$(get_coverage_status "$STATEMENTS_COV")
"
  [ -n "$BRANCHES_COV" ] && COVERAGE_DETAILS+="$(get_coverage_status "$BRANCHES_COV")
"
  [ -n "$FUNCTIONS_COV" ] && COVERAGE_DETAILS+="$(get_coverage_status "$FUNCTIONS_COV")
"
  [ -n "$LINES_COV" ] && COVERAGE_DETAILS+="$(get_coverage_status "$LINES_COV")
"
  
  # 低カバレッジファイルを抽出（存在する場合）
  LOW_COVERAGE_FILES=$(echo "$HTML_CONTENT" | grep -o "href=\"[^\"]*\.html\"[^>]*>[^<]*\.(ts|tsx|js|jsx)</a>[^0-9]*[0-9]*\.[0-9]*%" | grep -E "[0-7][0-9]\.[0-9]*%|[0-9]\.[0-9]*%" | head -3 || echo "")
  
  if [ -n "$LOW_COVERAGE_FILES" ]; then
    COVERAGE_GAPS="
### 🎯 カバレッジ改善候補
以下のファイルでカバレッジが低くなっています：
\`\`\`
$(echo "$LOW_COVERAGE_FILES" | sed 's/<[^>]*>//g' | sed 's/href="[^"]*"//g')
\`\`\`"
  else
    COVERAGE_GAPS="
### 🎯 カバレッジ状況
💯 全ファイルで良好なカバレッジが維持されています"
  fi
  
  if [ -n "$COVERAGE_DETAILS" ]; then
    COVERAGE_INFO="### 📈 カバレッジ詳細
$COVERAGE_DETAILS$COVERAGE_GAPS"
  else
    COVERAGE_INFO="### 📈 カバレッジ情報
📊 カバレッジレポートは利用可能ですが、詳細な数値の抽出に失敗しました"
  fi
else
  COVERAGE_INFO="### 📈 カバレッジ情報
⚠️ カバレッジレポートが見つかりません"
fi

# PRコメント本文を作成
COMMENT_BODY="## 📋 ユニットテスト実行結果

### 🧪 テスト結果
${TEST_STATUS}

### 📊 テスト統計
- ${TOTAL_TESTS}
- ${TEST_DETAILS}

${COVERAGE_INFO}

---
*CI自動実行レポート* | $(date '+%Y-%m-%d %H:%M:%S JST')"

# GitHub CLIでPRコメントを投稿
echo "PRにテスト結果を投稿中..."
echo "$COMMENT_BODY" | gh pr comment "$GITHUB_EVENT_NUMBER" --body-file -

echo "テスト結果の投稿が完了しました"