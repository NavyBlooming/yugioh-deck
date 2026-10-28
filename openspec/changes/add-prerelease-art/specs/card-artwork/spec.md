# Spec Delta

## ADDED Requirements

### Requirement: 発売前のカードの絵

The weekly update SHALL add artwork for prerelease cards when YGOPRODeck has an image of the card. A prerelease card SHALL be linked to a YGOPRODeck card only when the card number in the set matches and the card type and level also match. Pendulum cards SHALL NOT get artwork. Artwork of a card that is no longer a prerelease card SHALL be removed. The artwork SHALL be encrypted in the same way as other artwork.

#### Scenario: 発売前のカードに絵が出る

- **WHEN** 合言葉を入れた端末で、YGOPRODeck に画像がある発売前のカードを検索する
- **THEN** そのカードは絵つきで表示される

#### Scenario: 種類が合わないカードには出さない

- **WHEN** 型番の番号に当たる YGOPRODeck のカードの種類かレベルが、発売前のカードと違う
- **THEN** そのカードに絵は付かず、枠の色と名前で表示される

#### Scenario: 発売された

- **WHEN** 発売前のカードがカードデータに入り、発売前のカードの一覧から外れる
- **THEN** 発売前のカードとしての絵は消え、カードデータのカードの絵が使われる
