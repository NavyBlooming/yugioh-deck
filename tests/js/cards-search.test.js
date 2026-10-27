import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards, areaOf, MAIN_GROUPS, EXTRA_GROUPS } from "../../src/core/cards.js";
import { normalize, buildIndex, search, buildTextIndex, searchWithText } from "../../src/core/search.js";

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
  assert.deepEqual(m.get(1), {
    cid: 1, name: "灰流うらら", ruby: "はるうらら", group: "effect", frame: "effect", limit: 2, level: 0, sub: "",
  });
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

test("結果はデッキと同じ並び（効果モンスターが魔法より先）", () => {
  assert.deepEqual(names("うらら"), ["灰流うらら", "うららの舞"]);
});

test("結果は種類 → レベルや魔法・罠の種類 → 読みの順で、件数を絞らなければ全部返す", () => {
  const many = parseCards({
    version: 2,
    cards: [
      [10, "竜の融合", "りゅうのゆうごう", "fusion", "fusion", 3, 8, ""],
      [11, "竜の罠", "りゅうのわな", "trap", "trap", 3, 0, "normal"],
      [12, "竜の速攻", "りゅうのそっこう", "spell", "spell", 3, 0, "quickplay"],
      [13, "竜の場", "りゅうのば", "spell", "spell", 3, 0, "field"],
      [14, "竜L4い", "りゅうい", "effect", "effect", 3, 4, ""],
      [15, "竜L4あ", "りゅうあ", "effect", "effect", 3, 4, ""],
      [16, "竜L2", "りゅうに", "effect", "effect", 3, 2, ""],
      [17, "竜の通常", "りゅうのつうじょう", "normal", "normal", 3, 7, ""],
      ...Array.from({ length: 70 }, (_, i) => [100 + i, "竜" + i, "りゅう" + i, "effect", "effect", 3, 12, ""]),
    ],
  });
  const r = search(buildIndex([...many.values()]), "竜");
  assert.equal(r.length, 78);
  assert.deepEqual(r.slice(0, 4).map((c) => c.cid), [17, 16, 15, 14]);
  assert.deepEqual(r.slice(-4).map((c) => c.cid), [13, 12, 11, 10]);
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

const TEXTS = {
  1: "このカードを手札から捨てて発動できる。その効果を無効にする。",
  2: "「うらら」と名のついたカードを素材にする。",
  3: "相手は手札から捨てる。",
};

test("searchWithText: スペースで区切った語をすべて含む効果テキストに当たる", () => {
  const idx = buildIndex([...parseCards(RAW).values()]);
  const t = buildTextIndex(TEXTS);
  assert.deepEqual(searchWithText(idx, t, "手札から捨てて 無効").map((c) => c.cid), [1]);
  assert.deepEqual(searchWithText(idx, t, "てふだ").map((c) => c.cid), []);
  assert.deepEqual(searchWithText(idx, t, "手札 捨て").map((c) => c.cid), [1, 3]); // デッキと同じ並び
});

test("searchWithText: 名前で当たるカードを先に並べ、同じカードは二度出さない", () => {
  const idx = buildIndex([...parseCards(RAW).values()]);
  const t = buildTextIndex(TEXTS);
  const r = searchWithText(idx, t, "うらら").map((c) => c.cid);
  assert.deepEqual(r, [1, 3, 2]); // 名前で当たる 灰流うらら・うららの舞 の後に、効果テキストだけで当たるカード
});

test("searchWithText: 空の入力は何も返さない", () => {
  const idx = buildIndex([...parseCards(RAW).values()]);
  assert.deepEqual(searchWithText(idx, buildTextIndex(TEXTS), "   "), []);
});
