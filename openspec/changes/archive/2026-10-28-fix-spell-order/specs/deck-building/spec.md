# Spec Delta

## MODIFIED Requirements

### Requirement: 群の中の並び順

Within a monster group, cards SHALL be ordered by level, rank, or link rating from lowest to highest. Within the spell group the order SHALL be normal, field, equip, continuous, quick-play, ritual, and within the trap group normal, continuous, counter. Ties SHALL keep the order first added, with copies of the same card adjacent.

#### Scenario: モンスターはレベルの低い順

- **WHEN** レベル8の効果モンスター、レベル3の効果モンスターの順に追加する
- **THEN** 効果モンスターの中はレベル3、レベル8の順に並ぶ

#### Scenario: 魔法は種類の順

- **WHEN** 速攻魔法、永続魔法、装備魔法、フィールド魔法、通常魔法の順に追加する
- **THEN** 魔法の中は通常魔法、フィールド魔法、装備魔法、永続魔法、速攻魔法の順に並ぶ

#### Scenario: 同名カードは隣に並ぶ

- **WHEN** レベル4の効果モンスターA、レベル4の効果モンスターB、Aの順に追加する
- **THEN** 効果モンスターの中は A、A、B の順に並ぶ
