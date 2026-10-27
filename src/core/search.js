import { compareCards } from "./cards.js";

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

// 名前か読みに入力を含むカードを、デッキと同じ並びで返す
export function search(index, query, limit = Infinity) {
  const q = normalize(query);
  if (!q) return [];
  return index
    .filter((e) => e.n.includes(q) || e.r.includes(q))
    .map((e) => e.card)
    .sort(compareCards)
    .slice(0, limit);
}

// 効果テキストは cid → 正規化した文で持つ
export function buildTextIndex(texts) {
  return new Map(Object.entries(texts).map(([cid, t]) => [Number(cid), normalize(t)]));
}

// 名前と読みで当たるカードを先に、残りはスペースで区切った語をすべて名前・読み・効果テキストのどれかに含むカードを、それぞれデッキと同じ並びで並べる
export function searchWithText(index, textIndex, query, limit = Infinity) {
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
    .map((e) => e.card)
    .sort(compareCards);
  return [...named, ...rest].slice(0, limit);
}
