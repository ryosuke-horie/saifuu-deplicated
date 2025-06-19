import { describe, expect, it } from "vitest";
import { calculateNextPaymentDate } from "./subscriptions";

/**
 * サブスクリプション関数のユニットテスト
 *
 * データベースに依存しない純粋関数のテスト
 */

describe("subscriptions utils", () => {
	describe("calculateNextPaymentDate", () => {
		it("正常ケース: 日次の次回支払日を計算", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-01-15", "daily");

			// 検証
			expect(result).toBe("2024-01-16");
		});

		it("正常ケース: 週次の次回支払日を計算", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-01-15", "weekly");

			// 検証
			expect(result).toBe("2024-01-22");
		});

		it("正常ケース: 月次の次回支払日を計算", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-01-15", "monthly");

			// 検証
			expect(result).toBe("2024-02-15");
		});

		it("正常ケース: 年次の次回支払日を計算", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-01-15", "yearly");

			// 検証
			expect(result).toBe("2025-01-15");
		});

		it("正常ケース: 月末の処理（2月の場合）", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-01-31", "monthly");

			// 検証
			// JavaScriptのDateオブジェクトは1月31日に1か月加算すると3月2日になる（2月は29日まで）
			expect(result).toBe("2024-03-02");
		});

		it("正常ケース: うるう年でない年の2月末", () => {
			// 実行
			const result = calculateNextPaymentDate("2023-01-31", "monthly");

			// 検証
			// JavaScriptのDateオブジェクトは1月31日に1か月加算すると3月3日になる（2月は28日まで）
			expect(result).toBe("2023-03-03");
		});

		it("正常ケース: 30日の月から31日の月への移行", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-04-30", "monthly");

			// 検証
			// 4月30日 → 5月30日
			expect(result).toBe("2024-05-30");
		});

		it("エラーケース: サポートされていない頻度を指定", () => {
			// 実行 & 検証
			expect(() => calculateNextPaymentDate("2024-01-15", "invalid")).toThrow(
				"Unsupported frequency: invalid",
			);
		});

		it("エッジケース: 12月から翌年1月への年次移行", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-12-25", "yearly");

			// 検証
			expect(result).toBe("2025-12-25");
		});

		it("エッジケース: 週次で年またぎ", () => {
			// 実行
			const result = calculateNextPaymentDate("2024-12-30", "weekly");

			// 検証
			expect(result).toBe("2025-01-06");
		});
	});
});
