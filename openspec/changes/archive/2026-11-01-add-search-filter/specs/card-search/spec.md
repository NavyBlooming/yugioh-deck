## ADDED Requirements

### Requirement: 検索の絞り込み

The search panel SHALL offer a filter by card kind, spell/trap type, attribute, type (race), monster traits such as Tuner, level/rank/link rating range, ATK range and DEF range. Options within one group SHALL match any of them, and different groups SHALL all have to match. The filter SHALL work with an empty name query, listing all matching cards in deck order, and SHALL narrow the name search when a name is entered. While filtering, the panel SHALL show the conditions under the search box with a button to clear them. The filter SHALL be kept only while the deck editor is open. Cards without attribute, type or ATK/DEF data SHALL NOT match those conditions. A type (race) number without a known name SHALL be shown as "その他の種族" and SHALL match the "その他" option.

#### Scenario: 属性・種族・攻撃力で絞る

- **WHEN** 名前を入れずに「闇属性」「魔法使い族」、攻撃力2500〜2500で絞る
- **THEN** 「ブラック・マジシャン」と「アストログラフ・マジシャン」が出て、出たカードはすべて闇属性・魔法使い族・攻撃力2500であり、検索欄の下に「闇属性・魔法使い族・攻撃力2500〜2500」と出る

#### Scenario: 名前と組み合わせる

- **WHEN** 上の絞り込みのまま「ぶらっく」と入れる
- **THEN** 絞り込みの結果のうち、名前か読みに「ぶらっく」を含むカードだけが出る

#### Scenario: 解除する

- **WHEN** 条件の行の × を押す
- **THEN** 絞り込みが外れ、名前だけの検索に戻る
