// 初手の確率と、初手のテストで引くカード
import { tilesOf } from "./deck.js";

const choose = (n, k) => {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 1; i <= k; i++) r = (r * (n - k + i)) / i;
  return r;
};

// total 枚のデッキに印のカードが count 枚あるとき、draw 枚引いて印のカードが 0, 1, … 枚来る確率。
// デッキが draw 枚に足りなければ null
export function drawOdds(total, count, draw) {
  if (total < draw) return null;
  const all = choose(total, draw);
  return Array.from({ length: Math.min(count, draw) + 1 }, (_, x) => (choose(count, x) * choose(total - count, draw - x)) / all);
}

const mainCopies = (deck) => deck.entries.filter((e) => e.area === "main").flatMap((e) => Array(e.count).fill(e.cid));

// メインデッキだけを数える。候補と EX のカードは引かない
export function tagOdds(deck, tag, draw) {
  const copies = mainCopies(deck);
  const marked = deck.tags?.[tag] ?? [];
  const count = copies.filter((cid) => marked.includes(cid)).length;
  const dist = drawOdds(copies.length, count, draw);
  return { count, total: copies.length, dist, atLeastOne: dist ? 1 - dist[0] : null };
}

// メインデッキから draw 枚を重ならずに引く。1枚ずつ {cid, shared} で返す。足りなければ null
export function drawHand(deck, draw, random) {
  const copies = deck.entries.filter((e) => e.area === "main").flatMap((e) => tilesOf(e).map((t) => ({ cid: e.cid, shared: t.shared })));
  if (copies.length < draw) return null;
  for (let i = 0; i < draw; i++) {
    const j = i + Math.floor(random() * (copies.length - i));
    [copies[i], copies[j]] = [copies[j], copies[i]];
  }
  return copies.slice(0, draw);
}
