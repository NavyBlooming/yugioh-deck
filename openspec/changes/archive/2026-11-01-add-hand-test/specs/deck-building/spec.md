## ADDED Requirements

### Requirement: 初手の確率

The deck editor SHALL show, for the main deck, the probability that an opening hand of 5 cards contains at least one card marked "誘発" and at least one card marked "初動", with the number of marked copies, calculated without mulligans. Cards in the extra deck and the candidate area SHALL NOT be counted.

#### Scenario: 確率を見る

- **WHEN** メインデッキ9枚のうち「灰流うらら」2枚に誘発の印を付ける
- **THEN** デッキ編集画面に「初手5枚: 誘発 1枚以上 83.3%（2枚）／初動 印なし」と出る

#### Scenario: メインが少ない

- **WHEN** メインデッキが5枚より少ない
- **THEN** 「メインが5枚以上になると、初手を引けます」と出る

### Requirement: 初手のテスト

The deck editor SHALL offer a "初手を引く" button that opens a view drawing 5 cards (going first) or 6 cards (going second) at random from the main deck. The view SHALL let the user draw again, show how many "誘発" and "初動" cards the drawn hand contains, and show a table of the probabilities of drawing 0, 1, 2, 3 or more, and 1 or more marked cards for the selected hand size.

#### Scenario: 先攻と後攻

- **WHEN** 「初手を引く」を押し、「後攻 6枚」に切り替える
- **THEN** 引いたカードが5枚から6枚になり、表の確率も6枚引いたときの値になる

#### Scenario: 引き直す

- **WHEN** 「引き直す」を押す
- **THEN** メインデッキから引き直したカードが並び、手札の誘発・初動の枚数も引き直した手札で数え直される
