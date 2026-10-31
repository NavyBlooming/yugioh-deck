import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards, monsterInfo } from "../../src/core/cards.js";
import { emptyFilter, isFiltering, matchesFilter, filterLabel, RACE_OPTIONS } from "../../src/core/filter.js";

const cards = parseCards({
  version: 3,
  cards: [
    [1, "灰流うらら", "はるうらら", "effect", "effect", 2, 3, "", "2017-01-14", 4, 16, 4129, 0, 1800, 0],
    [2, "青眼の白龍", "ぶるーあいず", "normal", "normal", 3, 8, "", "", 16, 8192, 17, 3000, 2500, 0],
    [3, "デコード・トーカー", "でこーど", "link", "link", 3, 3, "", "", 32, 16777216, 67108897, 2300, 133, 0],
    [4, "アストログラフ・マジシャン", "あすとろ", "effect", "effect_pendulum", 3, 7, "", "", 32, 2, 16777249, 2500, 2000, 1],
    [5, "サイクロン", "さいくろん", "spell", "spell", 3, 0, "quickplay", ""],
    [6, "神の宣告", "かみのせんこく", "trap", "trap", 3, 0, "counter", ""],
    [7, "新種族", "しんしゅぞく", "effect", "effect", 3, 4, "", "", 32, 2 ** 27, 33, -2, 1000, 0],
    [8, "発売前", "はつばいまえ", "effect", "effect", 3, 4, ""],
  ],
});
const hits = (f) => [...cards.values()].filter((c) => matchesFilter(c, f)).map((c) => c.cid);
const F = (o) => ({ ...emptyFilter(), ...o });

test("何も選ばなければ全部当たり、絞り込み中ではない", () => {
  assert.equal(isFiltering(emptyFilter()), false);
  assert.deepEqual(hits(emptyFilter()), [1, 2, 3, 4, 5, 6, 7, 8]);
});

test("カードの種類: 同じ項目の中は「どれか」", () => {
  assert.deepEqual(hits(F({ kinds: ["link", "normal"] })), [2, 3]);
  assert.deepEqual(hits(F({ kinds: ["pendulum"] })), [4]);
  assert.deepEqual(hits(F({ kinds: ["effect"] })), [1, 4, 7, 8]);
  assert.deepEqual(hits(F({ kinds: ["spell"] })), [5]);
  assert.deepEqual(hits(F({ subs: ["counter", "quickplay"] })), [5, 6]);
});

test("属性・種族・チューナーなど。項目どうしは「すべて」、情報の無いカードは当たらない", () => {
  assert.deepEqual(hits(F({ attrs: [32] })), [3, 4, 7]);
  assert.deepEqual(hits(F({ attrs: [32, 16], races: [8192, 2] })), [2, 4]);
  assert.deepEqual(hits(F({ traits: [0x1000] })), [1]);
  assert.deepEqual(hits(F({ races: ["other"] })), [7]);
});

test("レベル・攻撃力・守備力の範囲。? とリンクの守備力は範囲に入らない", () => {
  assert.deepEqual(hits(F({ levelMin: 7 })), [2, 4]);
  assert.deepEqual(hits(F({ levelMin: 3, levelMax: 4 })), [1, 3, 7, 8]);
  assert.deepEqual(hits(F({ atkMin: 2500 })), [2, 4]);
  assert.deepEqual(hits(F({ atkMax: 100 })), [1]);
  assert.deepEqual(hits(F({ defMin: 1000, defMax: 2000 })), [1, 4, 7]);
});

test("filterLabel: 選んだ条件を短く並べる", () => {
  assert.equal(filterLabel(F({ attrs: [32], races: [8192], atkMin: 2500 })), "闇属性・ドラゴン族・攻撃力2500以上");
  assert.equal(filterLabel(F({ kinds: ["link"], levelMin: 2, levelMax: 3, defMax: 1000 })), "リンク・レベル2〜3・守備力1000以下");
});

test("monsterInfo: 名前の表に無い種族は「その他の種族」", () => {
  assert.equal(monsterInfo(cards.get(7)).race, "その他の種族");
  assert.ok(RACE_OPTIONS.some(([v, label]) => v === "other" && label === "その他"));
});
