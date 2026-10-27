# Spec Delta

## ADDED Requirements

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
