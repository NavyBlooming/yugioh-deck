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

The system SHALL open a card detail sheet when the user long-presses a card in the deck, the candidate area, the search results, the history or the favorites. The sheet SHALL show the card image (or frame color), name, reading, level, rank or link rating, card type, limit status, the attribute, type, monster traits (such as Tuner), ATK and DEF, link arrows and pendulum scale for monsters whose data is available, the OCG release date when it is available, the number of copies in the main deck, extra deck and candidate area of the open deck, and the effect text for a user who has entered the artwork passphrase, including the Yugioh Card Wiki text for prerelease cards obtained from the Wiki. Long-pressing SHALL NOT add the card. From the sheet, the user SHALL be able to add one copy, remove one copy, move one copy between the deck and the candidate area, add or remove the card from favorites, set the card as the deck cover, open the purchase note, and open the card's pages on the official database and Card Rush. Adding one copy from a card in the deck SHALL go to the same kind of area as the pressed card; adding from the search results, history or favorites SHALL go to the current destination. The official database button SHALL NOT be shown for prerelease cards. The deck editor SHALL also offer a tap mode switch with "未所持" and "抜く"; while "抜く" is selected, tapping a card SHALL remove one copy of it and show which card was removed. The switch SHALL start at "未所持" each time the deck is opened. Adding one copy and moving SHALL follow the same limits as adding from the search results. Adding or removing one copy from the sheet SHALL keep the sheet open and update the counts shown in it. When no more copies can be added, removed or moved, the system SHALL keep the sheet open and show the reason.

#### Scenario: カード詳細を見る

- **WHEN** 合言葉を入れた端末で、メインに2枚ある「灰流うらら」を長押しする
- **THEN** 名前「灰流うらら」、読み「はるうらら」、「★ 3」「【効果モンスター】」、「メイン 2」と、効果テキストが表示される

#### Scenario: 合言葉が無いときの効果テキスト

- **WHEN** 合言葉を入れていない端末でカードを長押しする
- **THEN** 効果テキストの代わりに、合言葉を入れると表示される旨が出る

#### Scenario: 1枚抜く

- **WHEN** メインに3枚ある「灰流うらら」を長押しして「−1 抜く」を選ぶ
- **THEN** メインの「灰流うらら」は2枚になり、シートは開いたままで「メイン 2」と表示される

#### Scenario: 続けて抜く

- **WHEN** メインに2枚ある「灰流うらら」を長押しして「−1 抜く」を2回選ぶ
- **THEN** メインの「灰流うらら」は0枚になり、シートは開いたまま「メイン 0」と表示される

#### Scenario: もう抜けない

- **WHEN** メインの「灰流うらら」を0枚まで抜いたシートで、もう一度「−1 抜く」を選ぶ
- **THEN** 枚数は変わらず、「メインデッキに灰流うららはもうありません」と表示される

#### Scenario: 入っていないカードを抜く

- **WHEN** デッキに入っていない「青眼の白龍」を検索結果から長押しして「−1 抜く」を選ぶ
- **THEN** 「このデッキに青眼の白龍は入っていません」と表示され、シートは開いたまま

#### Scenario: 1枚増やす

- **WHEN** メインに2枚ある「灰流うらら」を長押しして「＋1 デッキへ」を選ぶ
- **THEN** メインの「灰流うらら」は3枚になり、シートは開いたままで「メイン 3」と表示される

#### Scenario: 上限なら増やさない

- **WHEN** メインに3枚ある「灰流うらら」を長押しして「＋1 デッキへ」を選ぶ
- **THEN** 枚数は変わらず、3枚までである旨が表示される

#### Scenario: 検索結果から詳細を開く

- **WHEN** 検索結果のカードを長押しし、詳細を見てから「＋1 デッキへ」を選ぶ
- **THEN** 長押しした時点では追加されず、「＋1 デッキへ」で追加先に1枚入る

#### Scenario: 発売前のカード

- **WHEN** 合言葉を入れた端末で、遊戯王カードWiki から取得した発売前のカードを長押しする
- **THEN** 遊戯王カードWiki の効果テキストが出て、「公式DB」のボタンは出ない

#### Scenario: 自分で登録したカード

- **WHEN** 自分で登録した発売前のカードを長押しする
- **THEN** 効果テキストの代わりに発売前のカードである旨が出る

#### Scenario: タップで抜く

- **WHEN** 「タップで」を「抜く」にして、メインに3枚ある「灰流うらら」を2回タップする
- **THEN** メインの「灰流うらら」は1枚になり、「灰流うららを1枚抜きました」と表示される

#### Scenario: 開き直すと未所持に戻る

- **WHEN** 「抜く」にしたまま一覧に戻り、もう一度デッキを開く
- **THEN** 「タップで」は「未所持」になっている

#### Scenario: 候補からデッキへ移す

- **WHEN** 候補カード欄のカードを長押しして「デッキへ移す」を選ぶ
- **THEN** そのカードは候補から1枚減り、カードの区分に応じてメインかエクストラに1枚増える

