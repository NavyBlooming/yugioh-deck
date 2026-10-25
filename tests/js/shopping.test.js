import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards } from "../../src/core/cards.js";
import { emptyState } from "../../src/core/storage.js";
import { createDeck, addCard, tapCopy } from "../../src/core/deck.js";
import { buildShoppingList, markBought, setNote, cardRushUrl, officialDbUrl } from "../../src/core/shopping.js";

const cards = parseCards({
  version: 1,
  cards: [
    [1, "灰流うらら", "はるうらら", "effect", "effect", 2],
    [2, "増殖するG", "ぞうしょくするじー", "effect", "effect", 2],
    [3, "無名", "むめい", "effect", "effect", 3],
    [4, "高額", "こうがく", "effect", "effect", 3],
    [5, "融合A", "ゆうごうえー", "fusion", "fusion", 3],
  ],
});

function build() {
  let state = emptyState();
  const a = createDeck(state, "A"); state = a.state;
  const b = createDeck(state, "B"); state = b.state;
  const e = createDeck(state, "空"); state = e.state;
  const put = (deck, cid, n, dest, area, miss) => {
    for (let i = 0; i < n; i++) state = addCard(state, deck, cards.get(cid), dest).state;
    for (let i = 0; i < miss; i++) state = tapCopy(state, deck, cid, area, false).state;
  };
  put(a.deckId, 1, 2, "deck", "main", 2);
  put(a.deckId, 3, 1, "deck", "main", 1);
  put(a.deckId, 5, 1, "deck", "extra", 1);
  put(a.deckId, 4, 1, "cand", "cand", 1);
  put(b.deckId, 1, 1, "deck", "main", 1);
  put(e.deckId, 2, 1, "deck", "main", 0);
  state = setNote(state, 1, { price: 580 });
  state = setNote(state, 4, { price: 1000, rarity: "UR" });
  return { state, A: a.deckId, B: b.deckId };
}

test("合計・価格未入力・候補は含めない・未所持の無いデッキは出ない", () => {
  const { state, A, B } = build();
  const list = buildShoppingList(state, cards);
  assert.equal(list.length, 2);
  const a = list.find((d) => d.deckId === A);
  assert.deepEqual(a.items.map((i) => [i.cid, i.area, i.missing]), [[1, "main", 2], [3, "main", 1], [5, "extra", 1]]);
  assert.equal(a.total, 1160);
  assert.equal(a.unpriced, 2);
  assert.deepEqual(a.candidates.map((i) => i.cid), [4]);
  assert.equal(a.candidates[0].price, 1000);
  assert.equal(a.candidates[0].rarity, "UR");
  assert.deepEqual(a.items[1], { cid: 3, area: "main", name: "無名", missing: 1, price: null, rarity: "", print: "" });
  assert.equal(list.find((d) => d.deckId === B).items[0].price, 580);
});

test("580円x2 と単価未入力1枚 → 1160円・未入力1枚", () => {
  let state = emptyState();
  const a = createDeck(state, "A"); state = a.state;
  for (const cid of [1, 1, 3]) state = addCard(state, a.deckId, cards.get(cid), "deck").state;
  for (const cid of [1, 1, 3]) state = tapCopy(state, a.deckId, cid, "main", false).state;
  state = setNote(state, 1, { price: 580 });
  const [d] = buildShoppingList(state, cards);
  assert.deepEqual([d.total, d.unpriced], [1160, 1]);
});

test("markBought は A の main だけ -1、0未満にならない", () => {
  const { state, A, B } = build();
  const m = (s, id) => s.decks.find((d) => d.id === id).entries.find((e) => e.cid === 1).missing;
  const s2 = markBought(state, A, 1, "main");
  assert.equal(m(s2, A), 1);
  assert.equal(m(s2, B), 1);
  assert.equal(m(state, A), 2);
  const s3 = markBought(markBought(markBought(state, A, 1, "main"), A, 1, "main"), A, 1, "main");
  assert.equal(m(s3, A), 0);
});

test("setNote はマージ", () => {
  let s = setNote(emptyState(), 7, { price: 100 });
  s = setNote(s, 7, { rarity: "SE" });
  assert.deepEqual(s.notes[7], { price: 100, rarity: "SE", print: "" });
});

test("URL", () => {
  assert.equal(cardRushUrl("灰流うらら"), "https://www.cardrush.jp/product-list?keyword=" + encodeURIComponent("灰流うらら"));
  assert.equal(officialDbUrl(12950), "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=12950");
});
