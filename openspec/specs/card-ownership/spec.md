# card-ownership Specification

## Purpose
デッキに入れたカードのうち手元に無いものを1枚単位で記録し、マスターデュエルの未所持表示のように暗くして、買うべき枚数をひと目で分かるようにする。

## Requirements

### Requirement: 1枚ごとの未所持の切り替え

The system SHALL toggle a single copy between owned and missing when the user taps a card in the deck editor. Missing records SHALL be kept per deck and per area, independent of other decks.

#### Scenario: 1枚を未所持にする

- **WHEN** メインに3枚ある「灰流うらら」のうち、明るく表示された1枚をタップする
- **THEN** そのデッキのメインの「灰流うらら」は、3枚中1枚が未所持になる

#### Scenario: 未所持を戻す

- **WHEN** 暗く表示された「灰流うらら」をタップする
- **THEN** 未所持の枚数が1枚減る

#### Scenario: 他のデッキには影響しない

- **WHEN** デッキAの「灰流うらら」を未所持にする
- **THEN** デッキBの「灰流うらら」の表示は変わらない

### Requirement: 未所持の表示

The system SHALL display missing copies darkened, and SHALL place them after the owned copies of the same card.

#### Scenario: 暗く表示する

- **WHEN** 3枚中1枚が未所持のカードを表示する
- **THEN** 2枚は通常の明るさで、その後ろの1枚が暗く表示される

### Requirement: 枚数を減らしたときの未所持

When copies are removed or moved out of an area, the system SHALL remove missing copies first.

#### Scenario: 未所持の分から抜く

- **WHEN** 3枚中1枚が未所持のカードを1枚抜く
- **THEN** 残りは2枚で、未所持は0枚になる
