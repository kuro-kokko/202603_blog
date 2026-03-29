# Blog

TypeScript + Preact 製の静的サイトジェネレーター。Markdown ファイルからブログを生成します。

## 機能

- Markdown → HTML 変換（unified / remark / rehype）
- フロントマター対応（gray-matter）
- タグ管理・タグ別一覧ページ
- 目次（ToC）自動生成
- バックリンク（`[[wiki-link]]` 形式）
- 月次カレンダー（任意）
- クライアントサイド全文検索（MiniSearch）
- プロフィールカード
- ダーク/ライトモード対応 CSS
- XSS 対策（rehype-sanitize）

## セットアップ

```bash
npm install
```

## ビルド

```bash
# 静的サイトを生成 → out/
npm run build

# 検索用 JS をバンドル → assets/search.client.js
npm run build:client
```

`out/` ディレクトリの内容を任意のホスティングサービス（GitHub Pages、Vercelなど）にデプロイして公開できます。

## 記事の書き方

`content/` 配下に `.md` ファイルを作成します。

```markdown
---
title: 記事タイトル
tags:
  - タグ1
  - タグ2
createDateTime: 2026-03-25
updatedDateTime: 2026-03-26   # 省略時は createDateTime と同値
draft: false                   # true にするとビルドから除外
description: 記事の概要       # 省略時は本文冒頭 140 文字を使用
slug: my-custom-slug           # 省略時はファイル名から自動生成
---

## 見出し

本文を書きます。

他の記事へのリンクは [[posts/other-article]] 形式で書けます。
```

### フロントマター仕様

| フィールド | 必須 | 説明 |
|-----------|------|------|
| `title` | ✅ | 記事タイトル |
| `createDateTime` | ✅ | 投稿日（`YYYY-MM-DD`） |
| `updatedDateTime` | — | 更新日。省略時は投稿日と同値 |
| `tags` | — | タグのリスト。省略時は空 |
| `draft` | — | `true` でビルド除外。省略時は `false` |
| `description` | — | 概要。省略時は本文冒頭 140 文字 |
| `slug` | — | URL スラッグ。省略時はファイル名 |

## URL 構造

| ページ | URL |
|--------|-----|
| トップ | `/` |
| 記事 | `/posts/slug/` |
| タグ一覧 | `/tags/` |
| タグ別 | `/tags/タグ名/` |
| 検索 | `/search/` |

## ドキュメント

[要件定義](docs/要件定義.md)
[基本設計](docs/基本設計.md)
[テスト項目一覧](test/test.md)

## 設定

`config.ts` でサイト全体の設定を変更します。

```typescript
export const config: SiteConfig = {
  title: 'My Blog',
  baseUrl: 'https://example.com',
  description: 'サイトの説明',
  language: 'ja',

  profile: {
    enabled: true,
    name: 'Your Name',
    bio: '自己紹介文',
    avatar: '/assets/avatar.png',  // 省略するとイニシャルのプレースホルダー
    links: [
      { label: 'GitHub', url: 'https://github.com/yourname' },
    ],
  },

  calendar: {
    enabled: true,

  build: {
    outDir: 'out',
    excludeDrafts: true,
    excludeUnderscored: true,  // _ で始まるファイルを除外
  },

  backlinks: {
    position: 'below',   // 'below'　| 'sidebar'
  },
}
```
