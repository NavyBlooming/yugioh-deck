# Spec Delta

## Purpose

同じ Google アカウントでログインしたスマホと PC で、デッキと購入メモを同じにし、端末を替えても手で移さずに続きから使えるようにする。

## ADDED Requirements

### Requirement: Google アカウントでのログイン

The system SHALL let the user sign in with a Google account from the settings, show which account is signed in, and let the user sign out. Signing out SHALL keep the current data on the device.

#### Scenario: ログインする

- **WHEN** 「設定」で「Google でログイン」を押し、表示された画面でアカウントを選ぶ
- **THEN** 設定にログイン中のアカウントのメールアドレスが表示される

#### Scenario: ログアウトしても手元のデータは残る

- **WHEN** ログイン中に「ログアウト」を押す
- **THEN** デッキと購入メモは表示されたまま残り、以後の変更は端末の中だけに保存される

### Requirement: ログインしないときは端末の中だけ

The system SHALL keep working without sign-in, storing data only on the device as before.

#### Scenario: ログインせずに使う

- **WHEN** ログインせずにデッキを作る
- **THEN** デッキは端末に保存され、クラウドには何も送られない

### Requirement: クラウドへの保存

While signed in, the system SHALL save decks and purchase notes to the cloud within a few seconds after the user stops editing, and SHALL also keep them on the device.

#### Scenario: 編集がクラウドに残る

- **WHEN** ログイン中にカードを追加し、数秒待ってからページを閉じる
- **THEN** 別の端末で同じアカウントにログインすると、そのカードが入っている

#### Scenario: 連打してもまとめて保存する

- **WHEN** 2秒の間にカードを10回追加する
- **THEN** クラウドへの保存は、追加が止まった後にまとめて行われる

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

While signed in and with no unsaved local edits, the system SHALL reflect changes saved from another device without reopening the page.

#### Scenario: PC で足したカードがスマホに出る

- **WHEN** スマホでページを開いたまま、PC で同じアカウントのデッキにカードを足す
- **THEN** 数秒のうちにスマホのデッキにもそのカードが出る

### Requirement: 電波の無い場所での編集

While signed in and offline, the system SHALL accept edits, keep them on the device, and save them to the cloud when the connection returns.

#### Scenario: 店内で電波が無い

- **WHEN** ログイン中に電波の無い場所で「買った」を押し、その後に電波が戻る
- **THEN** その変更がクラウドに保存される

### Requirement: 本人以外は読めない

The cloud data of a user SHALL be readable and writable only by that signed-in user.

#### Scenario: ログインしていない取得

- **WHEN** ログインせずに、ある人のクラウドのデータを取得しようとする
- **THEN** 拒否される

### Requirement: 合言葉は同期しない

The artwork passphrase SHALL NOT be sent to the cloud.

#### Scenario: 合言葉は端末ごと

- **WHEN** 合言葉を入れた端末でログインする
- **THEN** クラウドのデータに合言葉は含まれない
