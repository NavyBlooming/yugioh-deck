# Spec Delta

## MODIFIED Requirements

### Requirement: カードを抜く・移す

The system SHALL open a card detail sheet when the user long-presses a card in the deck, the candidate area, the search results, the history or the favorites. The sheet SHALL show the card image (or frame color), name, reading, level, rank or link rating, card type, limit status, the number of copies in the main deck, extra deck and candidate area of the open deck, and the effect text for a user who has entered the artwork passphrase. Long-pressing SHALL NOT add the card. From the sheet, the user SHALL be able to add one copy, remove one copy, move one copy between the deck and the candidate area, add or remove the card from favorites, set the card as the deck cover, open the purchase note, and open the card's pages on the official database and Card Rush. Adding one copy from a card in the deck SHALL go to the same kind of area as the pressed card; adding from the search results, history or favorites SHALL go to the current destination. The official database button SHALL NOT be shown for prerelease cards. The deck editor SHALL also offer a tap mode switch with "未所持" and "抜く"; while "抜く" is selected, tapping a card SHALL remove one copy of it and show which card was removed. The switch SHALL start at "未所持" each time the deck is opened. Adding one copy and moving SHALL follow the same limits as adding from the search results.

#### Scenario: カード詳細を見る

- **WHEN** 合言葉を入れた端末で、メインに2枚ある「灰流うらら」を長押しする
- **THEN** 名前「灰流うらら」、読み「はるうらら」、「★ 3」「【効果モンスター】」、「メイン 2」と、効果テキストが表示される

#### Scenario: 合言葉が無いときの効果テキスト

- **WHEN** 合言葉を入れていない端末でカードを長押しする
- **THEN** 効果テキストの代わりに、合言葉を入れると表示される旨が出る

#### Scenario: 1枚抜く

- **WHEN** メインに3枚ある「灰流うらら」を長押しして「−1 抜く」を選ぶ
- **THEN** メインの「灰流うらら」は2枚になる

#### Scenario: 1枚増やす

- **WHEN** メインに2枚ある「灰流うらら」を長押しして「＋1 デッキへ」を選ぶ
- **THEN** メインの「灰流うらら」は3枚になる

#### Scenario: 上限なら増やさない

- **WHEN** メインに3枚ある「灰流うらら」を長押しして「＋1 デッキへ」を選ぶ
- **THEN** 枚数は変わらず、3枚までである旨が表示される

#### Scenario: 検索結果から詳細を開く

- **WHEN** 検索結果のカードを長押しし、詳細を見てから「＋1 デッキへ」を選ぶ
- **THEN** 長押しした時点では追加されず、「＋1 デッキへ」で追加先に1枚入る

#### Scenario: 発売前のカード

- **WHEN** 発売前のカードを長押しする
- **THEN** 効果テキストの代わりに発売前のカードである旨が出て、「公式DB」のボタンは出ない

#### Scenario: タップで抜く

- **WHEN** 「タップで」を「抜く」にして、メインに3枚ある「灰流うらら」を2回タップする
- **THEN** メインの「灰流うらら」は1枚になり、「灰流うららを1枚抜きました」と表示される

#### Scenario: 開き直すと未所持に戻る

- **WHEN** 「抜く」にしたまま一覧に戻り、もう一度デッキを開く
- **THEN** 「タップで」は「未所持」になっている

#### Scenario: 候補からデッキへ移す

- **WHEN** 候補カード欄のカードを長押しして「デッキへ移す」を選ぶ
- **THEN** そのカードは候補から1枚減り、カードの区分に応じてメインかエクストラに1枚増える
