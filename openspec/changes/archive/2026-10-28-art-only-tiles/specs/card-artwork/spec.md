# Spec Delta

## MODIFIED Requirements

### Requirement: 絵の表示

When a valid passphrase is set and the card has artwork, the system SHALL show only the artwork filling the tile, without the card name and the frame color. When no valid passphrase is set, or the card has no artwork, the system SHALL show the frame-colored tile with the card name only. The limit mark and the darkening of missing copies SHALL be shown in both cases. All features other than artwork SHALL work without a passphrase.

#### Scenario: 絵があるカード

- **WHEN** 合言葉が正しく、絵が用意されたカードを表示する
- **THEN** タイル全体に絵だけが表示され、カード名と枠の色は表示されない

#### Scenario: 合言葉なし

- **WHEN** 合言葉を入れずにデッキを開く
- **THEN** カードは枠の色とカード名のタイルで表示され、編集も未所持の切り替えもできる

#### Scenario: 絵が無いカード

- **WHEN** 合言葉が正しく、絵がまだ用意されていない新カードを表示する
- **THEN** そのカードは枠の色とカード名のタイルで表示される
