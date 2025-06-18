-- カテゴリテーブルにdisplayOrderフィールドを追加
-- 表示順序を管理するためのフィールド（デフォルト値: 0）
ALTER TABLE `categories` ADD COLUMN `display_order` integer DEFAULT 0 NOT NULL;

-- 既存データの表示順序を設定（IDの昇順でdisplayOrderを設定）
UPDATE `categories` SET `display_order` = `id` WHERE `display_order` = 0;