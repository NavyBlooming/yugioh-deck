# Proposal

## Why

発売済みのカードでも、YGOPRODeck に絵の部分だけの画像が無いものがあり、絵が出ない（聖王女ローズパメラなど8枚）。カード全体の画像はあるので、そこから絵を作れる。

## What Changes

- 絵の部分だけの画像が無いカードは、発売前のカードと同じく、カード全体の画像から絵の枠を切り出して絵にする
- ペンデュラムは絵の枠の形が違うので、今までどおり絵を付けない

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-artwork`: 新カードの絵の追加で、カード全体の画像からも作る

## Impact

- `tools/build_art.py`
