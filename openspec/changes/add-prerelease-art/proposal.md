# Proposal

## Why

発売前のカードは絵が無く、枠の色と名前だけで並ぶ。発売前の商品でデッキを考えるとき、ほかのカードと見た目がそろわず、どのカードか一目で分かりにくい。

## What Changes

- 発売前のカードの型番（`IMPH-JP038` など）を遊戯王カードWiki から取り、`data/prerelease.json` に残す
- YGOPRODeck の、発売日がこれからの OCG のカードのカード全体の画像から絵の枠を切り出し、今までの絵と同じく合言葉で暗号化して `art/` に置く
- 毎週の更新で、新しく載ったカードの絵を足し、発売前のカードでなくなったカードの絵を消す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-artwork`: 発売前のカードにも絵を出す

## Impact

- `tools/build_prerelease.py`（型番）、`tools/build_art.py`（発売前のカードの絵）、`.github/workflows/update.yml`
- 画面は変えない（絵は番号ごとに取るので、発売前のカードの番号でもそのまま出る）
