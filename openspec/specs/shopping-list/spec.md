# shopping-list Specification

## Purpose
カードショップでスマホを見ながら、デッキごとに何を何枚買えばよいか、合計でいくらかかるかを確かめ、買ったその場で記録できるようにする。

## Requirements

### Requirement: デッキごとの買い物リスト

The system SHALL list, for each deck that has missing copies, every card with missing copies and the number missing. Missing copies in the main and extra decks SHALL appear under the deck, and those in the candidate area SHALL appear under a separate "候補" heading within that deck.

#### Scenario: デッキと候補を分けて載せる

- **WHEN** デッキAのメインに未所持の「灰流うらら」2枚、候補に未所持の「増殖するG」1枚がある
- **THEN** デッキAの見出しの下に「灰流うらら ×2」、その中の「候補」の見出しの下に「増殖するG ×1」が載る

#### Scenario: 未所持の無いデッキは載せない

- **WHEN** あるデッキに未所持のカードが1枚も無い
- **THEN** 買い物リストにそのデッキは出ない

### Requirement: カードごとの購入メモ

The system SHALL let the user record, per card and shared across all decks, a unit price in yen, a desired rarity, and a desired printing chosen from the card's Japanese printings.

#### Scenario: 単価は全デッキで共通

- **WHEN** デッキAの買い物リストで「灰流うらら」の単価を580円にする
- **THEN** デッキBの買い物リストの「灰流うらら」も580円になる

#### Scenario: 収録パックの候補

- **WHEN** 「灰流うらら」の収録パックを選ぶ
- **THEN** 日本版の型番（例: MACR-JP036）が候補として表示される

### Requirement: 合計金額

The system SHALL show, for each deck, the total of unit price times missing count for the main and extra decks, excluding the candidate area, and SHALL show how many missing copies have no price.

#### Scenario: 価格未入力を含む合計

- **WHEN** 未所持が「灰流うらら」2枚（単価580円）と、単価未入力のカード1枚である
- **THEN** 合計は1,160円で、価格未入力が1枚と表示される

#### Scenario: 候補は合計に含めない

- **WHEN** 候補カード欄に単価1,000円の未所持カードが1枚ある
- **THEN** そのデッキの合計金額は1,000円増えない

### Requirement: カードラッシュへのリンク

The system SHALL provide, for each card in the list, a link that opens the Card Rush product search for that card's name.

#### Scenario: 検索結果を開く

- **WHEN** 「灰流うらら」のカードラッシュへのリンクを開く
- **THEN** カードラッシュで「灰流うらら」を検索した結果のページが開く

### Requirement: 購入の記録

The system SHALL decrease the missing count of a card by one in that deck and area when the user presses "買った" for it in the list.

#### Scenario: 買ったら暗い表示が減る

- **WHEN** デッキAの「灰流うらら ×2」で「買った」を押す
- **THEN** デッキAのメインの「灰流うらら」の未所持が1枚になり、デッキ編集画面でも暗い表示が1枚になる
