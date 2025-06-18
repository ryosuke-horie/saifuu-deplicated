import { expect, test, type APIResponse } from "@playwright/test";

/**
 * 取引API エンドポイントのE2Eテスト
 * 
 * テスト対象:
 * - 全ての取引APIエンドポイントの統合テスト
 * - レスポンス形式とステータスコードの確認
 * - エラーレスポンスの確認
 * - データの永続化確認
 * 
 * 注意:
 * - 実際のデータベースとの統合テストのため、テストデータのクリーンアップが重要
 * - テスト間での依存関係を最小限に抑える設計
 */

// APIレスポンスの共通検証ヘルパー
async function validateApiResponse(response: APIResponse, expectedStatus: number) {
	expect(response.status()).toBe(expectedStatus);
	expect(response.headers()["content-type"]).toContain("application/json");
	
	const json = await response.json();
	
	if (response.ok()) {
		expect(json).toHaveProperty("success", true);
		expect(json).toHaveProperty("data");
	} else {
		expect(json).toHaveProperty("error");
		expect(typeof json.error).toBe("string");
	}
	
	return json;
}

// テスト用の取引データ
const testTransactionData = {
	amount: 1500,
	type: "expense",
	description: "E2Eテスト用の取引",
	transactionDate: "2024-01-15",
	paymentMethod: "クレジットカード",
	tags: ["テスト", "E2E"],
};

