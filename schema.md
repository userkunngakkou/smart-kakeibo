-- Cloudflare D1 支出データテーブル作成コマンド

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,         -- YYYY-MM-DD
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  userId TEXT NOT NULL,
  userName TEXT NOT NULL,
  description TEXT,
  storeName TEXT,
  receiptImage TEXT,          -- Base64 encoded string
  createdAt INTEGER NOT NULL  -- Unix timestamp
);

-- 検索・集計用インデックス
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_userId ON transactions(userId);