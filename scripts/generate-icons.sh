#!/bin/bash

# PWAアイコン生成スクリプト（macOS sips使用）
# 既存のlogo.svgから複数サイズのPNGアイコンを生成

set -e

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🎨 PWAアイコン生成を開始します...${NC}\n"

# ディレクトリ設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SVG_SOURCE="$PROJECT_DIR/public/logo.svg"
ICONS_DIR="$PROJECT_DIR/public/icons"
PUBLIC_DIR="$PROJECT_DIR/public"

# アイコンディレクトリを作成
mkdir -p "$ICONS_DIR"

# SVGからPNGに変換する関数（macOS sips使用）
convert_svg_to_png() {
    local size=$1
    local filename=$2
    local output_path="$ICONS_DIR/$filename"
    
    echo -e "${YELLOW}📱 Generating: $filename (${size}x${size})${NC}"
    
    # SVGを一時的に1024x1024のPNGに変換してからリサイズ
    local temp_png="/tmp/logo_temp.png"
    
    # qlmanageの存在確認
    if ! command -v qlmanage &> /dev/null; then
        echo -e "${RED}❌ Error: qlmanage コマンドが見つかりません。macOS環境で実行してください。${NC}"
        return 1
    fi
    
    # macOS qlmanage を使用してSVGをPNGに変換
    qlmanage -t -s 1024 -o /tmp "$SVG_SOURCE" > /dev/null 2>&1
    mv "/tmp/logo.svg.png" "$temp_png" 2>/dev/null || {
        echo -e "${RED}❌ Error: SVGからPNGへの変換に失敗しました${NC}"
        return 1
    }
    
    # sipsでリサイズ
    sips -z "$size" "$size" "$temp_png" --out "$output_path" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Generated: $filename${NC}"
    else
        echo -e "${RED}✗ Failed: $filename${NC}"
    fi
    
    # 一時ファイルを削除
    rm -f "$temp_png"
}

# アイコンサイズ定義
declare -a ICON_SIZES=(
    "48:icon-48x48.png"
    "72:icon-72x72.png"
    "96:icon-96x96.png"
    "120:icon-120x120.png"
    "144:icon-144x144.png"
    "152:icon-152x152.png"
    "168:icon-168x168.png"
    "180:apple-touch-icon.png"
    "192:icon-192x192.png"
    "256:icon-256x256.png"
    "384:icon-384x384.png"
    "512:icon-512x512.png"
    "1024:icon-1024x1024.png"
)

# Maskable アイコンサイズ
declare -a MASKABLE_SIZES=(
    "192:icon-maskable-192x192.png"
    "512:icon-maskable-512x512.png"
)

echo -e "${BLUE}📱 基本アイコンを生成中...${NC}"
# 基本アイコンを生成
for item in "${ICON_SIZES[@]}"; do
    IFS=':' read -r size filename <<< "$item"
    convert_svg_to_png "$size" "$filename"
done

echo -e "\n${BLUE}🤖 Maskableアイコンを生成中...${NC}"
# Maskableアイコンも同じ方法で生成（簡単のため）
for item in "${MASKABLE_SIZES[@]}"; do
    IFS=':' read -r size filename <<< "$item"
    convert_svg_to_png "$size" "$filename"
done

# Apple Touch Iconを/publicディレクトリにコピー
if [ -f "$ICONS_DIR/apple-touch-icon.png" ]; then
    cp "$ICONS_DIR/apple-touch-icon.png" "$PUBLIC_DIR/"
    echo -e "${GREEN}✓ Apple Touch Icon copied to /public/${NC}"
fi

echo -e "\n${GREEN}🎉 全てのPWAアイコンが正常に生成されました！${NC}"
echo -e "${BLUE}📁 生成場所: $ICONS_DIR${NC}"
echo -e "${BLUE}📁 Apple Touch Icon: $PUBLIC_DIR/apple-touch-icon.png${NC}"