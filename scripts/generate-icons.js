#!/usr/bin/env node

/**
 * PWAアイコン生成スクリプト
 * 既存のlogo.svgから複数サイズのPNGアイコンを生成
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 生成するアイコンサイズとファイル名の定義
const iconSizes = [
	{ size: 48, filename: "icon-48x48.png" },
	{ size: 72, filename: "icon-72x72.png" },
	{ size: 96, filename: "icon-96x96.png" },
	{ size: 120, filename: "icon-120x120.png" }, // iPhone
	{ size: 144, filename: "icon-144x144.png" },
	{ size: 152, filename: "icon-152x152.png" }, // iPad
	{ size: 168, filename: "icon-168x168.png" },
	{ size: 180, filename: "apple-touch-icon.png" }, // iOS標準
	{ size: 192, filename: "icon-192x192.png" }, // PWA必須
	{ size: 256, filename: "icon-256x256.png" },
	{ size: 384, filename: "icon-384x384.png" },
	{ size: 512, filename: "icon-512x512.png" }, // PWA必須
	{ size: 1024, filename: "icon-1024x1024.png" },
];

// Maskableアイコンサイズ（Android用）
const maskableIconSizes = [
	{ size: 192, filename: "icon-maskable-192x192.png" },
	{ size: 512, filename: "icon-maskable-512x512.png" },
];

const sourceSvgPath = path.join(__dirname, "..", "public", "logo.svg");
const iconsDir = path.join(__dirname, "..", "public", "icons");

// アイコンディレクトリを作成
if (!fs.existsSync(iconsDir)) {
	fs.mkdirSync(iconsDir, { recursive: true });
}

async function generateIcon(size, filename, isMaskable = false) {
	try {
		const outputPath = path.join(iconsDir, filename);

		let sharpInstance = sharp(sourceSvgPath).resize(size, size, {
			fit: "contain",
			background: { r: 255, g: 255, b: 255, alpha: 1 }, // 白背景
		});

		// Maskableアイコンの場合はセーフゾーンを考慮してスケールダウン
		if (isMaskable) {
			const scaledSize = Math.floor(size * 0.8); // 80%のセーフゾーン
			sharpInstance = sharp(sourceSvgPath)
				.resize(scaledSize, scaledSize, {
					fit: "contain",
					background: { r: 255, g: 255, b: 255, alpha: 0 },
				})
				.extend({
					top: Math.floor((size - scaledSize) / 2),
					bottom: Math.floor((size - scaledSize) / 2),
					left: Math.floor((size - scaledSize) / 2),
					right: Math.floor((size - scaledSize) / 2),
					background: { r: 255, g: 255, b: 255, alpha: 1 },
				});
		}

		await sharpInstance
			.png({ quality: 90, compressionLevel: 9 })
			.toFile(outputPath);

		console.log(`✓ Generated: ${filename} (${size}x${size})`);
	} catch (error) {
		console.error(`✗ Error generating ${filename}:`, error.message);
	}
}

async function generateAllIcons() {
	console.log("🎨 PWAアイコン生成を開始します...\n");

	// 基本アイコンを生成
	console.log("📱 基本アイコンを生成中...");
	for (const { size, filename } of iconSizes) {
		await generateIcon(size, filename, false);
	}

	console.log("\n🤖 Maskableアイコンを生成中...");
	// Maskableアイコンを生成
	for (const { size, filename } of maskableIconSizes) {
		await generateIcon(size, filename, true);
	}

	// Apple Touch Iconを適切な場所にコピー
	const appleIconSource = path.join(iconsDir, "apple-touch-icon.png");
	const appleIconDest = path.join(
		__dirname,
		"..",
		"public",
		"apple-touch-icon.png",
	);

	if (fs.existsSync(appleIconSource)) {
		fs.copyFileSync(appleIconSource, appleIconDest);
		console.log("✓ Apple Touch Icon copied to /public/");
	}

	console.log("\n🎉 全てのPWAアイコンが正常に生成されました！");
	console.log(`📁 生成場所: ${iconsDir}`);
	console.log(`📁 Apple Touch Icon: ${appleIconDest}`);
}

// スクリプト実行
generateAllIcons().catch((error) => {
	console.error("❌ アイコン生成エラー:", error);
	process.exit(1);
});
