import { ATTRS, RACES, TRAITS } from "./cards.js";

// 検索の絞り込み。同じ項目の中は「どれか」、項目どうしは「すべて」。範囲は null なら制限なし
export const KIND_OPTIONS = [["normal", "通常"], ["effect", "効果"], ["ritual", "儀式"], ["fusion", "融合"], ["synchro", "シンクロ"], ["xyz", "エクシーズ"], ["link", "リンク"], ["pendulum", "ペンデュラム"], ["spell", "魔法"], ["trap", "罠"]];
export const SUB_OPTIONS = [["normal", "通常"], ["quickplay", "速攻"], ["continuous", "永続"], ["equip", "装備"], ["field", "フィールド"], ["ritual", "儀式"], ["counter", "カウンター"]];
export const ATTR_OPTIONS = ATTRS.map((n, i) => [2 ** i, `${n}属性`]);
export const RACE_OPTIONS = [...RACES.map((n, i) => [2 ** i, `${n}族`]), ["other", "その他"]];
export const TRAIT_OPTIONS = TRAITS.map(([bit, n]) => [bit, n]);
const KNOWN_RACES = 2 ** RACES.length - 1;

export const emptyFilter = () => ({ kinds: [], subs: [], attrs: [], races: [], traits: [], levelMin: null, levelMax: null, atkMin: null, atkMax: null, defMin: null, defMax: null });

const RANGES = [["level", "レベル"], ["atk", "攻撃力"], ["def", "守備力"]];
const isSet = (v) => v !== null && v !== undefined;

export const isFiltering = (f) => ["kinds", "subs", "attrs", "races", "traits"].some((k) => f[k].length) || RANGES.some(([k]) => isSet(f[`${k}Min`]) || isSet(f[`${k}Max`]));

function kindOf(card, k) {
  if (k === "pendulum") return card.frame.endsWith("_pendulum");
  if (k === "spell" || k === "trap") return card.group === k;
  return card.frame.replace(/_pendulum$/, "") === k;
}

const monster = (c) => c.group !== "spell" && c.group !== "trap";
// 範囲で比べる値。属性などの情報が無いカード・攻守が ?（-2）・リンクの守備力は null
function valueOf(card, k) {
  if (!monster(card)) return null;
  if (k === "level") return card.level ?? null;
  if (card.type === undefined) return null;
  if (k === "def" && card.type & 0x4000000) return null;
  const v = card[k];
  return v === -2 ? null : v;
}

export function matchesFilter(card, f) {
  if (f.kinds.length && !f.kinds.some((k) => kindOf(card, k))) return false;
  if (f.subs.length && !(!monster(card) && f.subs.includes(card.sub))) return false;
  const info = card.type !== undefined;
  if (f.attrs.length && !(info && f.attrs.includes(card.attr))) return false;
  if (f.races.length && !(info && f.races.some((r) => (r === "other" ? (card.race & ~KNOWN_RACES) !== 0 || !card.race : r === card.race)))) return false;
  if (f.traits.length && !(info && f.traits.some((t) => card.type & t))) return false;
  for (const [k] of RANGES) {
    const min = f[`${k}Min`];
    const max = f[`${k}Max`];
    if (!isSet(min) && !isSet(max)) continue;
    const v = valueOf(card, k);
    if (v === null || (isSet(min) && v < min) || (isSet(max) && v > max)) return false;
  }
  return true;
}

const labels = (opts, vals) => opts.filter(([v]) => vals.includes(v)).map(([, n]) => n);
export function filterLabel(f) {
  const out = [
    ...labels(KIND_OPTIONS, f.kinds),
    ...labels(SUB_OPTIONS, f.subs).map((n) => `${n}の魔法・罠`),
    ...labels(ATTR_OPTIONS, f.attrs),
    ...labels(RACE_OPTIONS, f.races).map((n) => (n === "その他" ? "その他の種族" : n)),
    ...labels(TRAIT_OPTIONS, f.traits),
  ];
  for (const [k, n] of RANGES) {
    const min = f[`${k}Min`];
    const max = f[`${k}Max`];
    if (isSet(min) && isSet(max)) out.push(`${n}${min}〜${max}`);
    else if (isSet(min)) out.push(`${n}${min}以上`);
    else if (isSet(max)) out.push(`${n}${max}以下`);
  }
  return out.join("・");
}
