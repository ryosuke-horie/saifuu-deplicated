# Saifuu セルフホストランナー設定ガイド

## 概要

このドキュメントでは、Saifuu プロジェクト専用のGitHub Actions セルフホストランナーの設定手順を説明します。セルフホストランナーを使用することで、GitHub Actions の実行制限を回避し、プロジェクト固有の環境設定での継続的インテグレーション（CI）を実現できます。

## 前提条件

### システム要件
- **OS**: macOS 12+ / Ubuntu 20.04+ / Windows 10+
- **CPU**: 2コア以上推奨（4コア以上を強く推奨）
- **メモリ**: 8GB以上（16GB以上を強く推奨）
- **ストレージ**: 50GB以上の空き容量
- **ネットワーク**: 安定したインターネット接続

### 必要なソフトウェア
- **Node.js**: v22.0.0以上（engines指定に準拠）
- **pnpm**: 最新版
- **Git**: 最新版
- **Docker** (オプション): 一部の高度な設定で使用

## 1. セルフホストランナーの基本設定

### 1.1 ランナーアプリケーションのダウンロード

```bash
# 作業ディレクトリを作成
mkdir -p ~/github-runner && cd ~/github-runner

# 最新バージョンのランナーをダウンロード（Linux x64の場合）
curl -o actions-runner-linux-x64-2.320.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.320.0/actions-runner-linux-x64-2.320.0.tar.gz

# アーカイブを展開
tar xzf ./actions-runner-linux-x64-2.320.0.tar.gz
```

**macOSの場合:**
```bash
curl -o actions-runner-osx-x64-2.320.0.tar.gz -L https://github.com/actions/runner/releases/download/v2.320.0/actions-runner-osx-x64-2.320.0.tar.gz
tar xzf ./actions-runner-osx-x64-2.320.0.tar.gz
```

### 1.2 ランナーの登録

1. GitHubリポジトリの「Settings」→「Actions」→「Runners」に移動
2. 「New self-hosted runner」をクリック
3. 表示されるトークンをコピー

```bash
# ランナーを設定（表示されるトークンを使用）
./config.sh --url https://github.com/your-username/saifuu-main --token YOUR_REGISTRATION_TOKEN

# 設定時の推奨オプション
./config.sh --url https://github.com/your-username/saifuu-main --token YOUR_REGISTRATION_TOKEN --name "saifuu-selfhosted" --labels "saifuu,node22,pnpm" --work "_work"
```

## 2. Saifuu プロジェクト固有の環境設定

### 2.1 Node.js環境のセットアップ

```bash
# Node.js v22のインストール（nvmを使用する場合）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 22
nvm use 22
nvm alias default 22

# Node.jsバージョンの確認
node --version  # v22.x.x が出力されることを確認
```

### 2.2 pnpmのインストール

```bash
# pnpmのインストール
npm install -g pnpm@latest

# インストール確認
pnpm --version
```

### 2.3 プロジェクト依存関係の事前インストール

```bash
# ワークスペースディレクトリに移動（ランナー実行時の作業ディレクトリ）
cd ~/github-runner/_work/saifuu-main/saifuu-main

# 依存関係をインストール（初回のみ）
pnpm install

# キャッシュを最適化
pnpm store prune
```

### 2.4 データベース環境の設定

```bash
# Cloudflare D1のローカル環境セットアップ
pnpm run db:migrate:local
pnpm run db:seed
```

### 2.5 テスト環境の確認

```bash
# ユニットテストの実行確認
pnpm run test:unit

# Playwrightのブラウザインストール
npx playwright install --with-deps chromium

# E2Eテストの実行確認
pnpm run test:e2e
```

## 3. セキュリティ設定

### 3.1 環境変数の設定

セキュリティを考慮して、機密情報は環境変数として設定します：

```bash
# ~/.bashrc または ~/.zshrc に追加
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"

# 設定を反映
source ~/.bashrc
```

### 3.2 アクセス制限

```bash
# ランナー用ユーザーの作成（推奨）
sudo useradd -m -s /bin/bash github-runner
sudo usermod -aG docker github-runner  # Dockerが必要な場合

# ランナーディレクトリの権限設定
sudo chown -R github-runner:github-runner ~/github-runner
```

### 3.3 ファイアウォール設定

