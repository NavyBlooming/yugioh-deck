import { test } from "node:test";
import assert from "node:assert/strict";
import { pick, rollDice, tossCoin } from "../../src/core/dice.js";

// 決めた順に32ビットの値を返す乱数
const seq = (...vals) => () => vals.shift();

test("pick: 32ビットの値を n で割った余りで選ぶ", () => {
  assert.equal(pick(6, seq(0)), 0);
  assert.equal(pick(6, seq(13)), 1);
});

test("pick: 割り切れない端の値は捨てて引き直す（偏りを出さない）", () => {
  // 2^32 = 6 * 715827882 + 4。0xFFFFFFFC 以上の4つは捨てる
  assert.equal(pick(6, seq(0xfffffffc, 0xffffffff, 7)), 1);
  assert.equal(pick(6, seq(0xfffffffb)), 0xfffffffb % 6);
});

test("rollDice: 指定した数だけ1〜6の目を返す", () => {
  assert.deepEqual(rollDice(1, seq(0)), [1]);
  assert.deepEqual(rollDice(3, seq(5, 0, 2)), [6, 1, 3]);
});

test("rollDice: 1〜3個以外は1個にする", () => {
  assert.deepEqual(rollDice(0, seq(1)), [2]);
  assert.deepEqual(rollDice(4, seq(1)), [2]);
});

test("tossCoin: 表か裏を返す", () => {
  assert.equal(tossCoin(seq(0)), "表");
  assert.equal(tossCoin(seq(1)), "裏");
});

test("rollDice: 既定の乱数でも1〜6に収まる", () => {
  for (let i = 0; i < 200; i++) for (const d of rollDice(3)) assert.ok(d >= 1 && d <= 6);
});
