# Spec Delta

## MODIFIED Requirements

### Requirement: カードを抜く・移す

The system SHALL let the user add one copy of a card to the same area, remove one copy of a card, and move one copy between the deck and the candidate area, from a menu opened by long-pressing the card. The deck editor SHALL also offer a tap mode switch with "未所持" and "抜く"; while "抜く" is selected, tapping a card SHALL remove one copy of it and show which card was removed. The switch SHALL start at "未所持" each time the deck is opened. Adding one copy and moving SHALL follow the same limits as adding from the search results.

#### Scenario: 1枚抜く

- **WHEN** メインに3枚ある「灰流うらら」を長押しして「1枚抜く」を選ぶ
- **THEN** メインの「灰流うらら」は2枚になる

#### Scenario: 1枚増やす

- **WHEN** メインに2枚ある「灰流うらら」を長押しして「1枚増やす」を選ぶ
- **THEN** メインの「灰流うらら」は3枚になる

#### Scenario: 上限なら増やさない

- **WHEN** メインに3枚ある「灰流うらら」を長押しして「1枚増やす」を選ぶ
- **THEN** 枚数は変わらず、3枚までである旨が表示される

#### Scenario: タップで抜く

- **WHEN** 「タップで」を「抜く」にして、メインに3枚ある「灰流うらら」を2回タップする
- **THEN** メインの「灰流うらら」は1枚になり、「灰流うららを1枚抜きました」と表示される

#### Scenario: 開き直すと未所持に戻る

- **WHEN** 「抜く」にしたまま一覧に戻り、もう一度デッキを開く
- **THEN** 「タップで」は「未所持」になっている

#### Scenario: 候補からデッキへ移す

- **WHEN** 候補カード欄のカードを長押しして「デッキへ移す」を選ぶ
- **THEN** そのカードは候補から1枚減り、カードの区分に応じてメインかエクストラに1枚増える
