# Spec Delta

## REMOVED Requirements

### Requirement: 結果の並び

**Reason**: 検索結果もデッキと同じ並びにするため、前方一致を先に出す並びをやめる。

**Migration**: 「結果はデッキと同じ並び」に置き換える。

## ADDED Requirements

### Requirement: 結果はデッキと同じ並び

The system SHALL order search results the same way as the deck: main deck groups (normal, effect, spell, trap) then extra deck groups (fusion, synchro, Xyz, link); within a group monsters by level, rank, or link rating from lowest, and spells and traps by type; then by reading. Cards matched only by effect text SHALL follow the cards matched by name or reading, ordered the same way.

#### Scenario: 効果モンスターが魔法より先

- **WHEN** 「うらら」と入力し、効果モンスター「灰流うらら」と魔法「うららの舞」が当たる
- **THEN** 「灰流うらら」が「うららの舞」より先に並ぶ

#### Scenario: レベルの低い順

- **WHEN** レベル4とレベル2の効果モンスターが当たる
- **THEN** レベル2のカードが先に並ぶ

### Requirement: 結果は全部出す

The system SHALL show all matching cards without a count limit. It SHALL first show 60 cards and add the next 60 each time the end of the results is scrolled into view. Artwork of result cards SHALL be downloaded only when the card becomes visible.

#### Scenario: スクロールで続きが出る

- **WHEN** 100枚以上当たる語を入力し、結果の下の端までスクロールする
- **THEN** 61枚目以降のカードが足される

#### Scenario: 見えていないカードの絵は取らない

- **WHEN** 合言葉を入れた状態で、何百枚も当たる語を入力する
- **THEN** 絵を取得するのは、画面に見えたカードの分だけになる
