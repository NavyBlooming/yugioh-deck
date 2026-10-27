# Spec Delta

## MODIFIED Requirements

### Requirement: 1枚ごとの未所持の切り替え

The system SHALL toggle a single copy between owned and missing when the user taps a card in the deck editor while the tap mode is "未所持". Missing records SHALL be kept per deck and per area, independent of other decks.

#### Scenario: 1枚を未所持にする

- **WHEN** 「タップで」が「未所持」のときに、メインに3枚ある「灰流うらら」のうち、明るく表示された1枚をタップする
- **THEN** そのデッキのメインの「灰流うらら」は、3枚中1枚が未所持になる

#### Scenario: 未所持を戻す

- **WHEN** 暗く表示された「灰流うらら」をタップする
- **THEN** 未所持の枚数が1枚減る

#### Scenario: 他のデッキには影響しない

- **WHEN** デッキAの「灰流うらら」を未所持にする
- **THEN** デッキBの「灰流うらら」の表示は変わらない
