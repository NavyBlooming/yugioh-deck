# Proposal

## Why

ygo-decklab など、ほかのデッキ管理サービスとデッキをやり取りしたい。これらのサービスは、カードのパスワードを並べた YDKE（`ydke://` で始まる文字列）でデッキを読み書きする。

## What Changes

- 毎週の更新で、カードの番号とパスワードの対応表 `data/passcodes.json` を作る
- ツールタブの切り替えを「買い物」「ユーティリティ」「その他」の3つにする。「ダイス」は「ユーティリティ」に名前を変える
- 「その他」に、YDKE を貼って新しいデッキとして読み込む欄と、デッキを YDKE にしてコピーする欄を置く
- YDKE のサイドデッキは、このアプリの候補と対応させる

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `tools`: タブの構成と YDKE の読み込み・書き出し
- `card-catalog`: パスワードの対応表

## Impact

- `tools/build_cards.py`、`data/passcodes.json`、新しい `src/core/ydke.js` と `src/ui/other.js`、`src/ui/shop.js`、`src/ui/dice.js`、`src/ui/app.js`、`styles.css`
