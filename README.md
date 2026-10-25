# yugioh-deck

紙の遊戯王OCGのデッキと、デッキごとに手元に無いカード（買いたいカード）を管理するページです。スマホで開くことを想定しています。

## データの出典

| データ | 取得元 | 使い方 |
| --- | --- | --- |
| カード名・読み仮名・カードの種類 | [ygocdb](https://ygocdb.com/api) の `cards.zip` | 全カードを1回で取得。`cards.zip.md5` で更新の有無を判定 |
| 禁止・制限・準制限 | [公式カードデータベースのリミットレギュレーション](https://www.db.yugioh-card.com/yugiohdb/forbidden_limited.action) | 一覧に無いカードは無制限 |
| 種類の補完 | [YGOPRODeck](https://ygoprodeck.com/api-guide/) の `cardinfo.php?misc=yes` | ygocdb に種類が無いカードだけ。`misc_info[0].konami_id` を公式のカードIDとして結び付ける |
| 日本版の収録パック（型番） | [YGOResources](https://db.ygoresources.com/about/api) の `/data/card/<cid>` | 購入メモを開いたときに、そのカードの分だけ画面から取得 |

日本語名の無いカードと、どの取得元にも種類の情報が無いカードは除き、`data/meta.json` の `excluded` に載せています。

## カードデータの更新

```sh
uv run tools/build_cards.py
```

カードの元データも禁止制限の一覧も前回から変わっていなければ `unchanged` と出て、何も書き換えません。

## テスト

```sh
npm test
uv run pytest
```
