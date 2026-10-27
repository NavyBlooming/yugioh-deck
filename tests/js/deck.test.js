import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards } from "../../src/core/cards.js";
import { emptyState } from "../../src/core/storage.js";
import {
  createDeck, renameDeck, deleteDeck, addCard, removeOne, moveOne, tapCopy,
  sortedEntries, tilesOf, warnings, deckSummary, addHandTraps, toggleFavorite,
} from "../../src/core/deck.js";

const cards = parseCards({
  version: 1,
  cards: [
    [1, "通常A", "つうじょうえー", "normal", "normal", 3],
    [2, "効果A", "こうかえー", "effect", "effect", 3],
    [3, "効果B", "こうかびー", "effect", "effect", 3],
    [4, "魔法A", "まほうえー", "spell", "spell", 3],
    [5, "罠A", "わなえー", "trap", "trap", 3],
    [6, "融合A", "ゆうごうえー", "fusion", "fusion", 3],
    [7, "シンクロA", "しんくろえー", "synchro", "synchro", 3],
    [8, "禁止A", "きんしえー", "effect", "effect", 0],
    [9, "制限A", "せいげんえー", "effect", "effect", 1],
    [10, "準制限A", "じゅんせいげんえー", "effect", "effect", 2],
    [11, "不明A", "ふめいえー", "effect", "effect", null],
    [12, "リンクA", "りんくえー", "link", "link", 3],
  ],
});
const c = (cid) => cards.get(cid);

function setup() {
  const r = createDeck(emptyState(), "テスト");
  return { state: r.state, id: r.deckId };
}
function add(state, id, cid, n = 1, dest = "deck") {
  for (let i = 0; i < n; i++) {
    const r = addCard(state, id, c(cid), dest);
    assert.ok(r.ok, r.reason);
    state = r.state;
  }
  return state;
}
// 別カードを大量に作って区分を満杯にするための補助
function fill(state, id, group, kinds, dest, base) {
  const pool = parseCards({
    version: 1,
    cards: Array.from({ length: kinds + 1 }, (_, i) => [base + i, "n" + (base + i), "n", group, group, 3]),
  });
  for (let i = 0; i < kinds; i++) {
    for (let k = 0; k < 3; k++) state = addCard(state, id, pool.get(base + i), dest).state;
  }
  return { state, spare: pool.get(base + kinds) };
}
const deckOf = (s, id) => s.decks.find((d) => d.id === id);
const entry = (s, id, cid, area) => deckOf(s, id).entries.find((e) => e.cid === cid && e.area === area);

test("デッキの作成・改名・削除と元 state の不変", () => {
  const s0 = emptyState();
  const r = createDeck(s0, "リビングデッド");
  assert.equal(s0.decks.length, 0);
  assert.equal(r.state.decks[0].name, "リビングデッド");
  assert.equal(r.state.decks[0].entries.length, 0);
  assert.equal(r.state.decks[0].cover, null);
  assert.equal(r.state.decks[0].id, r.deckId);
  const r2 = renameDeck(r.state, r.deckId, "新");
  assert.equal(deckOf(r2.state, r.deckId).name, "新");
  assert.equal(deckOf(r.state, r.deckId).name, "リビングデッド");
  assert.equal(deleteDeck(r2.state, r.deckId).state.decks.length, 0);
});

test("addCard: 区分・seq・nextSeq", () => {
  let { state, id } = setup();
  state = add(state, id, 2);
  state = add(state, id, 6);
  state = add(state, id, 2, 1, "cand");
  assert.equal(entry(state, id, 2, "main").count, 1);
  assert.equal(entry(state, id, 6, "extra").count, 1);
  assert.equal(entry(state, id, 2, "cand").count, 1);
  assert.equal(entry(state, id, 2, "main").seq, 1);
  assert.equal(entry(state, id, 6, "extra").seq, 2);
  assert.equal(state.nextSeq, 4);
  state = add(state, id, 2);
  assert.equal(entry(state, id, 2, "main").count, 2);
  assert.equal(entry(state, id, 2, "main").seq, 1);
  assert.equal(state.nextSeq, 4);
});

