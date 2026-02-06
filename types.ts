
export interface Transaction {
  id: string;
  date: string;
  amount: number;
  category: string;
  userId: string;
  userName: string;
  description: string;
  storeName?: string;
  receiptImage?: string; // base64
  createdAt: number;
  isSynced?: boolean; // Cloudflare D1との同期フラグ
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface OCRResult {
  amount: number;
  storeName: string;
  date: string;
  category: string;
  confidence: number;
}

export const CATEGORIES = [
  '食費', '日用品', '交通費', '交際費', '住居・光熱費', 'エンタメ', '美容・衣服', 'その他'
];

export const INITIAL_USERS: User[] = [
  { id: 'user-1', name: 'パパ', color: '#3b82f6' },
  { id: 'user-2', name: 'ママ', color: '#ec4899' },
  { id: 'user-3', name: '共通', color: '#10b981' },
];

export interface D1Status {
  connected: boolean;
  lastSync?: number;
}
