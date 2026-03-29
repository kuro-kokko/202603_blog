---
title: バックリンクのソース記事
createDateTime: 2026-03-01
tags:
  - テスト
  - バックリンク
---

この記事は [[posts/backlink-target]] にリンクしています。

エイリアス付きのwikiリンクも確認します：[[posts/backlink-target|ターゲット記事]]。

## 確認事項

- `page.links` に `posts/backlink-target` が含まれるべき
- `[[posts/backlink-target]]` が `<a href="/posts/backlink-target/">posts/backlink-target</a>` に変換されるべき
- `[[posts/backlink-target|ターゲット記事]]` が `<a href="/posts/backlink-target/">ターゲット記事</a>` に変換されるべき
- `posts/backlink-target` ページの `backlinks` にこの記事が含まれるべき