test("4枚目は same-name-limit（メイン2+候補1）", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 2);
  state = add(state, id, 2, 1, "cand");
  const r = addCard(state, id, c(2), "deck");
  assert.deepEqual([r.ok, r.reason], [false, "same-name-limit"]);
});

test("メイン61枚目は main-full", () => {
  const { state: s0, id } = setup();
  const { state, spare } = fill(s0, id, "effect", 20, "deck", 100);
  const r = addCard(state, id, spare, "deck");
  assert.deepEqual([r.ok, r.reason], [false, "main-full"]);
});

test("エクストラ16枚目は extra-full", () => {
  const { state: s0, id } = setup();
  const { state, spare } = fill(s0, id, "xyz", 5, "deck", 200);
  const r = addCard(state, id, spare, "deck");
  assert.deepEqual([r.ok, r.reason], [false, "extra-full"]);
});

test("候補16枚目は cand-full", () => {
  const { state: s0, id } = setup();
  const { state, spare } = fill(s0, id, "spell", 5, "cand", 300);
  const r = addCard(state, id, spare, "cand");
  assert.deepEqual([r.ok, r.reason], [false, "cand-full"]);
});

test("制限・禁止でも追加できる", () => {
  let { state, id } = setup();
  state = add(state, id, 8, 2);
  assert.equal(entry(state, id, 8, "main").count, 2);
});

test("removeOne は未所持から先に減らし、0で要素を消す", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 3);
  state = tapCopy(state, id, 2, "main", 0).state;
  state = removeOne(state, id, 2, "main").state;
  assert.deepEqual([entry(state, id, 2, "main").count, entry(state, id, 2, "main").missing], [2, 0]);
  state = removeOne(removeOne(state, id, 2, "main").state, id, 2, "main").state;
  assert.equal(entry(state, id, 2, "main"), undefined);
});

test("moveOne: 候補からデッキへ。未所持が付いてくる", () => {
  let { state, id } = setup();
  state = add(state, id, 6, 2, "cand");
  state = tapCopy(state, id, 6, "cand", 1).state;
  const r = moveOne(state, id, 6, "cand", "deck", c(6));
  assert.ok(r.ok);
  assert.deepEqual([entry(r.state, id, 6, "cand").count, entry(r.state, id, 6, "cand").missing], [1, 0]);
  assert.deepEqual([entry(r.state, id, 6, "extra").count, entry(r.state, id, 6, "extra").missing], [1, 1]);
});

test("moveOne: 移動先が満杯なら拒否、同名3枚でも移動は通る", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 3);
  assert.ok(moveOne(state, id, 2, "main", "cand", c(2)).ok);
  state = fill(state, id, "spell", 5, "cand", 300).state;
  const r = moveOne(state, id, 2, "main", "cand", c(2));
  assert.deepEqual([r.ok, r.reason], [false, "cand-full"]);
});

test("tapCopy: 押した1枚だけが切り替わる", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 3);
  state = tapCopy(state, id, 2, "main", 0).state;
  assert.deepEqual(tilesOf(entry(state, id, 2, "main")).map((t) => t.missing), [true, false, false]);
  assert.equal(entry(state, id, 2, "main").missing, 1);
  state = tapCopy(state, id, 2, "main", 2).state;
  assert.deepEqual(tilesOf(entry(state, id, 2, "main")).map((t) => t.missing), [true, false, true]);
  state = tapCopy(state, id, 2, "main", 0).state;
  assert.deepEqual(tilesOf(entry(state, id, 2, "main")).map((t) => t.missing), [false, false, true]);
  assert.equal(entry(state, id, 2, "main").missing, 1);
});

test("足した1枚は右端に明るく入り、暗い位置は変わらない", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 2);
  state = tapCopy(state, id, 2, "main", 0).state;
  state = add(state, id, 2, 1);
  assert.deepEqual(tilesOf(entry(state, id, 2, "main")).map((t) => t.missing), [true, false, false]);
});

