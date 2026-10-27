# card-artwork Specification

## Purpose
マスターデュエルのようにイラストの入ったカードで並べつつ、カードの絵を公開リポジトリから誰でも見られる状態にはせず、合言葉を知っている人にだけ表示する。

## Requirements

### Requirement: 絵は暗号化した状態でだけ公開する

The published site SHALL contain card artwork only in encrypted form, so that the artwork cannot be viewed without the passphrase. File names SHALL not reveal that the files are images.

#### Scenario: 公開ファイルを直接開く

- **WHEN** 公開サイトに置かれた絵のファイルを、合言葉なしで取得する
- **THEN** 中身は画像として表示できない

### Requirement: 合言葉の入力

The system SHALL let the user enter the passphrase in the settings, SHALL tell the user whether it is correct, and SHALL remember a correct passphrase on that device.

#### Scenario: 正しい合言葉

- **WHEN** 正しい合言葉を入れる
- **THEN** 正しい旨が表示され、カードにイラストが表示されるようになる

#### Scenario: 違う合言葉

- **WHEN** 違う合言葉を入れる
- **THEN** 合言葉が違う旨が表示され、合言葉は保存されない

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

### Requirement: 必要な絵だけを取得する

The system SHALL fetch only the artwork of cards currently displayed, and SHALL keep decrypted artwork on the device so that the same card is not fetched again.

#### Scenario: 2回目は取り直さない

- **WHEN** 一度表示したカードを、ページを開き直してもう一度表示する
- **THEN** そのカードの絵は通信せずに表示される

### Requirement: 新カードの絵の追加

The weekly update SHALL add encrypted artwork for newly added cards without re-encrypting existing artwork.

#### Scenario: 週1回の更新で新カードの絵が増える

- **WHEN** 週1回の更新で新しいカードが増え、その絵が取得できる
- **THEN** 更新後、合言葉が正しければそのカードにイラストが表示される
