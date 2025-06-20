import { expect, test } from "@playwright/test";
import { DashboardPage } from "./pages/dashboard.page";
import { TransactionFormPage } from "./pages/transaction-form.page";
import { TransactionListPage } from "./pages/transaction-list.page";
import {
	cleanupTestData,
	seedTestData,
	testTransactions,
} from "./setup/database";

/**
 * レスポンシブデザインのE2Eテスト
 * モバイル・タブレット・デスクトップでの表示と操作をテスト
 *
 * テスト戦略：
 * - 主要なビューポートサイズでの動作確認
 * - タッチ操作とクリック操作の互換性
 * - 画面サイズに応じたレイアウト変更の確認
 */
test.describe("レスポンシブデザイン", () => {
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

	test.describe("モバイル表示（375x667）", () => {
		test.beforeEach(async ({ page }) => {
			await page.setViewportSize({ width: 375, height: 667 });
		});

		test("ダッシュボードがモバイル表示で正しくレイアウトされる", async ({
			page,
		}) => {
			await dashboardPage.goto();
			await dashboardPage.expectSummaryCardsVisible();

			// モバイル表示のスクリーンショット
			await dashboardPage.takeScreenshot("mobile-dashboard");

			// サマリーカードが縦に積み重なって表示されることを確認
			const summaryCards = dashboardPage.summaryCards;
			const boundingBox = await summaryCards.boundingBox();

			// モバイル幅（375px）に収まることを確認
			expect(boundingBox?.width).toBeLessThanOrEqual(375);

			// 各カードがタップ可能なサイズであることを確認（44px以上のタップターゲット）
			const cardElements = await page
				.locator('[data-testid="summary-card"]')
				.all();
			for (const card of cardElements) {
				const cardBox = await card.boundingBox();
				expect(cardBox?.height).toBeGreaterThanOrEqual(44);
			}
		});

		test("取引フォームがモバイル表示で正常に動作する", async ({ page }) => {
			await transactionFormPage.goto();
			await transactionFormPage.expectFormVisible();

			// フォーム要素がモバイル幅に収まることを確認
			const form = page.locator('[data-testid="transaction-form"]');
			const formBox = await form.boundingBox();
			expect(formBox?.width).toBeLessThanOrEqual(375);

			// タッチ操作での入力テスト
			await transactionFormPage.fillTransactionForm(testTransactions.expense);
			await transactionFormPage.selectCategory("テスト食費");

			// モバイルキーボードによるレイアウト変更を考慮
			await page.keyboard.press("Tab"); // フォーカス移動
			await transactionFormPage.submit();
			await transactionFormPage.expectSubmitSuccess();

			await transactionFormPage.takeScreenshot("mobile-form");
		});

		test("取引一覧がモバイル表示で適切にスクロール・操作できる", async ({
			page,
		}) => {
			// テスト用に複数の取引を作成
			const transactions = Array.from({ length: 10 }, (_, i) => ({
				...testTransactions.expense,
				description: `モバイルテスト取引 ${i + 1}`,
				amount: 1000 + i * 100,
			}));

			for (const transaction of transactions) {
				await transactionFormPage.goto();
				await transactionFormPage.fillTransactionForm(transaction);
				await transactionFormPage.selectCategory("テスト食費");
				await transactionFormPage.submit();
			}

			await transactionListPage.goto();

			// スクロール可能であることを確認
			await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
			await page.waitForTimeout(500);

			// 最後の取引が表示されることを確認
			await transactionListPage.expectTransactionVisible(
				"モバイルテスト取引 10",
			);

			// タッチ操作での削除テスト
			await transactionListPage.deleteTransaction(0);
			await transactionListPage.expectDeleteModalVisible();

			// モーダルがモバイル画面に収まることを確認
			const modal = page.locator('[data-testid="delete-modal"]');
			const modalBox = await modal.boundingBox();
			expect(modalBox?.width).toBeLessThanOrEqual(375);

			await transactionListPage.confirmDelete();
			await transactionListPage.takeScreenshot("mobile-list");
		});
	});

	test.describe("タブレット表示（768x1024）", () => {
		test.beforeEach(async ({ page }) => {
			await page.setViewportSize({ width: 768, height: 1024 });
		});

		test("ダッシュボードがタブレット表示で適切にレイアウトされる", async ({
			page,
		}) => {
			await dashboardPage.goto();
			await dashboardPage.expectSummaryCardsVisible();

			// タブレット表示のスクリーンショット
			await dashboardPage.takeScreenshot("tablet-dashboard");

			// サマリーカードが2列で表示されることを確認（タブレット幅を活用）
			const summaryCards = await page
				.locator('[data-testid="summary-card"]')
				.all();

			// 最初の2つのカードが同じ高さにあることを確認（横並び）
			if (summaryCards.length >= 2) {
				const firstCardBox = await summaryCards[0].boundingBox();
				const secondCardBox = await summaryCards[1].boundingBox();

				// Y座標が近い（同じ行にある）ことを確認
				const yDifference = Math.abs(
					(firstCardBox?.y || 0) - (secondCardBox?.y || 0),
				);
				expect(yDifference).toBeLessThan(50);
			}
		});

		test("取引フォームがタブレット表示で見やすくレイアウトされる", async ({
			page,
		}) => {
			await transactionFormPage.goto();

			// フォームがタブレット幅を活用していることを確認
			const form = page.locator('[data-testid="transaction-form"]');
			const formBox = await form.boundingBox();

			// デスクトップほど幅広でなく、モバイルより余裕があることを確認
			expect(formBox?.width).toBeGreaterThan(400);
			expect(formBox?.width).toBeLessThan(700);

			// 入力フィールドが適切なサイズであることを確認
			const inputFields = await page.locator("input, select, textarea").all();
			for (const field of inputFields) {
				const fieldBox = await field.boundingBox();
				// タップしやすいサイズであることを確認
				expect(fieldBox?.height).toBeGreaterThanOrEqual(40);
			}

			await transactionFormPage.takeScreenshot("tablet-form");
		});

		test("取引一覧がタブレット表示で効率的に情報を表示する", async ({
			page,
		}) => {
			// 複数の取引を作成
			for (let i = 0; i < 5; i++) {
				await transactionFormPage.goto();
				await transactionFormPage.fillTransactionForm({
					...testTransactions.expense,
					description: `タブレットテスト ${i + 1}`,
				});
				await transactionFormPage.selectCategory("テスト食費");
				await transactionFormPage.submit();
			}

			await transactionListPage.goto();

			// タブレット表示では一覧が見やすく表示される
			const transactionItems = await page
				.locator('[data-testid="transaction-item"]')
				.all();

			// 各取引項目が適切な間隔で表示されることを確認
			for (let i = 0; i < transactionItems.length - 1; i++) {
				const currentBox = await transactionItems[i].boundingBox();
				const nextBox = await transactionItems[i + 1].boundingBox();

				// 適切な間隔があることを確認
				const gap =
					(nextBox?.y || 0) -
					((currentBox?.y || 0) + (currentBox?.height || 0));
				expect(gap).toBeGreaterThan(5);
			}

			await transactionListPage.takeScreenshot("tablet-list");
		});
	});

	test.describe("デスクトップ表示（1920x1080）", () => {
		test.beforeEach(async ({ page }) => {
			await page.setViewportSize({ width: 1920, height: 1080 });
		});

		test("ダッシュボードがデスクトップ表示で最大限活用される", async ({
			page,
		}) => {
			await dashboardPage.goto();
			await dashboardPage.expectSummaryCardsVisible();

			// デスクトップ表示のスクリーンショット
			await dashboardPage.takeScreenshot("desktop-dashboard");

			// サマリーカードが横並びで表示されることを確認
			const summaryCards = await page
				.locator('[data-testid="summary-card"]')
				.all();

			if (summaryCards.length >= 3) {
				const cardBoxes = await Promise.all(
					summaryCards.slice(0, 3).map((card) => card.boundingBox()),
				);

				// すべてのカードが同じ高さにあることを確認（横並び）
				const yPositions = cardBoxes.map((box) => box?.y || 0);
				const maxYDiff = Math.max(...yPositions) - Math.min(...yPositions);
				expect(maxYDiff).toBeLessThan(50);
			}

			// デスクトップ幅を活用した余白があることを確認
			const dashboard = page.locator('[data-testid="dashboard-container"]');
			const dashboardBox = await dashboard.boundingBox();
			expect(dashboardBox?.width).toBeGreaterThan(1000);
		});

		test("取引フォームがデスクトップ表示で効率的にレイアウトされる", async ({
			page,
		}) => {
			await transactionFormPage.goto();

			// フォームがデスクトップ幅を適切に活用
			const form = page.locator('[data-testid="transaction-form"]');
			const formBox = await form.boundingBox();

			// 読みやすい幅に制限されていることを確認（過度に横長でない）
			expect(formBox?.width).toBeGreaterThan(500);
			expect(formBox?.width).toBeLessThan(1200);

			// 複数列レイアウトが使用されている可能性を確認
			const formRows = await page.locator('[data-testid="form-row"]').all();
			if (formRows.length >= 2) {
				// 一部のフィールドが横並びになっていることを確認
				const firstRowBox = await formRows[0].boundingBox();
				const secondRowBox = await formRows[1].boundingBox();
				expect(firstRowBox?.width).toBeGreaterThan(400);
			}

			await transactionFormPage.takeScreenshot("desktop-form");
		});

		test("取引一覧がデスクトップ表示でテーブル形式で効率表示", async ({
			page,
		}) => {
			// 複数の取引を作成
			for (let i = 0; i < 8; i++) {
				await transactionFormPage.goto();
				await transactionFormPage.fillTransactionForm({
					...testTransactions.expense,
					description: `デスクトップテスト ${i + 1}`,
					amount: 1000 + i * 500,
				});
				await transactionFormPage.selectCategory("テスト食費");
				await transactionFormPage.submit();
			}

			await transactionListPage.goto();

			// デスクトップ表示では多くの情報が一度に表示される
			const visibleTransactions =
				await transactionListPage.getTransactionCount();
			expect(visibleTransactions).toBeGreaterThanOrEqual(5);

			// テーブルヘッダーが表示されることを確認
			const tableHeaders = await page
				.locator('[data-testid="table-header"]')
				.all();
			expect(tableHeaders.length).toBeGreaterThan(0);

			// 各列が適切な幅で表示されることを確認
			const amountColumn = page.locator('[data-testid="amount-column"]');
			const dateColumn = page.locator('[data-testid="date-column"]');
			const descriptionColumn = page.locator(
				'[data-testid="description-column"]',
			);

			await expect(amountColumn).toBeVisible();
			await expect(dateColumn).toBeVisible();
			await expect(descriptionColumn).toBeVisible();

			await transactionListPage.takeScreenshot("desktop-list");
		});
	});

	test.describe("画面回転・サイズ変更", () => {
		test("画面サイズ変更時にレイアウトが適切に調整される", async ({ page }) => {
			await dashboardPage.goto();

			// デスクトップサイズから開始
			await page.setViewportSize({ width: 1200, height: 800 });
			await dashboardPage.expectSummaryCardsVisible();

			// タブレットサイズに変更
			await page.setViewportSize({ width: 768, height: 1024 });
			await page.waitForTimeout(500); // レイアウト調整を待つ
			await dashboardPage.expectSummaryCardsVisible();

			// モバイルサイズに変更
			await page.setViewportSize({ width: 375, height: 667 });
			await page.waitForTimeout(500);
			await dashboardPage.expectSummaryCardsVisible();

			// 各サイズでスクリーンショットを取得
			await dashboardPage.takeScreenshot("size-change-mobile");
		});

		test("横画面モバイルでの表示確認", async ({ page }) => {
			// 横画面モバイル（landscape）
			await page.setViewportSize({ width: 667, height: 375 });

			await dashboardPage.goto();
			await dashboardPage.expectSummaryCardsVisible();

			// 横画面でも操作可能であることを確認
			await dashboardPage.clickAddTransaction();
			await transactionFormPage.expectFormVisible();

			// フォームが画面に収まることを確認
			const form = page.locator('[data-testid="transaction-form"]');
			const formBox = await form.boundingBox();
			expect(formBox?.height).toBeLessThanOrEqual(375);

			await transactionFormPage.takeScreenshot("landscape-mobile");
		});
	});
});
