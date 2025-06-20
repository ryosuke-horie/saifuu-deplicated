import { expect, test } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";
import { TransactionFormPage } from "./pages/transaction-form.page";
import { TransactionListPage } from "./pages/transaction-list.page";
import { cleanupTestData, seedTestData } from "./setup/database";

/**
 * パフォーマンステストとCore Web Vitals計測
 * ページ読み込み速度、操作レスポンス、メモリ使用量をテスト
 *
 * テスト戦略：
 * - Core Web Vitalsの基準値達成を確認
 * - 大量データでのパフォーマンス劣化を検証
 * - メモリリークの検出
 */
test.describe("パフォーマンステスト", () => {
	let dashboardPage: DashboardPage;
	let transactionFormPage: TransactionFormPage;
	let transactionListPage: TransactionListPage;

	test.beforeEach(async ({ page }) => {
		dashboardPage = new DashboardPage(page);
		transactionFormPage = new TransactionFormPage(page);
		transactionListPage = new TransactionListPage(page);

		await seedTestData();
	});

	test.afterEach(async () => {
		await cleanupTestData();
	});

	test.describe("Core Web Vitals", () => {
		test("ダッシュボードのCore Web Vitalsが基準を満たす", async ({ page }) => {
			// パフォーマンス計測開始
			await page.goto("/dashboard", { waitUntil: "networkidle" });

			// Performance APIからメトリクスを取得
			const metrics = await page.evaluate(() => {
				return new Promise((resolve) => {
					// PerformanceObserverでメトリクスを取得
					const observer = new PerformanceObserver((list) => {
						const entries = list.getEntries();
						const metricsData: Record<string, number> = {};

						for (const entry of entries) {
							if (entry.entryType === "navigation") {
								const navEntry = entry as PerformanceNavigationTiming;
								// FCP (First Contentful Paint)
								metricsData.fcp = navEntry.responseEnd - navEntry.startTime;
								// LCP推定値
								metricsData.estimatedLcp =
									navEntry.loadEventEnd - navEntry.startTime;
							}
						}

						resolve(metricsData);
					});

					observer.observe({ entryTypes: ["navigation"] });

					// タイムアウト設定
					setTimeout(() => resolve({}), 5000);
				});
			});

			const metricsData = metrics as Record<string, number>;

			// Core Web Vitals基準の確認
			if (metricsData.fcp) {
				// FCP (First Contentful Paint) < 1.8s
				expect(metricsData.fcp).toBeLessThan(1800);
				console.log(`FCP: ${metricsData.fcp}ms`);
			}

			if (metricsData.estimatedLcp) {
				// LCP (Largest Contentful Paint) < 2.5s
				expect(metricsData.estimatedLcp).toBeLessThan(2500);
				console.log(`Estimated LCP: ${metricsData.estimatedLcp}ms`);
			}

			// CLS (Cumulative Layout Shift) の計測
			const cls = await page.evaluate(() => {
				return new Promise<number>((resolve) => {
					let clsValue = 0;
					const observer = new PerformanceObserver((list) => {
						for (const entry of list.getEntries()) {
							if (
								entry.entryType === "layout-shift" &&
								!(entry as any).hadRecentInput
							) {
								clsValue += (entry as any).value;
							}
						}
					});

					observer.observe({ entryTypes: ["layout-shift"] });

					setTimeout(() => {
						resolve(clsValue);
					}, 3000);
				});
			});

			// CLS < 0.1
			expect(cls).toBeLessThan(0.1);
			console.log(`CLS: ${cls}`);
		});

		test("取引フォームの読み込み速度が基準を満たす", async ({ page }) => {
			const startTime = Date.now();

			await transactionFormPage.goto();
			await transactionFormPage.expectFormVisible();

			const loadTime = Date.now() - startTime;

			// フォーム表示まで2秒以内
			expect(loadTime).toBeLessThan(2000);
			console.log(`Form load time: ${loadTime}ms`);
		});

		test("取引一覧の初期表示速度が基準を満たす", async ({ page }) => {
			// テスト用に50件の取引を作成
			const transactions = Array.from({ length: 50 }, (_, i) => ({
				amount: 1000 + i * 100,
				type: i % 2 === 0 ? ("expense" as const) : ("income" as const),
				description: `パフォーマンステスト取引 ${i + 1}`,
				transactionDate: "2025-01-15",
			}));

			for (const transaction of transactions) {
				await transactionFormPage.goto(transaction.type);
				await transactionFormPage.fillTransactionForm(transaction);
				const categoryName =
					transaction.type === "income" ? "テスト給与" : "テスト食費";
				await transactionFormPage.selectCategory(categoryName);
				await transactionFormPage.submit();
			}

			// 一覧の読み込み速度測定
			const startTime = Date.now();
			await transactionListPage.goto();
			await transactionListPage.expectTransactionCount(50);
			const loadTime = Date.now() - startTime;

			// 50件の取引表示まで3秒以内
			expect(loadTime).toBeLessThan(3000);
			console.log(`Transaction list load time: ${loadTime}ms`);
		});
	});

	test.describe("操作レスポンス", () => {
		test("取引フォーム送信のレスポンス時間が適切", async ({ page }) => {
			await transactionFormPage.goto();
			await transactionFormPage.fillTransactionForm({
				amount: 1200,
				type: "expense",
				description: "レスポンステスト",
				transactionDate: "2025-01-15",
			});
			await transactionFormPage.selectCategory("テスト食費");

			// 送信時間の測定
			const startTime = Date.now();
			await transactionFormPage.submit();
			await transactionFormPage.expectSubmitSuccess();
			const submitTime = Date.now() - startTime;

			// フォーム送信から完了まで5秒以内
			expect(submitTime).toBeLessThan(5000);
			console.log(`Form submit time: ${submitTime}ms`);
		});

		test("検索・フィルタ機能のレスポンス時間が適切", async ({ page }) => {
			// テスト用に20件の取引を作成
			for (let i = 0; i < 20; i++) {
				await transactionFormPage.goto();
				await transactionFormPage.fillTransactionForm({
					amount: 1000 + i * 100,
					type: "expense",
					description: `検索テスト取引 ${i + 1}`,
					transactionDate: "2025-01-15",
				});
				await transactionFormPage.selectCategory("テスト食費");
				await transactionFormPage.submit();
			}

			await transactionListPage.goto();

			// 検索のレスポンス時間測定
			const searchStartTime = Date.now();
			await transactionListPage.searchTransactions("検索テスト");
			await transactionListPage.waitForSearchResults();
			const searchTime = Date.now() - searchStartTime;

			// 検索結果表示まで2秒以内
			expect(searchTime).toBeLessThan(2000);
			console.log(`Search response time: ${searchTime}ms`);

			// フィルタのレスポンス時間測定
			const filterStartTime = Date.now();
			await transactionListPage.clearFilters();
			await transactionListPage.filterByType("expense");
			const filterTime = Date.now() - filterStartTime;

			// フィルタ適用まで1.5秒以内
			expect(filterTime).toBeLessThan(1500);
			console.log(`Filter response time: ${filterTime}ms`);
		});
	});

	test.describe("メモリ使用量", () => {
		test("大量データ操作時のメモリリークがない", async ({ page }) => {
			// 初期メモリ使用量を取得
			const initialMemory = await page.evaluate(() => {
				return (performance as any).memory?.usedJSHeapSize || 0;
			});

			// 大量の取引を作成・削除を繰り返す
			for (let cycle = 0; cycle < 5; cycle++) {
				// 10件の取引を作成
				for (let i = 0; i < 10; i++) {
					await transactionFormPage.goto();
					await transactionFormPage.fillTransactionForm({
						amount: 1000,
						type: "expense",
						description: `メモリテスト ${cycle}-${i}`,
						transactionDate: "2025-01-15",
					});
					await transactionFormPage.selectCategory("テスト食費");
					await transactionFormPage.submit();
				}

				// 取引を削除
				await transactionListPage.goto();
				for (let i = 0; i < 10; i++) {
					const count = await transactionListPage.getTransactionCount();
					if (count > 0) {
						await transactionListPage.deleteTransaction(0);
						await transactionListPage.confirmDelete();
					}
				}
			}

			// 最終メモリ使用量を取得
			const finalMemory = await page.evaluate(() => {
				return (performance as any).memory?.usedJSHeapSize || 0;
			});

			// メモリ増加が許容範囲内（初期の2倍以下）
			if (initialMemory > 0 && finalMemory > 0) {
				const memoryIncrease = finalMemory - initialMemory;
				const increaseRatio = memoryIncrease / initialMemory;

				expect(increaseRatio).toBeLessThan(1.0); // 100%未満の増加
				console.log(
					`Memory increase: ${memoryIncrease} bytes (${(increaseRatio * 100).toFixed(2)}%)`,
				);
			}
		});

		test("ページ間遷移時のメモリ効率性", async ({ page }) => {
			const memorySnapshots: number[] = [];

			// 各ページでメモリ使用量を記録
			const captureMemory = async (pageName: string) => {
				const memory = await page.evaluate(() => {
					return (performance as any).memory?.usedJSHeapSize || 0;
				});
				memorySnapshots.push(memory);
				console.log(`${pageName} memory: ${memory} bytes`);
			};

			// ダッシュボード
			await dashboardPage.goto();
			await captureMemory("Dashboard");

			// 取引フォーム
			await transactionFormPage.goto();
			await captureMemory("Transaction Form");

			// 取引一覧
			await transactionListPage.goto();
			await captureMemory("Transaction List");

			// ダッシュボードに戻る
			await dashboardPage.goto();
			await captureMemory("Dashboard (return)");

			// ページ間でのメモリ使用量が安定していることを確認
			const maxMemory = Math.max(...memorySnapshots);
			const minMemory = Math.min(...memorySnapshots);
			const memoryVariation = (maxMemory - minMemory) / minMemory;

			// メモリ変動が50%以下
			expect(memoryVariation).toBeLessThan(0.5);
		});
	});

	test.describe("ネットワーク効率性", () => {
		test("不要なAPIリクエストが発生しない", async ({ page }) => {
			const apiRequests: string[] = [];

			// APIリクエストを監視
			page.on("request", (request) => {
				if (request.url().includes("/api/")) {
					apiRequests.push(request.url());
				}
			});

			// ダッシュボード表示
			await dashboardPage.goto();
			await dashboardPage.expectSummaryCardsVisible();

			// 同じページの再表示
			await page.reload();
			await dashboardPage.expectSummaryCardsVisible();

			// 重複リクエストの確認
			const uniqueRequests = new Set(apiRequests);
			const duplicateRatio =
				(apiRequests.length - uniqueRequests.size) / apiRequests.length;

			// 重複リクエストが20%以下
			expect(duplicateRatio).toBeLessThan(0.2);
			console.log(
				`API requests: ${apiRequests.length}, Unique: ${uniqueRequests.size}`,
			);
		});

		test("大量データ取得時のページング効率性", async ({ page }) => {
			// 100件の取引を作成
			for (let i = 0; i < 100; i++) {
				await transactionFormPage.goto();
				await transactionFormPage.fillTransactionForm({
					amount: 1000 + i,
					type: "expense",
					description: `ページングテスト ${i + 1}`,
					transactionDate: "2025-01-15",
				});
				await transactionFormPage.selectCategory("テスト食費");
				await transactionFormPage.submit();
			}

			const requestSizes: number[] = [];

			// レスポンスサイズを監視
			page.on("response", async (response) => {
				if (response.url().includes("/api/transactions")) {
					const body = await response.text();
					requestSizes.push(body.length);
				}
			});

			// 取引一覧を表示
			await transactionListPage.goto();
			await transactionListPage.expectTransactionCount(100);

			// レスポンスサイズが適切（500KB以下）
			for (const size of requestSizes) {
				expect(size).toBeLessThan(500 * 1024); // 500KB
			}

			console.log(
				`API response sizes: ${requestSizes.map((s) => `${(s / 1024).toFixed(2)}KB`).join(", ")}`,
			);
		});
	});
});
