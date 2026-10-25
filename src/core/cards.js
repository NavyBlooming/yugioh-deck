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
export const SUB_ORDER = ["normal", "quickplay", "continuous", "equip", "field", "ritual", "counter"];

export function areaOf(card) {
  return EXTRA_GROUPS.includes(card.group) ? "extra" : "main";
}
