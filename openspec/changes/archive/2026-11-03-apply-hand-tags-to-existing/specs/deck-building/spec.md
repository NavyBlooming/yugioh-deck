## ADDED Requirements

### Requirement: 前からあるデッキへの誘発の印

The system SHALL, once per saved data, give the "誘発" mark to the cards listed in "最初から付く誘発の印" that are already in each deck, when the page is opened. It SHALL record that this was done in the saved data (`applied`), and SHALL NOT give the mark again after the user removes it.

#### Scenario: 前からあるデッキ

- **WHEN** 印の付いていない灰流うららが入ったデッキがある状態で、ページを開く
- **THEN** 灰流うららに誘発の印が付く

#### Scenario: 外した印は戻らない

- **WHEN** その印を外してから、ページを開き直す
- **THEN** 灰流うららに誘発の印は付かない
