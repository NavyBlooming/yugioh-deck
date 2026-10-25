export const MAIN_GROUPS = ["normal", "effect", "spell", "trap"];
export const EXTRA_GROUPS = ["fusion", "synchro", "xyz", "link"];

export function parseCards(json) {
  const map = new Map();
  for (const [cid, name, ruby, group, frame, limit] of json.cards) {
    map.set(cid, { cid, name, ruby, group, frame, limit });
  }
  return map;
}

export function areaOf(card) {
  return EXTRA_GROUPS.includes(card.group) ? "extra" : "main";
}
