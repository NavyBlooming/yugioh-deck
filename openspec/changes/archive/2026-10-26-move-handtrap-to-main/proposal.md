# Proposal

## Why

汎用誘発の追加ボタンは、メインデッキに入れたいという意図だった。今は候補カード欄に入れ、ボタンも候補カード欄の見出しにあるので、入れた後にデッキへ移す手間がかかる。

## What Changes

- 「汎用誘発を追加」ボタンを、検索欄の下の追加先（デッキ / 候補）のボタンの並びの右端に移す
- 入れる先を候補カード欄からメインデッキに変える。メインデッキが60枚になったら止める

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `deck-building`: 汎用誘発をまとめて入れる先とボタンの位置を変える

## Impact

- `src/core/deck.js` の `addHandTraps`、`src/ui/deck.js` の検索パネル、テスト
