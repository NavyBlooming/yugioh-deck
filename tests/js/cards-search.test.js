import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards, areaOf, MAIN_GROUPS, EXTRA_GROUPS } from "../../src/core/cards.js";
import { normalize, buildIndex, search } from "../../src/core/search.js";

const RAW = {
  version: 1,
  cards: [
    [1, "灰流うらら", "はるうらら", "effect", "effect", 2],
    [2, "ABC－ドラゴン・バスター", "えーびーしーどらごんばすたー", "fusion", "fusion", 3],
    [3, "うららの舞", "うららのまい", "spell", "spell", null],
    [4, "No.39 希望皇ホープ", "ナンバーズ３９　きぼうおうホープ", "xyz", "xyz", 3],
  ],
};

test("parseCards は cid をキーにした Map を返す", () => {
  const m = parseCards(RAW);
  assert.equal(m.size, 4);
  assert.deepEqual(m.get(1), { cid: 1, name: "灰流うらら", ruby: "はるうらら", group: "effect", frame: "effect", limit: 2 });
  assert.equal(m.get(3).limit, null);
});

test("areaOf は extra 群だけ extra", () => {
  const m = parseCards(RAW);
  assert.equal(areaOf(m.get(1)), "main");
  assert.equal(areaOf(m.get(2)), "extra");
  assert.equal(areaOf(m.get(4)), "extra");
  assert.deepEqual(MAIN_GROUPS, ["normal", "effect", "spell", "trap"]);
  assert.deepEqual(EXTRA_GROUPS, ["fusion", "synchro", "xyz", "link"]);
});

test("normalize", () => {
  assert.equal(normalize("ハルウララ"), "はるうらら");
  assert.equal(normalize("ABC－ドラゴン・バスター"), "abcどらごんばすたー");
  assert.equal(normalize("  　"), "");
  assert.equal(normalize("ﾊﾙ"), "はる");
});

const index = buildIndex([...parseCards(RAW).values()]);
const names = (q) => search(index, q).map((c) => c.name);

test("読み・カタカナ・名前の一部・記号違いで当たる", () => {
  assert.ok(names("はるう").includes("灰流うらら"));
  assert.ok(names("ハルウララ").includes("灰流うらら"));
  assert.ok(names("うらら").includes("灰流うらら"));
  assert.ok(names("ABCドラゴンバスター").includes("ABC－ドラゴン・バスター"));
});

test("前方一致が先", () => {
  assert.deepEqual(names("うらら"), ["うららの舞", "灰流うらら"]);
});

test("空白だけは空", () => {
  assert.deepEqual(search(index, " 　"), []);
});

test("読みにカタカナと全角が混ざっても当たる", () => {
  assert.deepEqual(names("きぼうおう"), ["No.39 希望皇ホープ"]);
});

test("limit で件数を絞る", () => {
  assert.equal(search(index, "うらら", 1).length, 1);
});
