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

// 効果テキストは cid → 正規化した文で持つ
export function buildTextIndex(texts) {
  return new Map(Object.entries(texts).map(([cid, t]) => [Number(cid), normalize(t)]));
}

// 名前と読みで当たるカードを先に、残りはスペースで区切った語をすべて名前・読み・効果テキストのどれかに含むカードを読み順で並べる
export function searchWithText(index, textIndex, query, limit = 100) {
  const words = query.split(/\s+/).map(normalize).filter(Boolean);
  if (!words.length) return [];
  const named = search(index, query, Infinity);
  const seen = new Set(named.map((c) => c.cid));
  const rest = index
    .filter((e) => {
      if (seen.has(e.card.cid)) return false;
      const t = textIndex.get(e.card.cid) ?? "";
      return words.every((w) => e.n.includes(w) || e.r.includes(w) || t.includes(w));
    })
    .sort((a, b) => (a.r < b.r ? -1 : a.r > b.r ? 1 : 0))
    .map((e) => e.card);
  return [...named, ...rest].slice(0, limit);
}
