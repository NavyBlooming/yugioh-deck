# Proposal

## Why

発表されたばかりの発売前のカードは、カードデータの取得元（ygocdb・mycard/ygopro-database）に入っていないため、検索できずデッキに入れられない。

## What Changes

- 「設定」で、発売前のカードをカード名・読み・種類（モンスターはレベル、魔法・罠は種類）で登録・削除できるようにする
- 登録したカードは、検索・デッキ・候補・履歴・お気に入り・買い物リストで、ほかのカードと同じに使える。制限は無し、絵と効果テキストは無し
- カードデータの更新で同じ名前のカードが入ったら、開いたときにそのカードへ置き換え、デッキ・履歴・お気に入り・購入メモを引き継ぐ
- 登録したカードは書き出しとクラウドの同期にも含める

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `card-catalog`: 発売前のカードの登録と、発売後の置き換えを足す

## Impact

- 新しい `src/core/custom.js` とテスト、`src/core/storage.js`（形の確かめ）、`src/core/sync.js`（空かどうか）
- `src/ui/app.js`（カードの一覧に登録したカードを足す）、`src/ui/settings.js`（登録の欄）、`src/ui/deck.js`（公式DBへのリンクを出さない）、`src/ui/cloud.js`（取り込み時に一覧を作り直す）
