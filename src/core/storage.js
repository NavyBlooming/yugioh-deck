import { bitCount } from "./deck.js";

export const STORAGE_KEY = "ygo.data.v1";

export function emptyState() {
  return { version: 1, decks: [], notes: {}, nextSeq: 1 };
}

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
const isObj = (v) => typeof v === "object" && v !== null && !Array.isArray(v);

function validEntry(e) {
  return (
    isObj(e) &&
    isNum(e.cid) &&
    ["main", "extra", "cand"].includes(e.area) &&
    Number.isInteger(e.count) && e.count >= 1 &&
    Number.isInteger(e.missing) && e.missing >= 0 && e.missing <= e.count &&
    (e.mask === undefined || (Number.isInteger(e.mask) && e.mask >= 0 && e.mask < 2 ** e.count && bitCount(e.mask) === e.missing)) &&
    isNum(e.seq)
  );
}

const validHistory = (h) => h === undefined || (Array.isArray(h) && h.every((x) => isObj(x) && isNum(x.cid) && (x.op === "in" || x.op === "out")));

function validDeck(d) {
  return (
    validHistory(d?.history) &&
    isObj(d) &&
    typeof d.id === "string" &&
    typeof d.name === "string" &&
    (d.cover === null || isNum(d.cover)) &&
    Array.isArray(d.entries) &&
    d.entries.every(validEntry)
  );
}

function validNote(n) {
  return isObj(n) && (n.price === null || isNum(n.price)) && typeof n.rarity === "string" && typeof n.print === "string";
}

export function isValidState(obj) {
  return (
    isObj(obj) &&
    obj.version === 1 &&
    Array.isArray(obj.decks) && obj.decks.every(validDeck) &&
    isObj(obj.notes) && Object.values(obj.notes).every(validNote) &&
    isNum(obj.nextSeq) &&
    (obj.favorites === undefined || (Array.isArray(obj.favorites) && obj.favorites.every(isNum)))
  );
}

export function exportJson(state) {
  const { version, decks, notes, nextSeq, favorites } = state;
  return JSON.stringify({ version, decks, notes, nextSeq, favorites });
}

export function parseImport(text) {
  let obj;
  try {
    obj = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  return isValidState(obj) ? { ok: true, state: obj } : { ok: false };
}

export function exportFileName(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `yugioh-deck-${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}.json`;
}

export function loadState(storage) {
  try {
    const text = storage.getItem(STORAGE_KEY);
    if (text === null || text === undefined) return emptyState();
    const r = parseImport(text);
    return r.ok ? r.state : emptyState();
  } catch {
    return emptyState();
  }
}

export function saveState(storage, state) {
  storage.setItem(STORAGE_KEY, exportJson(state));
}