test("removeOne: 位置を指定するとその1枚を抜く", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 3);
  state = tapCopy(state, id, 2, "main", 0).state;
  state = removeOne(state, id, 2, "main", 1).state;
  assert.deepEqual(tilesOf(entry(state, id, 2, "main")).map((t) => t.missing), [true, false]);
  state = removeOne(state, id, 2, "main", 0).state;
  assert.deepEqual([entry(state, id, 2, "main").count, entry(state, id, 2, "main").missing], [1, 0]);
});

test("removeOne: 位置の指定が無ければ暗い方から抜く", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 3);
  state = tapCopy(state, id, 2, "main", 1).state;
  state = removeOne(state, id, 2, "main").state;
  assert.deepEqual(tilesOf(entry(state, id, 2, "main")).map((t) => t.missing), [false, false]);
});

test("moveOne: 位置を指定するとその1枚の状態で移る", () => {
  let { state, id } = setup();
  state = add(state, id, 6, 2, "cand");
  state = tapCopy(state, id, 6, "cand", 1).state;
  const r = moveOne(state, id, 6, "cand", "deck", c(6), 0);
  assert.deepEqual(tilesOf(entry(r.state, id, 6, "cand")).map((t) => t.missing), [true]);
  assert.equal(entry(r.state, id, 6, "extra").missing, 0);
});

test("sortedEntries: 種類順、同名は隣", () => {
  let { state, id } = setup();
  for (const cid of [5, 2, 4, 1]) state = add(state, id, cid);
  assert.deepEqual(sortedEntries(deckOf(state, id), cards, "main").map((e) => e.cid), [1, 2, 4, 5]);
  const s2 = setup();
  for (const cid of [2, 3, 2]) s2.state = add(s2.state, s2.id, cid);
  assert.deepEqual(
    sortedEntries(deckOf(s2.state, s2.id), cards, "main").map((e) => [e.cid, e.count]),
    [[2, 2], [3, 1]],
  );
});

test("sortedEntries: モンスターはレベルの低い順、魔法罠は種類の順、同じなら追加順", () => {
  const lv = parseCards({
    version: 2,
    cards: [
      [21, "効果L8", "", "effect", "effect", 3, 8, ""],
      [22, "効果L3", "", "effect", "effect", 3, 3, ""],
      [23, "効果L4a", "", "effect", "effect", 3, 4, ""],
      [24, "効果L4b", "", "effect", "effect", 3, 4, ""],
      [31, "永続魔法", "", "spell", "spell", 3, 0, "continuous"],
      [32, "速攻魔法", "", "spell", "spell", 3, 0, "quickplay"],
      [33, "通常魔法", "", "spell", "spell", 3, 0, "normal"],
      [34, "儀式魔法", "", "spell", "spell", 3, 0, "ritual"],
      [35, "フィールド魔法", "", "spell", "spell", 3, 0, "field"],
      [36, "装備魔法", "", "spell", "spell", 3, 0, "equip"],
      [41, "カウンター罠", "", "trap", "trap", 3, 0, "counter"],
      [42, "通常罠", "", "trap", "trap", 3, 0, "normal"],
      [43, "永続罠", "", "trap", "trap", 3, 0, "continuous"],
      [51, "リンク3", "", "link", "link", 3, 3, ""],
      [52, "リンク1", "", "link", "link", 3, 1, ""],
    ],
  });
  let { state, id } = setup();
  for (const cid of [21, 23, 22, 24, 23, 31, 34, 32, 36, 33, 35, 41, 43, 42, 51, 52]) {
    const r = addCard(state, id, lv.get(cid), "deck");
    assert.ok(r.ok, r.reason);
    state = r.state;
  }
  const deck = deckOf(state, id);
  assert.deepEqual(
    sortedEntries(deck, lv, "main").map((e) => e.cid),
    // 魔法: 通常・フィールド・装備・永続・速攻・儀式、罠: 通常・永続・カウンター（マスターデュエルの絞り込みの並び）
    [22, 23, 24, 21, 33, 35, 36, 31, 32, 34, 42, 43, 41],
  );
  assert.deepEqual(sortedEntries(deck, lv, "extra").map((e) => e.cid), [52, 51]);
});

