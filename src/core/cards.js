export const MAIN_GROUPS = ["normal", "effect", "spell", "trap"];
export const EXTRA_GROUPS = ["fusion", "synchro", "xyz", "link"];

export function parseCards(json) {
  const map = new Map();
  for (const [cid, name, ruby, group, frame, limit, level = 0, sub = "", date = "", ...mon] of json.cards) {
    const card = { cid, name, ruby, group, frame, limit, level, sub };
    if (date) card.date = date;
    if (mon.length) [card.attr, card.race, card.type, card.atk, card.def, card.scale] = mon;
    map.set(cid, card);
  }
  return map;
}

// 属性・種族・種類は ygocdb の番号（YGOPro と同じ並び）
const ATTRS = ["地", "水", "炎", "風", "光", "闇", "神"];
const RACES = ["戦士", "魔法使い", "天使", "悪魔", "アンデット", "機械", "水", "炎", "岩石", "鳥獣", "植物", "昆虫", "雷", "ドラゴン", "獣", "獣戦士", "恐竜", "魚", "海竜", "爬虫類", "サイキック", "幻神獣", "創造神", "幻竜", "サイバース", "幻想魔"];
const TRAITS = [[0x200000, "リバース"], [0x200, "スピリット"], [0x400, "ユニオン"], [0x800, "デュアル"], [0x400000, "トゥーン"], [0x2000000, "特殊召喚"], [0x1000, "チューナー"]];
// リンクマーカーのビット（YGOPro と同じ）
const MARKERS = [[1, "左下"], [2, "下"], [4, "右下"], [8, "左"], [32, "右"], [64, "左上"], [128, "上"], [256, "右上"]];
const nameOf = (bits, names, suffix) => {
  const i = Math.log2(bits);
  return Number.isInteger(i) && names[i] ? names[i] + suffix : "";
};
const num = (v) => (v === -2 ? "?" : String(v));

// カード詳細に出すモンスターの情報。番号が無いカード（魔法・罠、発売前のカードなど）は null
export function monsterInfo(card) {
  if (card.type === undefined) return null;
  const link = (card.type & 0x4000000) !== 0;
  return {
    attr: nameOf(card.attr, ATTRS, "属性"),
    race: nameOf(card.race, RACES, "族"),
    traits: TRAITS.filter(([bit]) => card.type & bit).map(([, t]) => t),
    atk: num(card.atk),
    def: link ? null : num(card.def),
    markers: link ? MARKERS.filter(([bit]) => card.def & bit).map(([, m]) => m) : null,
    scale: card.type & 0x1000000 ? card.scale : null,
  };
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
