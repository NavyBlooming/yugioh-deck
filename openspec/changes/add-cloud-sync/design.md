# Design

## Context

動機は proposal.md の Why を参照。

- 画面はビルド工程の無い静的サイト（GitHub Pages、`navyblooming.github.io/yugioh-deck/`）。保存は `src/core/storage.js` の `loadState` / `saveState` で `localStorage` に state 全体を書く。state の変更はすべて `src/ui/app.js` の `ctx.commit` を通る
- state は数十KB程度で、Firestore の1ドキュメントの上限 1 MiB に収まる
- Firebase の無料枠（Spark）: Firestore は1日に読み取り5万回・書き込み2万回・保存 1 GiB。Authentication は1日3,000人まで
- Firebase の公式資料では、Safari などサードパーティのストレージを遮断するブラウザで、Firebase Hosting 以外から配信するページは `signInWithRedirect` が動かない。`signInWithPopup` を使うよう勧めている
- Firebase の JS SDK 13.1.0 は `https://www.gstatic.com/firebasejs/13.1.0/firebase-{app,auth,firestore}.js` から ES modules として読み込める（取得できることを確認済み）

## Goals / Non-Goals

**Goals:**

- 同期の判断（ログイン時にどちらのデータを使うか、空かどうか、保存をまとめるか）を Firebase から切り離した純粋な関数にし、Node だけでテストできるようにする
- Firebase とのやり取りは `src/ui/cloud.js` の1か所に閉じ込める

**Non-Goals:**

- デッキ単位・カード単位での変更のマージ（両端末で同時に編集したら、後から保存した方が勝つ）
- Google 以外のログイン方法
- 合言葉の同期

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

### 3. ログイン: `signInWithPopup`

「Google でログイン」ボタンを押したその処理の中で呼ぶ（ボタン操作の外で開くと、ポップアップがブロックされるため）。ログインの状態は Firebase が端末に覚えるので、開き直しても続く。

- 代替案: `signInWithRedirect` → 上記のとおり Safari で動かない。認証用の部品を自分のドメインに置く方法は、`navyblooming.github.io` の直下（別のリポジトリ）に置く必要があり、手間に見合わない

### 4. 同期の流れ（`src/core/sync.js` の純粋な関数＋`src/ui/cloud.js`）

- `isEmptyState(s)`: デッキ0件かつ購入メモ0件
- `decideOnSignIn(local, remote)`: remote が無い → `"upload"`、local が空 → `"download"`、両方の `exportJson` が同じ → `"same"`、それ以外 → `"ask"`
- `ctx.commit` は今までどおり `localStorage` に書き、ログイン中は `cloud.schedule(state)` を呼ぶ。`schedule` は最後の呼び出しから2秒たったら1回だけ書く（連打で書き込み回数を増やさない）。ページを閉じる・隠すとき（`visibilitychange` で hidden）は待たずに書く
- 他端末の変更: `onSnapshot` で `users/{uid}` を見張る。自分の書き込み中（`hasPendingWrites`）と、まだ書いていない変更があるあいだは無視する。それ以外で内容が今と違えば、`parseImport` で検証してから画面を描き直す
- 電波が無いとき: Firestore の `persistentLocalCache` を使い、書き込みは端末に溜まって、つながったときに送られる（Firebase の機能。動きは実装時にエミュレーターで確かめる）

### 5. 設定値

Firebase のプロジェクトの設定値（`apiKey` など）は `src/ui/firebase-config.js` に置く。これらは公開されても問題の無い値で、守りはアクセス規則が担う。承認済みドメインに `navyblooming.github.io` と、試験用に `127.0.0.1` を足す。

### 6. 試験

- 同期の判断とまとめて保存する処理: `node --test` で単体テスト（時計は差し替える）
- アクセス規則とログイン・同期の通し: Firebase のエミュレーター（Auth と Firestore）を手元で動かす。エミュレーターには JDK 11 以上が要り、この PC は Java 8 なので、JDK を G: ドライブに展開して使う（C: は空きが少ない）。エミュレーターのログイン画面は、偽の Google アカウントを画面上で作れるので、Playwright で本物のクリックとして通せる
- 本物の Google ログインと本物の Firestore は、公開後にスマホと PC で利用者が確かめる

## Risks / Trade-offs

- [両方の端末で同時に編集すると、片方の変更が消える] → 保存は2秒で行い、他端末の変更はすぐ反映するので、持ち替える使い方ではまず起きない。起きても書き出しファイルで戻せる
- [iPhone の Safari でポップアップがブロックされる] → ボタン操作の中で呼ぶ。それでも開かない場合の案内を画面に出す
- [ログイン情報の保存先もサードパーティのストレージ扱いになり、Safari で消える] → 未確認。公開後に実機で、開き直してもログインが続くかを確かめる
- [Firebase の設定値がリポジトリに載る] → 公開前提の値。悪用はアクセス規則と、承認済みドメインの限定で防ぐ
- [無料枠の超過] → 1回の保存で書き込み1回、開くたびに読み取り1回。個人と友人の利用では上限の1%にも届かない見込み
