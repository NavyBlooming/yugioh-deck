import { sortedEntries } from "./deck.js";

export function buildShoppingList(state, cards) {
  const row = (e) => {
    const note = state.notes[e.cid];
    return {
      cid: e.cid,
      area: e.area,
      name: cards.get(e.cid)?.name ?? "",
      missing: e.missing,
      price: note?.price ?? null,
      rarity: note?.rarity ?? "",
      print: note?.print ?? "",
    };
  };
  const rows = (deck, areas) =>
    areas.flatMap((a) => sortedEntries(deck, cards, a)).filter((e) => e.missing > 0).map(row);

  const result = [];
  for (const deck of state.decks) {
    const items = rows(deck, ["main", "extra"]);
    const candidates = rows(deck, ["cand"]);
    if (items.length === 0 && candidates.length === 0) continue;
    let total = 0;
    let unpriced = 0;
    for (const i of items) {
      if (i.price === null) unpriced += i.missing;
      else total += i.price * i.missing;
    }
    result.push({ deckId: deck.id, name: deck.name, items, candidates, total, unpriced });
  }
  return result;
}

export function markBought(state, deckId, cid, area) {
  const s = structuredClone(state);
  const e = s.decks.find((d) => d.id === deckId)?.entries.find((x) => x.cid === cid && x.area === area);
  if (e) e.missing = Math.max(0, e.missing - 1);
  return s;
}

export function setNote(state, cid, patch) {
  const s = structuredClone(state);
  const cur = s.notes[cid] ?? { price: null, rarity: "", print: "" };
  s.notes[cid] = { ...cur, ...patch };
  return s;
}

export const cardRushUrl = (name) => "https://www.cardrush.jp/product-list?keyword=" + encodeURIComponent(name);
export const officialDbUrl = (cid) => "https://www.db.yugioh-card.com/yugiohdb/card_search.action?ope=2&cid=" + cid;
