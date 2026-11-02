# Proposal

## Why

買い物リストのデッキが増えると、目当てのデッキまでのスクロールが長く、いま見ている行がどのデッキのものか分からなくなる。

## What Changes

- デッキごとの帯（デッキ名・合計・価格未入力）を押すと、そのデッキの行を畳む・開く
- 帯は画面の上端に着いたら、そのデッキを見ている間は上に留まる
- 畳んだ状態は、アプリを開いている間は残す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `shopping-list`: デッキごとに畳む・帯を上に留める

## Impact

- `src/ui/shop.js`、`styles.css`