```bash
# 必要なポートのみ開放（Ubuntu/CentOSの場合）
sudo ufw allow ssh
sudo ufw allow 5173  # Vite開発サーバー用
sudo ufw enable
```

## 4. ランナーの実行設定

### 4.1 サービスとしての実行

#### systemd サービス作成（Linux）

```bash
# サービスファイルを作成
sudo tee /etc/systemd/system/github-runner.service > /dev/null <<EOF
[Unit]
Description=GitHub Actions Runner
After=network.target

[Service]
Type=simple
User=github-runner
WorkingDirectory=/home/github-runner/github-runner
ExecStart=/home/github-runner/github-runner/run.sh
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PATH=/home/github-runner/.nvm/versions/node/v22.0.0/bin:/usr/local/bin:/usr/bin:/bin

[Install]
WantedBy=multi-user.target
EOF

# サービスの有効化と開始
sudo systemctl daemon-reload
sudo systemctl enable github-runner
sudo systemctl start github-runner

# 状態確認
sudo systemctl status github-runner
```

#### launchd サービス作成（macOS）

```bash
# plistファイルを作成
tee ~/Library/LaunchAgents/com.github.runner.plist > /dev/null <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.github.runner</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/$(whoami)/github-runner/run.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>WorkingDirectory</key>
    <string>/Users/$(whoami)/github-runner</string>
</dict>
</plist>
EOF

# サービスの登録と開始
launchctl load ~/Library/LaunchAgents/com.github.runner.plist
launchctl start com.github.runner
```

### 4.2 手動実行

```bash
cd ~/github-runner
./run.sh
```

## 5. ワークフロー設定

### 5.1 セルフホストランナー用ワークフローファイル

`.github/workflows/ci-selfhosted.yml` を作成：

```yaml
name: CI (Self-hosted)

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: [self-hosted, saifuu, node22, pnpm]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check and lint
        run: pnpm run check

      - name: Run unit tests
        run: pnpm run test:unit:coverage

      - name: Build project
        run: pnpm run build

      - name: Setup database
        run: |
          pnpm run db:migrate:local
          pnpm run db:seed

      - name: Run E2E tests
        run: pnpm run test:e2e

      - name: Build Storybook
        run: pnpm run build-storybook

  deploy:
    needs: test
    runs-on: [self-hosted, saifuu, node22, pnpm]
    if: github.ref == 'refs/heads/main'
    
    steps:
      - name: Deploy to Cloudflare Workers
        run: pnpm run deploy
        env:
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 5.2 ラベル設定の最適化

セルフホストランナーには適切なラベルを設定：

```bash
# ランナー再設定時にラベルを指定
./config.sh --url https://github.com/your-username/saifuu-main --token YOUR_TOKEN --labels "saifuu,node22,pnpm,local-db,playwright"
```

## 6. パフォーマンス最適化

### 6.1 キャッシュ戦略

```bash
# pnpmストアのキャッシュディレクトリを設定
pnpm config set store-dir ~/github-runner/.pnpm-store

# Node.jsモジュールキャッシュの最適化
echo 'export NODE_OPTIONS="--max-old-space-size=4096"' >> ~/.bashrc
```

### 6.2 並列実行の設定

```bash
# ワーカー数の最適化（CPUコア数に応じて調整）
export PLAYWRIGHT_WORKERS=2
export VITEST_MAX_THREADS=4
```

## 7. トラブルシューティング

### 7.1 よくある問題と解決方法

#### ランナーが起動しない

```bash
# ログの確認
sudo journalctl -u github-runner -f  # Linux
tail -f ~/github-runner/_diag/Runner*.log  # 全般

# 権限の確認と修正
sudo chown -R github-runner:github-runner ~/github-runner
sudo chmod +x ~/github-runner/run.sh
```

#### Node.js関連のエラー

```bash
# Node.jsパスの確認
which node
echo $PATH

# pnpmの再インストール
npm uninstall -g pnpm
npm install -g pnpm@latest
```

#### データベース接続エラー

```bash
# D1データベースの状態確認
wrangler d1 list
wrangler d1 info saifuu-db --local

# マイグレーションの再実行
rm -rf .wrangler/state/d1/
pnpm run db:migrate:local
pnpm run db:seed
```

#### Playwright関連のエラー

```bash
# ブラウザの再インストール
npx playwright install --with-deps chromium
npx playwright install --with-deps  # 全ブラウザ

