import { checkKey, decryptArt, deriveKey } from "../core/art.js";
import { setArtProvider } from "./tile.js";

const PASS_KEY = "ygo.pass.v1";

let meta = null;
let index = new Set();
let key = null;
const urls = new Map(); // cid → Promise<objectURL|null>

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

// 起動時に一度だけ呼ぶ。絵のデータが無くても、合言葉が無くても、他の機能はそのまま動く。
export async function initArt() {
  try {
    const [m, i] = await Promise.all([
      fetch("art/meta.json").then((r) => (r.ok ? r.json() : null)),
      fetch("art/index.json").then((r) => (r.ok ? r.json() : [])),
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

export function clearPassphrase() {
  key = null;
  urls.clear();
  store.del(PASS_KEY);
}
