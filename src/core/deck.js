import { MAIN_GROUPS, EXTRA_GROUPS, SUB_ORDER, areaOf } from "./cards.js";

const LIMITS = { main: 60, extra: 15, cand: 15 };
const FULL = { main: "main-full", extra: "extra-full", cand: "cand-full" };

const clone = (state) => structuredClone(state);
const findDeck = (state, deckId) => state.decks.find((d) => d.id === deckId);
const findEntry = (deck, cid, area) => deck.entries.find((e) => e.cid === cid && e.area === area);
const areaTotal = (deck, area) => deck.entries.reduce((n, e) => (e.area === area ? n + e.count : n), 0);
const ok = (state) => ({ ok: true, state });
const ng = (reason) => ({ ok: false, reason });
const destArea = (card, dest) => (dest === "cand" ? "cand" : areaOf(card));

export function createDeck(state, name) {
  const s = clone(state);
  const deckId = crypto.randomUUID();
  s.decks.push({ id: deckId, name, cover: null, entries: [] });
  return { ok: true, state: s, deckId };
}

export function renameDeck(state, deckId, name) {
  const s = clone(state);
  findDeck(s, deckId).name = name;
  return ok(s);
}

export function deleteDeck(state, deckId) {
  const s = clone(state);
  s.decks = s.decks.filter((d) => d.id !== deckId);
  return ok(s);
}

// 追加先の区分に1枚足す。missing が true なら未所持として足す。
function put(s, deck, cid, area, missing) {
  const e = findEntry(deck, cid, area);
  if (e) {
    e.count += 1;
    if (missing) e.missing += 1;
  } else {
    deck.entries.push({ cid, area, count: 1, missing: missing ? 1 : 0, seq: s.nextSeq++ });
  }
}

// 未所持から先に1枚減らす。減らした1枚が未所持だったかを返す。
function take(deck, cid, area) {
  const e = findEntry(deck, cid, area);
  const wasMissing = e.missing > 0;
  if (wasMissing) e.missing -= 1;
  e.count -= 1;
  if (e.count === 0) deck.entries.splice(deck.entries.indexOf(e), 1);
  return wasMissing;
}

export function addCard(state, deckId, card, dest) {
  const deck = findDeck(state, deckId);
  const area = destArea(card, dest);
  const same = deck.entries.reduce((n, e) => (e.cid === card.cid ? n + e.count : n), 0);
  if (same >= 3) return ng("same-name-limit");
  if (areaTotal(deck, area) >= LIMITS[area]) return ng(FULL[area]);
  const s = clone(state);
  put(s, findDeck(s, deckId), card.cid, area, false);
  return ok(s);
}

export function removeOne(state, deckId, cid, area) {
  const s = clone(state);
  take(findDeck(s, deckId), cid, area);
  return ok(s);
}

// to が "deck" のとき移動先の区分を決めるため card が要る。
export function moveOne(state, deckId, cid, from, to, card) {
  const area = destArea(card, to);
  if (area === from) return ok(state);
  if (areaTotal(findDeck(state, deckId), area) >= LIMITS[area]) return ng(FULL[area]);
  const s = clone(state);
  const deck = findDeck(s, deckId);
  const wasMissing = take(deck, cid, from);
  put(s, deck, cid, area, wasMissing);
  return ok(s);
}

export function tapCopy(state, deckId, cid, area, tappedMissing) {
  const s = clone(state);
  const e = findEntry(findDeck(s, deckId), cid, area);
  e.missing = tappedMissing ? Math.max(0, e.missing - 1) : Math.min(e.count, e.missing + 1);
  return ok(s);
}

export function sortedEntries(deck, cards, area) {
  const order = area === "main" ? MAIN_GROUPS : area === "extra" ? EXTRA_GROUPS : [...MAIN_GROUPS, ...EXTRA_GROUPS];
  // 群 → 群の中の順（モンスターはレベル、魔法・罠は種類）→ 追加順
  const key = (e) => {
    const card = cards.get(e.cid);
    if (!card) return [Infinity, 0, e.seq];
    const inner = card.group === "spell" || card.group === "trap" ? SUB_ORDER.indexOf(card.sub) : card.level ?? 0;
    return [order.indexOf(card.group), inner, e.seq];
  };
  const keys = new Map(deck.entries.map((e) => [e, key(e)]));
  return deck.entries
    .filter((e) => e.area === area)
    .sort((a, b) => {
      const ka = keys.get(a);
      const kb = keys.get(b);
      return ka[0] - kb[0] || ka[1] - kb[1] || ka[2] - kb[2];
    });
}

export function tilesOf(entry) {
  return Array.from({ length: entry.count }, (_, i) => ({ missing: i >= entry.count - entry.missing }));
}

export function warnings(deck, cards) {
  const out = [];
  const main = areaTotal(deck, "main");
  if (main < 40) out.push({ type: "main-under", count: main });
  const totals = new Map();
  for (const e of deck.entries) totals.set(e.cid, (totals.get(e.cid) ?? 0) + e.count);
  for (const [cid, count] of totals) {
    const limit = cards.get(cid)?.limit;
    if (limit === 0) out.push({ type: "forbidden", cid });
    else if (limit === 1 && count >= 2) out.push({ type: "limited", cid, count });
    else if (limit === 2 && count >= 3) out.push({ type: "semi", cid, count });
  }
  return out;
}

export function deckSummary(deck, cards) {
  const missing = deck.entries.reduce((n, e) => (e.area === "cand" ? n : n + e.missing), 0);
  let coverCid = null;
  if (deck.cover !== null && deck.entries.some((e) => e.cid === deck.cover)) coverCid = deck.cover;
  else coverCid = sortedEntries(deck, cards, "main")[0]?.cid ?? null;
  return { missing, hasWarning: warnings(deck, cards).length > 0, coverCid };
}

// 汎用誘発（増殖するG、灰流うらら、マルチャミー・フワロス、無限泡影）。この順に入れる
export const HAND_TRAPS = [9455, 12950, 20500, 13631];
const MAX_BY_LIMIT = { 0: 0, 1: 1, 2: 2 };

// 全区分の合計が禁止制限の上限に届くまで候補に入れる。候補が埋まったら止める
export function addHandTraps(state, deckId, cards) {
  let s = state;
  let added = 0;
  for (const cid of HAND_TRAPS) {
    const card = cards.get(cid);
    if (!card) continue;
    const max = MAX_BY_LIMIT[card.limit] ?? 3;
    let have = findDeck(s, deckId).entries.reduce((n, e) => (e.cid === cid ? n + e.count : n), 0);
    while (have < max) {
      const r = addCard(s, deckId, card, "cand");
      if (!r.ok) return { ok: true, state: s, added, full: r.reason === "cand-full" };
      s = r.state;
      have++;
      added++;
    }
  }
  return { ok: true, state: s, added, full: false };
}
