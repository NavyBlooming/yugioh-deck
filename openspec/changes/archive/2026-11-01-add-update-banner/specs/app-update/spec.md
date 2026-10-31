## ADDED Requirements

### Requirement: 新しい版の知らせ

The system SHALL remember the version (ETag, or Last-Modified when there is no ETag) of each same-site file the page loaded, except artwork files (.bin). It SHALL ask the server whether those files have changed 10 seconds after the page opens and whenever the user returns to the app, at most once every 10 minutes. When any file has changed, the system SHALL show a bar at the top of the page with "新しい版があります", an "更新する" button and a "閉じる" button.

#### Scenario: 公開ページが新しくなる

- **WHEN** ページを開いたあとに公開ページのファイルが新しくなり、10分以上たってからアプリに戻る
- **THEN** ページの一番上に「新しい版があります」と「更新する」が出る

#### Scenario: 変わっていない

- **WHEN** ページを開いたあと、公開ページのファイルが変わっていない
- **THEN** 上の帯は出ない

### Requirement: 知らせを閉じる

The system SHALL hide the bar when the user presses "閉じる", and SHALL NOT show it again until the page is opened again.

#### Scenario: 閉じる

- **WHEN** 上の帯の「閉じる」を押す
- **THEN** 帯が消え、次にページを開くまで出ない

### Requirement: 保存してから更新する

When the user presses "更新する" on the bar or "最新の版に更新" in the settings, the system SHALL first send unsent changes to the cloud if the user is signed in, waiting at most 5 seconds, and then reload the page with the latest files. Decks and purchase notes SHALL remain after the reload. When the changes could not be sent, the system SHALL show "クラウドへの保存は次に開いたときに行います", keep the unsent mark, and then reload.

#### Scenario: ログイン中に更新する

- **WHEN** ログイン中に、クラウドへまだ送っていないカードを足してから「更新する」を押す
- **THEN** クラウドに足したカードが届いてから開き直し、開き直したあともそのカードが入っている

#### Scenario: クラウドへ送れないときに更新する

- **WHEN** ログイン中に、クラウドへの書き込みが失敗する状態でカードを足してから「更新する」を押す
- **THEN** 「クラウドへの保存は次に開いたときに行います」と出てから開き直し、開き直したあともそのカードが入っている

#### Scenario: ログインしていないときに更新する

- **WHEN** ログインしていない状態で「更新する」を押す
- **THEN** 開き直したあともデッキと購入メモが残っている

### Requirement: 通信できないときは更新しない

When the page itself cannot be fetched, the system SHALL NOT reload and SHALL show "通信できないため更新できません".

#### Scenario: 電波が無いときに更新する

- **WHEN** 電波が無い状態で「更新する」を押す
- **THEN** 開き直さず、「通信できないため更新できません」と出る
