# tools Specification

## Purpose
下のタブ「ツール」にまとめる道具（買い物リスト・ダイス・コイントス）。

## Requirements

### Requirement: ツールタブ

The system SHALL replace the "買い物" tab with a "ツール" tab that switches between "買い物" (the shopping list) and "ダイス" (dice and coin toss). The "ツール" tab SHALL stay highlighted on both pages.

#### Scenario: ツールタブを開く

- **WHEN** 下のタブの「ツール」を押す
- **THEN** 買い物リストが出て、上の切り替えで「買い物」が選ばれている

#### Scenario: ダイスに切り替える

- **WHEN** ツールタブで「ダイス」を押す
- **THEN** ダイスの画面が出て、下のタブは「ツール」のまま光っている

### Requirement: ダイスとコイントス

The system SHALL roll one to three six-sided dice, chosen by the user, and SHALL show each face and, for two or more dice, the total. The system SHALL toss a coin showing "表" or "裏". Results SHALL be drawn from `crypto.getRandomValues` without modulo bias. The last three results SHALL be listed below the current one.

#### Scenario: 2個振る

- **WHEN** ダイスの数で「2個」を選び、「ダイスを振る」を押す
- **THEN** 1〜6の目が2つと、その合計が出る

#### Scenario: コイントス

- **WHEN** 「コイントス」を押す
- **THEN** 「表」か「裏」が出る

#### Scenario: 直前の結果

- **WHEN** 4回続けて振る
- **THEN** 今の結果の下に、その前の3回分が新しい順に出る
