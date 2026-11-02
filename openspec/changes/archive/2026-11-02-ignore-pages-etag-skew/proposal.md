# Proposal

## Why

公開していないのに「新しい版があります」の帯が出る。GitHub Pages の ETag は「更新時刻-大きさ」で、裏のサーバーごとに時刻が1秒ほどずれており、途中の配信網が10分ごとに取り直すたびに、同じ版でも ETag が入れ替わるため。

## What Changes

- GitHub Pages の形の ETag は、大きさが同じで時刻の差が60秒以内なら、同じ版とみなす

## Capabilities

### New Capabilities

（なし）

### Modified Capabilities

- `app-update`: 版の比べ方

## Impact

- `src/core/update.js`
