# deck-building Specification

## Purpose
マスターデュエルのデッキ編集に近い操作で、メインデッキ・エクストラデッキ・候補カード欄にカードを出し入れし、公式ルールに反する構成にすぐ気づけるようにする。

## Requirements

### Requirement: 検索結果からの追加

The system SHALL add a card to the deck when the user taps it in the search results. Main deck cards SHALL go to the main deck and extra deck monsters to the extra deck, unless the user has switched the destination to the candidate area.

#### Scenario: メインデッキのカードを足す

- **WHEN** 追加先が「デッキ」の状態で、検索結果の「灰流うらら」をタップする
- **THEN** メインデッキの「灰流うらら」が1枚増える

#### Scenario: エクストラデッキのモンスターを足す

- **WHEN** 追加先が「デッキ」の状態で、シンクロモンスターをタップする
- **THEN** そのカードはエクストラデッキに入る

#### Scenario: 候補カード欄に足す

- **WHEN** 追加先を「候補」に切り替えて、検索結果のカードをタップする
- **THEN** そのカードは候補カード欄に入る

### Requirement: 同名カードは3枚まで

The system SHALL refuse to add a card when the main deck, extra deck, and candidate area together already hold three copies of that card, and SHALL tell the user why.

#### Scenario: 4枚目は入らない

- **WHEN** メインに2枚、候補に1枚の「灰流うらら」があるデッキに、もう1枚足そうとする
- **THEN** カードは増えず、3枚までである旨が表示される

### Requirement: メインデッキは60枚まで、エクストラデッキは15枚まで

The system SHALL refuse to add a card to the main deck when it already holds 60 cards, and to the extra deck when it already holds 15 cards, and SHALL tell the user why.

#### Scenario: メインの61枚目は入らない

- **WHEN** メインデッキが60枚のときに、メインデッキのカードを足そうとする
- **THEN** カードは増えず、60枚までである旨が表示される

#### Scenario: エクストラの16枚目は入らない

- **WHEN** エクストラデッキが15枚のときに、エクストラデッキのモンスターを足そうとする
- **THEN** カードは増えず、15枚までである旨が表示される

### Requirement: 候補カード欄は15枚まで

The system SHALL refuse to add a card to the candidate area when it already holds 15 cards.

#### Scenario: 16枚目は入らない

- **WHEN** 候補カード欄が15枚のときに、候補へカードを足そうとする
- **THEN** カードは増えず、15枚までである旨が表示される

### Requirement: カードを抜く・移す

The system SHALL let the user remove one copy of a card, and move one copy between the deck and the candidate area, from a menu opened by long-pressing the card. Moving SHALL follow the same limits as adding.

#### Scenario: 1枚抜く

- **WHEN** メインに3枚ある「灰流うらら」を長押しして「1枚抜く」を選ぶ
- **THEN** メインの「灰流うらら」は2枚になる

#### Scenario: 候補からデッキへ移す

- **WHEN** 候補カード欄のカードを長押しして「デッキへ移す」を選ぶ
- **THEN** そのカードは候補から1枚減り、カードの区分に応じてメインかエクストラに1枚増える

### Requirement: 並び順

The main deck SHALL be displayed grouped in the order normal monsters, effect monsters, spells, traps. The extra deck SHALL be grouped in the order fusion, synchro, Xyz, link. The candidate area SHALL use the main deck groups followed by the extra deck groups.

#### Scenario: 種類ごとにまとまる

- **WHEN** 罠、効果モンスター、魔法、通常モンスターの順にカードを追加する
- **THEN** メインデッキは通常モンスター、効果モンスター、魔法、罠の順に並ぶ

### Requirement: 群の中の並び順

Within a monster group, cards SHALL be ordered by level, rank, or link rating from lowest to highest. Within the spell group the order SHALL be normal, quick-play, continuous, equip, field, ritual, and within the trap group normal, continuous, counter. Ties SHALL keep the order first added, with copies of the same card adjacent.

#### Scenario: モンスターはレベルの低い順

- **WHEN** レベル8の効果モンスター、レベル3の効果モンスターの順に追加する
- **THEN** 効果モンスターの中はレベル3、レベル8の順に並ぶ

#### Scenario: 魔法は種類の順

- **WHEN** 永続魔法、速攻魔法、通常魔法の順に追加する
- **THEN** 魔法の中は通常魔法、速攻魔法、永続魔法の順に並ぶ

#### Scenario: 同名カードは隣に並ぶ

- **WHEN** レベル4の効果モンスターA、レベル4の効果モンスターB、Aの順に追加する
- **THEN** 効果モンスターの中は A、A、B の順に並ぶ

### Requirement: ルール違反の警告

The system SHALL show a warning, without blocking edits, when the main deck has fewer than 40 cards, or when the main deck, extra deck, and candidate area together hold a forbidden card, more than one copy of a limited card, or more than two copies of a semi-limited card.

#### Scenario: 制限カードの2枚目は入るが警告が出る

- **WHEN** 制限カードが1枚入っているデッキに、同じカードをもう1枚足す
- **THEN** カードは2枚になり、そのカード名を挙げた警告が表示される

#### Scenario: メインデッキの枚数不足

- **WHEN** メインデッキが39枚である
- **THEN** 40枚以上60枚以下である旨の警告が表示される

#### Scenario: 禁止カード

- **WHEN** 禁止カードがメインデッキに1枚入っている
- **THEN** そのカード名を挙げた警告が表示される

#### Scenario: 無制限のカード

- **WHEN** 無制限のカードを3枚入れている
- **THEN** そのカードについての禁止制限の警告は出ない

### Requirement: 汎用誘発をまとめて候補に入れる

The candidate area heading SHALL have a button that adds 増殖するG, 灰流うらら, マルチャミー・フワロス, and 無限泡影 to the candidate area, in that order, until each card's total across the main deck, extra deck, and candidate area reaches its limit: 0 for forbidden, 1 for limited, 2 for semi-limited, and 3 otherwise. Adding SHALL stop when the candidate area is full, and the system SHALL tell the user how many cards were added.

#### Scenario: 空のデッキで押す

- **WHEN** 増殖するGが制限、灰流うららが準制限、ほかの2枚が無制限のとき、空のデッキで押す
- **THEN** 候補カード欄に増殖するG 1枚、灰流うらら 2枚、マルチャミー・フワロス 3枚、無限泡影 3枚が入る

#### Scenario: すでにデッキに入っている分は数える

- **WHEN** メインデッキに灰流うららが1枚あるデッキで押す
- **THEN** 候補カード欄に入る灰流うららは1枚になる

#### Scenario: 上限まで入っている

- **WHEN** 4枚とも上限まで入っているデッキで押す
- **THEN** 何も増えず、すでに上限まで入っている旨が表示される

#### Scenario: 候補カード欄が途中でいっぱいになる

- **WHEN** 候補カード欄が12枚のデッキで押す
- **THEN** 15枚になったところで止まり、追加した枚数と、候補がいっぱいになった旨が表示される
