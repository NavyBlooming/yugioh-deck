import { test } from "node:test";
import assert from "node:assert/strict";
import { drawOdds, tagOdds, drawHand } from "../../src/core/hand.js";

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test("drawOdds: 40枚に9枚、5枚引いたときの枚数ごとの確率（超幾何分布）", () => {
  const d = drawOdds(40, 9, 5);
  assert.equal(d.length, 6);
  // 0枚 = C(31,5)/C(40,5)
  near(d[0], 169911 / 658008);
  near(d[1], (9 * 31465) / 658008);
  near(d.reduce((a, b) => a + b, 0), 1);
});

test("drawOdds: 印のカードが引く枚数より少なければ、その枚数まで", () => {
  const d = drawOdds(40, 2, 5);
  assert.equal(d.length, 3);
  near(d[2], (1 * 8436) / 658008); // C(2,2)*C(38,3)/C(40,5)
});

test("drawOdds: 印が無ければ0枚が100%、デッキが引く枚数より少なければ null", () => {
  assert.deepEqual(drawOdds(40, 0, 5), [1]);
  assert.equal(drawOdds(4, 1, 5), null);
});

const deck = {
  entries: [
    { cid: 1, area: "main", count: 3, missing: 0, seq: 1 },
    { cid: 2, area: "main", count: 2, missing: 0, seq: 2 },
    { cid: 3, area: "main", count: 35, missing: 0, seq: 3 },
    { cid: 1, area: "cand", count: 1, missing: 0, seq: 4 },
    { cid: 9, area: "extra", count: 3, missing: 0, seq: 5 },
  ],
  tags: { hand: [1, 9], starter: [2] },
};

test("tagOdds: メインの印のカードの枚数だけ数える（候補・EX は数えない）", () => {
  const o = tagOdds(deck, "hand", 5);
  assert.equal(o.count, 3);
  assert.equal(o.total, 40);
  near(o.atLeastOne, 1 - drawOdds(40, 3, 5)[0]);
  assert.equal(tagOdds(deck, "starter", 6).count, 2);
  assert.equal(tagOdds({ entries: deck.entries }, "hand", 5).count, 0);
});

test("drawHand: メインから重ならずに引く", () => {
  let i = 0;
  const seq = [0.99, 0.01, 0.5, 0.2, 0.7, 0.3];
  const hand = drawHand(deck, 5, () => seq[i++ % seq.length]);
  assert.equal(hand.length, 5);
  assert.ok(hand.every((c) => [1, 2, 3].includes(c.cid)));
  const many = drawHand(deck, 40, Math.random);
  assert.deepEqual(many.map((c) => c.cid).sort((a, b) => a - b), [1, 1, 1, 2, 2, ...Array(35).fill(3)]);
  assert.equal(drawHand({ entries: [] }, 5, Math.random), null);
});

test("drawHand: 引いた1枚ごとに共用の印が付いてくる", () => {
  const d = { entries: [{ cid: 7, area: "main", count: 3, missing: 0, shared: 0b100, seq: 0 }, { cid: 8, area: "main", count: 2, missing: 0, seq: 1 }] };
  const hand = drawHand(d, 5, Math.random);
  assert.equal(hand.filter((c) => c.shared).length, 1);
  assert.ok(hand.find((c) => c.shared).cid === 7);
});
