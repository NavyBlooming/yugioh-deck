# Spec Delta

## MODIFIED Requirements

### Requirement: 1枚ごとの未所持の切り替え

The system SHALL toggle the tapped copy itself between owned and missing when the user taps a card in the deck editor while the tap mode is "未所持". Missing records SHALL be kept per copy position, per deck and per area, independent of other decks.

#### Scenario: 1枚を未所持にする

- **WHEN** 「タップで」が「未所持」のときに、メインに3枚並んだ「灰流うらら」の左端の1枚をタップする
- **THEN** 左端の1枚だけが暗くなり、そのデッキのメインの「灰流うらら」は3枚中1枚が未所持になる

#### Scenario: 未所持を戻す

- **WHEN** 暗く表示された「灰流うらら」をタップする
- **THEN** その1枚が明るくなり、未所持の枚数が1枚減る

#### Scenario: 他のデッキには影響しない

- **WHEN** デッキAの「灰流うらら」を未所持にする
- **THEN** デッキBの「灰流うらら」の表示は変わらない

### Requirement: 未所持の表示

The system SHALL display missing copies darkened at the positions where they were marked. Data saved before positions were kept SHALL be displayed with the missing copies after the owned copies.

#### Scenario: 暗く表示する

- **WHEN** 3枚中、真ん中の1枚を未所持にしたカードを表示する
- **THEN** 左と右は通常の明るさで、真ん中の1枚が暗く表示される

#### Scenario: 位置を持たない前のデータ

- **WHEN** 位置の記録が無く、3枚中1枚が未所持のデータを読み込む
- **THEN** 2枚は通常の明るさで、その後ろの1枚が暗く表示される

### Requirement: 枚数を減らしたときの未所持

When the user removes or moves a specific copy, the system SHALL remove that copy and keep the positions of the others. When no copy is specified, such as marking a card as bought, the system SHALL act on the leftmost missing copy for buying, and on missing copies first for removing.

#### Scenario: 未所持の分から抜く

- **WHEN** 「タップで」が「抜く」のときに、右端が暗い3枚のカードの右端をタップする
- **THEN** 残りは2枚で、未所持は0枚になる

#### Scenario: 押した札を抜く

- **WHEN** 「タップで」が「抜く」のときに、左端が暗い3枚の「灰流うらら」の真ん中をタップする
- **THEN** 残りは2枚で、左端が暗いまま残る

#### Scenario: 買った

- **WHEN** 左端と右端が暗い3枚のカードを、買い物リストで「買った」にする
- **THEN** 左端が明るくなり、右端は暗いまま残る
