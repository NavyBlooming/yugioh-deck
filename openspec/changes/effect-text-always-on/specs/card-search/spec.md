# Spec Delta

## MODIFIED Requirements

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
