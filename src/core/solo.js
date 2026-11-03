// 一人回しの盤面。操作はすべて新しい盤面を返し、元の盤面は変えない。
// ルール（召喚の条件や効果の処理）は見ない。どこへでも置ける

export const PILES = ["deck", "hand", "gy", "ban", "extra"];
export const SLOTS = ["m0", "m1", "m2", "m3", "m4", "e0", "e1", "s0", "s1", "s2", "s3", "s4", "fz"];
const isMonsterSlot = (s) => /^[me]\d$/.test(s);
const HISTORY_MAX = 200;

const fresh = (c) => ({ ...c, face: "up", pos: "atk", mats: [], counters: 0 });

function shuffled(list, random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// メインデッキを混ぜて draw 枚引く。候補（サイド）は使わない
export function startSolo(deck, cards, draw, random) {
  let id = 0;
  const copies = (area) => deck.entries.filter((e) => e.area === area).flatMap((e) => {
    const pend = Boolean(cards.get(e.cid)?.frame.endsWith("_pendulum"));
    return Array.from({ length: e.count }, () => ({ ...fresh({ id: ++id, cid: e.cid }), pend }));
  });
  const main = shuffled(copies("main"), random);
  const extra = copies("extra").map((c) => ({ ...c, face: "down" }));
  return {
    nextId: id + 1,
    turn: 1,
    life: 8000,
    deck: main.slice(draw),
    hand: main.slice(0, draw),
    gy: [],
    ban: [],
    extra,
    slots: Object.fromEntries(SLOTS.map((s) => [s, null])),
  };
}

const clone = (b) => ({ ...b, ...Object.fromEntries(PILES.map((p) => [p, [...b[p]]])), slots: { ...b.slots } });

// zone は束の名前・置き場の名前・素材なら "mat"（parent は持ち主の置き場）
export function findCard(b, id) {
  for (const p of PILES) {
    const index = b[p].findIndex((c) => c.id === id);
    if (index >= 0) return { card: b[p][index], zone: p, index };
  }
  for (const s of SLOTS) {
    const c = b.slots[s];
    if (!c) continue;
    if (c.id === id) return { card: c, zone: s, index: 0 };
    const index = c.mats.findIndex((m) => m.id === id);
    if (index >= 0) return { card: c.mats[index], zone: "mat", parent: s, index };
  }
  return null;
}

// 盤面から抜いた後の盤面を、b を直接書き換えて作る（b は clone 済みのもの）
function takeOut(b, at) {
  if (PILES.includes(at.zone)) b[at.zone].splice(at.index, 1);
  else if (at.zone === "mat") {
    const owner = b.slots[at.parent];
    b.slots[at.parent] = { ...owner, mats: owner.mats.filter((_, i) => i !== at.index) };
  } else b.slots[at.zone] = null;
}

// opts.bottom: デッキの下へ。opts.index: 束の中の位置。opts.stack: 埋まった置き場へ "top"（元のカードを素材に）か "under"（素材にする）
export function moveCard(b, id, to, opts = {}) {
  const at = findCard(b, id);
  if (!at || (at.zone === to && !PILES.includes(to))) return at ? b : null;
  const n = clone(b);
  const onField = SLOTS.includes(at.zone);
  takeOut(n, at);
  const card = at.card;
  if (PILES.includes(to)) {
    // 場を離れると素材は墓地へ。トークンは消える
    n.gy.push(...card.mats.map(fresh));
    if (card.token) return n;
    let c = fresh(card);
    if (to === "extra" && !(c.pend && (onField || at.zone === "mat"))) c = { ...c, face: "down" };
    const list = n[to];
    const index = opts.bottom ? list.length : opts.index ?? (to === "deck" ? 0 : list.length);
    list.splice(Math.min(index, list.length), 0, c);
    return n;
  }
  const here = n.slots[to];
  // 素材だったカードや束から来たカードは表側で置く。場の中で動かしたときはそのまま
  const placed = onField ? card : { ...fresh(card), mats: at.zone === "mat" ? [] : card.mats };
  if (!here) {
    n.slots[to] = placed;
    return n;
  }
  if (opts.stack === "top") n.slots[to] = { ...placed, mats: [...placed.mats, fresh(here), ...here.mats.map(fresh)] };
  else if (opts.stack === "under") n.slots[to] = { ...here, mats: [...here.mats, fresh(placed), ...placed.mats.map(fresh)] };
  else return null;
  return n;
}

function updateCard(b, id, fn) {
  const at = findCard(b, id);
  if (!at) return null;
  const n = clone(b);
  const next = fn(at.card);
  if (PILES.includes(at.zone)) n[at.zone][at.index] = next;
  else if (at.zone === "mat") {
    const owner = n.slots[at.parent];
    n.slots[at.parent] = { ...owner, mats: owner.mats.map((m, i) => (i === at.index ? next : m)) };
  } else n.slots[at.zone] = next;
  return n;
}

export const setPosition = (b, id, { face, pos }) => updateCard(b, id, (c) => ({ ...c, face: face ?? c.face, pos: pos ?? c.pos }));
export const addCounter = (b, id, d) => updateCard(b, id, (c) => ({ ...c, counters: Math.max(0, c.counters + d) }));

// いちばん下（最初に重ねた）の素材を墓地へ
export function detach(b, id) {
  const at = findCard(b, id);
  if (!at?.card.mats?.length) return null;
  return moveCard(b, at.card.mats[0].id, "gy");
}

export function drawCards(b, count) {
  const n = clone(b);
  n.hand.push(...n.deck.splice(0, count));
  return n;
}

export const shuffleDeck = (b, random) => ({ ...clone(b), deck: shuffled(b.deck, random) });

export function placeToken(b, slot) {
  if (!isMonsterSlot(slot) || b.slots[slot]) return null;
  const n = clone(b);
  n.slots[slot] = { ...fresh({ id: b.nextId, cid: 0 }), token: true };
  n.nextId = b.nextId + 1;
  return n;
}

export const changeLife = (b, d) => ({ ...b, life: Math.max(0, b.life + d) });
export const endTurn = (b) => ({ ...b, turn: b.turn + 1 });

// 元に戻す・やり直す
export const history = (now) => ({ past: [], now, future: [] });
export const record = (h, next) => ({ past: [...h.past, h.now].slice(-HISTORY_MAX), now: next, future: [] });
export const undo = (h) => (h.past.length ? { past: h.past.slice(0, -1), now: h.past.at(-1), future: [h.now, ...h.future] } : null);
export const redo = (h) => (h.future.length ? { past: [...h.past, h.now], now: h.future[0], future: h.future.slice(1) } : null);
