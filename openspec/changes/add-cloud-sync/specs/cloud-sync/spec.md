# Spec Delta

## Purpose

同じ Google アカウントでログインしたスマホと PC で、デッキと購入メモを同じにし、端末を替えても手で移さずに続きから使えるようにする。

## ADDED Requirements

### Requirement: Google アカウントでのログイン

The system SHALL let the user sign in with a Google account from the settings, show which account is signed in, and let the user sign out. Signing out SHALL keep the current data on the device.

#### Scenario: ログインする

- **WHEN** 「設定」で「Google でログイン」を押し、表示された画面でアカウントを選ぶ
- **THEN** 設定にログイン中のアカウントのメールアドレスが表示される

#### Scenario: iPhone の Safari でログインする

- **WHEN** iPhone の Safari（タブ、またはホーム画面に追加したアプリ）で「Google でログイン」を押し、Google の画面でアカウントを選ぶ
- **THEN** このページに戻り、設定にログイン中のアカウントのメールアドレスが表示される

#### Scenario: ログアウトしても手元のデータは残る

- **WHEN** ログイン中に「ログアウト」を押す
- **THEN** デッキと購入メモは表示されたまま残り、以後の変更は端末の中だけに保存される

### Requirement: ログインしないときは端末の中だけ

The system SHALL keep working without sign-in, storing data only on the device as before.

#### Scenario: ログインせずに使う

- **WHEN** ログインせずにデッキを作る
- **THEN** デッキは端末に保存され、クラウドには何も送られない

### Requirement: クラウドへの保存

While signed in, the system SHALL keep every edit on the device immediately, and SHALL save to the cloud at most once every 30 seconds while editing continues, and immediately when the page is hidden or closed. Edits not yet saved to the cloud SHALL be saved the next time the page is opened.

#### Scenario: 編集がクラウドに残る

- **WHEN** ログイン中にカードを追加し、ほかのアプリに切り替える
- **THEN** 別の端末で同じアカウントのページを開くと、そのカードが入っている

#### Scenario: 連打してもまとめて保存する

- **WHEN** 2分間、カードを5秒おきに追加し続ける
- **THEN** クラウドへの保存は5回以下（最初の1回と、30秒ごとに1回）で、最後の追加まで保存される

#### Scenario: 保存の前にページが閉じられた

- **WHEN** クラウドへの保存が済む前にブラウザが終了し、後でページを開き直す
- **THEN** 端末に残っていた変更がクラウドに保存される

### Requirement: 初めてログインしたときのデータの扱い

On sign-in, the system SHALL use the cloud data when the device has no decks and no purchase notes, SHALL upload the device data when the cloud has none, and SHALL ask the user which to keep when both exist and differ. Choosing one SHALL replace the other.

#### Scenario: 新しい端末でログインする

- **WHEN** デッキが1つも無い端末で、クラウドにデータがあるアカウントにログインする
- **THEN** クラウドのデッキと購入メモが表示される

#### Scenario: 初めてクラウドを使う

- **WHEN** デッキがある端末で、クラウドにデータが無いアカウントにログインする
- **THEN** 端末のデータがクラウドに保存される

#### Scenario: 両方にデータがある

- **WHEN** デッキがある端末で、別のデータがクラウドにあるアカウントにログインする
- **THEN** 「この端末のデータを使う」「クラウドのデータを使う」を選ぶ画面が出て、選ばなかった方は置き換えられる

### Requirement: 他の端末での変更の反映

While signed in, the system SHALL fetch the cloud data when the page is opened and each time the page becomes visible again, and SHALL reflect changes saved from another device if this device has no edits waiting to be saved. When this device has edits waiting, they SHALL be saved and kept. The system SHALL NOT keep a continuous connection that watches for changes.

#### Scenario: PC で足したカードがスマホに出る

- **WHEN** PC で同じアカウントのデッキにカードを足して保存された後、スマホでほかのアプリからこのページに戻る
- **THEN** スマホのデッキにもそのカードが出る

#### Scenario: 戻ったときに手元に未保存の変更がある

- **WHEN** スマホで電波の無いときに編集し、電波が戻ってからこのページに戻る
- **THEN** スマホの変更がクラウドに保存され、そのまま表示される

### Requirement: 電波の無い場所での編集

While signed in and offline, the system SHALL accept edits, keep them on the device, and save them to the cloud when the connection returns or the next time the page is opened.

#### Scenario: 店内で電波が無い

- **WHEN** ログイン中に電波の無い場所で「買った」を押し、その後に電波が戻る
- **THEN** その変更がクラウドに保存される

### Requirement: 本人以外は読めない

The cloud data of a user SHALL be readable and writable only by that signed-in user.

#### Scenario: ログインしていない取得

- **WHEN** ログインせずに、ある人のクラウドのデータを取得しようとする
- **THEN** 拒否される

### Requirement: 合言葉の同期

While signed in, the system SHALL store the artwork passphrase in the cloud separately from the deck data, so that it is never included in the exported file. A device without a passphrase SHALL use the one from the cloud only after checking it the same way as a typed passphrase. Saving a passphrase in the settings SHALL send it, and clearing it SHALL remove it from the cloud. A device that still has the passphrase SHALL NOT send it again after another device removed it.

#### Scenario: 新しい端末で絵が出る

- **WHEN** 合言葉を入れた端末でログインした後、合言葉を入れていない別の端末で同じアカウントにログインする
- **THEN** 別の端末にも合言葉が入り、カードに絵が表示される

#### Scenario: 書き出しのファイルには入らない

- **WHEN** ログイン中に「書き出し」を押す
- **THEN** 書き出したファイルに合言葉は含まれない

#### Scenario: 合言葉を消す

- **WHEN** ログイン中に「合言葉を消す」を押し、その後に合言葉の残っている別の端末を開き直す
- **THEN** クラウドの合言葉は消えたままで、別の端末の手元の合言葉は残る

#### Scenario: クラウドの合言葉が違う

- **WHEN** クラウドに正しくない合言葉が入っているアカウントに、合言葉の無い端末でログインする
- **THEN** その合言葉は使われず、カードは枠の色と名前で表示される
