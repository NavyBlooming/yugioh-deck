# Spec Delta

## ADDED Requirements

### Requirement: 汎用誘発をまとめて候補に入れる

The candidate area heading SHALL have a button that adds 増殖するG, 灰流うらら, マルチャミー・フワロス, and 無限泡影 to the candidate area, in that order, until each card's total across the main deck, extra deck, and candidate area reaches its limit: 0 for forbidden, 1 for limited, 2 for semi-limited, and 3 otherwise. Adding SHALL stop when the candidate area is full, and the system SHALL tell the user how many cards were added.

#### Scenario: 空のデッキで押す

- **WHEN** 増殖するGが制限、灰流うららが準制限、ほかの2枚が無制限のとき、空のデッキで押す
- **THEN** 候補カード欄に増殖するG 1枚、灰流うらら 2枚、マルチャミー・フワロス 3枚、無限泡影 3枚が入る

#### Scenario: すでにデッキに入っている分は数える

- **WHEN** メインデッキに灰流うららが1枚あるデッキで押す
- **THEN** 候補カード欄に入る灰流うららは1枚になる

#### Scenario: 上限まで入っている

- **WHEN** 4枚とも上限まで入っているデッキで押す
- **THEN** 何も増えず、すでに上限まで入っている旨が表示される

#### Scenario: 候補カード欄が途中でいっぱいになる

- **WHEN** 候補カード欄が12枚のデッキで押す
- **THEN** 15枚になったところで止まり、追加した枚数と、候補がいっぱいになった旨が表示される
