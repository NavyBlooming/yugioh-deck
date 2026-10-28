# Design

## Context

動機は proposal.md の Why を参照。

- 画面はビルド工程の無い静的サイト（GitHub Pages、`navyblooming.github.io/yugioh-deck/`）。保存は `src/core/storage.js` の `loadState` / `saveState` で `localStorage` に state 全体を書く。state の変更はすべて `src/ui/app.js` の `ctx.commit` を通る
- state は数十KB程度で、Firestore の1ドキュメントの上限 1 MiB に収まる
- Firebase の無料枠（Spark）: Firestore は1日に読み取り5万回・書き込み2万回・保存 1 GiB。Authentication は1日3,000人まで
- Firebase の公式資料では、Safari などサードパーティのストレージを遮断するブラウザで、Firebase Hosting 以外から配信するページは、認証用の中継ページ（`/__/auth/handler`）が別のドメイン（`<project>.firebaseapp.com`）にあるとログインが失敗することがある。直し方の1つとして、中継ページを自分のドメインに置き、`authDomain` をそのドメインにする方法が示されている
- Firebase の JS SDK 13.1.0 は `https://www.gstatic.com/firebasejs/13.1.0/firebase-{app,auth,firestore-lite}.js` から ES modules として読み込める（取得できることを確認済み。圧縮後の転送量は app 24KB・auth 42KB・firestore-lite 44KB。通常版の firestore は 187KB）
- Firestore の課金（[公式の料金ページ](https://firebase.google.com/docs/firestore/pricing)）: 見張り（リアルタイムリスナー）は、見張っているドキュメントが更新されるたびに読み取り1回。オフライン保存を有効にして30分以上切れると、つなぎ直しが新しい取得として課金される。送信量（サーバーから端末へ）の無料枠は月10GiB

## 試算: ログイン済み10人が1日2時間使う

前提: 1人がスマホと PC の2台を持つ。1人のデータは 80KB（10デッキ・購入メモ500件で約82KBと実測。1デッキなら約10KB）。編集は「平均10秒に1回」と「最悪: 2時間ずっと5秒以内の間隔で続ける」の2通り。

| 項目（1日、10人の合計） | 無料枠 | 最初の案（2秒で保存＋常に見張る） | 直した案（30秒に1回まで＋戻ったときに取得） |
| --- | --- | --- | --- |
| 書き込み | 20,000回 | 平均 7,200（36%）／最悪 36,000（180%、超過） | 平均・最悪とも 最大 2,400（12%） |
| 読み取り | 50,000回 | 平均 10,800（22%）／最悪 54,000（108%、超過） | 約300（1%未満）※1人30回開く・戻る |
| 送信量（月） | 10GiB | 平均 約26GB（約240%、超過） | 約0.7GB（約7%） |
| 保存容量 | 1GiB | 0.8MB | 0.8MB |
| ログインする人 | 3,000人/日 | 10人 | 10人 |

最初の案の読み取りは、書き込み1回につき、見張っている端末の数（自分の端末と、開いていればもう1台。平均1.5台とした）だけ数えた。自分の書き込みが自分の見張りで読み取りに数えられるかは公式資料に明記が無いので、数える側で見積もった。送信量は、読み取りのたびにデータ全体（80KB）が端末へ送られるとした。

直した案では、書き込みは「1人2時間 ÷ 30秒 = 240回」が上限になり、10人で2,400回。この使い方なら、書き込みの上限に届くのは約80人から。

## Goals / Non-Goals

**Goals:**

- 同期の判断（ログイン時にどちらのデータを使うか、空かどうか、保存をまとめるか）を Firebase から切り離した純粋な関数にし、Node だけでテストできるようにする
- Firebase とのやり取りは `src/ui/cloud.js` の1か所に閉じ込める

**Non-Goals:**

- デッキ単位・カード単位での変更のマージ（両端末で同時に編集したら、後から保存した方が勝つ）
- Google 以外のログイン方法

## Decisions

### 1. 保存の形: 1人1ドキュメント

`users/{uid}` に `{ state: "<exportJson の文字列>", updatedAt: <サーバー時刻> }` を置く。

- state を文字列で持つのは、書き出しファイルと同じ形にして `parseImport` の検証をそのまま使えるため。Firestore のフィールド名の制約（数値のキー等）も気にしなくてよい
- 代替案: デッキごとに別ドキュメント → 同時編集の衝突は減るが、読み書きの回数と実装が増える。今の使い方（1人が端末を持ち替える）には過剰なので採らない

### 2. アクセス規則

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

`firestore.rules` としてリポジトリに置き、Firebase のコンソールに貼る（手動）。

### 3. ログイン: 中継ページを自分のドメインに置き、`signInWithRedirect`

公開リポジトリ `NavyBlooming/navyblooming.github.io` の `__/auth/` に、`firebaseapp.com` から取得した中継ページ（`handler`・`handler.js`・`experiments.js`・`iframe`・`iframe.js`・`links`・`links.js`）を置き、`__/firebase/init.json` を設定値から作る。GitHub Pages が `_` で始まるフォルダーを公開するよう `.nojekyll` も置く。`authDomain` を `navyblooming.github.io` にし、ページと中継ページを同じドメインにする。

ログインは同じ画面の中で Google のログインへ移動し、戻ってきたら `onAuthStateChanged` で受け取る。失敗は `getRedirectResult` で知らせる。Google Cloud の OAuth クライアントの承認済みのリダイレクト URI に `https://navyblooming.github.io/__/auth/handler` を足す（手動）。ログインの状態は Firebase が端末に覚えるので、開き直しても続く。

- 代替案: `signInWithPopup`（中継ページは `firebaseapp.com` のまま）→ Chrome では通るが、iPhone の Safari ではタブでもホーム画面のアプリでも「missing initial state」で失敗した
- 中継ページは取得した日のまま変わらない。Firebase 側の更新で合わなくなったら、取り直して置き直す。読み込む SDK は 13.1.0 に固定しているので、すぐに合わなくなる見込みは小さい
- エミュレーターの試験では、エミュレーターのログイン画面を使うためポップアップのまま

### 4. 同期の流れ（`src/core/sync.js` の純粋な関数＋`src/ui/cloud.js`）

- `isEmptyState(s)`: デッキ0件かつ購入メモ0件
- `decideOnSignIn(local, remote)`: remote が無い → `"upload"`、local が空 → `"download"`、両方の `exportJson` が同じ → `"same"`、それ以外 → `"ask"`
- 保存: `ctx.commit` は今までどおり `localStorage` に書き、ログイン中は「未送信あり」の印（`ygo.sync.dirty.v1`）も `localStorage` に立てて `cloud.schedule()` を呼ぶ。`schedule` は、前回の書き込みから30秒たっていればすぐ、まだなら30秒たった時点で、その時の state を1回だけ書く。ページが隠れたとき（`visibilitychange` で hidden。iPhone でほかのアプリに切り替えたときも含む）は待たずに書く。書けたら印を下ろす
- 取得: ページを開いたときと、隠れていたページに戻ったとき（`visibilitychange` で visible）に `users/{uid}` を1回取る。印が立っていれば手元を書き込んで手元を残す。印が無く、クラウドの `updatedAt` が前回取り込んだ時刻より新しければ、`parseImport` で検証してから取り込んで描き直す
- 電波が無いとき: 書き込みに失敗したら印を立てたままにし、`online` イベント・次に戻ったとき・次に開いたときに書き直す。端末の中のデータは `localStorage` にあるので、Firestore のオフライン保存は使わない
- 代替案: 見張り（`onSnapshot`）で他端末の変更をすぐ反映 → 上の試算のとおり、書き込みのたびに読み取りと送信量が端末の数だけ増え、10人でも無料枠を超える。開いたまま見ていても他端末の変更が出ないことは、持ち替えて使う使い方では困らないと判断した
- 代替案: デッキごとに別ドキュメントにして送る量を減らす → 書き込みの回数は減らず、送信量は戻ったときの取得だけなので、1ドキュメントのままで足りる

### 4.1 Firestore Lite を使う

見張りとオフライン保存を使わないので、`firebase-firestore-lite.js`（44KB）で足りる。通常版（187KB）より、スマホで開いたときの読み込みが軽い

### 4.2 合言葉: 同じ文書の別の項目

`users/{uid}` に `pass`（文字列）として持つ。state の文字列には入れないので、書き出しのファイルにも入らない。state の書き込みは `merge` にして、`pass` を消さない。

- `decidePass({ remote, localOn, sent })`: 手元に確かめ済みの合言葉が無く、クラウドにある → `"adopt"`。クラウドに無く、手元にあり、このアカウントへまだ送っていない → `"upload"`。それ以外 → `"none"`
- 受け取った合言葉は、今までの入力と同じく `meta.json` の確認用の値で確かめ、正しいときだけ使う。違えば使わず、手元の状態も変えない
- 「設定」で保存したら送り、「合言葉を消す」で `deleteField` で消す。送った・消したことは端末ごとに `ygo.sync.passsent.v1` に覚え、ほかの端末で消された合言葉を、手元に残っている端末が送り直さないようにする。ログアウトでこの印も消す
- 判断は、ログイン時の選択の後と、開いたとき・戻ったときの取得の後に行う。起動時は絵の準備（合言葉の確かめ）を待ってから判断する
- 代替案: 別の文書（`users/{uid}/private/pass`）に置く → 読み書きの回数が増える。アクセス規則は同じ本人限定なので、分けても守りは変わらない

### 5. 設定値

Firebase のプロジェクトの設定値（`apiKey` など）は `src/ui/firebase-config.js` に置く。これらは公開されても問題の無い値で、守りはアクセス規則が担う。承認済みドメインに `navyblooming.github.io` と、試験用に `127.0.0.1` を足す。

### 6. 試験

- 同期の判断とまとめて保存する処理: `node --test` で単体テスト（時計は差し替える）
- アクセス規則とログイン・同期の通し: Firebase のエミュレーター（Auth と Firestore）を手元で動かす。エミュレーターには JDK 11 以上が要り、この PC は Java 8 なので、JDK を G: ドライブに展開して使う（C: は空きが少ない）。エミュレーターのログイン画面は、偽の Google アカウントを画面上で作れるので、Playwright で本物のクリックとして通せる
- 本物の Google ログインと本物の Firestore は、公開後にスマホと PC で利用者が確かめる

## Risks / Trade-offs

- [両方の端末で同時に編集すると、後から保存した方が残り、片方の変更が消える] → ほかのアプリに切り替えた時点で保存し、戻った時点で取り込むので、持ち替える使い方ではまず起きない。起きても書き出しファイルで戻せる
- [開いたまま見ている画面には、他端末の変更が出ない] → ほかのタブやアプリから戻ったとき、開き直したときに出る。「設定」の「最新の版に更新」でも取り直せる
- [保存の前にブラウザが落ちる] → 端末の中には毎回保存し、「未送信あり」の印で次に開いたときに送る
- [中継ページが Firebase 側の更新に合わなくなり、ログインが失敗する] → 失敗したら `firebaseapp.com` から取り直して置き直す
- [合言葉がクラウドに置かれる] → 本人しか読めないアクセス規則で守る。合言葉を知っている人が使う前提のもので、手元の `localStorage` にも平文で置いているのと同じ扱い
- [ログイン情報の保存先もサードパーティのストレージ扱いになり、Safari で消える] → 未確認。公開後に実機で、開き直してもログインが続くかを確かめる
- [Firebase の設定値がリポジトリに載る] → 公開前提の値。悪用はアクセス規則と、承認済みドメインの限定で防ぐ
- [無料枠の超過] → 上の試算のとおり、10人が1日2時間使っても書き込みは最大12%、送信量は約7%。超えた場合は Spark プランでは止まるだけで課金はされない（支払い情報を登録しないため）
