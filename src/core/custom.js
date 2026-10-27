// 発売前のカード。カードデータに無いカードを、利用者が名前と種類で登録する。cid は -1, -2, … と負の番号を振る
import { bitCount, maskOf } from "./deck.js";
import { normalize } from "./search.js";

export const KINDS = {
  normal: { group: "normal", frame: "normal", label: "通常モンスター" },
  effect: { group: "effect", frame: "effect", label: "効果モンスター" },
  ritual: { group: "effect", frame: "ritual", label: "儀式モンスター" },
  fusion: { group: "fusion", frame: "fusion", label: "融合モンスター" },
  synchro: { group: "synchro", frame: "synchro", label: "シンクロモンスター" },
  xyz: { group: "xyz", frame: "xyz", label: "エクシーズモンスター" },
  link: { group: "link", frame: "link", label: "リンクモンスター" },
  spell: { group: "spell", frame: "spell", label: "魔法" },
  trap: { group: "trap", frame: "trap", label: "罠" },
};

const clone = (state) => structuredClone(state);

export function addCustomCard(state, { name, ruby, kind, level, sub }) {
  const s = clone(state);
  const list = s.customCards ?? [];
  const cid = Math.min(0, ...list.map((c) => c.cid)) - 1;
  s.customCards = [...list, { cid, name, ruby, kind, level, sub }];
  return { state: s, cid };
}

// cid → カード（parseCards と同じ形）。制限は無し
export function customCardMap(state) {
  return new Map(
    (state.customCards ?? []).map((c) => [c.cid, { cid: c.cid, name: c.name, ruby: c.ruby, group: KINDS[c.kind].group, frame: KINDS[c.kind].frame, limit: 3, level: c.level, sub: c.sub, custom: true }]),
  );
}

export function removeCustomCard(state, cid) {
  const s = clone(state);
  s.customCards = (s.customCards ?? []).filter((c) => c.cid !== cid);
  for (const d of s.decks) {
    d.entries = d.entries.filter((e) => e.cid !== cid);
    d.history = (d.history ?? []).filter((h) => h.cid !== cid);
  }
  s.favorites = (s.favorites ?? []).filter((x) => x !== cid);
  delete s.notes[cid];
  return s;
}

// 登録したカード from を、カードデータのカード to に置き換える
function moveCard(s, from, to) {
  for (const d of s.decks) {
    for (const e of d.entries.filter((x) => x.cid === from)) {
      const same = d.entries.find((x) => x.cid === to && x.area === e.area);
      if (same) {
        // 同じ欄にあればまとめる。登録した方の札は後ろに続ける
        const mask = maskOf(same) | (maskOf(e) << same.count);
        same.count += e.count;
        same.mask = mask;
        same.missing = bitCount(mask);
        d.entries.splice(d.entries.indexOf(e), 1);
      } else e.cid = to;
    }
    if (d.history) {
      const seen = new Set();
      d.history = d.history.map((h) => (h.cid === from ? { ...h, cid: to } : h)).filter((h) => !seen.has(h.cid) && seen.add(h.cid));
    }
  }
  if (s.favorites?.includes(from)) s.favorites = [...new Set(s.favorites.map((x) => (x === from ? to : x)))].sort((a, b) => a - b);
  if (s.notes[from]) {
    s.notes[to] ??= s.notes[from];
    delete s.notes[from];
  }
}

// カードデータに同じ名前（全角半角・記号・空白の違いは無視）のカードが入った登録カードを置き換える
export function replaceReleased(state, cards) {
  const byName = new Map();
  for (const c of cards.values()) if (c.cid > 0) byName.set(normalize(c.name), c.cid);
  const hits = (state.customCards ?? []).filter((c) => byName.has(normalize(c.name)));
  if (!hits.length) return { state, replaced: [] };
  const s = clone(state);
  for (const c of hits) moveCard(s, c.cid, byName.get(normalize(c.name)));
  s.customCards = s.customCards.filter((c) => !hits.some((h) => h.cid === c.cid));
  return { state: s, replaced: hits.map((c) => c.name) };
}

export const validCustomCard = (c) =>
  typeof c === "object" && c !== null &&
  Number.isInteger(c.cid) && c.cid < 0 &&
  typeof c.name === "string" && c.name.trim() !== "" &&
  typeof c.ruby === "string" &&
  Object.hasOwn(KINDS, c.kind) &&
  Number.isInteger(c.level) && c.level >= 0 &&
  typeof c.sub === "string";
