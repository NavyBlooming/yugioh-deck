import { checkKey, decryptArt, decryptTexts, deriveKey } from "../core/art.js";
import { buildTextIndex } from "../core/search.js";
import { setArtProvider } from "./tile.js";

const PASS_KEY = "ygo.pass.v1";

let meta = null;
let index = new Set();
let key = null;
const urls = new Map(); // cid → Promise<objectURL|null>
let texts = null; // Promise<Map cid → 正規化した効果テキスト | null>
let rawTexts = null; // cid → 表示用の効果テキスト

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
  del: (k) => { try { localStorage.removeItem(k); } catch {} },
};

// 復号した絵は IndexedDB に塩と cid の組で置く。合言葉を変えて作り直すと塩も変わるので、古い分は使われない。
function openDb() {
  return new Promise((resolve) => {
    let req;
    try {
      req = indexedDB.open("ygo-art", 1);
    } catch {
      return resolve(null);
    }
    req.onupgradeneeded = () => req.result.createObjectStore("art");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
  });
}
const dbReady = openDb();

async function idb(mode, fn) {
  const db = await dbReady;
  if (!db) return null;
  return new Promise((resolve) => {
    const tx = db.transaction("art", mode);
    const req = fn(tx.objectStore("art"));
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}

async function load(cid) {
  const k = `${meta.salt}:${cid}`;
  let blob = await idb("readonly", (s) => s.get(k));
  if (!blob) {
    const r = await fetch(`art/${cid}.bin`);
    if (!r.ok) return null;
    blob = new Blob([await decryptArt(key, await r.arrayBuffer())], { type: "image/webp" });
    await idb("readwrite", (s) => s.put(blob, k));
  }
  return URL.createObjectURL(blob);
}

function provider(cid) {
  if (!key || !index.has(cid)) return Promise.resolve(null);
  if (!urls.has(cid)) urls.set(cid, load(cid).catch(() => null));
  return urls.get(cid);
}

async function keyFor(pass) {
  const k = await deriveKey(pass, meta);
  return (await checkKey(k, meta)) ? k : null;
}

// 起動時に呼ぶ。2回目からは同じ準備を待つだけ。絵のデータが無くても、合言葉が無くても、他の機能はそのまま動く。
let started = null;
export const initArt = () => (started ??= init());

async function init() {
  try {
    const [m, i] = await Promise.all([
      fetch("art/meta.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null)),
      fetch("art/index.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : [])),
    ]);
    meta = m;
    index = new Set(i);
  } catch {
    meta = null;
  }
  const pass = store.get(PASS_KEY);
  if (meta && pass) key = await keyFor(pass).catch(() => null);
  setArtProvider(provider);
  return key !== null;
}

export const artState = () => (!meta ? "none" : key ? "on" : "off");

// 確かめ済みの合言葉。入っていなければ null
export const currentPassphrase = () => (key ? store.get(PASS_KEY) : null);

// 正しい合言葉のときだけ保存する
export async function setPassphrase(pass) {
  if (!meta) return false;
  const k = await keyFor(pass).catch(() => null);
  if (!k) return false;
  key = k;
  urls.clear();
  store.set(PASS_KEY, pass);
  return true;
}

// 効果テキストは初めて使うときに取り、塩ごとに1件だけ置く。hash が変われば取り直す
async function fetchTexts() {
  const tm = await fetch("art/texts-meta.json", { cache: "no-cache" }).then((r) => (r.ok ? r.json() : null));
  if (!tm) return null;
  const k = `${meta.salt}:texts`;
  const saved = await idb("readonly", (s) => s.get(k));
  if (saved?.hash === tm.hash) {
    rawTexts = saved.texts;
    return buildTextIndex(saved.texts);
  }
  const r = await fetch(`art/texts.bin?h=${tm.hash}`);
  if (!r.ok) return null;
  const t = await decryptTexts(key, await r.arrayBuffer());
  await idb("readwrite", (s) => s.put({ hash: tm.hash, texts: t }, k));
  rawTexts = t;
  return buildTextIndex(t);
}

export function loadTexts() {
  if (!key) return Promise.resolve(null);
  if (!texts) texts = fetchTexts().catch(() => null).then((t) => (t ? t : ((texts = null), null)));
  return texts;
}

// カード詳細に出す効果テキスト。合言葉が無いか、文が無ければ null
export async function cardText(cid) {
  if (!(await loadTexts())) return null;
  return rawTexts?.[cid] ?? null;
}

export function clearPassphrase() {
  key = null;
  urls.clear();
  texts = null;
  store.del(PASS_KEY);
}
