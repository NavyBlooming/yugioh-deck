// 開いたときに読み込んだファイルの版と、サーバーの今の版を比べる。
// baseTag / freshTag は版（ETag など）を返し、取れなければ null を返す。
export function createVersionWatch({ urls, baseTag, freshTag, now, gap = 600000 }) {
  let base = null;
  let last = -Infinity;
  let found = false;
  let running = null;

  const run = async () => {
    if (!base) base = await Promise.all(urls().map(async (u) => [u, await baseTag(u)]));
    const fresh = await Promise.all(base.filter(([, tag]) => tag !== null).map(async ([u, tag]) => [tag, await freshTag(u)]));
    found = fresh.some(([tag, f]) => f !== null && f !== tag);
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
