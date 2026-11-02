## ADDED Requirements

### Requirement: 最初から付く誘発の印

The system SHALL give the "誘発" mark to the following cards when a copy is added to a deck that has no copy of that card yet, in the main deck, the extra deck or the candidates, including through "汎用誘発を追加" and YDKE import: 幽鬼うさぎ, 原始生命態ニビル, D.D.クロウ, 浮幽さくら, エフェクト・ヴェーラー, 灰流うらら, PSYフレームギア・γ, 古聖戴サウラヴィス, スカル・マイスター, 屋敷わらし, 朔夜しぐれ, 増殖するG, 応戦するG, 飛翔するG, アーティファクト－ロンギヌス, ディメンション・アトラクター, ドロール＆ロックバード, マルチャミー・プルリア, マルチャミー・フワロス, マルチャミー・ニャルス, 儚無みずき, 無限泡影, 霊王の波動, 霆王の閃光, 命王の螺旋, 聖王の粉砕, 列王詩篇, 聖王女ローズパメラ. When the user removes the mark, adding more copies SHALL NOT give it again.

#### Scenario: 初めて入れる

- **WHEN** 灰流うららが入っていないデッキに灰流うららを入れる
- **THEN** 灰流うららに誘発の印が付く

#### Scenario: 外した印は付け直さない

- **WHEN** 灰流うららの誘発の印を外してから、もう1枚入れる
- **THEN** 誘発の印は付かない
