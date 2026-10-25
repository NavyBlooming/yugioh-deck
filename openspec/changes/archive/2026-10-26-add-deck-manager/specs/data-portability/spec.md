# Spec Delta

## Purpose

利用者ごとのデッキと購入メモを、アカウント無しでその端末に保存し、ファイルで書き出して別の端末へ移したりバックアップしたりできるようにする。

## ADDED Requirements

### Requirement: 端末内への自動保存

The system SHALL save every change to decks, missing records, and purchase notes on the device immediately, and SHALL restore them when the page is reopened.

#### Scenario: 開き直しても残る

- **WHEN** デッキにカードを足してからページを閉じて開き直す
- **THEN** 足したカードが残っている

### Requirement: 書き出し

The system SHALL let the user download all their data as a single JSON file whose name includes the date.

#### Scenario: ファイルに書き出す

- **WHEN** 2026年10月25日に「書き出し」を押す
- **THEN** 日付を含む名前のJSONファイルが保存され、全デッキと購入メモが含まれる

### Requirement: 読み込み

The system SHALL let the user import a previously exported file, replacing all current data after confirmation. A file that is not a valid export SHALL be rejected without changing the current data.

#### Scenario: 別の端末へ移す

- **WHEN** PCで書き出したファイルを、スマホで読み込んで確認する
- **THEN** スマホにPCと同じデッキと購入メモが表示される

#### Scenario: 壊れたファイル

- **WHEN** 書き出し形式ではないファイルを読み込む
- **THEN** 読み込めない旨が表示され、今のデータは変わらない

### Requirement: 合言葉は書き出さない

The exported file SHALL NOT contain the artwork passphrase.

#### Scenario: 書き出しに合言葉が入らない

- **WHEN** 合言葉を設定した端末で書き出す
- **THEN** 書き出したファイルに合言葉は含まれない