#### Scenario: モンスターの属性・種族・攻守を見る

- **WHEN** 「灰流うらら」を長押しする
- **THEN** 「炎属性／アンデット族／チューナー」「ATK 0 / DEF 1800」「OCG 発売日 2017-01-14」が表示される

#### Scenario: リンクマーカーとスケールを見る

- **WHEN** 「デコード・トーカー」と「アストログラフ・マジシャン」を長押しする
- **THEN** デコード・トーカーは「ATK 2300」と、上・左下・右下が点いたリンクマーカーが表示され、アストログラフ・マジシャンは「スケール 1」が表示される

### Requirement: 並び順

The main deck SHALL be displayed grouped in the order normal monsters, effect monsters, spells, traps. The extra deck SHALL be grouped in the order fusion, synchro, Xyz, link. The candidate area SHALL use the main deck groups followed by the extra deck groups.

#### Scenario: 種類ごとにまとまる

- **WHEN** 罠、効果モンスター、魔法、通常モンスターの順にカードを追加する
- **THEN** メインデッキは通常モンスター、効果モンスター、魔法、罠の順に並ぶ

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

### Requirement: 汎用誘発をまとめてメインデッキに入れる

The search panel SHALL have a button at the right end of the destination buttons (デッキ / 候補) that adds 増殖するG, 灰流うらら, マルチャミー・フワロス, and 無限泡影 to the main deck, in that order, until each card's total across the main deck, extra deck, and candidate area reaches its limit: 0 for forbidden, 1 for limited, 2 for semi-limited, and 3 otherwise. Adding SHALL stop when the main deck holds 60 cards, and the system SHALL tell the user how many cards were added.

#### Scenario: 空のデッキで押す

- **WHEN** 増殖するGが制限、灰流うららが準制限、ほかの2枚が無制限のとき、空のデッキで押す
- **THEN** メインデッキに増殖するG 1枚、灰流うらら 2枚、マルチャミー・フワロス 3枚、無限泡影 3枚が入る

#### Scenario: 候補に入っている分も数える

- **WHEN** 候補カード欄に灰流うららが1枚あるデッキで押す
- **THEN** メインデッキに入る灰流うららは1枚になる

#### Scenario: 上限まで入っている

- **WHEN** 4枚とも上限まで入っているデッキで押す
- **THEN** 何も増えず、すでに上限まで入っている旨が表示される

#### Scenario: メインデッキが途中でいっぱいになる

- **WHEN** メインデッキが57枚のデッキで押す
- **THEN** 60枚になったところで止まり、追加した枚数と、メインデッキがいっぱいになった旨が表示される

#### Scenario: 追加先が候補でもメインに入る

- **WHEN** 追加先を「候補」にした状態で押す
- **THEN** 4枚はメインデッキに入る

### Requirement: 履歴からの追加

The system SHALL keep, for each deck, the cards recently added to or removed from it, newest first, one entry per card, at most 30 entries, marked as added or removed. Adding from the search results, history or favorites, the hand trap button, or "1枚増やす" SHALL record an addition; removing by tap or from the menu SHALL record a removal. Moving between the deck and the candidate area SHALL NOT be recorded. The search panel SHALL offer a "履歴" tab listing them, and tapping one SHALL add it to the current destination with the same limits as the search results.

#### Scenario: 抜いたカードを戻す

- **WHEN** デッキから「灰流うらら」を1枚抜き、「履歴」タブで「灰流うらら」をタップする
- **THEN** 「灰流うらら」がメインに1枚戻る

#### Scenario: 新しい順で同じカードは1つ

- **WHEN** 「灰流うらら」を入れ、「増殖するG」を入れ、もう一度「灰流うらら」を抜く
- **THEN** 「履歴」タブには「灰流うらら」（抜いた印）、「増殖するG」（入れた印）の順に2枚が並ぶ

#### Scenario: デッキごとの履歴

- **WHEN** デッキAでカードを入れてから、デッキBの「履歴」タブを開く
- **THEN** デッキAで入れたカードは出ない

### Requirement: お気に入りからの追加

The system SHALL let the user add a card to or remove it from the favorites from the long-press menu. Favorites SHALL be shared by all decks. The search panel SHALL offer a "お気に入り" tab listing them, and tapping one SHALL add it to the current destination with the same limits as the search results.

#### Scenario: お気に入りに入れて別のデッキで使う

- **WHEN** デッキAで「無限泡影」を長押しして「お気に入りに追加」を選び、デッキBの「お気に入り」タブで「無限泡影」をタップする
- **THEN** デッキBのメインに「無限泡影」が1枚入る

#### Scenario: お気に入りから外す

- **WHEN** お気に入りに入っているカードを長押しして「お気に入りから外す」を選ぶ
- **THEN** 「お気に入り」タブからそのカードが消える

### Requirement: 誘発・初動の印

