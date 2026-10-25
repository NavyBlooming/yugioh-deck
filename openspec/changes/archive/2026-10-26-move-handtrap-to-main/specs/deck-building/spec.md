# Spec Delta

## REMOVED Requirements

### Requirement: 汎用誘発をまとめて候補に入れる

**Reason**: 入れる先は候補カード欄ではなくメインデッキだった

**Migration**: 「汎用誘発をまとめてメインデッキに入れる」に置き換える。候補カード欄へは、検索から追加先を「候補」にして入れる

## ADDED Requirements

### Requirement: 汎用誘発をまとめてメインデッキに入れる

The search panel SHALL have a button at the right end of the destination buttons (デッキ / 候補) that adds 増殖するG, 灰流うらら, マルチャミー・フワロス, and 無限泡影 to the main deck, in that order, until each card's total across the main deck, extra deck, and candidate area reaches its limit: 0 for forbidden, 1 for limited, 2 for semi-limited, and 3 otherwise. Adding SHALL stop when the main deck holds 60 cards, and the system SHALL tell the user how many cards were added.

#### Scenario: 空のデッキで押す

- **WHEN** 増殖するGが制限、灰流うららが準制限、ほかの2枚が無制限のとき、空のデッキで押す
- **THEN** メインデッキに増殖するG 1枚、灰流うらら 2枚、マルチャミー・フワロス 3枚、無限泡影 3枚が入る

#### Scenario: 候補に入っている分も数える

- **WHEN** 候補カード欄に灰流うららが1枚あるデッキで押す
- **THEN** メインデッキに入る灰流うららは1枚になる

#### Scenario: 上限まで入っている

- **WHEN** 4枚とも上限まで入っているデッキで押す
- **THEN** 何も増えず、すでに上限まで入っている旨が表示される

#### Scenario: メインデッキが途中でいっぱいになる

- **WHEN** メインデッキが57枚のデッキで押す
- **THEN** 60枚になったところで止まり、追加した枚数と、メインデッキがいっぱいになった旨が表示される

#### Scenario: 追加先が候補でもメインに入る

- **WHEN** 追加先を「候補」にした状態で押す
- **THEN** 4枚はメインデッキに入る
