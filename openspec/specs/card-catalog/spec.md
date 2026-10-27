# card-catalog Specification

## Purpose
デッキ編集・検索・ルール確認のもとになる、全OCGカードの日本語名・読み仮名・カードの種類・禁止制限の状態を提供し、新しいカードと制限の改定に追従する。

## Requirements

### Requirement: カードの基本情報

The system SHALL provide, for every OCG card, its official database card ID, Japanese name, reading (ruby), deck area (main or extra), display group, frame type, level (rank or link rating for those monsters, 0 for spells and traps), and for spells and traps their kind (normal, quick-play, continuous, equip, field, ritual, or counter). Tokens SHALL be excluded.

#### Scenario: ペンデュラムモンスターのレベル

- **WHEN** レベル5のペンデュラムモンスター「星読みの魔術師」を参照する
- **THEN** レベルは5である（スケールの値は混ざらない）

#### Scenario: 魔法の種類

- **WHEN** 装備魔法「伝説の剣」を参照する
- **THEN** 種類は装備である

#### Scenario: 読み仮名つきのカード

- **WHEN** 公式カードID 12950 のカードを参照する
- **THEN** 名前は「灰流うらら」、読み仮名は「はるうらら」、区分はメイン、表示グループは効果モンスターである

#### Scenario: トークンは含めない

- **WHEN** 元データにトークンが含まれている
- **THEN** カードデータにはそのトークンが含まれない

### Requirement: 区分と表示グループの判定

The system SHALL assign fusion, synchro, Xyz, and link monsters to the extra deck area and all other cards to the main deck area. Main deck cards SHALL be grouped as normal monster, effect monster, spell, or trap; ritual and pendulum effect monsters SHALL belong to the effect monster group, and normal pendulum monsters to the normal monster group.

#### Scenario: エクストラデッキのモンスター

- **WHEN** シンクロモンスターのカードを判定する
- **THEN** 区分はエクストラになる

#### Scenario: 儀式モンスター

- **WHEN** 儀式モンスターのカードを判定する
- **THEN** 区分はメイン、表示グループは効果モンスターになる

#### Scenario: 通常のペンデュラムモンスター

- **WHEN** 効果を持たないペンデュラムモンスターを判定する
- **THEN** 表示グループは通常モンスターになる

### Requirement: 禁止制限の状態

The system SHALL provide each card's OCG limit status as forbidden, limited, semi-limited, or unlimited, following the official limit regulation list published in the official card database. Cards not on the list SHALL be unlimited.

#### Scenario: 準制限のカード

- **WHEN** 公式の一覧で準制限に指定されているカードを参照する
- **THEN** 状態は準制限である

#### Scenario: 一覧に無いカード

- **WHEN** 公式の一覧に載っていないカードを参照する
- **THEN** 状態は無制限である

#### Scenario: 一覧が読み取れない

- **WHEN** 週1回の更新で、公式の一覧のページの作りが変わって禁止・制限・準制限のいずれかが読み取れない
- **THEN** 更新は失敗し、前回のカードデータがそのまま残る

### Requirement: 定期更新

The system SHALL regenerate the card data weekly, and SHALL skip regeneration only when neither the card source data nor the official limit regulation list has changed since the last run.

#### Scenario: 元データに変化なし

- **WHEN** 週1回の更新で、カードの元データの更新判定値も、公式の一覧の内容も前回と同じである
- **THEN** カードデータは書き換えられず、公開内容も変わらない

#### Scenario: 制限の改定だけがあった

- **WHEN** 週1回の更新で、カードの元データは前回と同じだが、公式の一覧で準制限のカードが1枚増えている
- **THEN** 更新後のカードデータで、そのカードの状態が準制限になる

#### Scenario: 新カードの追加

- **WHEN** 週1回の更新で、元データに新しいカードが増えている
- **THEN** 更新後のカードデータにそのカードが含まれ、検索できる

### Requirement: 発売前のカードの登録

The system SHALL let the user register a card that is not in the card data, with its name, reading, kind (normal, effect, ritual, fusion, synchro, Xyz or link monster, spell, or trap), and its level, rank or link rating for monsters or its type for spells and traps. Registered cards SHALL be usable in search, decks, the candidate area, history, favorites and the shopping list like other cards, with no limit status, no artwork and no effect text. The user SHALL be able to delete a registered card, which also removes it from decks, history, favorites and purchase notes. Registered cards SHALL be included in the export and in cloud sync.

#### Scenario: 登録したカードをデッキに入れる

- **WHEN** 「設定」で、名前「新しい竜」、読み「あたらしいりゅう」、効果モンスター、レベル4で登録し、デッキで「あたらしい」と検索して結果をタップする
- **THEN** 「新しい竜」がメインデッキの効果モンスターのレベル4の位置に入る

#### Scenario: 登録したカードを削除する

- **WHEN** デッキに入っている登録したカードを「設定」で削除する
- **THEN** そのカードはデッキと検索から消える

### Requirement: 発売されたカードへの置き換え

When the card data contains a card whose name matches a registered card, ignoring differences in width, case, spaces and symbols, the system SHALL replace the registered card with that card when the page is opened, carrying over its copies and missing marks in decks, history, favorites and purchase notes, and SHALL tell the user which cards were replaced.

#### Scenario: 発売されて一覧に入った

- **WHEN** 登録した「新しい竜」と同じ名前のカードが、カードデータの更新で一覧に入った後にページを開く
- **THEN** デッキの「新しい竜」は一覧のカードに置き換わり、枚数と未所持の印は変わらず、登録したカードの一覧からは消える

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
