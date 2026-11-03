import { test } from "node:test";
import assert from "node:assert/strict";
import {
  SLOTS, addCounter, changeLife, detach, drawCards, endTurn, findCard, history, moveCard, placeToken, redo, record, setPosition, shuffleDeck, startSolo, undo,
} from "../../src/core/solo.js";

const cards = new Map([
  [1, { cid: 1, frame: "effect" }],
  [2, { cid: 2, frame: "spell" }],
  [3, { cid: 3, frame: "effect_pendulum" }],
  [9, { cid: 9, frame: "xyz" }],
]);
const deck = {
  entries: [
    { cid: 1, area: "main", count: 3 },
    { cid: 2, area: "main", count: 3 },
    { cid: 3, area: "main", count: 1 },
    { cid: 9, area: "extra", count: 2 },
    { cid: 1, area: "cand", count: 2 },
  ],
};
// 混ぜない乱数（Fisher–Yates で毎回いちばん後ろを選ぶ）
const keep = () => 0.999999;

const start = (draw = 5) => startSolo(deck, cards, draw, keep);
const handIds = (b) => b.hand.map((c) => c.id);

test("startSolo: メインを混ぜて draw 枚引き、EX は EXデッキへ、候補は使わない", () => {
  const b = start(5);
  assert.equal(b.hand.length, 5);
  assert.equal(b.deck.length, 2);
  assert.deepEqual(b.extra.map((c) => c.cid), [9, 9]);
  assert.equal(b.extra[0].face, "down");
  assert.equal(b.life, 8000);
  assert.equal(b.turn, 1);
  assert.deepEqual(SLOTS.map((s) => b.slots[s]), SLOTS.map(() => null));
  const ids = [...b.hand, ...b.deck, ...b.extra].map((c) => c.id);
  assert.equal(new Set(ids).size, 9);
  assert.ok(b.nextId > Math.max(...ids)); // トークンの番号がカードと重ならない
});

test("startSolo: 後攻は6枚。デッキが足りなければある分だけ引く", () => {
  assert.equal(start(6).hand.length, 6);
  assert.equal(startSolo({ entries: [{ cid: 1, area: "main", count: 2 }] }, cards, 5, keep).hand.length, 2);
});

test("shuffleDeck: 渡した乱数で混ぜ、ほかは変えない", () => {
  const b = start(0);
  const before = b.deck.map((c) => c.id);
  const s = shuffleDeck(b, () => 0);
  assert.notDeepEqual(s.deck.map((c) => c.id), before);
  assert.deepEqual([...s.deck.map((c) => c.id)].sort(), [...before].sort());
  assert.deepEqual(b.deck.map((c) => c.id), before); // 元の盤面は変えない
});

test("drawCards: デッキの上から手札の右へ。無ければある分だけ", () => {
  const b = start(0);
  const top = b.deck[0].id;
  const d = drawCards(b, 1);
  assert.equal(d.hand.at(-1).id, top);
  assert.equal(d.deck.length, 6);
  assert.equal(drawCards(b, 10).hand.length, 7);
});

test("moveCard: 手札から空いたモンスターゾーンへは表側攻撃表示、魔法罠ゾーンへは表側", () => {
  const b = start(5);
  const [a, c] = handIds(b);
  let n = moveCard(b, a, "m2");
  assert.equal(n.slots.m2.id, a);
  assert.equal(n.slots.m2.face, "up");
  assert.equal(n.slots.m2.pos, "atk");
  assert.ok(!handIds(n).includes(a));
  n = moveCard(n, c, "s0");
  assert.equal(n.slots.s0.id, c);
});

test("moveCard: 場の中で動かしても表示形式は変えない", () => {
  let b = start(5);
  const a = handIds(b)[0];
  b = moveCard(b, a, "m0");
  b = setPosition(b, a, { face: "down", pos: "def" });
  b = moveCard(b, a, "e1");
  assert.equal(b.slots.m0, null);
  assert.deepEqual([b.slots.e1.face, b.slots.e1.pos], ["down", "def"]);
});

test("moveCard: 束へ動かすと表側攻撃表示に戻りカウンターは消える。デッキは上か下へ", () => {
  let b = start(5);
  const [a, c] = handIds(b);
  b = moveCard(b, a, "m0");
  b = setPosition(b, a, { face: "down", pos: "def" });
  b = addCounter(b, a, 2);
  b = moveCard(b, a, "gy");
  assert.deepEqual([b.gy[0].face, b.gy[0].pos, b.gy[0].counters], ["up", "atk", 0]);
  assert.equal(b.slots.m0, null);
  b = moveCard(b, c, "deck");
  assert.equal(b.deck[0].id, c);
  b = moveCard(b, a, "deck", { bottom: true });
  assert.equal(b.deck.at(-1).id, a);
  assert.equal(b.gy.length, 0);
});

