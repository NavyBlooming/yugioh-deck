# Proposal

## Why

検索結果は60枚までで、並びも読み順のため、デッキに入れたときの見え方と違い、当たったカードの一部しか見られない。

## What Changes

- 検索結果は件数で切らずに全部出す。最初に60枚を出し、結果の下の端までスクロールしたら次の60枚を足す
- 検索結果のカードの絵は、画面に見えたものだけ取得する
- 検索結果の並びをデッキと同じ並び（メインの群 → EXの群 → モンスターはレベル、魔法・罠は種類 → 読み）にする。効果テキストだけで当たるカードは、名前で当たるカードの後ろに同じ並びで出す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-search`: 結果の並びと件数を変える

## Impact

- `src/core/cards.js`（`compareCards`）、`src/core/search.js`、`src/ui/deck.js`・`src/ui/tile.js`、テスト
