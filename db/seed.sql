-- メインシードファイル
-- 初期データとサンプルデータを統合して投入

-- 初期カテゴリデータの投入
-- 家計管理アプリで一般的に使用されるカテゴリを事前定義

-- 支出カテゴリ
INSERT INTO categories (name, type, color, icon, is_active) VALUES
('食費', 'expense', '#FF6B6B', 'utensils', 1),
('交通費', 'expense', '#4ECDC4', 'car', 1),
('日用品', 'expense', '#45B7D1', 'shopping-cart', 1),
('医療費', 'expense', '#96CEB4', 'heart', 1),
('通信費', 'expense', '#FFEAA7', 'smartphone', 1),
('光熱費', 'expense', '#DDA0DD', 'zap', 1),
('家賃', 'expense', '#98D8C8', 'home', 1),
('娯楽費', 'expense', '#F7DC6F', 'game-controller-01', 1),
('被服費', 'expense', '#BB8FCE', 'shirt', 1),
('書籍・学習', 'expense', '#85C1E9', 'book-open', 1),
('その他支出', 'expense', '#D5DBDB', 'more-horizontal', 1);

-- 収入カテゴリ  
INSERT INTO categories (name, type, color, icon, is_active) VALUES
('給与', 'income', '#58D68D', 'briefcase', 1),
('賞与', 'income', '#52C41A', 'award', 1),
('副業', 'income', '#1890FF', 'laptop', 1),
('投資収益', 'income', '#722ED1', 'trending-up', 1),
('その他収入', 'income', '#13C2C2', 'plus-circle', 1);

-- サンプルトランザクション（過去1ヶ月分）
INSERT INTO transactions (amount, type, category_id, description, transaction_date, payment_method) VALUES
-- 収入
(250000, 'income', 12, '12月分給与', '2024-12-25', '銀行振込'),
-- 支出
(3500, 'expense', 1, 'スーパーでの買い物', '2024-12-20', '現金'),
(1200, 'expense', 1, 'コンビニ弁当', '2024-12-19', 'クレジットカード'),
(500, 'expense', 2, '電車賃', '2024-12-18', 'ICカード'),
(2800, 'expense', 3, '洗剤・シャンプー', '2024-12-17', 'クレジットカード'),
(8000, 'expense', 8, '映画・ディナー', '2024-12-16', 'クレジットカード'),
(15000, 'expense', 9, '冬服購入', '2024-12-15', 'クレジットカード'),
(2500, 'expense', 10, '技術書籍', '2024-12-14', 'クレジットカード');

-- サンプルサブスクリプション
INSERT INTO subscriptions (name, amount, category_id, frequency, next_payment_date, description, is_active, auto_generate) VALUES
('Netflix', 1980, 8, 'monthly', '2025-01-15', '動画配信サービス', 1, 1),
('Spotify', 980, 8, 'monthly', '2025-01-20', '音楽配信サービス', 1, 1),
('Adobe Creative Cloud', 6480, 10, 'monthly', '2025-01-25', 'デザインソフトサブスク', 1, 1),
('携帯電話料金', 4500, 5, 'monthly', '2025-01-10', 'スマートフォン料金', 1, 1),
('家賃', 80000, 7, 'monthly', '2025-01-01', 'マンション賃料', 1, 1);

-- サンプル予算設定
INSERT INTO budgets (category_id, amount, period, year, month) VALUES
(1, 40000, 'monthly', 2025, 1), -- 食費: 月4万円
(2, 10000, 'monthly', 2025, 1), -- 交通費: 月1万円
(8, 20000, 'monthly', 2025, 1), -- 娯楽費: 月2万円
(9, 30000, 'monthly', 2025, 1); -- 被服費: 月3万円