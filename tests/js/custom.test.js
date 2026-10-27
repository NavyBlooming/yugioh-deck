import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards } from "../../src/core/cards.js";
import { emptyState, isValidState, exportJson, parseImport } from "../../src/core/storage.js";
import { createDeck, addCard, tapCopy, toggleFavorite, sortedEntries, tilesOf } from "../../src/core/deck.js";
import { setNote } from "../../src/core/shopping.js";
import { isEmptyState } from "../../src/core/sync.js";
import { addCustomCard, removeCustomCard, customCardMap, replaceReleased, prereleaseMap, adoptPrerelease } from "../../src/core/custom.js";

const RYU = { name: "新しい竜", ruby: "あたらしいりゅう", kind: "effect", level: 4, sub: "" };

test("addCustomCard: 負の番号を順に振り、カードの一覧の形に変えられる", () => {
  let r = addCustomCard(emptyState(), RYU);
  assert.equal(r.cid, -1);
  r = addCustomCard(r.state, { name: "新しい罠", ruby: "あたらしいわな", kind: "trap", level: 0, sub: "counter" });
  assert.equal(r.cid, -2);
  const m = customCardMap(r.state);
  assert.deepEqual(m.get(-1), { cid: -1, name: "新しい竜", ruby: "あたらしいりゅう", group: "effect", frame: "effect", limit: 3, level: 4, sub: "", custom: true });
  assert.deepEqual([m.get(-2).group, m.get(-2).frame, m.get(-2).sub], ["trap", "trap", "counter"]);
});

test("addCustomCard: 儀式モンスターは効果モンスターの群、枠は儀式", () => {
  const { state, cid } = addCustomCard(emptyState(), { name: "儀式", ruby: "ぎしき", kind: "ritual", level: 8, sub: "" });
  assert.deepEqual([customCardMap(state).get(cid).group, customCardMap(state).get(cid).frame], ["effect", "ritual"]);
});

test("登録したカードはデッキに入り、ほかのカードと同じ並びに入る", () => {
  let { state, cid } = addCustomCard(emptyState(), RYU);
  const cards = new Map([...parseCards({ version: 2, cards: [[1, "低い", "ひくい", "effect", "effect", 3, 2, ""], [2, "高い", "たかい", "effect", "effect", 3, 8, ""]] }), ...customCardMap(state)]);
  const d = createDeck(state, "D");
  state = d.state;
  for (const c of [2, cid, 1]) state = addCard(state, d.deckId, cards.get(c), "deck").state;
  assert.deepEqual(sortedEntries(state.decks[0], cards, "main").map((e) => e.cid), [1, cid, 2]);
});

test("removeCustomCard: デッキ・履歴・お気に入り・購入メモからも消す", () => {
  let { state, cid } = addCustomCard(emptyState(), RYU);
  const d = createDeck(state, "D");
  state = addCard(d.state, d.deckId, customCardMap(d.state).get(cid), "deck").state;
  state = toggleFavorite(state, cid);
  state = setNote(state, cid, { price: 300 });
  state = removeCustomCard(state, cid);
  assert.deepEqual(state.customCards, []);
  assert.deepEqual(state.decks[0].entries, []);
  assert.deepEqual(state.decks[0].history, []);
  assert.deepEqual(state.favorites, []);
  assert.equal(state.notes[cid], undefined);
});

test("replaceReleased: 名前が同じカードが一覧に入ったら置き換え、枚数・未所持・履歴・お気に入り・購入メモを引き継ぐ", () => {
  let { state, cid } = addCustomCard(emptyState(), { ...RYU, name: "新しい竜・Ｘ" });
  const d = createDeck(state, "D");
  const custom = customCardMap(d.state).get(cid);
  state = d.state;
  for (let i = 0; i < 2; i++) state = addCard(state, d.deckId, custom, "deck").state;
  state = tapCopy(state, d.deckId, cid, "main", 1).state;
  state = toggleFavorite(state, cid);
  state = setNote(state, cid, { price: 500 });
  const cards = parseCards({ version: 2, cards: [[9000, "新しい竜X", "あたらしいりゅうえっくす", "effect", "effect", 3, 4, ""]] });
  const r = replaceReleased(state, cards);
  assert.deepEqual(r.replaced, ["新しい竜・Ｘ"]);
  const e = r.state.decks[0].entries;
  assert.equal(e.length, 1);
  assert.deepEqual([e[0].cid, e[0].count], [9000, 2]);
  assert.deepEqual(tilesOf(e[0]).map((t) => t.missing), [false, true]);
  assert.deepEqual(r.state.decks[0].history, [{ cid: 9000, op: "in" }]);
  assert.deepEqual(r.state.favorites, [9000]);
  assert.equal(r.state.notes[9000].price, 500);
  assert.equal(r.state.notes[cid], undefined);
  assert.deepEqual(r.state.customCards, []);
});

