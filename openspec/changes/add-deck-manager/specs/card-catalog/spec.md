# Spec Delta

## Purpose

デッキ編集・検索・ルール確認のもとになる、全OCGカードの日本語名・読み仮名・カードの種類・禁止制限の状態を提供し、新しいカードと制限の改定に追従する。

## ADDED Requirements

### Requirement: カードの基本情報
The system SHALL provide, for every OCG card, its official database card ID, Japanese name, reading (ruby), deck area (main or extra), display group, and frame type. Tokens SHALL be excluded.

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
The system SHALL provide each card's OCG limit status as forbidden, limited, semi-limited, or unlimited. When the status source has no entry for a card, its status SHALL be unknown.

#### Scenario: 準制限のカード
- **WHEN** OCGで準制限に指定されているカードを参照する
- **THEN** 状態は準制限である

#### Scenario: 状態の出典に無いカード
- **WHEN** 日本先行の新カードで、状態の出典にまだ載っていない
- **THEN** 状態は不明であり、禁止制限の警告の対象にならない

### Requirement: 定期更新
The system SHALL regenerate the card data weekly, and SHALL skip regeneration when the source data has not changed since the last run.

#### Scenario: 元データに変化なし
- **WHEN** 週1回の更新で、元データの更新判定値が前回と同じである
- **THEN** カードデータは書き換えられず、公開内容も変わらない

#### Scenario: 新カードの追加
- **WHEN** 週1回の更新で、元データに新しいカードが増えている
- **THEN** 更新後のカードデータにそのカードが含まれ、検索できる
