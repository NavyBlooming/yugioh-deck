## ADDED Requirements

### Requirement: デッキごとに畳む

The system SHALL fold or unfold a deck's rows in the shopping list when the user presses that deck's header (deck name, total and unpriced count). A deck's header SHALL stay at the top of the screen while the user scrolls through that deck. Folding SHALL be remembered while the app stays open, including when switching tabs. When the user folds a deck from its header held at the top, the system SHALL scroll so that the folded header is visible.

#### Scenario: 畳む

- **WHEN** 買い物リストでデッキBの帯を押す
- **THEN** デッキBの行が消えて帯だけになり、もう一度押すと行が出る

#### Scenario: 帯が上に留まる

- **WHEN** デッキBの行を下へスクロールしていく
- **THEN** デッキBの帯は画面の上端に留まり、次のデッキに入ると次のデッキの帯に替わる

#### Scenario: 留まった帯で畳む

- **WHEN** 上に留まったデッキBの帯を押す
- **THEN** デッキBが畳まれ、畳んだ帯が画面に見える位置まで戻る
