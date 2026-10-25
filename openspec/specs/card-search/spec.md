# card-search Specification

## Purpose
遊戯王に多い特殊な読みのカードも含めて、デッキに入れたいカードを名前の一部や読み仮名から素早く見つけられるようにする。

## Requirements

### Requirement: 名前と読み仮名での検索

The system SHALL return cards whose name or reading contains the query, ignoring differences between hiragana and katakana, full-width and half-width characters, letter case, spaces, and symbols.

#### Scenario: 読み仮名で探す

- **WHEN** 「はるう」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: カタカナで入力しても読み仮名に当たる

- **WHEN** 「ハルウララ」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: 名前の一部で探す

- **WHEN** 「うらら」と入力する
- **THEN** 結果に「灰流うらら」が含まれる

#### Scenario: 記号と全角半角の違いを無視する

- **WHEN** 「ABCドラゴンバスター」と入力する
- **THEN** 結果に「ABC－ドラゴン・バスター」が含まれる

### Requirement: 結果の並び

The system SHALL list cards whose name or reading starts with the query before other matches, and SHALL order cards within each tier by reading.

#### Scenario: 前方一致を先に出す

- **WHEN** 「うらら」と入力し、名前が「うらら」で始まるカードと、途中に含むカードの両方がある
- **THEN** 「うらら」で始まるカードが先に並ぶ

### Requirement: 空の入力

The system SHALL show no results when the query is empty after normalization.

#### Scenario: 空白だけを入力

- **WHEN** 空白だけを入力する
- **THEN** 結果は表示されない
