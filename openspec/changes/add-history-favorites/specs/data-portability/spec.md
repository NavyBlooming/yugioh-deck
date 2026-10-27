# Spec Delta

## MODIFIED Requirements

### Requirement: 書き出し

The system SHALL let the user download all their data as a single JSON file whose name includes the date, including the favorites and each deck's history.

#### Scenario: ファイルに書き出す

- **WHEN** 2026年10月25日に「書き出し」を押す
- **THEN** 日付を含む名前のJSONファイルが保存され、全デッキと購入メモ、お気に入り、各デッキの履歴が含まれる
