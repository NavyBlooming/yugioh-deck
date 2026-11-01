## ADDED Requirements

### Requirement: 共用の印

The system SHALL let the user mark a single copy of a card in a deck as shared with other decks ("共用") from the card detail sheet opened by long-pressing that copy, without closing the sheet. The mark SHALL belong to that copy only, independent of the "未所持" mark. A shared copy SHALL show a "共用" band along the bottom edge of the card in the deck editor and in the opening-hand test. The mark SHALL move with the copy when cards are removed, moved, or replaced by a released card, and SHALL be saved with the deck.

#### Scenario: 1枚だけ共用にする

- **WHEN** メインに3枚ある「無限泡影」の2枚目を長押しし、「共用の印（この1枚）」を押して閉じる
- **THEN** シートは押しても閉じず、2枚目の札の下端にだけ「共用」の帯が出る

#### Scenario: 未所持と両方付ける

- **WHEN** 共用の札をタップして未所持にする
- **THEN** 札は暗くなり、「共用」の帯も残る

#### Scenario: 共用の札を抜く

- **WHEN** 共用の札を長押しして「−1 抜く」を押す
- **THEN** その札が抜け、残りの札には帯が出ない

#### Scenario: 初手のテスト

- **WHEN** 共用の札を含むデッキで初手を引き、その札が来る
- **THEN** 手札のその札にも「共用」の帯が出る
