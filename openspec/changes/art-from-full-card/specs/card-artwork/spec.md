## MODIFIED Requirements

### Requirement: 新カードの絵の追加

The weekly update SHALL add encrypted artwork for newly added cards without re-encrypting existing artwork. When the cropped artwork image of a card is not available, the system SHALL instead cut the artwork frame out of the whole card image, except for Pendulum monsters.

#### Scenario: 週1回の更新で新カードの絵が増える

- **WHEN** 週1回の更新で新しいカードが増え、その絵が取得できる
- **THEN** 更新後、合言葉が正しければそのカードにイラストが表示される

#### Scenario: 絵だけの画像が無いカード

- **WHEN** 「聖王女ローズパメラ」の絵だけの画像が無く、カード全体の画像がある
- **THEN** カード全体の画像から絵の枠を切り出した絵が表示される

#### Scenario: ペンデュラムは切り出さない

- **WHEN** ペンデュラムモンスターの絵だけの画像が無い
- **THEN** そのカードには絵を付けず、枠の色と名前で表示される
