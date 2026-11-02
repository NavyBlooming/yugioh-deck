import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCards } from "../../src/core/cards.js";
import { emptyState } from "../../src/core/storage.js";
import { addCard, createDeck } from "../../src/core/deck.js";
import { parseYdke, toYdke, passcodeIndex, exportDeck, importDeck } from "../../src/core/ydke.js";

const cards = parseCards({
  version: 1,
  cards: [
    [1, "効果A", "こうかえー", "effect", "effect", 3],
    [2, "魔法A", "まほうえー", "spell", "spell", 3],
    [6, "融合A", "ゆうごうえー", "fusion", "fusion", 3],
    [7, "登録A", "とうろくえー", "effect", "effect", 3],
  ],
});
const index = passcodeIndex({ export: { 1: 11111111, 2: 22222222, 6: 66666666 }, alias: { 11111112: 1 } });

test("parseYdke: ygo-decklab の公開デッキの文字列を解く", () => {
  // ygo-decklab のデッキ編集のページに載っていた公開デッキの先頭（メイン3枚・エクストラ1枚・サイド0枚に切り詰めたもの）
  const d = parseYdke("ydke://nG/zAWl4LQRpeC0E!oJQEAg==!!");
  assert.deepEqual(d, { main: [32731036, 70088809, 70088809], extra: [33854624], side: [] });
});

test("parseYdke: 前後の空白は無視し、形が違えば null", () => {
  assert.deepEqual(parseYdke("  ydke://!!!\n"), { main: [], extra: [], side: [] });
  assert.equal(parseYdke("https://example.com"), null);
  assert.equal(parseYdke("ydke://abc!!!"), null); // Base64 として壊れている
  assert.equal(parseYdke("ydke://AQID!!!"), null); // 4バイトで割り切れない
  assert.equal(parseYdke("ydke://!!"), null); // 区切りが足りない
});

test("toYdke: parseYdke と往復する", () => {
  const d = { main: [32731036, 70088809, 70088809], extra: [33854624], side: [14558127] };
  const s = toYdke(d);
  assert.ok(s.startsWith("ydke://") && s.endsWith("!"));
  assert.deepEqual(parseYdke(s), d);
});

test("passcodeIndex: 書き出しの番号と別名のどちらでもカードが分かる", () => {
  assert.equal(index.toPw.get(1), 11111111);
  assert.equal(index.toCid.get(11111111), 1);
  assert.equal(index.toCid.get(11111112), 1);
});

function deckWith(entries) {
  let { state, deckId } = createDeck(emptyState(), "元");
  for (const [cid, n, dest] of entries) for (let i = 0; i < n; i++) state = addCard(state, deckId, cards.get(cid), dest).state;
  return { state, deck: state.decks[0] };
}

test("exportDeck: メイン・エクストラ・候補をサイドにして、枚数分並べる", () => {
  const { deck } = deckWith([[1, 3, "deck"], [2, 1, "deck"], [6, 2, "deck"], [2, 2, "cand"]]);
  const r = exportDeck(deck, cards, index);
  assert.deepEqual(parseYdke(r.ydke), { main: [11111111, 11111111, 11111111, 22222222], extra: [66666666, 66666666], side: [22222222, 22222222] });
  assert.deepEqual(r.missing, []);
});

test("exportDeck: パスワードの無いカードは名前を返して外す", () => {
  const { deck } = deckWith([[1, 1, "deck"], [7, 2, "deck"]]);
  const r = exportDeck(deck, cards, index);
  assert.deepEqual(parseYdke(r.ydke).main, [11111111]);
  assert.deepEqual(r.missing, ["登録A"]);
});

test("importDeck: 新しいデッキに入れ、サイドは候補に、種類でメインとエクストラに分ける", () => {
  const ydke = toYdke({ main: [11111111, 11111112, 22222222, 66666666], extra: [66666666], side: [22222222] });
  const r = importDeck(emptyState(), "読み込み", ydke, cards, index);
  assert.ok(r.ok);
  const deck = r.state.decks.find((d) => d.id === r.deckId);
  assert.equal(deck.name, "読み込み");
  const count = (cid, area) => deck.entries.filter((e) => e.cid === cid && e.area === area).reduce((n, e) => n + e.count, 0);
  assert.equal(count(1, "main"), 2); // 別の絵の番号も同じカード
  assert.equal(count(2, "main"), 1);
  assert.equal(count(6, "extra"), 2); // メインの欄に来た融合もエクストラへ
  assert.equal(count(2, "cand"), 1);
  assert.ok(deck.entries.every((e) => e.missing === 0 && !e.shared));
  assert.deepEqual(deck.history ?? [], []); // 最近使ったカードは汚さない
  assert.deepEqual(r.unknown, []);
  assert.equal(r.over, 0);
});

test("importDeck: 知らない番号と、上限を超えた分は入れずに返す", () => {
  const ydke = toYdke({ main: [99999999, 11111111, 11111111, 11111111, 11111111], extra: [], side: Array(16).fill(22222222) });
  const r = importDeck(emptyState(), "多い", ydke, cards, index);
  assert.ok(r.ok);
  assert.deepEqual(r.unknown, [99999999]);
  // 同名4枚目と、候補の16枚目以降（同名3枚を超えた分も含む）
  const deck = r.state.decks[0];
  const total = deck.entries.reduce((n, e) => n + e.count, 0);
  assert.equal(total + r.over + r.unknown.length, 21);
});

test("importDeck: YDKE の形でなければデッキを作らない", () => {
  const r = importDeck(emptyState(), "x", "ydke-ではない", cards, index);
  assert.deepEqual(r, { ok: false, reason: "not-ydke" });
});
