---
title: 最小限フィールドの記事
createDateTime: 2026-01-20
---

タグなし、descriptionなし、updatedDateTimeなし、slugなしの記事です。
各フィールドのデフォルト値が正しく補完されるか確認します。

- `tags` → 空配列 `[]` になるべき
- `draft` → `false` になるべき
- `updatedDateTime` → `createDateTime` と同じ 2026-01-20 になるべき
- `description` → この本文の冒頭140文字が自動生成されるべき
- `slug` → ファイルパスから `posts/minimal-frontmatter` が生成されるべき
