export function normalize(s) {
  return s
    .normalize("NFKC")
    .replace(/[ァ-ヶ]/g, (c) => String.fromCodePoint(c.codePointAt(0) - 0x60))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, "");
}

export function buildIndex(cards) {
  return cards.map((card) => ({ card, n: normalize(card.name), r: normalize(card.ruby) }));
}

export function search(index, query, limit = 100) {
  const q = normalize(query);
  if (!q) return [];
  const first = [];
  const second = [];
  for (const e of index) {
    if (e.n.startsWith(q) || e.r.startsWith(q)) first.push(e);
    else if (e.n.includes(q) || e.r.includes(q)) second.push(e);
  }
  const byRuby = (a, b) => (a.r < b.r ? -1 : a.r > b.r ? 1 : 0);
  first.sort(byRuby);
  second.sort(byRuby);
  return [...first, ...second].slice(0, limit).map((e) => e.card);
}
