# Proposal

## Why

カード名や読みを覚えていないと、デッキに入れたいカードを探せない。「手札から捨てて」「デッキから特殊召喚」のように、効果の中身から探したい。

## What Changes

- 日本語の効果テキストを毎週取得し、カードの絵と同じ合言葉で暗号化して置く
- 合言葉を入れた人は、検索欄の「効果」を押すと効果テキストでも探せる。名前で当たるカードを先に、効果テキストで当たるカードを後に並べる
- 効果テキストでは、スペースで区切った語をすべて含むカードに絞り込む
- 効果テキストは、初めて使ったときに取得して端末に覚える

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-search`: 効果テキストでの検索を足す

## Impact

- 新しい `tools/build_texts.py` とテスト、`art/texts.bin`・`art/texts-meta.json`
- `src/core/search.js`・`src/core/art.js`、`src/ui/art.js`・`src/ui/deck.js`、`styles.css`
- `.github/workflows/update.yml` に取得の手順を足す。README の出典の表に mycard/ygopro-database を足す