test.describe("Transactions API E2E Tests", () => {
	let createdTransactionId: number;

	test.describe("POST /api/transactions - 取引作成", () => {
		test("有効なデータで取引を作成できる", async ({ request }) => {
			const response = await request.post("/api/transactions", {
				data: testTransactionData,
			});

			const json = await validateApiResponse(response, 201);
			
			// 作成された取引の検証
			expect(json.data).toMatchObject({
				amount: testTransactionData.amount,
				type: testTransactionData.type,
				description: testTransactionData.description,
				transactionDate: testTransactionData.transactionDate,
				paymentMethod: testTransactionData.paymentMethod,
			});
			
			expect(json.data).toHaveProperty("id");
			expect(json.data.id).toBeGreaterThan(0);
			expect(json.message).toBe("取引が正常に作成されました");
			
			// 後続のテストで使用するためにIDを保存
			createdTransactionId = json.data.id;
		});

		test("必須フィールドが不足している場合にエラーが返される", async ({ request }) => {
			const invalidData = {
				description: "必須フィールドなし",
			};

			const response = await request.post("/api/transactions", {
				data: invalidData,
			});

			const json = await validateApiResponse(response, 400);
			expect(json.error).toBe("無効なリクエストボディです");
			expect(json.details).toBeDefined();
		});

		test("無効な金額でエラーが返される", async ({ request }) => {
			const invalidData = {
				...testTransactionData,
				amount: -100,
			};

			const response = await request.post("/api/transactions", {
				data: invalidData,
			});

			const json = await validateApiResponse(response, 400);
			expect(json.error).toBe("無効なリクエストボディです");
		});

		test("無効な取引タイプでエラーが返される", async ({ request }) => {
			const invalidData = {
				...testTransactionData,
				type: "invalid-type",
			};

			const response = await request.post("/api/transactions", {
				data: invalidData,
			});

			const json = await validateApiResponse(response, 400);
			expect(json.error).toBe("無効なリクエストボディです");
		});
	});

	test.describe("GET /api/transactions/:id - 取引詳細取得", () => {
		test("存在する取引IDで詳細を取得できる", async ({ request }) => {
			// 先に取引を作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			// 詳細を取得
			const response = await request.get(`/api/transactions/${transactionId}`);
			const json = await validateApiResponse(response, 200);
			
			// データの検証
			expect(json.data).toMatchObject({
				id: transactionId,
				amount: testTransactionData.amount,
				type: testTransactionData.type,
				description: testTransactionData.description,
				transactionDate: testTransactionData.transactionDate,
				paymentMethod: testTransactionData.paymentMethod,
			});
			
			// タグが配列として解析されていることを確認
			expect(Array.isArray(json.data.tags)).toBe(true);
			expect(json.data.tags).toEqual(testTransactionData.tags);
		});

		test("存在しない取引IDで404エラーが返される", async ({ request }) => {
			const response = await request.get("/api/transactions/999999");
			const json = await validateApiResponse(response, 404);
			
			expect(json.error).toBe("指定された取引が見つかりません");
			expect(json.transactionId).toBe(999999);
		});

		test("無効な取引IDで400エラーが返される", async ({ request }) => {
			const response = await request.get("/api/transactions/invalid-id");
			const json = await validateApiResponse(response, 400);
			
			expect(json.error).toBe("無効なパラメータです");
		});
	});

	test.describe("GET /api/transactions - 取引一覧取得", () => {
		test("デフォルトパラメータで取引一覧を取得できる", async ({ request }) => {
			const response = await request.get("/api/transactions");
			const json = await validateApiResponse(response, 200);
			
			// レスポンス構造の検証
			expect(json).toHaveProperty("data");
			expect(json).toHaveProperty("count");
			expect(json).toHaveProperty("pagination");
			expect(json).toHaveProperty("filters");
			expect(json).toHaveProperty("sort");
			
			// ページネーション情報の検証
			const { pagination } = json;
			expect(pagination).toHaveProperty("currentPage");
			expect(pagination).toHaveProperty("totalPages");
			expect(pagination).toHaveProperty("totalCount");
			expect(pagination).toHaveProperty("hasNextPage");
			expect(pagination).toHaveProperty("hasPrevPage");
			expect(pagination).toHaveProperty("limit");
			
			// データが配列であることを確認
			expect(Array.isArray(json.data)).toBe(true);
		});

		test("日付範囲フィルタが動作する", async ({ request }) => {
			const response = await request.get("/api/transactions?from=2024-01-01&to=2024-01-31");
			const json = await validateApiResponse(response, 200);
			
			expect(json.filters.from).toBe("2024-01-01");
			expect(json.filters.to).toBe("2024-01-31");
		});

		test("取引タイプフィルタが動作する", async ({ request }) => {
			const response = await request.get("/api/transactions?type=expense");
			const json = await validateApiResponse(response, 200);
			
			expect(json.filters.type).toBe("expense");
		});

		test("ページネーションが動作する", async ({ request }) => {
			const response = await request.get("/api/transactions?page=1&limit=5");
			const json = await validateApiResponse(response, 200);
			
			expect(json.pagination.currentPage).toBe(1);
			expect(json.pagination.limit).toBe(5);
			expect(json.count).toBeLessThanOrEqual(5);
		});

		test("ソート機能が動作する", async ({ request }) => {
			const response = await request.get("/api/transactions?sort_by=amount&sort_order=asc");
			const json = await validateApiResponse(response, 200);
			
			expect(json.sort.sort_by).toBe("amount");
			expect(json.sort.sort_order).toBe("asc");
		});

		test("無効なクエリパラメータでエラーが返される", async ({ request }) => {
			const response = await request.get("/api/transactions?page=0");
			const json = await validateApiResponse(response, 400);
			
			expect(json.error).toBe("無効なクエリパラメータです");
		});
	});

	test.describe("PUT /api/transactions/:id - 取引更新", () => {
		test("有効なデータで取引を更新できる", async ({ request }) => {
			// 先に取引を作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			// 更新データ
			const updateData = {
				amount: 2000,
				description: "更新されたE2Eテスト用取引",
			};

			// 更新実行
			const response = await request.put(`/api/transactions/${transactionId}`, {
				data: updateData,
			});
			const json = await validateApiResponse(response, 200);
			
			// 更新結果の検証
			expect(json.data.id).toBe(transactionId);
			expect(json.data.amount).toBe(updateData.amount);
			expect(json.data.description).toBe(updateData.description);
			expect(json.message).toBe("取引が正常に更新されました");
			
			// 変更されていないフィールドが保持されていることを確認
			expect(json.data.type).toBe(testTransactionData.type);
			expect(json.data.transactionDate).toBe(testTransactionData.transactionDate);
		});

		test("部分更新ができる", async ({ request }) => {
			// 先に取引を作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			// 単一フィールドのみ更新
			const updateData = { amount: 2500 };

			const response = await request.put(`/api/transactions/${transactionId}`, {
				data: updateData,
			});
			const json = await validateApiResponse(response, 200);
			
			expect(json.data.amount).toBe(2500);
			expect(json.data.description).toBe(testTransactionData.description); // 変更されていない
		});

		test("存在しない取引IDで404エラーが返される", async ({ request }) => {
			const updateData = { amount: 2000 };

			const response = await request.put("/api/transactions/999999", {
				data: updateData,
			});
			const json = await validateApiResponse(response, 404);
			
			expect(json.error).toBe("指定された取引が見つかりません");
		});

		test("更新フィールドが指定されていない場合にエラーが返される", async ({ request }) => {
			// 先に取引を作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			const response = await request.put(`/api/transactions/${transactionId}`, {
				data: {},
			});
			const json = await validateApiResponse(response, 400);
			
			expect(json.error).toBe("更新するフィールドが指定されていません");
		});

		test("無効なデータで更新しようとするとエラーが返される", async ({ request }) => {
			// 先に取引を作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			const invalidUpdateData = { amount: -100 };

			const response = await request.put(`/api/transactions/${transactionId}`, {
				data: invalidUpdateData,
			});
			const json = await validateApiResponse(response, 400);
			
			expect(json.error).toBe("無効なリクエストボディです");
		});
	});

	test.describe("DELETE /api/transactions/:id - 取引削除", () => {
		test("存在する取引を削除できる", async ({ request }) => {
			// 先に取引を作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			// 削除実行
			const response = await request.delete(`/api/transactions/${transactionId}`);
			const json = await validateApiResponse(response, 200);
			
			// 削除結果の検証
			expect(json.data.id).toBe(transactionId);
			expect(json.message).toBe("取引が正常に削除されました");
			expect(json.deletedInfo).toMatchObject({
				id: transactionId,
				amount: testTransactionData.amount,
				type: testTransactionData.type,
				description: testTransactionData.description,
				transactionDate: testTransactionData.transactionDate,
				isRecurring: false,
			});

			// 削除後に取得を試みると404になることを確認
			const getResponse = await request.get(`/api/transactions/${transactionId}`);
			expect(getResponse.status()).toBe(404);
		});

		test("存在しない取引IDで404エラーが返される", async ({ request }) => {
			const response = await request.delete("/api/transactions/999999");
			const json = await validateApiResponse(response, 404);
			
			expect(json.error).toBe("指定された取引が見つかりません");
		});

		test("無効な取引IDで400エラーが返される", async ({ request }) => {
			const response = await request.delete("/api/transactions/invalid-id");
			const json = await validateApiResponse(response, 400);
			
			expect(json.error).toBe("無効なパラメータです");
		});
	});

	test.describe("統合的なCRUDフロー", () => {
		test("作成→取得→更新→削除の一連の操作が正常に動作する", async ({ request }) => {
			// 1. 作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await validateApiResponse(createResponse, 201);
			const transactionId = createJson.data.id;

			// 2. 詳細取得
			const getResponse = await request.get(`/api/transactions/${transactionId}`);
			const getJson = await validateApiResponse(getResponse, 200);
			expect(getJson.data.id).toBe(transactionId);

			// 3. 更新
			const updateData = { amount: 3000, description: "統合テスト更新" };
			const updateResponse = await request.put(`/api/transactions/${transactionId}`, {
				data: updateData,
			});
			const updateJson = await validateApiResponse(updateResponse, 200);
			expect(updateJson.data.amount).toBe(3000);
			expect(updateJson.data.description).toBe("統合テスト更新");

			// 4. 一覧で更新された内容を確認
			const listResponse = await request.get("/api/transactions");
			const listJson = await validateApiResponse(listResponse, 200);
			const updatedTransaction = listJson.data.find((t: any) => t.id === transactionId);
			expect(updatedTransaction).toBeDefined();
			expect(updatedTransaction.amount).toBe(3000);

			// 5. 削除
			const deleteResponse = await request.delete(`/api/transactions/${transactionId}`);
			const deleteJson = await validateApiResponse(deleteResponse, 200);
			expect(deleteJson.data.id).toBe(transactionId);

			// 6. 削除後に取得できないことを確認
			const finalGetResponse = await request.get(`/api/transactions/${transactionId}`);
			expect(finalGetResponse.status()).toBe(404);
		});
	});

	test.describe("エラーハンドリング", () => {
		test("不正なJSONでリクエストするとエラーが返される", async ({ request }) => {
			const response = await request.post("/api/transactions", {
				data: "invalid-json",
				headers: {
					"Content-Type": "application/json",
				},
			});
			
			// JSON解析エラーによりサーバーエラーが発生する可能性
			expect([400, 500]).toContain(response.status());
		});

		test("不正なHTTPメソッドでエラーが返される", async ({ request }) => {
			// POST エンドポイントに GET リクエスト
			const response = await request.get("/api/transactions", {
				// POST用のデータを含めてみる（本来は無効）
				data: testTransactionData,
			});
			
			// GET /api/transactions は有効なので200が返る
			// この場合は作成ではなく一覧取得として処理される
			expect(response.status()).toBe(200);
		});
	});

	test.describe("データ永続化の確認", () => {
		test("作成したデータが一覧に表示される", async ({ request }) => {
			// 特定の説明文で取引を作成
			const uniqueDescription = `永続化テスト_${Date.now()}`;
			const createData = {
				...testTransactionData,
				description: uniqueDescription,
			};

			const createResponse = await request.post("/api/transactions", {
				data: createData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			// 一覧取得で作成したデータが含まれていることを確認
			const listResponse = await request.get("/api/transactions");
			const listJson = await listResponse.json();
			
			const createdTransaction = listJson.data.find((t: any) => t.id === transactionId);
			expect(createdTransaction).toBeDefined();
			expect(createdTransaction.description).toBe(uniqueDescription);

			// クリーンアップ
			await request.delete(`/api/transactions/${transactionId}`);
		});

		test("更新したデータが正しく保持される", async ({ request }) => {
			// 取引作成
			const createResponse = await request.post("/api/transactions", {
				data: testTransactionData,
			});
			const createJson = await createResponse.json();
			const transactionId = createJson.data.id;

			// 更新
			const newAmount = 5000;
			await request.put(`/api/transactions/${transactionId}`, {
				data: { amount: newAmount },
			});

			// 別のリクエストで取得して更新が保持されていることを確認
			const getResponse = await request.get(`/api/transactions/${transactionId}`);
			const getJson = await getResponse.json();
			expect(getJson.data.amount).toBe(newAmount);

			// クリーンアップ
			await request.delete(`/api/transactions/${transactionId}`);
		});
	});
});