## ADDED Requirements

### Requirement: 誘発・初動の印

The system SHALL let the user mark a card in a deck as a hand trap ("誘発") and/or a starter ("初動") from the card detail sheet, without closing the sheet. The marks SHALL belong to the deck and the card, so all copies of the card in that deck share them and other decks are not affected. Marked cards in the deck editor SHALL show "誘" and "初" at the top right. The marks SHALL be saved with the deck and included in cloud sync and export.

#### Scenario: 誘発の印を付ける

- **WHEN** メインに2枚ある「灰流うらら」を長押しし、「誘発の印」を押して閉じる
- **THEN** シートは押しても閉じず、デッキの「灰流うらら」2枚の右上に「誘」が出る

#### Scenario: 印はデッキごと

- **WHEN** デッキAの「灰流うらら」に誘発の印を付ける
- **THEN** デッキBの「灰流うらら」には印が付かない

#### Scenario: 印を外す

- **WHEN** 印の付いたカードを長押しし、押した状態の「初動の印」をもう一度押す
- **THEN** そのカードの右上の「初」が消える
