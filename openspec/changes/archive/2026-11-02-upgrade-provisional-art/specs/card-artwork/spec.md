## ADDED Requirements

### Requirement: 仮の絵の取り直し

The system SHALL record artwork cut out of a whole card image and artwork carried over from a prerelease card as provisional. The weekly update SHALL fetch the cropped artwork image of each provisional card again from the source, without using the local copy, and SHALL replace the artwork and stop treating it as provisional when the image is available.

#### Scenario: 正式な絵が出たら差し替える

- **WHEN** 発売前から絵を引き継いだカードに、取得元の絵だけの画像が出る
- **THEN** 次の週1回の更新で、そのカードの絵が絵だけの画像に差し替わる

#### Scenario: まだ無ければそのまま

- **WHEN** 仮の絵のカードの絵だけの画像が、取得元にまだ無い
- **THEN** 今の絵のまま残り、次の週にまた取り直す

### Requirement: カードの裏面の画像

The system SHALL treat the card back image that the source returns for a card without artwork as no artwork, both when adding new artwork and when fetching provisional artwork again.

#### Scenario: 裏面の画像が返ってくる

- **WHEN** 取得元が、絵の代わりにカードの裏面の画像を返す
- **THEN** その画像は絵として使わない

### Requirement: 画像の番号の候補

The system SHALL look up the artwork image by the passcode in the YGOPRODeck card list first, and SHALL try the passcode in ygocdb when the card is not in the list or the image is not available under the first passcode.

#### Scenario: 発売前の仮の番号に画像がある

- **WHEN** YGOPRODeck の一覧の番号では絵だけの画像が無く、ygocdb の番号（発売前の仮の番号）には画像がある
- **THEN** ygocdb の番号の画像を絵に使う
