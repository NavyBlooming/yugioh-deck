# Spec Delta

## ADDED Requirements

### Requirement: 発売前のカードの登録

The system SHALL let the user register a card that is not in the card data, with its name, reading, kind (normal, effect, ritual, fusion, synchro, Xyz or link monster, spell, or trap), and its level, rank or link rating for monsters or its type for spells and traps. Registered cards SHALL be usable in search, decks, the candidate area, history, favorites and the shopping list like other cards, with no limit status, no artwork and no effect text. The user SHALL be able to delete a registered card, which also removes it from decks, history, favorites and purchase notes. Registered cards SHALL be included in the export and in cloud sync.

#### Scenario: 登録したカードをデッキに入れる

- **WHEN** 「設定」で、名前「新しい竜」、読み「あたらしいりゅう」、効果モンスター、レベル4で登録し、デッキで「あたらしい」と検索して結果をタップする
- **THEN** 「新しい竜」がメインデッキの効果モンスターのレベル4の位置に入る

#### Scenario: 登録したカードを削除する

- **WHEN** デッキに入っている登録したカードを「設定」で削除する
- **THEN** そのカードはデッキと検索から消える

### Requirement: 発売されたカードへの置き換え

When the card data contains a card whose name matches a registered card, ignoring differences in width, case, spaces and symbols, the system SHALL replace the registered card with that card when the page is opened, carrying over its copies and missing marks in decks, history, favorites and purchase notes, and SHALL tell the user which cards were replaced.

#### Scenario: 発売されて一覧に入った

- **WHEN** 登録した「新しい竜」と同じ名前のカードが、カードデータの更新で一覧に入った後にページを開く
- **THEN** デッキの「新しい竜」は一覧のカードに置き換わり、枚数と未所持の印は変わらず、登録したカードの一覧からは消える
