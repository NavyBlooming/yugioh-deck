# card-search Specification

## Purpose
遊戯王に多い特殊な読みのカードも含めて、デッキに入れたいカードを名前の一部や読み仮名から素早く見つけられるようにする。

## Requirements

### Requirement: 名前と読み仮名での検索

The system SHALL return cards whose name or reading contains the query, ignoring differences between hiragana and katakana, full-width and half-width characters, letter case, spaces, and symbols.

#### Scenario: 読み仮名で探す

- **WHEN** 「はるう」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: カタカナで入力しても読み仮名に当たる

- **WHEN** 「ハルウララ」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: 名前の一部で探す

- **WHEN** 「うらら」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: 記号と全角半角の違いを無視する

- **WHEN** 「ABCドラゴンバスター」と入力する
- **THEN** 結果に「ABC－ドラゴン・バスター」が含まれる

### Requirement: 空の入力

The system SHALL show no results when the query is empty after normalization.

#### Scenario: 空白だけを入力

- **WHEN** 空白だけを入力する
- **THEN** 結果は表示されない

### Requirement: 効果テキストの用意

The system SHALL obtain the Japanese effect text of each card weekly from the ja-JP card database of mycard/ygopro-database, link it to the official card ID through the ygocdb card list, and publish it only encrypted with the same passphrase as the card artwork. The system SHALL also include the effect text of each prerelease card, read from its Yugioh Card Wiki page, under the prerelease card's number, and SHALL NOT put it in any unencrypted file. When the Wiki could not be read that week, the system SHALL keep the previous effect texts of the cards that are still prerelease cards. The system SHALL NOT rewrite the published file when the texts have not changed.

#### Scenario: 暗号化して置く

- **WHEN** 効果テキストを用意する
- **THEN** 公開されるファイルは合言葉が無いと読めず、合言葉で復号すると公式のカード ID ごとの効果テキストになる

#### Scenario: 発売前のカードの効果テキスト

- **WHEN** 遊戯王カードWiki から発売前のカードを取得してから、効果テキストを用意する
- **THEN** 復号した効果テキストに、発売前のカードの番号ごとの Wiki の効果テキストが含まれ、`data/prerelease.json` には効果テキストが含まれない

#### Scenario: Wiki を読めなかった週

- **WHEN** 遊戯王カードWiki の取得に失敗した週に、効果テキストを用意する
- **THEN** 今も発売前のカードである分は、前回の効果テキストが残る

#### Scenario: 変化が無ければ書き換えない

- **WHEN** 前回と同じ効果テキストで、もう一度用意する
- **THEN** 公開されるファイルは書き換えられない

### Requirement: 効果テキストでの検索

While the artwork passphrase is set, the system SHALL always also return cards whose effect text contains every space-separated word of the query, listed after the cards matched by name or reading. Without the passphrase search SHALL work by name and reading as before. The effect texts SHALL be downloaded the first time a search is made and kept on the device; until they are available, the system SHALL search by name and reading and SHALL update the results once they are.

#### Scenario: 効果テキストで探す

- **WHEN** 合言葉を入れた状態で「手札から捨てて 無効」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: 名前で当たるカードが先

- **WHEN** 合言葉を入れた状態で「ブラック・マジシャン」と入力する
- **THEN** 名前に「ブラック・マジシャン」を含むカードが、効果テキストだけに含むカードより先に並ぶ

#### Scenario: 合言葉が無いとき

- **WHEN** 合言葉を入れていない状態で「手札から捨てて 無効」と入力する
- **THEN** 効果テキストは取得されず、結果に「灰流うらら」は含まれない

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
