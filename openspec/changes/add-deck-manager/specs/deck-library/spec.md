# Spec Delta

## Purpose

複数のデッキを作って並べ、どのデッキに未所持のカードやルール違反が残っているかを一覧で見渡せるようにする。

## ADDED Requirements

### Requirement: デッキの作成・名前の変更・削除
The system SHALL let the user create a deck with a name, rename it, and delete it. Deleting SHALL require confirmation.

#### Scenario: 新しいデッキを作る
- **WHEN** 名前「リビングデッド」でデッキを作る
- **THEN** 一覧に「リビングデッド」が加わり、カードは0枚である

#### Scenario: 削除は確認してから
- **WHEN** デッキの削除を選び、確認で取り消す
- **THEN** デッキは残る

### Requirement: 一覧での状況表示
The deck list SHALL show, for each deck, its name, its cover card artwork, the number of missing cards in the main and extra decks, and whether it has any rule warning.

#### Scenario: 未所持の枚数
- **WHEN** メインに未所持3枚、エクストラに未所持1枚、候補に未所持2枚があるデッキを一覧で見る
- **THEN** 未所持の枚数は4枚と表示される

#### Scenario: ルール違反の印
- **WHEN** メインデッキが38枚のデッキを一覧で見る
- **THEN** そのデッキに警告の印が表示される

### Requirement: 表紙のカード
The system SHALL let the user choose any card in the deck as its cover. When none is chosen, the first card of the main deck in display order SHALL be used. A deck with no cards SHALL show a placeholder.

#### Scenario: 表紙を選ばない場合
- **WHEN** 表紙を選んでいないデッキを一覧で見る
- **THEN** 並び順でメインデッキの先頭にあるカードが表紙になる

#### Scenario: 表紙のカードを抜いた場合
- **WHEN** 表紙に選んだカードをデッキから全部抜く
- **THEN** 表紙は並び順でメインデッキの先頭のカードに戻る
