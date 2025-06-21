#!/usr/bin/env node

/**
 * ビルド前の安全性チェックスクリプト
 * 本番ビルド時に不適切な設定や開発用コードの混入を防ぐ
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, "..");

/**
 * ファイルを再帰的に検索する
 */
function findFiles(dir, extensions = [".ts", ".tsx", ".js", ".jsx"]) {
	const files = [];

	function walkDir(currentDir) {
		try {
			const entries = readdirSync(currentDir, { withFileTypes: true });

			for (const entry of entries) {
				const fullPath = join(currentDir, entry.name);

				if (
					entry.isDirectory() &&
					!entry.name.startsWith(".") &&
					entry.name !== "node_modules"
				) {
					walkDir(fullPath);
				} else if (entry.isFile() && extensions.includes(extname(entry.name))) {
					files.push(fullPath);
				}
			}
		} catch (error) {
			// ディレクトリが読めない場合はスキップ
		}
	}

	if (existsSync(dir)) {
		walkDir(dir);
	}
	return files;
}

/**
 * 危険なパターンをチェック
 */
function checkDangerousPatterns() {
	console.log("🔍 Checking for dangerous patterns...");

	let hasErrors = false;

	// appディレクトリ内でMSW初期化を検出
	const appFiles = findFiles(join(rootDir, "app"));
	for (const file of appFiles) {
		try {
			const content = readFileSync(file, "utf-8");

			if (content.includes("msw") && content.includes("initialize")) {
				console.error(
					`❌ MSW initialization found in app code: ${file.replace(rootDir, ".")}`,
				);
				hasErrors = true;
			}

			if (content.includes("console.debug")) {
				console.error(`❌ Debug console found: ${file.replace(rootDir, ".")}`);
				hasErrors = true;
			}

			if (content.includes("debugger;")) {
				console.error(
					`❌ Debugger statement found: ${file.replace(rootDir, ".")}`,
				);
				hasErrors = true;
			}
		} catch (error) {
			// ファイルが読めない場合はスキップ
		}
	}

	return hasErrors;
}

/**
 * 環境変数をチェック
 */
function checkEnvironmentVariables() {
	console.log("🌍 Checking environment variables...");

	let hasErrors = false;

	if (!process.env.NODE_ENV) {
		console.error("❌ NODE_ENV is not set");
		hasErrors = true;
	} else if (process.env.NODE_ENV !== "production") {
		console.error(
			`❌ NODE_ENV must be 'production' for production build, got: ${process.env.NODE_ENV}`,
		);
		hasErrors = true;
	}

	return hasErrors;
}

/**
 * Storybookファイルをチェック
 */
function checkStorybookFiles() {
	console.log("📚 Checking Storybook files...");

	let hasWarnings = false;

	// .storybookディレクトリのpreview.tsxをチェック
	const previewFile = join(rootDir, ".storybook", "preview.tsx");
	if (existsSync(previewFile)) {
		try {
			const content = readFileSync(previewFile, "utf-8");

			// 環境変数チェックなしのMSW初期化を検出
			if (content.includes("initialize(") && !content.includes("NODE_ENV")) {
				console.warn(
					"⚠️  MSW initialization without environment check in Storybook preview",
				);
				hasWarnings = true;
			}
		} catch (error) {
			console.warn("⚠️  Could not read Storybook preview file");
		}
	}

	return hasWarnings;
}

async function main() {
	console.log("🏗️  Starting pre-build safety checks...\n");

	const hasPatternErrors = checkDangerousPatterns();
	const hasEnvErrors = checkEnvironmentVariables();
	const hasStorybookWarnings = checkStorybookFiles();

	console.log("");

	if (hasPatternErrors || hasEnvErrors) {
		console.error("❌ Pre-build checks failed! Please fix the errors above.");
		process.exit(1);
	}

	if (hasStorybookWarnings) {
		console.warn("⚠️  Pre-build checks completed with warnings.");
	} else {
		console.log("✅ All pre-build checks passed!");
	}

	console.log("🚀 Proceeding with production build...\n");
}

main().catch((error) => {
	console.error("❌ Pre-build check script failed:", error.message);
	process.exit(1);
});
