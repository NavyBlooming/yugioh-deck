export const MAIN_GROUPS = ["normal", "effect", "spell", "trap"];
export const EXTRA_GROUPS = ["fusion", "synchro", "xyz", "link"];

export function parseCards(json) {
  const map = new Map();
  for (const [cid, name, ruby, group, frame, limit, level = 0, sub = ""] of json.cards) {
    map.set(cid, { cid, name, ruby, group, frame, limit, level, sub });
  }
  return map;
}

// 魔法・罠の種類の並び順
// 魔法は通常・フィールド・装備・永続・速攻・儀式、罠は通常・永続・カウンター（マスターデュエルの絞り込みの並び）
export const SUB_ORDER = ["normal", "field", "equip", "continuous", "quickplay", "ritual", "counter"];

export function areaOf(card) {
  return EXTRA_GROUPS.includes(card.group) ? "extra" : "main";
}

// デッキと同じ並び（メインの群 → EXの群 → モンスターはレベル、魔法・罠は種類 → 読み）でカードを比べる
const ALL_GROUPS = [...MAIN_GROUPS, ...EXTRA_GROUPS];
export function compareCards(a, b) {
  const inner = (c) => (c.group === "spell" || c.group === "trap" ? SUB_ORDER.indexOf(c.sub) : c.level ?? 0);
  return ALL_GROUPS.indexOf(a.group) - ALL_GROUPS.indexOf(b.group) || inner(a) - inner(b) || (a.ruby < b.ruby ? -1 : a.ruby > b.ruby ? 1 : 0);
}
