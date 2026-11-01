# Proposal

## Why

発売前のカードの絵と、絵だけの画像が無いカードの絵は、カード全体の画像から切り出して作っている。一度絵ができたカードは取り直さないため、発売後に正式な絵だけの画像が出ても差し替わらない。取得元に絵がまだ無い時期に取り込んだカードは、カードの裏面の画像のまま残っている。また、新しいパックはたいてい土曜に発売されるので、毎週の更新はその翌日に回したい。

## What Changes

- 正式な絵だけの画像ではない絵（カード全体から切り出した絵・発売前から引き継いだ絵）を、仮の絵として art/provisional.json に記録する
- 毎週の更新で、仮の絵のカードの絵だけの画像を取得元から取り直し、取れたら差し替えて記録から外す
- 取得元が返すカードの裏面の画像は、絵が無いとみなす
- 毎週の更新を、日本時間の日曜 12:00 に回す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-artwork`: 仮の絵の取り直し
- `card-catalog`: 定期更新の曜日

## Impact

- `tools/build_art.py`、`art/provisional.json`、`.github/workflows/update.yml`
