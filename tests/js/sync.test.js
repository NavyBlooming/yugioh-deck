import { test } from "node:test";
import assert from "node:assert/strict";
import { isEmptyState, decideOnSignIn, createScheduler, decideOnResume } from "../../src/core/sync.js";
import { emptyState } from "../../src/core/storage.js";

const withDeck = () => ({
  version: 1,
  decks: [{ id: "d1", name: "デッキ", cover: null, entries: [{ cid: 12950, area: "main", count: 1, missing: 0, seq: 1 }] }],
  notes: {},
  nextSeq: 2,
});
const withNote = () => ({ ...emptyState(), notes: { 12950: { price: 580, rarity: "", print: "" } } });

test("isEmptyState: デッキも購入メモも無いときだけ空", () => {
  assert.equal(isEmptyState(emptyState()), true);
  assert.equal(isEmptyState(withDeck()), false);
  assert.equal(isEmptyState(withNote()), false);
});

test("decideOnSignIn: クラウドに無ければ送る", () => {
  assert.equal(decideOnSignIn(withDeck(), null), "upload");
  assert.equal(decideOnSignIn(emptyState(), null), "upload");
});

test("decideOnSignIn: 端末が空ならクラウドを使う", () => {
  assert.equal(decideOnSignIn(emptyState(), withDeck()), "download");
});

test("decideOnSignIn: 同じなら何もしない", () => {
  assert.equal(decideOnSignIn(withDeck(), withDeck()), "same");
});

test("decideOnSignIn: 両方にあって違えば選んでもらう", () => {
  assert.equal(decideOnSignIn(withDeck(), withNote()), "ask");
  assert.equal(decideOnSignIn(withNote(), withDeck()), "ask");
});

// 時計とタイマーを差し替える。advance で時刻を進め、期限の来たタイマーを順に動かす
function fakeClock() {
  let t = 0;
  let timers = [];
  let nextId = 1;
  return {
    now: () => t,
    setTimer: (fn, ms) => {
      const id = nextId++;
      timers.push({ id, at: t + ms, fn });
      return id;
    },
    clearTimer: (id) => {
      timers = timers.filter((x) => x.id !== id);
    },
    async advance(ms) {
      const end = t + ms;
      for (;;) {
        timers.sort((a, b) => a.at - b.at);
        const next = timers[0];
        if (!next || next.at > end) break;
        timers.shift();
        t = next.at;
        next.fn();
        await settle();
      }
      t = end;
      await settle();
    },
  };
}
const settle = () => new Promise((r) => setImmediate(r));

function setup({ fail = () => false, hold = false } = {}) {
  const clock = fakeClock();
  const writes = [];
  let release = null;
  const write = () => {
    writes.push(clock.now());
    if (hold) return new Promise((r) => (release = r));
    return fail() ? Promise.reject(new Error("offline")) : Promise.resolve();
  };
  const s = createScheduler({ write, now: clock.now, setTimer: clock.setTimer, clearTimer: clock.clearTimer, interval: 30000 });
  return { clock, writes, s, release: () => release() };
}

test("createScheduler: 前回から30秒たっていればすぐ書く", async () => {
  const { s, writes } = setup();
  s.schedule();
  await settle();
  assert.deepEqual(writes, [0]);
  assert.equal(s.dirty, false);
});

test("createScheduler: 30秒以内の変更は30秒たった時点で1回だけ書く", async () => {
  const { s, writes, clock } = setup();
  s.schedule();
  await settle();
  for (let i = 0; i < 5; i++) {
    await clock.advance(5000);
    s.schedule();
  }
  assert.deepEqual(writes, [0]);
  assert.equal(s.dirty, true);
  await clock.advance(5000);
  assert.deepEqual(writes, [0, 30000]);
  assert.equal(s.dirty, false);
});

test("createScheduler: 2分間5秒おきに変更しても30秒に1回まで", async () => {
  const { s, writes, clock } = setup();
  for (let t = 0; t < 120000; t += 5000) {
    s.schedule();
    await clock.advance(5000);
  }
  await clock.advance(60000);
  assert.deepEqual(writes, [0, 30000, 60000, 90000, 120000]);
  assert.equal(s.dirty, false);
});

test("createScheduler: flush は待たずに書き、予約は取り消す", async () => {
  const { s, writes, clock } = setup();
  s.schedule();
  await settle();
  await clock.advance(1000);
  s.schedule();
  await s.flush();
  assert.deepEqual(writes, [0, 1000]);
  await clock.advance(60000);
  assert.deepEqual(writes, [0, 1000]);
});

test("createScheduler: 送るものが無ければ flush しても書かない", async () => {
  const { s, writes } = setup();
  await s.flush();
  assert.deepEqual(writes, []);
});

test("createScheduler: 書き込み中に来た変更は書き終えた後にもう1回書く", async () => {
  const { s, writes, clock, release } = setup({ hold: true });
  s.schedule();
  await settle();
  s.schedule();
  assert.deepEqual(writes, [0]);
  release();
  await settle();
  assert.equal(s.dirty, true);
  await clock.advance(30000);
  assert.deepEqual(writes, [0, 30000]);
});

test("createScheduler: 失敗したら印を残し、次の flush で書き直す", async () => {
  let failing = true;
  const { s, writes } = setup({ fail: () => failing });
  s.schedule();
  await settle();
  assert.equal(s.dirty, true);
  failing = false;
  await s.flush();
  assert.equal(writes.length, 2);
  assert.equal(s.dirty, false);
});

test("decideOnResume: 未送信があれば書き込む", () => {
  assert.equal(decideOnResume(true, 2000, 1000), "push");
  assert.equal(decideOnResume(true, null, 1000), "push");
});

test("decideOnResume: クラウドが新しければ取り込む", () => {
  assert.equal(decideOnResume(false, 2000, 1000), "pull");
});

test("decideOnResume: それ以外は何もしない", () => {
  assert.equal(decideOnResume(false, 1000, 1000), "none");
  assert.equal(decideOnResume(false, null, 1000), "none");
});
