# Proposal

## Why

発売前のカードを1枚ずつ自分で登録するのは手間がかかる。発表されたカードは、遊戯王カードWiki の発売予定の商品のページに載っている。

## What Changes

- 毎週の更新で、遊戯王カードWiki のカードリストから発売予定の商品のページを探し、今のカードデータに無い収録カードのページを読んで、カード名・読み・種類・レベル（ランク・リンク）・魔法罠の種類・収録商品を `data/prerelease.json` に置く。効果テキストは取らない
- ページの間は2秒空け、利用者名にリポジトリの URL を付ける。取得や読み取りに失敗したら、前のデータを残して失敗を記録に出す
- 画面では、取得した発売前のカードも検索に出る。デッキ・候補・お気に入りに入れた時点で、自分で登録した発売前のカードと同じ扱いで端末に保存し、発売後は同じ仕組みで置き換える

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-catalog`: 発売前のカードの自動取得を足す

## Impact

- 新しい `tools/build_prerelease.py` とテスト、`data/prerelease.json`、`.github/workflows/update.yml`
- `src/core/custom.js`（取得したカードの保存）、`src/ui/app.js`（読み込みとカードの一覧）、README の出典の表
