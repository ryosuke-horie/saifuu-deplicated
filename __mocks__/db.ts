/**
 * データベースモックオブジェクト
 *
 * 設計方針:
 * - 実際のDrizzle ORMのメソッドチェーンを模倣
 * - インメモリデータストアでテスト環境を構築
 * - CRUD操作を完全にサポート
 * - 型安全性を維持してテストの信頼性を確保
 */

import type {
	SelectCategory,
	SelectSubscription,
	SelectTransaction,
} from "../db/schema";

// インメモリデータストア
interface MockDataStore {
	categories: SelectCategory[];
	transactions: SelectTransaction[];
	subscriptions: SelectSubscription[];
}

const mockDataStore: MockDataStore = {
	categories: [],
	transactions: [],
	subscriptions: [],
};

// IDカウンター（新規作成時のID生成用）
const idCounters = {
	categories: 1,
	transactions: 1,
	subscriptions: 1,
};

// モッククエリビルダー
class MockQueryBuilder {
	private tableName: string;
	private selectFields: any = null;
	private whereConditions: Array<(item: any) => boolean> = [];
	private orderByFields: Array<{ field: string; direction: "asc" | "desc" }> =
		[];
	private joinConditions: Array<{
		table: string;
		condition: (left: any, right: any) => boolean;
	}> = [];
	private limitValue: number | null = null;
	private offsetValue: number | null = null;

	constructor(tableName: string) {
		this.tableName = tableName;
	}

	select(fields?: any) {
		this.selectFields = fields;
		return this;
	}

	where(condition: (item: any) => boolean) {
		this.whereConditions.push(condition);
		return this;
	}

	leftJoin(table: string, condition: (left: any, right: any) => boolean) {
		this.joinConditions.push({ table, condition });
		return this;
	}

	orderBy(...fields: Array<{ field: string; direction: "asc" | "desc" }>) {
		this.orderByFields = fields;
		return this;
	}

	limit(count: number) {
		this.limitValue = count;
		return this;
	}

	offset(count: number) {
		this.offsetValue = count;
		return this;
	}

	groupBy(...fields: string[]) {
		// グループ化の実装（簡略化）
		return this;
	}

	async execute(): Promise<any[]> {
		let data = mockDataStore[this.tableName as keyof MockDataStore] || [];

		// WHERE条件を適用
		for (const condition of this.whereConditions) {
			data = data.filter(condition);
		}

		// JOIN処理（簡略化）
		for (const join of this.joinConditions) {
			const joinTable = mockDataStore[join.table as keyof MockDataStore] || [];
			data = data.map((item) => {
				const joinedItem = joinTable.find((joinItem) =>
					join.condition(item, joinItem),
				);
				return {
					...item,
					[join.table.slice(0, -1)]: joinedItem || null, // テーブル名から's'を除去してキー名にする
				};
			});
		}

		// ORDER BY処理
		if (this.orderByFields.length > 0) {
			data.sort((a, b) => {
				for (const { field, direction } of this.orderByFields) {
					const aVal = this.getNestedValue(a, field);
					const bVal = this.getNestedValue(b, field);
					if (aVal < bVal) return direction === "asc" ? -1 : 1;
					if (aVal > bVal) return direction === "asc" ? 1 : -1;
				}
				return 0;
			});
		}

		// OFFSET処理
		if (this.offsetValue !== null) {
			data = data.slice(this.offsetValue);
		}

		// LIMIT処理
		if (this.limitValue !== null) {
			data = data.slice(0, this.limitValue);
		}

		return data;
	}

	private getNestedValue(obj: any, path: string): any {
		return path.split(".").reduce((current, key) => current?.[key], obj);
	}
}

// モックデータベースクラス
class MockDatabase {
	select(fields?: any) {
		return {
			from: (table: any) => {
				const tableName = this.getTableName(table);
				const builder = new MockQueryBuilder(tableName);
				return builder.select(fields);
			},
		};
	}

