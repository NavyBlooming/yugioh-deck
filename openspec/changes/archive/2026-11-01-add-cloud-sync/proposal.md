# Proposal

## Why

デッキと購入メモは各端末のブラウザにしか保存されず、スマホと PC で同じデータを使うには、毎回ファイルの書き出しと読み込みが要る。カードショップではスマホ、デッキを組むのは PC という使い方では、この手間が大きい。

## What Changes

- 「設定」に Google アカウントでのログインを足し、ログインした人のデータをクラウド（Firebase）に保存する
- 同じアカウントでログインした端末どうしで、デッキと購入メモ、カードの絵の合言葉が同じになる
- ログインしていない人は、今までどおり端末の中だけに保存する
- 初めてログインした端末に既にデータがあり、クラウドにも別のデータがある場合は、どちらを使うかを選ばせる
- 電波の無い場所での編集は端末に残し、つながったときにクラウドへ保存する

## Capabilities

### New Capabilities

- `cloud-sync`: Google アカウントでのログインと、ログインした人のデータのクラウド保存・端末間の同期

### Modified Capabilities

（なし。端末内への保存と書き出し・読み込みの要件はそのまま残る）

## Impact

- 外部サービスの追加: Firebase（Authentication の Google ログイン、Cloud Firestore）。無料の Spark プランの範囲で使う
- Firebase のプロジェクトは利用者（リポジトリの持ち主）の Google アカウントで作る
- 画面から Firebase の JavaScript SDK を gstatic.com から読み込む
- ログインの中継ページを置く公開リポジトリ `NavyBlooming/navyblooming.github.io` を作る。Google Cloud の OAuth クライアントに戻り先の URI を足す
- 利用者のデータが Google のサーバーに置かれる。読めるのは本人だけにするアクセス規則を設定する
