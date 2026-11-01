## ADDED Requirements

### Requirement: 定期更新の曜日

The weekly update SHALL run every Sunday at 12:00 Japan time, because new products are usually released on Saturday.

#### Scenario: 土曜発売のパック

- **WHEN** 土曜に新しいパックが発売される
- **THEN** 翌日の日曜 12:00 の更新で、そのパックのカードが取り込まれる
