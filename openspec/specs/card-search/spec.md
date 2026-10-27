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

### Requirement: 結果の並び

The system SHALL list cards whose name or reading starts with the query before other matches, and SHALL order cards within each tier by reading.

#### Scenario: 前方一致を先に出す

- **WHEN** 「うらら」と入力し、名前が「うらら」で始まるカードと、途中に含むカードの両方がある
- **THEN** 「うらら」で始まるカードが先に並ぶ

### Requirement: 空の入力

The system SHALL show no results when the query is empty after normalization.

#### Scenario: 空白だけを入力

- **WHEN** 空白だけを入力する
- **THEN** 結果は表示されない

### Requirement: 効果テキストの用意

The system SHALL obtain the Japanese effect text of each card weekly from the ja-JP card database of mycard/ygopro-database, link it to the official card ID through the ygocdb card list, and publish it only encrypted with the same passphrase as the card artwork. The system SHALL NOT rewrite the published file when the texts have not changed.

#### Scenario: 暗号化して置く

- **WHEN** 効果テキストを用意する
- **THEN** 公開されるファイルは合言葉が無いと読めず、合言葉で復号すると公式のカード ID ごとの効果テキストになる

#### Scenario: 変化が無ければ書き換えない

- **WHEN** 前回と同じ効果テキストで、もう一度用意する
- **THEN** 公開されるファイルは書き換えられない

### Requirement: 効果テキストでの検索

While the artwork passphrase is set, the system SHALL offer an "効果" switch in the search box. When it is on, the system SHALL also return cards whose effect text contains every space-separated word of the query, listed after the cards matched by name or reading. Without the passphrase the switch SHALL NOT be shown and search SHALL work by name and reading as before. The effect texts SHALL be downloaded the first time the switch is turned on and kept on the device.

#### Scenario: 効果テキストで探す

- **WHEN** 合言葉を入れた状態で「効果」をオンにして、「手札から捨てて 無効」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: 名前で当たるカードが先

- **WHEN** 「効果」をオンにして「うらら」と入力する
- **THEN** 名前に「うらら」を含むカードが、効果テキストだけに「うらら」を含むカードより先に並ぶ

#### Scenario: 合言葉が無いとき

- **WHEN** 合言葉を入れていない状態で検索欄を見る
- **THEN** 「効果」の切り替えは表示されない
