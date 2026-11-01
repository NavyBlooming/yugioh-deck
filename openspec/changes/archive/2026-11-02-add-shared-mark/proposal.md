# Proposal

## Why

紙のカードは持っている枚数に限りがあり、同じ1枚をいくつかのデッキで使い回すことがある。どの札がほかのデッキと共用なのかを、デッキの中で見分けられるようにする。

## What Changes

- カード詳細に「共用の印（この1枚）」の切り替えボタンを足す。長押しした1枚だけに付き、押してもシートは閉じない。デッキの外から開いたときは出さない
- 共用の札は、デッキ編集画面と初手のテストで、札の下端に「共用」の帯を出す
- 共用は未所持と同じく1枚ずつ持ち、未所持とは別に付けられる。抜く・移す・発売済みへの置き換えで、札と一緒に動く

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `deck-building`: 共用の印

## Impact

- `src/core/deck.js`、`src/core/hand.js`、`src/core/custom.js`、`src/core/storage.js`、`src/ui/deck.js`、`src/ui/tile.js`、`styles.css`
