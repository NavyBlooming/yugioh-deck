# Proposal

## Why

対戦の前に先攻・後攻を決めるため、手元のアプリでコイントスとダイスを振れるようにする。あわせて、買い物タブを、買い物リストやダイスなどをまとめるタブにする。

## What Changes

- 下のタブの「買い物」を「ツール」にし、中に「買い物」と「ダイス」の切り替えを置く
- 「ダイス」では、ダイスの数を1〜3個から選んで振れる。2個以上なら合計も出す
- 同じ画面でコイントスもでき、表か裏を出す
- 振った結果は直前の3回分を残す

## Capabilities

### New Capabilities

- `tools`: ツールタブとダイス・コイントス

### Modified Capabilities

（なし）

## Impact

- `index.html`、`src/ui/app.js`、`src/ui/shop.js`、新しい `src/ui/dice.js` と `src/core/dice.js`、`styles.css`
