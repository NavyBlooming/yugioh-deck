## MODIFIED Requirements

### Requirement: ツールタブ

The system SHALL replace the "買い物" tab with a "ツール" tab that switches between "買い物" (the shopping list), "ユーティリティ" (dice and coin toss) and "その他" (YDKE import and export). The "ツール" tab SHALL stay highlighted on all three pages.

#### Scenario: ツールタブを開く

- **WHEN** 下のタブの「ツール」を押す
- **THEN** 買い物リストが出て、上の切り替えで「買い物」が選ばれている

#### Scenario: ダイスに切り替える

- **WHEN** ツールタブで「ユーティリティ」を押す
- **THEN** ダイスの画面が出て、下のタブは「ツール」のまま光っている

## ADDED Requirements

### Requirement: YDKE で書き出す

The system SHALL let the user pick a deck and produce a `ydke://` string with the main deck, the extra deck, and the candidates as the side deck, each card repeated by its count, with a button to copy it. Cards without a passcode SHALL be listed by name and left out. Missing marks, shared marks and purchase notes SHALL NOT be included.

#### Scenario: 書き出す

- **WHEN** その他の画面で、メイン40枚・エクストラ15枚・候補3枚のデッキを選ぶ
- **THEN** メイン40・エクストラ15・サイド3枚分の YDKE が出て、「コピー」でクリップボードに入る

#### Scenario: パスワードの無いカード

- **WHEN** 自分で登録したカードが入ったデッキを選ぶ
- **THEN** そのカードの名前が「書き出せないカード」として出て、ほかのカードだけの YDKE になる

### Requirement: YDKE で読み込む

The system SHALL let the user paste a `ydke://` string and create a new deck, asking for its name. Main-section cards SHALL go to the main or extra deck by card type, extra-section cards likewise, and side-section cards to the candidates. All cards SHALL be owned. Cards with an unknown passcode, and copies beyond a section's capacity, SHALL be left out and reported. A string that is not a valid YDKE SHALL be rejected without creating a deck.

#### Scenario: 読み込む

- **WHEN** ygo-decklab で書き出した YDKE を貼り、「読み込む」を押して名前を付ける
- **THEN** その名前の新しいデッキができ、サイドのカードは候補に入る

#### Scenario: 知らないカード

- **WHEN** カードデータに無いパスワードを含む YDKE を読み込む
- **THEN** そのカードは入らず、入らなかった枚数とパスワードが出る

#### Scenario: 形の違う文字列

- **WHEN** `ydke://` で始まらない文字列を読み込む
- **THEN** デッキは作られず、YDKE の形ではないと出る