test("sortedEntries: cand は main 群の後に extra 群、未知 cid は末尾", () => {
  const { state: s0, id } = setup();
  let state = add(s0, id, 12, 1, "cand");
  state = add(state, id, 6, 1, "cand");
  state = add(state, id, 5, 1, "cand");
  state = add(state, id, 1, 1, "cand");
  const deck = deckOf(state, id);
  assert.deepEqual(sortedEntries(deck, cards, "cand").map((e) => e.cid), [1, 5, 6, 12]);
  deck.entries.unshift({ cid: 999, area: "cand", count: 1, missing: 0, seq: 0 });
  assert.equal(sortedEntries(deck, cards, "cand").at(-1).cid, 999);
});

test("tilesOf: 位置の記録が無い前の形は、明るい札のあとに暗い札", () => {
  assert.deepEqual(tilesOf({ count: 3, missing: 1 }), [{ missing: false }, { missing: false }, { missing: true }]);
});

test("tilesOf: 位置の記録どおりに暗くする", () => {
  assert.deepEqual(tilesOf({ count: 3, missing: 1, mask: 1 }), [{ missing: true }, { missing: false }, { missing: false }]);
});

test("warnings", () => {
  let { state, id } = setup();
  assert.deepEqual(warnings(deckOf(state, id), cards), [{ type: "main-under", count: 0 }]);
  state = add(state, id, 8, 1);
  state = add(state, id, 9, 2);
  state = add(state, id, 10, 3);
  state = add(state, id, 11, 3);
  const w = warnings(deckOf(state, id), cards);
  assert.ok(w.some((x) => x.type === "main-under" && x.count === 9));
  assert.ok(w.some((x) => x.type === "forbidden" && x.cid === 8));
  assert.ok(w.some((x) => x.type === "limited" && x.cid === 9 && x.count === 2));
  assert.ok(w.some((x) => x.type === "semi" && x.cid === 10 && x.count === 3));
  assert.ok(!w.some((x) => x.cid === 11));
});

test("warnings: 全区分の合計で数える", () => {
  let { state, id } = setup();
  state = add(state, id, 9, 1);
  state = add(state, id, 9, 1, "cand");
  const w = warnings(deckOf(state, id), cards);
  assert.ok(w.some((x) => x.type === "limited" && x.count === 2));
});

test("warnings: 40枚あれば main-under は出ない", () => {
  const { state: s0, id } = setup();
  const { state } = fill(s0, id, "effect", 14, "deck", 400); // 42枚
  assert.ok(!warnings(deckOf(state, id), cards).some((x) => x.type === "main-under"));
});

test("deckSummary", () => {
  let { state, id } = setup();
  assert.deepEqual(deckSummary(deckOf(state, id), cards), { missing: 0, hasWarning: true, coverCid: null });
  state = add(state, id, 4);
  state = add(state, id, 1);
  state = add(state, id, 6, 1);
  state = add(state, id, 5, 1, "cand");
  for (const [cid, area] of [[4, "main"], [6, "extra"], [5, "cand"]]) {
    state = tapCopy(state, id, cid, area, 0).state;
  }
  const d = deckOf(state, id);
  const s = deckSummary(d, cards);
  assert.equal(s.missing, 2);
  assert.equal(s.coverCid, 1);
  d.cover = 5;
  assert.equal(deckSummary(d, cards).coverCid, 5);
  d.cover = 77;
  assert.equal(deckSummary(d, cards).coverCid, 1);
});

// 汎用誘発: 増殖するG(制限) 灰流うらら(準制限) マルチャミー・フワロス 無限泡影(無制限)
const ht = parseCards({
  version: 2,
  cards: [
    [9455, "増殖するG", "", "effect", "effect", 1, 2, ""],
    [12950, "灰流うらら", "", "effect", "effect", 2, 3, ""],
    [20500, "マルチャミー・フワロス", "", "effect", "effect", 3, 1, ""],
    [13631, "無限泡影", "", "trap", "trap", 3, 0, "normal"],
    [1, "通常A", "", "normal", "normal", 3, 4, ""],
  ],
});
const mainOf = (s, id) => Object.fromEntries(deckOf(s, id).entries.filter((e) => e.area === "main").map((e) => [e.cid, e.count]));

