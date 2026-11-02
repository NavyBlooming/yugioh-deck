// 開いたときに読み込んだファイルの版と、サーバーの今の版を比べる。
// baseTag / freshTag は版（ETag など）を返し、取れなければ null を返す。
// GitHub Pages の ETag は "更新時刻-大きさ"（16進）。裏のサーバーごとに時刻が1秒ほどずれ、
// 途中の配信網が10分ごとに取り直すたびに入れ替わるので、大きさが同じで時刻の差が60秒以内なら同じ版とみなす。
// 公開し直すと全ファイルの時刻が変わるので、新しい版はこれまでどおり見つかる
const PAGES_TAG = /^(?:W\/)?"([0-9a-f]+)-([0-9a-f]+)"$/;
export function sameTag(a, b) {
  const x = PAGES_TAG.exec(a);
  const y = PAGES_TAG.exec(b);
  if (!x || !y) return a === b;
  return x[2] === y[2] && Math.abs(parseInt(x[1], 16) - parseInt(y[1], 16)) <= 60;
}

export function createVersionWatch({ urls, baseTag, freshTag, now, gap = 600000 }) {
  let base = null;
  let last = -Infinity;
  let found = false;
  let running = null;

  const run = async () => {
    if (!base) base = await Promise.all(urls().map(async (u) => [u, await baseTag(u)]));
    const fresh = await Promise.all(base.filter(([, tag]) => tag !== null).map(async ([u, tag]) => [tag, await freshTag(u)]));
    found = fresh.some(([tag, f]) => f !== null && !sameTag(f, tag));
    return found;
  };

  return {
    check() {
      if (found) return Promise.resolve(true);
      if (running) return running;
      if (now() - last < gap) return Promise.resolve(false);
      last = now();
      running = run().finally(() => (running = null));
      return running;
    },
  };
}
