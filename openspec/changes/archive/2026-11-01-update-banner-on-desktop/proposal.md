# Proposal

## Why

新しい版の問い合わせは、開いて10秒後とアプリに戻ってきたとき（ページが隠れた状態から見える状態に変わったとき）だけ行っている。PC ではタブを開いたまま別のウィンドウに切り替えても隠れた扱いにならないことが多く、開いたままのタブでは新しい版の知らせが出ない。

## What Changes

- ウィンドウに戻ったとき（focus）にも問い合わせる
- ページが見えている間は1分ごとに確かめ、前の問い合わせから10分たっていれば問い合わせる

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `app-update`: 開いたままの PC でも新しい版を知らせる

## Impact

- `src/ui/update.js`
