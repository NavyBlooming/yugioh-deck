# Proposal

## Why

カードラッシュのほかに、ドラスタの値段も買い物リストから確かめたい。

## What Changes

- 買い物リストの各行に、ドラスタでカード名を検索した結果を開くリンクを足す
- カード詳細（長押しメニュー）のカードラッシュのリンクは外し、ショップへのリンクは買い物リストにまとめる

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `shopping-list`: ドラスタへのリンク

## Impact

- `src/core/shopping.js`、`src/ui/shop.js`、`src/ui/deck.js`
