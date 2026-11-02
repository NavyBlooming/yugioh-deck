import { test } from "node:test";
import assert from "node:assert/strict";
import { createVersionWatch, sameTag } from "../../src/core/update.js";

// base: 開いたときに読み込んだ版、fresh: サーバーの今の版
const setup = (base, fresh) => {
  let t = 0;
  const calls = { base: 0, fresh: 0 };
  const w = createVersionWatch({
    urls: () => Object.keys(base),
    baseTag: async (u) => (calls.base++, base[u] ?? null),
    freshTag: async (u) => (calls.fresh++, fresh[u] ?? null),
    now: () => t,
  });
  return { w, calls, fresh, advance: (ms) => (t += ms) };
};

test("createVersionWatch: 変わっていなければ新しい版なし", async () => {
  const { w } = setup({ "a.js": "1", "b.css": "2" }, { "a.js": "1", "b.css": "2" });
  assert.equal(await w.check(), false);
});

test("createVersionWatch: どれか1つ変わっていれば新しい版あり", async () => {
  const { w } = setup({ "a.js": "1", "b.css": "2" }, { "a.js": "1", "b.css": "3" });
  assert.equal(await w.check(), true);
});

test("createVersionWatch: 10分たつまでは問い合わせない", async () => {
  const { w, calls, fresh, advance } = setup({ "a.js": "1" }, { "a.js": "1" });
  assert.equal(await w.check(), false);
  fresh["a.js"] = "2";
  advance(599999);
  assert.equal(await w.check(), false);
  assert.equal(calls.fresh, 1);
  advance(1);
  assert.equal(await w.check(), true);
  assert.equal(calls.fresh, 2);
});

test("createVersionWatch: 開いたときの版は最初の1回だけ覚える", async () => {
  const { w, calls, advance } = setup({ "a.js": "1" }, { "a.js": "1" });
  await w.check();
  advance(600000);
  await w.check();
  assert.equal(calls.base, 1);
});

test("createVersionWatch: 取れなかったファイルは比べない", async () => {
  assert.equal(await setup({ "a.js": null }, { "a.js": "2" }).w.check(), false);
  assert.equal(await setup({ "a.js": "1" }, { "a.js": null }).w.check(), false);
});

test("createVersionWatch: 一度新しい版と分かったら問い合わせずにそのまま", async () => {
  const { w, calls, fresh, advance } = setup({ "a.js": "1" }, { "a.js": "2" });
  assert.equal(await w.check(), true);
  fresh["a.js"] = "1";
  advance(600000);
  assert.equal(await w.check(), true);
  assert.equal(calls.fresh, 1);
});

test("createVersionWatch: 問い合わせ中に呼ばれても重ねて問い合わせない", async () => {
  const { w, calls } = setup({ "a.js": "1" }, { "a.js": "1" });
  await Promise.all([w.check(), w.check()]);
  assert.equal(calls.fresh, 1);
});

test("sameTag: GitHub Pages のサーバーの間で時刻が1秒ずれただけなら同じ版", () => {
  // 公開ページで実際に返ってきた2通りの ETag（同じ公開の index.html）
  assert.equal(sameTag('W/"6ae894c1-269"', 'W/"6ae894c0-269"'), true);
  assert.equal(sameTag('"6ae894c1-269"', 'W/"6ae894c1-269"'), true); // 圧縮の有無で W/ が付くだけ
  assert.equal(sameTag('W/"6ae894c0-269"', 'W/"6ae8950c-269"'), false); // 時刻が60秒より離れていれば公開し直した版
  assert.equal(sameTag('W/"6ae894c0-269"', 'W/"6ae894c0-26a"'), false); // 大きさが違えば別の版
  assert.equal(sameTag("Mon, 02 Nov 2026 13:47:39 GMT", "Mon, 02 Nov 2026 13:47:39 GMT"), true); // 形が違えばそのまま比べる
  assert.equal(sameTag('"abc"', '"abd"'), false);
});

test("createVersionWatch: サーバーの間の時刻のずれでは新しい版にしない", async () => {
  const { w } = setup({ "index.html": 'W/"6ae894c1-269"' }, { "index.html": 'W/"6ae894c0-269"' });
  assert.equal(await w.check(), false);
});
