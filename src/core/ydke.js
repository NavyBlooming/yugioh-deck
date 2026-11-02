import { addCard, createDeck, sortedEntries } from "./deck.js";

// YDKE は "ydke://" + メイン + "!" + エクストラ + "!" + サイド + "!"。
// 各欄はパスワードを4バイトのリトルエンディアンで並べて Base64 にしたもの
const SECTIONS = ["main", "extra", "side"];

function decode(b64) {
  let bin;
  try {
    bin = atob(b64);
  } catch {
    return null;
  }
  if (bin.length % 4) return null;
  const view = new DataView(Uint8Array.from(bin, (ch) => ch.charCodeAt(0)).buffer);
  return Array.from({ length: bin.length / 4 }, (_, i) => view.getUint32(i * 4, true));
}

function encode(ids) {
  const view = new DataView(new ArrayBuffer(ids.length * 4));
  ids.forEach((id, i) => view.setUint32(i * 4, id, true));
  return btoa(String.fromCharCode(...new Uint8Array(view.buffer)));
}

export function parseYdke(text) {
  const s = text.trim();
  if (!s.startsWith("ydke://")) return null;
  const parts = s.slice(7).split("!");
  if (parts.length < 4) return null;
  const out = {};
  for (const [i, key] of SECTIONS.entries()) {
    out[key] = decode(parts[i]);
    if (!out[key]) return null;
  }
  return out;
}

export const toYdke = (d) => "ydke://" + SECTIONS.map((k) => encode(d[k]) + "!").join("");

// data/passcodes.json から、cid → 書き出す番号 と、番号 → cid の表を作る
export function passcodeIndex(json) {
  const toPw = new Map(Object.entries(json.export).map(([cid, pw]) => [Number(cid), pw]));
  const toCid = new Map([...toPw].map(([cid, pw]) => [pw, cid]));
  for (const [pw, cid] of Object.entries(json.alias)) toCid.set(Number(pw), cid);
  return { toPw, toCid };
}

// 候補はサイドデッキとして書き出す。パスワードの無いカードは外し、名前を返す
export function exportDeck(deck, cards, index) {
  const missing = new Set();
  const out = {};
  for (const [key, area] of [["main", "main"], ["extra", "extra"], ["side", "cand"]]) {
    out[key] = sortedEntries(deck, cards, area).flatMap((e) => {
      const pw = index.toPw.get(e.cid);
      if (!pw) missing.add(cards.get(e.cid)?.name ?? String(e.cid));
      return pw ? Array(e.count).fill(pw) : [];
    });
  }
  return { ydke: toYdke(out), missing: [...missing] };
}

// 新しいデッキとして読み込む。サイドは候補に入れ、メインとエクストラはカードの種類で振り分ける。
// 知らない番号は unknown に、上限（欄の枚数・同名3枚）を超えた分は over に数えて入れない
export function importDeck(state, name, text, cards, index) {
  const d = parseYdke(text);
  if (!d) return { ok: false, reason: "not-ydke" };
  let { state: s, deckId } = createDeck(state, name);
  const unknown = [];
  let over = 0;
  for (const [key, dest] of [["main", "deck"], ["extra", "deck"], ["side", "cand"]]) {
    for (const pw of d[key]) {
      const card = cards.get(index.toCid.get(pw));
      if (!card) {
        unknown.push(pw);
        continue;
      }
      const r = addCard(s, deckId, card, dest);
      if (r.ok) s = r.state;
      else over++;
    }
  }
  delete s.decks.find((x) => x.id === deckId).history;
  return { ok: true, state: s, deckId, unknown, over };
}
