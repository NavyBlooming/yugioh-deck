# Proposal

## Why

発売前のカードは、長押しで詳細を開いても効果テキストが無く、どんなカードか分からない。発売前の商品でデッキを考えるときに、別のサイトで調べる手間がかかる。

## What Changes

- 遊戯王カードWiki のカードのページから、種類と能力値の行より後を効果テキストとして取る
- 取った文は公開するファイルに入れず、ほかの効果テキストと同じく合言葉で暗号化して `art/texts.bin` に入れる
- Wiki の取得に失敗した週は、前回の発売前のカードの文を残す
- カード詳細で、合言葉があれば発売前のカードの効果テキストを出す。効果テキストでの検索にも使う

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-catalog`: 発売前のカードの取得で、効果テキストも読む（暗号化せずには公開しない）
- `card-search`: 効果テキストの用意に、発売前のカードの文を足す
- `deck-building`: カード詳細で、発売前のカードの効果テキストを出す

## Impact

- `tools/build_prerelease.py`、`tools/build_texts.py`、`.github/workflows/update.yml`（効果テキストより先に Wiki を読む）
- `src/ui/deck.js`（カード詳細の効果テキスト）
