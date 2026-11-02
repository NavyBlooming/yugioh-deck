## ADDED Requirements

### Requirement: パスワードの対応表

The weekly update SHALL write `data/passcodes.json` mapping each card's Konami ID to the passcode used for export, and additional passcodes that also identify the card on import. The export passcode SHALL be ygocdb's `id`, or YGOPRODeck's `id` when ygocdb's is a temporary number (100,000,000 or more). Alternate-artwork passcodes and ygocdb's temporary numbers SHALL be readable on import. Cards with no real passcode SHALL have no export entry.

#### Scenario: 仮の番号のカード

- **WHEN** ygocdb の番号が 100200300 で、YGOPRODeck の番号が 22222222 のカードがある
- **THEN** 書き出しには 22222222 を使い、読み込みでは 100200300 でも同じカードと分かる

#### Scenario: 別の絵の番号

- **WHEN** 別の絵の番号で書かれたデッキを読み込む
- **THEN** 元のカードとして読み込まれる
