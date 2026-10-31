# Proposal

## Why

組んだデッキで、初手に誘発や初動がどれくらい来るかを、引き直しながら眺めたり、確率で確かめたりしたい。

## What Changes

- デッキ編集画面の上に、初手5枚に誘発・初動が1枚以上来る確率を1行で出す
- 「初手を引く」で、メインデッキから先攻5枚・後攻6枚を引く画面を開く。引き直しができ、引いた手札の誘発・初動の枚数と、枚数ごとの確率の表を出す
- 確率は引き直しをしない場合の超幾何分布で、メインデッキだけを数える

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `deck-building`: 初手の確率と初手のテスト

## Impact

- `src/core/hand.js`（新規）、`src/ui/deck.js`、`styles.css`
