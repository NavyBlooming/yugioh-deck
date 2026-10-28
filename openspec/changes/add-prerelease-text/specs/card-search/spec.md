## MODIFIED Requirements

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