test("replaceReleased: 同じ欄に一覧のカードが既にあればまとめ、未所持の位置は後ろに続ける", () => {
  let { state, cid } = addCustomCard(emptyState(), RYU);
  const cards = parseCards({ version: 2, cards: [[9000, "新しい竜", "あたらしいりゅう", "effect", "effect", 3, 4, ""]] });
  const d = createDeck(state, "D");
  state = addCard(d.state, d.deckId, cards.get(9000), "deck").state;
  state = addCard(state, d.deckId, customCardMap(state).get(cid), "deck").state;
  state = tapCopy(state, d.deckId, cid, "main", 0).state;
  const r = replaceReleased(state, cards);
  const e = r.state.decks[0].entries;
  assert.equal(e.length, 1);
  assert.deepEqual(tilesOf(e[0]).map((t) => t.missing), [false, true]);
});

test("replaceReleased: 一致が無ければ何も変えない", () => {
  const { state } = addCustomCard(emptyState(), RYU);
  const r = replaceReleased(state, parseCards({ version: 2, cards: [[1, "別", "べつ", "effect", "effect", 3, 4, ""]] }));
  assert.deepEqual(r.replaced, []);
  assert.equal(r.state, state);
});

test("形の確かめ・書き出し・空かどうか", () => {
  const { state } = addCustomCard(emptyState(), RYU);
  assert.ok(isValidState(state));
  assert.ok(isValidState(emptyState()));
  const back = parseImport(exportJson(state));
  assert.ok(back.ok);
  assert.deepEqual(back.state.customCards, state.customCards);
  assert.equal(isEmptyState(state), false);
  for (const bad of [{ ...state.customCards[0], cid: 5 }, { ...state.customCards[0], name: "" }, { ...state.customCards[0], kind: "token" }]) {
    assert.equal(isValidState({ ...state, customCards: [bad] }), false);
  }
});

const PRE = { cards: [{ cid: -2000000, name: "太陽神の詩詠者", ruby: "たいようしんのしえいしゃ", kind: "effect", level: 5, sub: "", set: "IMMORTAL PHOENIX" }] };

test("prereleaseMap: 取得したカードをカードの一覧の形にする", () => {
  const m = prereleaseMap(PRE);
  assert.deepEqual(m.get(-2000000), { cid: -2000000, name: "太陽神の詩詠者", ruby: "たいようしんのしえいしゃ", group: "effect", frame: "effect", limit: 3, level: 5, sub: "", custom: true, set: "IMMORTAL PHOENIX" });
});

test("adoptPrerelease: デッキかお気に入りに入った取得カードだけ、登録したカードとして保存する", () => {
  const pre = prereleaseMap(PRE);
  const d = createDeck(emptyState(), "D");
  let state = d.state;
  assert.equal(adoptPrerelease(state, pre), state);
  state = addCard(state, d.deckId, pre.get(-2000000), "deck").state;
  state = adoptPrerelease(state, pre);
  assert.deepEqual(state.customCards, [{ cid: -2000000, name: "太陽神の詩詠者", ruby: "たいようしんのしえいしゃ", kind: "effect", level: 5, sub: "" }]);
  assert.equal(adoptPrerelease(state, pre), state);
  let fav = toggleFavorite(emptyState(), -2000000);
  fav = adoptPrerelease(fav, pre);
  assert.equal(fav.customCards.length, 1);
});

test("addCustomCard: 取得カードの番号があっても、自分で登録する番号は -1 から続ける", () => {
  const s = { ...emptyState(), customCards: [{ cid: -2000000, name: "x", ruby: "x", kind: "effect", level: 1, sub: "" }] };
  assert.equal(addCustomCard(s, RYU).cid, -1);
});
