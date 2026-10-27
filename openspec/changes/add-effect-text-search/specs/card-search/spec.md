# Spec Delta

## ADDED Requirements

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