	insert(table: any) {
		const tableName = this.getTableName(table);
		return {
			values: (data: any) => ({
				returning: async () => {
					const newId = idCounters[tableName as keyof typeof idCounters]++;
					const newItem = {
						id: newId,
						...data,
						createdAt: data.createdAt || new Date().toISOString(),
						updatedAt: data.updatedAt || new Date().toISOString(),
					};

					(mockDataStore[tableName as keyof MockDataStore] as any[]).push(
						newItem,
					);
					return [newItem];
				},
			}),
		};
	}

	update(table: any) {
		const tableName = this.getTableName(table);
		return {
			set: (data: any) => ({
				where: (condition: (item: any) => boolean) => ({
					returning: async () => {
						const items = mockDataStore[
							tableName as keyof MockDataStore
						] as any[];
						const index = items.findIndex(condition);
						if (index !== -1) {
							const updatedItem = {
								...items[index],
								...data,
								updatedAt: new Date().toISOString(),
							};
							items[index] = updatedItem;
							return [updatedItem];
						}
						return [];
					},
				}),
			}),
		};
	}

	delete(table: any) {
		const tableName = this.getTableName(table);
		return {
			where: (condition: (item: any) => boolean) => ({
				returning: async () => {
					const items = mockDataStore[
						tableName as keyof MockDataStore
					] as any[];
					const index = items.findIndex(condition);
					if (index !== -1) {
						const deletedItem = items.splice(index, 1)[0];
						return [deletedItem];
					}
					return [];
				},
			}),
		};
	}

	private getTableName(table: any): string {
		// テーブルオブジェクトからテーブル名を取得（簡略化）
		if (typeof table === "object" && table._) {
			return table._.name;
		}
		// フォールバック：シンボルまたは文字列として処理
		return String(table).replace("Symbol(", "").replace(")", "");
	}
}

// DrizzleORM関数のモック
export const mockDrizzleHelpers = {
	eq: (field: any, value: any) => (item: any) => {
		const fieldName = String(field).split(".").pop() || String(field);
		return item[fieldName] === value;
	},

	and:
		(...conditions: Array<(item: any) => boolean>) =>
		(item: any) => {
			return conditions.every((condition) => condition(item));
		},

	gte: (field: any, value: any) => (item: any) => {
		const fieldName = String(field).split(".").pop() || String(field);
		return item[fieldName] >= value;
	},

	lte: (field: any, value: any) => (item: any) => {
		const fieldName = String(field).split(".").pop() || String(field);
		return item[fieldName] <= value;
	},

	like: (field: any, pattern: string) => (item: any) => {
		const fieldName = String(field).split(".").pop() || String(field);
		const value = item[fieldName];
		if (typeof value !== "string") return false;
		const regex = new RegExp(pattern.replace("%", ".*"), "i");
		return regex.test(value);
	},

	desc: (field: any) => ({ field: String(field), direction: "desc" as const }),
	asc: (field: any) => ({ field: String(field), direction: "asc" as const }),

	sql: (template: TemplateStringsArray, ...values: any[]) => ({
		as: (alias: string) => ({ alias, template: template.join("?"), values }),
	}),
};

// モックデータベースインスタンス
export const mockDb = new MockDatabase();

// データストアリセット関数（テスト間でのクリーンアップ用）
export const resetMockDataStore = () => {
	mockDataStore.categories = [];
	mockDataStore.transactions = [];
	mockDataStore.subscriptions = [];
	idCounters.categories = 1;
	idCounters.transactions = 1;
	idCounters.subscriptions = 1;
};

// テストデータ投入関数
export const seedMockData = (data: Partial<MockDataStore>) => {
	if (data.categories) {
		mockDataStore.categories = data.categories;
		idCounters.categories =
			Math.max(...data.categories.map((c) => c.id), 0) + 1;
	}
	if (data.transactions) {
		mockDataStore.transactions = data.transactions;
		idCounters.transactions =
			Math.max(...data.transactions.map((t) => t.id), 0) + 1;
	}
	if (data.subscriptions) {
		mockDataStore.subscriptions = data.subscriptions;
		idCounters.subscriptions =
			Math.max(...data.subscriptions.map((s) => s.id), 0) + 1;
	}
};

// データストアの現在の状態を取得（デバッグ用）
export const getMockDataStore = () => ({ ...mockDataStore });
