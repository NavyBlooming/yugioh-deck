# Proposal

## Why

初手に誘発や初動がどれくらい来るかを数えるには、デッキのどのカードが誘発・初動かを決めておく必要がある。カードの役割はデッキによって変わるので、利用者がデッキごとに印を付けられるようにする。

## What Changes

- カード詳細に「誘発の印」「初動の印」の切り替えボタンを足す。押してもシートは閉じない
- デッキ編集画面で、印の付いたカードの右上に「誘」「初」を出す
- 印はデッキごと・カードごとに持ち、端末の保存・クラウドの同期・書き出しに含める。発売前のカードが発売済みに置き換わるときは印も移す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `deck-building`: 誘発・初動の印

## Impact

- `src/core/deck.js`、`src/core/custom.js`、`src/core/storage.js`、`src/ui/deck.js`、`styles.css`
