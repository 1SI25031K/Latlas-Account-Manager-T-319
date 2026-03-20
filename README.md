# Latlas アカウント管理

Latlas Teacher Dashboard と同じ Supabase プロジェクトに接続し、**ログイン情報（メール・パスワード）** と **`profiles` / `profile_affiliations`** を編集する Web アプリです。見た目は Latlas のダッシュボードトークン（`dashboard-theme-root` / `data-theme` / CSS 変数）に揃えています。ホームでは **Gemini** 経由の「Latlas AI for Account Center」（BETA）チャットを利用できます（API キーはサーバー環境変数のみ）。

## 技術スタック

- Next.js（App Router）+ TypeScript + Tailwind CSS v4
- Supabase（`@supabase/ssr`）— Auth + Postgres + Storage（`avatars`）
- アイコン: `iconoir-react`

## セットアップ

```bash
cp .env.example .env.local
# .env.local に NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY を記入
npm install
npm run dev
```

- 未ログイン: `/login`（`/signup` で新規登録 ※プロジェクトの Auth 設定に依存）
- ログイン後: `/account`

## 環境変数

| 変数 | 必須 | 説明 |
|------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✓ | Latlas と同一 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✓ | Latlas と同一（anon） |
| `NEXT_PUBLIC_LATLAS_DASHBOARD_URL` | 任意 | 「Latlas ダッシュボードに戻る」リンク先 |
| `GEMINI_API_KEY` | 任意 | ホームの AI チャット用（未設定だとチャット API は 503） |
| `GEMINI_MODEL` | 任意 | 既定: `gemini-2.0-flash`。チューニング済みモデル ID に変更可 |

**429 / quota のとき:** Google 側の無料枠・プロジェクト設定の問題です。[Google AI / Cloud のクォータと料金](https://ai.google.dev/gemini-api/docs/rate-limits)を確認し、請求の有効化や別モデル（例: プロジェクトで利用可能な Flash 系）への `GEMINI_MODEL` 変更を検討してください。チャット画面には日本語で短い案内が表示されます。

## テーマ

- **OS の「外観モード」（ライト / ダーク）のみ**に追従します。`prefers-color-scheme` の変更にもインラインスクリプトで追従します。
- 旧来の `localStorage` キー `dashboard-theme` は**参照しません**（手動トグルはありません）。
- `html` に `dashboard-theme-root` と `data-theme` を付与（初回はインラインスクリプトで FOUC 抑制）

## よくある質問チップ（ホーム）

- 文言は [`src/lib/account-faq.ts`](src/lib/account-faq.ts) の `ACCOUNT_FAQ_ITEMS` に追加します。空のときはチップは表示されません。表示時はクライアントでランダム並び替え（最大 3 件）され、クリックでチャットに送信されます。

## DB 想定

- **`profiles`**: `id` = `auth.users.id`。列が無い項目はフォームから除外して更新します（既存行のキーに合わせる）。
- **`profile_affiliations`**: `user_id`, `sort_order`, `affiliation`, `title_at_affiliation`（読み込み失敗時は所属ブロックに案内のみ表示）。
- **Storage**: バケット名 `avatars`（RLS・公開 URL は Latlas と同様に設定してください）。

## セキュリティ

- パスワードやトークンをログに出しません。
- 外部リンクは `rel="noopener noreferrer"` です。

## ビルド

```bash
npm run build
npm start
```