The system SHALL let the user mark a card in a deck as a hand trap ("誘発") and/or a starter ("初動") from the card detail sheet, without closing the sheet. The marks SHALL belong to the deck and the card, so all copies of the card in that deck share them and other decks are not affected. Marked cards in the deck editor SHALL show "誘" and "初" at the top right. The marks SHALL be saved with the deck and included in cloud sync and export.

#### Scenario: 誘発の印を付ける

- **WHEN** メインに2枚ある「灰流うらら」を長押しし、「誘発の印」を押して閉じる
- **THEN** シートは押しても閉じず、デッキの「灰流うらら」2枚の右上に「誘」が出る

#### Scenario: 印はデッキごと

- **WHEN** デッキAの「灰流うらら」に誘発の印を付ける
- **THEN** デッキBの「灰流うらら」には印が付かない

#### Scenario: 印を外す

- **WHEN** 印の付いたカードを長押しし、押した状態の「初動の印」をもう一度押す
- **THEN** そのカードの右上の「初」が消える

### Requirement: 初手の確率

The deck editor SHALL show, for the main deck, the probability that an opening hand of 5 cards contains at least one card marked "誘発" and at least one card marked "初動", with the number of marked copies, calculated without mulligans. Cards in the extra deck and the candidate area SHALL NOT be counted.

#### Scenario: 確率を見る

- **WHEN** メインデッキ9枚のうち「灰流うらら」2枚に誘発の印を付ける
- **THEN** デッキ編集画面に「初手5枚: 誘発 1枚以上 83.3%（2枚）／初動 印なし」と出る

#### Scenario: メインが少ない

- **WHEN** メインデッキが5枚より少ない
- **THEN** 「メインが5枚以上になると、初手を引けます」と出る

### Requirement: 初手のテスト

The deck editor SHALL offer a "初手を引く" button that opens a view drawing 5 cards (going first) or 6 cards (going second) at random from the main deck. The view SHALL let the user draw again, show how many "誘発" and "初動" cards the drawn hand contains, and show a table of the probabilities of drawing 0, 1, 2, 3 or more, and 1 or more marked cards for the selected hand size.

#### Scenario: 先攻と後攻

- **WHEN** 「初手を引く」を押し、「後攻 6枚」に切り替える
- **THEN** 引いたカードが5枚から6枚になり、表の確率も6枚引いたときの値になる

#### Scenario: 引き直す

- **WHEN** 「引き直す」を押す
- **THEN** メインデッキから引き直したカードが並び、手札の誘発・初動の枚数も引き直した手札で数え直される

### Requirement: 共用の印

The system SHALL let the user mark a single copy of a card in a deck as shared with other decks ("共用") from the card detail sheet opened by long-pressing that copy, without closing the sheet. The mark SHALL belong to that copy only, independent of the "未所持" mark. A shared copy SHALL show a "共用" band along the bottom edge of the card in the deck editor and in the opening-hand test. The mark SHALL move with the copy when cards are removed, moved, or replaced by a released card, and SHALL be saved with the deck.

#### Scenario: 1枚だけ共用にする

- **WHEN** メインに3枚ある「無限泡影」の2枚目を長押しし、「共用の印（この1枚）」を押して閉じる
- **THEN** シートは押しても閉じず、2枚目の札の下端にだけ「共用」の帯が出る

#### Scenario: 未所持と両方付ける

- **WHEN** 共用の札をタップして未所持にする
- **THEN** 札は暗くなり、「共用」の帯も残る

#### Scenario: 共用の札を抜く

- **WHEN** 共用の札を長押しして「−1 抜く」を押す
- **THEN** その札が抜け、残りの札には帯が出ない

#### Scenario: 初手のテスト

- **WHEN** 共用の札を含むデッキで初手を引き、その札が来る
- **THEN** 手札のその札にも「共用」の帯が出る

### Requirement: 最初から付く誘発の印

The system SHALL give the "誘発" mark to the following cards when a copy is added to a deck that has no copy of that card yet, in the main deck, the extra deck or the candidates, including through "汎用誘発を追加" and YDKE import: 幽鬼うさぎ, 原始生命態ニビル, D.D.クロウ, 浮幽さくら, エフェクト・ヴェーラー, 灰流うらら, PSYフレームギア・γ, 古聖戴サウラヴィス, スカル・マイスター, 屋敷わらし, 朔夜しぐれ, 増殖するG, 応戦するG, 飛翔するG, アーティファクト－ロンギヌス, ディメンション・アトラクター, ドロール＆ロックバード, マルチャミー・プルリア, マルチャミー・フワロス, マルチャミー・ニャルス, 儚無みずき, 無限泡影, 霊王の波動, 霆王の閃光, 命王の螺旋, 聖王の粉砕, 列王詩篇, 聖王女ローズパメラ. When the user removes the mark, adding more copies SHALL NOT give it again.

#### Scenario: 初めて入れる

- **WHEN** 灰流うららが入っていないデッキに灰流うららを入れる
- **THEN** 灰流うららに誘発の印が付く

#### Scenario: 外した印は付け直さない

- **WHEN** 灰流うららの誘発の印を外してから、もう1枚入れる
- **THEN** 誘発の印は付かない
