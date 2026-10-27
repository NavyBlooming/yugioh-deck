import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STORAGE_KEY, emptyState, isValidState, exportJson, parseImport, exportFileName, loadState, saveState,
} from "../../src/core/storage.js";

const good = () => ({
  version: 1,
  decks: [{ id: "d1", name: "デッキ", cover: 12950, entries: [{ cid: 12950, area: "main", count: 3, missing: 1, seq: 1 }] }],
  notes: { 12950: { price: 580, rarity: "SE", print: "RC04-JP009" } },
  nextSeq: 2,
});
const fake = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), m };
};

test("emptyState と STORAGE_KEY", () => {
  assert.equal(STORAGE_KEY, "ygo.data.v1");
  assert.deepEqual(emptyState(), { version: 1, decks: [], notes: {}, nextSeq: 1 });
  assert.ok(isValidState(emptyState()));
});

test("正しい形は通る", () => {
  assert.ok(isValidState(good()));
  const m = good();
  m.decks[0].entries[0].mask = 2;
  assert.ok(isValidState(m));
  const s = good();
  s.decks[0].cover = null;
  assert.ok(isValidState(s));
});

test("お気に入りと履歴は無くてもよく、あれば形を確かめる", () => {
  const s = good();
  s.favorites = [12950];
  s.decks[0].history = [{ cid: 12950, op: "in" }, { cid: 9455, op: "out" }];
  assert.ok(isValidState(s));
  let b = good(); b.favorites = ["12950"]; assert.equal(isValidState(b), false);
  b = good(); b.decks[0].history = [{ cid: 1, op: "move" }]; assert.equal(isValidState(b), false);
  b = good(); b.decks[0].history = {}; assert.equal(isValidState(b), false);
});

test("exportJson はお気に入りと履歴を含める", () => {
  const s = { ...good(), favorites: [12950] };
  s.decks[0].history = [{ cid: 12950, op: "in" }];
  const back = parseImport(exportJson(s));
  assert.ok(back.ok);
  assert.deepEqual(back.state.favorites, [12950]);
  assert.deepEqual(back.state.decks[0].history, [{ cid: 12950, op: "in" }]);
});

test("不正な形は拒否", () => {
  let s = good(); s.version = 2; assert.equal(isValidState(s), false);
  s = good(); s.decks[0].entries[0].missing = 4; assert.equal(isValidState(s), false);
  s = good(); s.decks[0].entries[0].mask = 3; assert.equal(isValidState(s), false); // 暗い位置が2つで missing と合わない
  s = good(); s.decks[0].entries[0].mask = 8; assert.equal(isValidState(s), false); // 4枚目の位置
  s = good(); s.decks[0].entries[0].mask = 1.5; assert.equal(isValidState(s), false);
  s = good(); s.decks[0].entries[0].count = 0; assert.equal(isValidState(s), false);
  s = good(); s.decks[0].entries[0].area = "side"; assert.equal(isValidState(s), false);
  s = good(); s.notes[12950].price = "580"; assert.equal(isValidState(s), false);
  s = good(); s.nextSeq = "2"; assert.equal(isValidState(s), false);
  assert.equal(isValidState(null), false);
  assert.equal(isValidState("x"), false);
});

test("parseImport", () => {
  assert.equal(parseImport("これはJSONではない").ok, false);
  assert.equal(parseImport(JSON.stringify({ ...good(), version: 2 })).ok, false);
  const r = parseImport(JSON.stringify(good()));
  assert.ok(r.ok);
  assert.deepEqual(r.state, good());
});

test("exportJson は余計なキーを落とす", () => {
  const out = exportJson({ ...good(), pass: "secret" });
  assert.ok(!out.includes("secret"));
  assert.deepEqual(Object.keys(JSON.parse(out)).sort(), ["decks", "nextSeq", "notes", "version"]);
});

test("exportFileName はローカル日付", () => {
  assert.equal(exportFileName(new Date(2026, 9, 5)), "yugioh-deck-2026-10-05.json");
});

test("save → load", () => {
  const st = fake();
  assert.deepEqual(loadState(st), emptyState());
  saveState(st, good());
  assert.ok(st.m.has(STORAGE_KEY));
  assert.deepEqual(loadState(st), good());
  st.setItem(STORAGE_KEY, "{壊れ");
  assert.deepEqual(loadState(st), emptyState());
  st.setItem(STORAGE_KEY, JSON.stringify({ version: 9 }));
  assert.deepEqual(loadState(st), emptyState());
});
