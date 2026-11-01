# Proposal

## Why

画面は復号した絵を端末に保存し、次からはそれを使う。仮の絵を正式な絵に差し替えても、一度その絵を表示した端末では古い絵が出続ける。

## What Changes

- 絵を差し替えたカードに版の番号を付け、art/versions.json に書く
- 画面は版の番号ごとに絵を保存し、番号が変わったら取り直す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-artwork`: 差し替えた絵の取り直し

## Impact

- `tools/build_art.py`、`art/versions.json`、`src/ui/art.js`
