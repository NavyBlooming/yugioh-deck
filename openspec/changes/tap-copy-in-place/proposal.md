# Proposal

## Why

同じカードが3枚並んでいるとき、左の1枚をタップしても右端の1枚が暗くなる。未所持は枚数だけで持ち、表示のときに右側から暗くしているためで、押した札と変わる札が違って分かりにくい。

## What Changes

- 未所持を、同じカードの何枚目かの位置で持つ。押した札がその場で暗くなり、もう一度押すと戻る
- 「抜く」のときのタップと、長押しのメニューの「1枚抜く」「候補へ移す」「デッキへ移す」は、押した札に効く
- 位置を指定しない減らし方（買い物リストの「買った」）は、左の暗い札から明るくする
- 位置を持たない前の形のデータは、これまでどおり右側から暗いものとして読む

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-ownership`: 未所持の切り替え・表示・減らしたときの扱いを、札の位置で行う

## Impact

- `src/core/deck.js`（`tapCopy`・`removeOne`・`moveOne`・`tilesOf`）、`src/core/shopping.js` の `markBought`、`src/core/storage.js` の形の確かめ、`src/ui/deck.js`・`src/ui/tile.js`、テスト
- 保存するデータの各カードに、未所持の位置を表す `mask` が付く（無くても読める）
