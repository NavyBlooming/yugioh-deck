## ADDED Requirements

### Requirement: 差し替えた絵の取り直し

The system SHALL give a version number to artwork that has been replaced, and the app SHALL fetch and decrypt the artwork again instead of using the copy saved on the device when the version number changes.

#### Scenario: 一度表示した絵が差し替わる

- **WHEN** 端末で一度表示したカードの絵が、毎週の更新で正式な絵に差し替わる
- **THEN** 次に開いたとき、そのカードには新しい絵が出る
