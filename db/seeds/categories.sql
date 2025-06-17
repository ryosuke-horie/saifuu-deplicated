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