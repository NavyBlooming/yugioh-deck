## MODIFIED Requirements

### Requirement: 新しい版の知らせ

The system SHALL remember the version (ETag, or Last-Modified when there is no ETag) of each same-site file the page loaded, except artwork files (.bin). It SHALL ask the server whether those files have changed 10 seconds after the page opens, whenever the user returns to the app or its window, and while the page stays visible, at most once every 10 minutes. A GitHub Pages ETag ("<modified time>-<size>" in hex, with or without W/) SHALL count as unchanged when the size is the same and the times differ by 60 seconds or less, because the servers behind the page differ by about a second. When any file has changed, the system SHALL show a bar at the top of the page with "新しい版があります", an "更新する" button and a "閉じる" button.

#### Scenario: 公開ページが新しくなる

- **WHEN** ページを開いたあとに公開ページのファイルが新しくなり、10分以上たってからアプリに戻る
- **THEN** ページの一番上に「新しい版があります」と「更新する」が出る

#### Scenario: 変わっていない

- **WHEN** ページを開いたあと、公開ページのファイルが変わっていない
- **THEN** 上の帯は出ない

#### Scenario: PC で開いたままにしている

- **WHEN** PC でページを開いたまま見えている状態にしておき、その間に公開ページのファイルが新しくなる
- **THEN** 10分ほどのうちに、ページの一番上に「新しい版があります」と「更新する」が出る

#### Scenario: サーバーの間の時刻のずれ

- **WHEN** 公開していないのに、問い合わせたサーバーが違い、ETag が W/"6ae894c1-269" から W/"6ae894c0-269" に変わる
- **THEN** 上の帯は出ない