test("moveCard: 手札の中で並びを変えられる", () => {
  const b = start(5);
  const ids = handIds(b);
  assert.deepEqual(handIds(moveCard(b, ids[4], "hand", { index: 0 })), [ids[4], ...ids.slice(0, 4)]);
});

test("moveCard: 埋まったゾーンへは重ね方を指定しないと動かさない", () => {
  let b = start(5);
  const [a, c] = handIds(b);
  b = moveCard(b, a, "m0");
  assert.equal(moveCard(b, c, "m0"), null);
});

test("moveCard: 上に重ねると、元のカードとその素材が素材になる", () => {
  let b = start(5);
  const [a, c] = handIds(b);
  const x = b.extra[0].id;
  b = moveCard(b, a, "m0");
  b = moveCard(b, c, "m0", { stack: "under" });
  b = moveCard(b, x, "m0", { stack: "top" });
  assert.equal(b.slots.m0.id, x);
  assert.equal(b.slots.m0.face, "up");
  assert.deepEqual(b.slots.m0.mats.map((m) => m.id), [a, c]);
  assert.equal(b.slots.m0.mats[0].mats.length, 0);
  assert.equal(findCard(b, c).zone, "mat");
});

test("moveCard: 素材を持ったカードが束へ行くと素材は墓地へ。素材も1枚ずつ動かせる", () => {
  let b = start(5);
  const [a, c, d] = handIds(b);
  b = moveCard(b, a, "m0");
  b = moveCard(b, c, "m0", { stack: "under" });
  b = moveCard(b, d, "m0", { stack: "under" });
  const m = moveCard(b, d, "hand");
  assert.deepEqual(m.slots.m0.mats.map((x) => x.id), [c]);
  assert.ok(handIds(m).includes(d));
  const g = moveCard(b, a, "ban");
  assert.deepEqual(g.ban.map((x) => x.id), [a]);
  assert.deepEqual(g.gy.map((x) => x.id).sort(), [c, d].sort());
});

test("detach: 素材を1つ墓地へ", () => {
  let b = start(5);
  const [a, c] = handIds(b);
  b = moveCard(b, a, "m0");
  b = moveCard(b, c, "m0", { stack: "under" });
  b = detach(b, a);
  assert.equal(b.slots.m0.mats.length, 0);
  assert.equal(b.gy[0].id, c);
  assert.equal(detach(b, a), null);
});

test("moveCard: EXデッキへは裏側。場にあったペンデュラムは表側で", () => {
  let b = start(7);
  const p = b.hand.find((c) => c.cid === 3).id;
  const x = b.extra[0].id;
  b = moveCard(b, x, "m0");
  b = moveCard(b, x, "extra");
  assert.equal(b.extra.find((c) => c.id === x).face, "down");
  b = moveCard(b, p, "s0");
  b = moveCard(b, p, "extra");
  assert.equal(b.extra.find((c) => c.id === p).face, "up");
});

test("placeToken: 空いたモンスターゾーンにだけ置け、場を離れると消える", () => {
  let b = start(5);
  b = placeToken(b, "m4");
  const t = b.slots.m4;
  assert.equal(t.token, true);
  assert.equal(placeToken(b, "m4"), null);
  assert.equal(placeToken(b, "s0"), null);
  const g = moveCard(b, t.id, "gy");
  assert.equal(g.slots.m4, null);
  assert.equal(g.gy.length, 0);
  assert.equal(moveCard(b, t.id, "m3").slots.m3.id, t.id);
});

test("addCounter: 0 より下にはしない", () => {
  let b = start(5);
  const a = handIds(b)[0];
  b = moveCard(b, a, "s1");
  b = addCounter(b, a, 1);
  assert.equal(b.slots.s1.counters, 1);
  assert.equal(addCounter(addCounter(b, a, -1), a, -1).slots.s1.counters, 0);
});

test("changeLife・endTurn", () => {
  const b = start(5);
  assert.equal(changeLife(b, -1000).life, 7000);
  assert.equal(changeLife(b, -9000).life, 0);
  assert.equal(endTurn(endTurn(b)).turn, 3);
});

test("history: 記録して元に戻す・やり直す。新しく記録したらやり直しは消える", () => {
  const b = start(5);
  let h = history(b);
  h = record(h, drawCards(h.now, 1));
  assert.equal(h.now.hand.length, 6);
  h = undo(h);
  assert.equal(h.now.hand.length, 5);
  assert.equal(redo(h).now.hand.length, 6);
  h = record(h, changeLife(h.now, -500));
  assert.equal(h.future.length, 0);
  assert.equal(undo(history(b)), null);
  assert.equal(redo(h), null);
});

test("history: 200 手より前は捨てる", () => {
  let h = history(start(5));
  for (let i = 0; i < 205; i++) h = record(h, changeLife(h.now, -1));
  assert.equal(h.past.length, 200);
});
