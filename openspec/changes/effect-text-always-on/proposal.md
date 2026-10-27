# Proposal

## Why

効果テキストで探すたびに「効果」を押すのは手間で、切り替える必要も無い。

## What Changes

- 検索欄の「効果」の切り替えをやめ、合言葉を入れていれば常に効果テキストでも探す
- 効果テキストは、デッキ画面で初めて検索したときに取得する。取れるまでは名前と読みで探し、取れたら結果を出し直す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-search`: 効果テキストでの検索を常に行う

## Impact

- `src/ui/deck.js` の検索欄、`styles.css`
