# Proposal

## Why

絵が出るカードでも、絵の下にカード名と枠の色が並び、絵が小さく見える。絵があればカード名と枠の色は要らない。

## What Changes

- 絵があるカードは、タイル全体に絵だけを出す。カード名と枠の色は出さない
- 合言葉が無いときや絵の無いカードは、これまでどおり枠の色とカード名で出す
- 制限の印、未所持の暗い表示、履歴の印はこれまでどおり

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-artwork`: 絵があるときの表示を絵だけにする

## Impact

- `src/ui/tile.js`、`styles.css`
