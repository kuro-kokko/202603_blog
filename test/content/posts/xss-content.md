---
title: XSS攻撃パターンのサニタイズテスト
createDateTime: 2026-03-05
tags:
  - テスト
  - セキュリティ
---

このファイルにはXSS攻撃パターンが含まれます。
rehype-sanitize によってすべて無害化されることを確認します。

## scriptタグの直接埋め込み

<script>alert('xss-script-tag')</script>

上記のscriptタグは出力HTMLに含まれてはいけません。

## イベントハンドラ属性

<img src="valid-image.png" onerror="alert('xss-onerror')" alt="テスト画像">

`onerror` 属性は除去されるべきです（`src` と `alt` は残る）。

## javascript: スキーム

<a href="javascript:alert('xss-href')">クリックしないでください</a>

`javascript:` スキームのhref属性は除去またはリンク自体が無効化されるべきです。
