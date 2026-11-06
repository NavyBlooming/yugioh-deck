# solo-play Specification

## Purpose
組んだデッキの動きを確かめるため、デッキの中身をそのまま使って、一人でカードを動かせる盤面を提供する。ルールの自動処理はしない。

## Requirements

### Requirement: 一人回しを始める

The system SHALL open a solo-play board for a deck from a "一人回し" button on the deck editor and from a "一人回し" page in the tools tab. The user SHALL choose going first (5 cards) or second (6 cards); the main deck SHALL be shuffled and that many cards drawn. Candidate (side) cards SHALL NOT be used. The board SHALL NOT be stored in the saved data or the cloud.

#### Scenario: 先攻で始める

- **WHEN** 40枚のデッキで「一人回し」を押し、「先攻（5枚）」を選ぶ
- **THEN** 手札が5枚、デッキが35枚、EXデッキにそのデッキの EX のカードが入った盤面が出る

### Requirement: 盤面

The board SHALL have five main monster zones, two extra monster zones, five spell/trap zones, a field zone, the graveyard, banishment, the deck, the extra deck and the hand, and SHALL fit in one screen without scrolling on phones and PCs. The first row SHALL be the field zone, five monster zones and the graveyard; the second row SHALL be the extra deck, five spell/trap zones and the deck; the extra monster zones SHALL be above the second and fourth monster zones and banishment above the graveyard.

#### Scenario: スマホの幅

- **WHEN** 幅390px・高さ660pxの画面で盤面を開く
- **THEN** 盤面・手札・操作のボタンがスクロールなしで全部見える

### Requirement: カードを動かす

The user SHALL move a card by dragging it to a zone. Tapping a card SHALL show its details; a long press (right click with a mouse) SHALL open a menu to change its position, attach or detach materials, change counters and return it to the top or bottom of the deck. Cards not on the field SHALL also offer "セット", which places the card face down in the next empty zone the user taps (face-down defense in a monster zone). Tapping the deck, graveyard, banishment or extra deck SHALL list their cards, from which a card can be moved.

#### Scenario: ドラッグで召喚

- **WHEN** 手札のモンスターを空いたモンスターゾーンへドラッグする
- **THEN** そのカードが表側攻撃表示で置かれ、手札から消える

#### Scenario: 埋まったゾーンへ重ねる

- **WHEN** EXデッキのエクシーズモンスターを、モンスターのいるゾーンへドラッグし「上に重ねる」を選ぶ
- **THEN** エクシーズモンスターがそのゾーンに置かれ、元のモンスターが素材になる

#### Scenario: デッキからセット

- **WHEN** デッキの一覧でカードを押し、「セット」を選んで空いた魔法罠ゾーンを押す
- **THEN** そのカードが裏側で置かれる。モンスターゾーンを押したときは裏側守備表示で置かれる

#### Scenario: 墓地から手札へ

- **WHEN** 墓地を押し、一覧のカードの「手札へ」を選ぶ
- **THEN** そのカードが手札に加わる

### Requirement: デッキ・ライフ・ターン・元に戻す

The user SHALL draw one card, shuffle the deck, place a token, change life points (starting at 8000), end the turn (incrementing the turn number), reset the board, and undo or redo each operation.

#### Scenario: 元に戻す

- **WHEN** 1枚引いてから「元に戻す」を押す
- **THEN** 引く前の手札とデッキに戻り、「やり直す」でまた引いた後になる
