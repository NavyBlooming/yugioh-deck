# Proposal

## Why

誘発のカードに最初から印を付けるのは、デッキに初めて入れたときだけだった。前から作ってあるデッキの誘発のカードにも付けたい。

## What Changes

- 開いたときに、まだ済んでいなければ、各デッキに入っている誘発のカードに誘発の印を付ける
- 済んだことを保存データの `applied` に記録し、その後に外した印は付け直さない

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `deck-building`: 前からあるデッキへの誘発の印

## Impact

- `src/core/deck.js`、`src/core/storage.js`、`src/ui/app.js`
