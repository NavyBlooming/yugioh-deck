# Proposal

## Why

カード詳細には名前・レベル・カードの種類しか出ず、属性・種族・攻撃力・守備力などを確かめるには別のサイトを開く必要がある。取得元の ygocdb と YGOPRODeck はこれらを持っているが、カードデータを作るときに捨てている。

## What Changes

- カードデータに、OCG の発売日（YGOPRODeck）と、モンスターの属性・種族・種類・攻撃力・守備力・ペンデュラムスケール（ygocdb の番号のまま）を足す。リンクモンスターは守備力の欄にリンクマーカーが入る
- カード詳細に「炎属性／アンデット族／チューナー」「ATK 0 / DEF 1800」、リンクマーカーの図、スケール、OCG の発売日を出す

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `deck-building`: カード詳細に属性・種族・攻守などを出す

## Impact

- `tools/build_cards.py`（カードデータの形を FORMAT 3 にする）、`data/cards.json`
- `src/core/cards.js`（読み取りと名前への読み替え）、`src/ui/deck.js`（カード詳細）、`styles.css`