test("addHandTraps: 空のデッキなら上限までメインに入る", () => {
  const { state, id } = setup();
  const r = addHandTraps(state, id, ht);
  assert.equal(r.added, 9);
  assert.equal(r.full, false);
  assert.deepEqual(mainOf(r.state, id), { 9455: 1, 12950: 2, 20500: 3, 13631: 3 });
});

test("addHandTraps: 候補に入っている分も数える", () => {
  let { state, id } = setup();
  state = addCard(state, id, ht.get(12950), "cand").state;
  const r = addHandTraps(state, id, ht);
  assert.equal(mainOf(r.state, id)[12950], 1);
  assert.equal(r.added, 8);
});

test("addHandTraps: 上限まで入っていれば何も増えない", () => {
  const { state, id } = setup();
  const once = addHandTraps(state, id, ht).state;
  const r = addHandTraps(once, id, ht);
  assert.equal(r.added, 0);
  assert.deepEqual(mainOf(r.state, id), mainOf(once, id));
});

test("addHandTraps: メインが60枚になったら止まる", () => {
  let { state, id } = setup();
  const fill = parseCards({ version: 2, cards: Array.from({ length: 19 }, (_, i) => [100 + i, "x" + i, "", "normal", "normal", 3, 4, ""]) });
  for (const c of fill.values()) for (let i = 0; i < 3; i++) state = addCard(state, id, c, "deck").state;
  const r = addHandTraps(state, id, ht);
  assert.equal(r.added, 3);
  assert.equal(r.full, true);
  assert.equal(Object.values(mainOf(r.state, id)).reduce((a, b) => a + b, 0), 60);
  assert.deepEqual([mainOf(r.state, id)[9455], mainOf(r.state, id)[12950]], [1, 2]);
});

const hist = (s, id) => (deckOf(s, id).history ?? []).map((h) => [h.cid, h.op]);

test("履歴: 入れる・抜くを新しい順に残し、同じカードは先頭へまとめる", () => {
  let { state, id } = setup();
  state = add(state, id, 2);
  state = add(state, id, 3);
  assert.deepEqual(hist(state, id), [[3, "in"], [2, "in"]]);
  state = removeOne(state, id, 2, "main").state;
  assert.deepEqual(hist(state, id), [[2, "out"], [3, "in"]]);
});

test("履歴: 候補への追加も入れたとして残し、移動では残さない", () => {
  let { state, id } = setup();
  state = add(state, id, 2, 1, "cand");
  state = moveOne(state, id, 2, "cand", "deck", c(2)).state;
  assert.deepEqual(hist(state, id), [[2, "in"]]);
});

test("履歴: 30件まで", () => {
  let { state, id } = setup();
  const pool = parseCards({ version: 1, cards: Array.from({ length: 34 }, (_, i) => [500 + i, "n", "n", "effect", "effect", 3]) });
  for (const card of pool.values()) state = addCard(state, id, card, "deck").state;
  assert.equal(hist(state, id).length, 30);
  assert.equal(hist(state, id)[0][0], 533);
  assert.equal(hist(state, id)[29][0], 504);
});

test("履歴: 汎用誘発も入れたとして残り、ほかのデッキには出ない", () => {
  let { state, id } = setup();
  const b = createDeck(state, "B");
  state = addHandTraps(b.state, id, ht).state;
  assert.deepEqual(hist(state, id).map((h) => h[0]).sort((a, b) => a - b), [9455, 12950, 13631, 20500]);
  assert.deepEqual(hist(state, b.deckId), []);
});

test("toggleFavorite: 全デッキ共通で、もう一度で外れる", () => {
  let state = emptyState();
  state = toggleFavorite(state, 5);
  state = toggleFavorite(state, 2);
  assert.deepEqual(state.favorites, [2, 5]);
  state = toggleFavorite(state, 5);
  assert.deepEqual(state.favorites, [2]);
});
