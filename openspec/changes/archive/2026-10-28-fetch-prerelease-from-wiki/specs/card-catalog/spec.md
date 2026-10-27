# Spec Delta

## ADDED Requirements

### Requirement: 発売前のカードの自動取得

The system SHALL weekly find the product pages marked as upcoming on the card list of 遊戯王カードWiki, read the pages of their cards that are not in the card data, and publish each card's name, reading, kind, level, rank or link rating, spell or trap type, and product name. It SHALL NOT publish effect text. It SHALL wait 2 seconds between pages and identify itself with the repository URL. When fetching or reading fails, the previously published data SHALL be kept and the failure SHALL be reported.

#### Scenario: 発売予定の商品のカードが出る

- **WHEN** 発売予定の商品のページに、カードデータに無い《太陽神の詩詠者－ヘルポエマー》が載っていて、そのカードのページに「効果モンスター 星５」とある
- **THEN** 公開されるデータに、名前「太陽神の詩詠者－ヘルポエマー」、効果モンスター、レベル5で載る

#### Scenario: 発売済みのカードは載せない

- **WHEN** 商品のページのカードが、すでにカードデータにある
- **THEN** そのカードのページは読まず、公開されるデータにも載らない

### Requirement: 取得した発売前のカードを使う

The system SHALL show the fetched pre-release cards in search like other cards. When such a card is added to a deck or the candidate area, or to the favorites, the system SHALL keep it on the device in the same way as a registered pre-release card, so that it is replaced by the released card in the same way.

#### Scenario: 取得したカードをデッキに入れる

- **WHEN** 取得した発売前のカードを検索してデッキに入れる
- **THEN** そのカードは「設定」の発売前のカードの一覧に載り、発売後はカードデータのカードに置き換わる
