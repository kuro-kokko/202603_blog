---
title: 下書き記事（ビルドから除外される）
createDateTime: 2026-02-10
tags:
  - テスト
  - 下書き
draft: true
description: この記事はdraft=trueのためビルドから除外されるべきです。
---

この記事が出力ディレクトリに存在する場合、テスト失敗です。

- `out/posts/draft/index.html` が **存在しない**ことを確認する
- `search-index.json` に `posts/draft` の `id` が **含まれない**ことを確認する
- TagMap に `下書き` タグが **含まれない**ことを確認する
