# スマート家計簿 (Smart Kakeibo) 総合マニュアル

このファイルには、アプリの使い方から、AIを使った開発方法、Cloudflare D1のセットアップまで、必要なすべての情報がまとめられています。

---

## 1. 🌟 ユーザー向けガイド (User Manual)
家族や友人と支出を共有し、AIでレシートを管理するデジタル家計簿です。

### 基本操作
- **レシートスキャン**: 右下の「＋」ボタンからカメラを選択。Gemini AIが金額・店名を自動抽出します。
- **共有管理**: パパ・ママ・共通など、誰の支出かをボタン一つで切り替えて記録できます。
- **同期**: クラウド（D1）と自動同期されます。オフライン時は一時的にローカルに保存され、オンライン復帰時に同期可能です。

---

## 2. 🤖 AI開発・拡張ガイド (For AI Development)
このプロジェクトを AI（Cursor, Windsurf等）で拡張する際に、AIに読み込ませるコンテキスト情報です。

### 設計思想
- **Service分離**: `services/geminiService.ts`（AI処理）と `services/dbService.ts`（D1通信）にロジックを分離。UI（`App.tsx`）からデータ操作を隠蔽しています。
- **Gemini SDK**: 最新の `@google/genai` を使用。`responseSchema` による構造化出力を活用しています。
- **D1関係**: `dbService.ts` が心臓部です。現在は Worker 経由の通信をシミュレート・実行しています。

### AIへのプロンプト例
- 「`schema.md` のテーブル定義に基づいて、月間予算を設定する機能を `dbService.ts` に追加して」
- 「ダッシュボードに、今月のユーザー別支出割合を示す円グラフを追加して」

---

## 3. ☁️ Cloudflare D1 セットアップ
D1 データベースと連携させるための技術的な手順です。

1. **DB作成**: `npx wrangler d1 create smart-kakeibo-db`
2. **テーブル作成**: `schema.md` に記載されている SQL コマンドを D1 に対して実行してください。
   ```bash
   npx wrangler d1 execute smart-kakeibo-db --file=./schema.md
   ```
3. **接続設定**: `services/dbService.ts` 内の `WORKER_ENDPOINT` にデプロイした Worker の URL を設定します。

---

## 📊 データベース仕様
具体的なテーブル定義（SQL）は [schema.md](./schema.md) を参照してください。

---
Produced by World-Class Frontend Engineer.