# ディスプレイ設定（ヘッドレス環境の場合）
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &
```

### 7.2 メモリ不足の対処

```bash
# スワップファイルの作成（Linux）
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 永続化
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 7.3 ディスク容量の管理

```bash
# 不要なファイルのクリーンアップ
pnpm store prune
docker system prune -af  # Dockerを使用している場合
npm cache clean --force

# 古いログファイルの削除
find ~/github-runner/_diag -name "*.log" -mtime +7 -delete
```

## 8. モニタリングと保守

### 8.1 ランナーの状態監視

```bash
# ランナー状態確認スクリプト
#!/bin/bash
# ~/check-runner.sh

echo "=== GitHub Runner Status ==="
systemctl status github-runner  # Linux
# launchctl list | grep github  # macOS

echo -e "\n=== Disk Usage ==="
df -h ~/github-runner

echo -e "\n=== Memory Usage ==="
free -h  # Linux
# vm_stat | head -20  # macOS

echo -e "\n=== Running Processes ==="
ps aux | grep -E "(runner|node|pnpm)" | grep -v grep
```

### 8.2 定期メンテナンス

```bash
# 週次メンテナンススクリプト
#!/bin/bash
# ~/weekly-maintenance.sh

# パッケージ更新
pnpm update

# キャッシュクリーンアップ
pnpm store prune
npm cache clean --force

# ログローテーション
find ~/github-runner/_diag -name "*.log" -mtime +30 -delete

# システム更新（Ubuntu）
sudo apt update && sudo apt upgrade -y
```

### 8.3 アラート設定

```bash
# 簡易アラート（メール通知）
# crontabに追加: 0 */6 * * * ~/check-runner.sh || echo "Runner issue detected" | mail -s "GitHub Runner Alert" admin@example.com
```

## 9. 新しいワークフローの使用方法

### 9.1 基本的な使用方法

1. **ワークフローファイルの作成**
   - `.github/workflows/` ディレクトリにYAMLファイルを作成
   - `runs-on: [self-hosted, saifuu]` を指定

2. **プロジェクト固有のステップ**
   ```yaml
   steps:
     - uses: actions/checkout@v4
     - name: Setup project
       run: |
         pnpm install
         pnpm run db:migrate:local
         pnpm run check:fix
   ```

### 9.2 高度な設定例

```yaml
# カスタムワークフロー例
name: Custom Deploy

on:
  push:
    tags: ['v*']

jobs:
  deploy:
    runs-on: [self-hosted, saifuu, node22]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build and test
        run: |
          pnpm install
          pnpm run build
          pnpm run test:unit
      
      - name: Deploy with backup
        run: |
          # 現在のデプロイのバックアップ
          wrangler deployments list --name saifuu-app | head -1 > backup.txt
          
          # 新しいデプロイ
          pnpm run deploy
          
          # ヘルスチェック
          sleep 30
          curl -f https://your-app.workers.dev/health || (
            echo "Deployment failed, rolling back..."
            wrangler rollback $(cat backup.txt)
            exit 1
          )
```

## 10. セキュリティベストプラクティス

### 10.1 定期的なセキュリティ更新

```bash
# 月次セキュリティチェック
#!/bin/bash
# ~/security-check.sh

# システム更新
sudo apt update && sudo apt list --upgradable

# Node.js脆弱性スキャン
pnpm audit
pnpm audit --fix

# ランナーバージョンチェック
cd ~/github-runner
./config.sh --check
```

### 10.2 アクセスログの監視

```bash
# ランナーアクセスログの確認
tail -f ~/github-runner/_diag/Runner*.log | grep -E "(ERROR|WARNING|FAILURE)"
```

## 参考資料

- [GitHub Actions Self-hosted runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Saifuu プロジェクト設定](../CLAUDE.md)
- [React Router v7 ドキュメント](https://reactrouter.com/dev)
- [Cloudflare Workers ドキュメント](https://developers.cloudflare.com/workers/)
- [Playwright ドキュメント](https://playwright.dev/)

---

**注意事項:**
- このガイドは Saifuu プロジェクトの特定の要件に基づいて作成されています
- 本番環境での使用前に、セキュリティ設定を十分に検証してください
- ランナーの更新は定期的に実行し、最新のセキュリティパッチを適用してください
- 機密情報は必ず環境変数またはGitHub Secretsで管理してください