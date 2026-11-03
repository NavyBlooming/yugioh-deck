import {
  SLOTS, addCounter, changeLife, detach, drawCards, endTurn, findCard, history, moveCard, placeToken, record, redo, setPosition, shuffleDeck, startSolo, undo,
} from "../core/solo.js";
import { cardInfo } from "./card-info.js";
import { h } from "./dom.js";
import { openModal, toast } from "./dialogs.js";
import { toolTabs } from "./shop.js";
import { cardOr, tileEl } from "./tile.js";

// デッキごとの盤面（元に戻すための列ごと）。タブを移っても、開いている間は残す
const sessions = new Map();

const ZONE_TEXT = { hand: "手札", gy: "墓地", ban: "除外", extra: "EXデッキ", deck: "デッキ" };
const isMonsterSlot = (z) => /^[me]\d$/.test(z);
// 盤面の並び。null は空き
const ROWS = [
  [null, null, "e0", null, "e1", null, "ban"],
  ["fz", "m0", "m1", "m2", "m3", "m4", "gy"],
  ["extra", "s0", "s1", "s2", "s3", "s4", "deck"],
];
const EMPTY_TEXT = { e0: "EX", e1: "EX", fz: "場", s0: "P", s4: "P" };
const DRAG_PX = 10;
const LONG_MS = 500;

const deckOf = (ctx, id) => ctx.state.decks.find((d) => d.id === id);

function startButtons(ctx, deckId, after) {
  const go = (n) => () => {
    sessions.set(deckId, history(startSolo(deckOf(ctx, deckId), ctx.cards, n, Math.random)));
    after();
  };
  return h("div", { class: "solo-start" },
    h("button", { class: "btn primary", type: "button", id: "solo-first", onclick: go(5) }, "先攻（5枚）"),
    h("button", { class: "btn primary", type: "button", id: "solo-second", onclick: go(6) }, "後攻（6枚）"),
  );
}

// ツールタブの「一人回し」。デッキを選んで始める
export function soloPicker(ctx) {
  const root = h("div", { class: "view" });
  const decks = ctx.state.decks;
  const head = h("div", { class: "page-head" }, h("h1", {}, "一人回し"));
  if (!decks.length) {
    root.replaceChildren(toolTabs("solo"), head, h("div", { class: "empty" }, h("p", {}, "まだデッキがありません")));
    return { el: root, refresh() {} };
  }
  const select = h("select", { id: "solo-deck" }, decks.map((d) => h("option", { value: d.id }, d.name)));
  const area = h("div", { class: "panel solo-pick" });
  const open = () => (location.hash = `#/solo/${encodeURIComponent(select.value)}`);
  // replaceChildren は null を "null" の文字にするので、盤面が無いときは何も足さない
  const show = () => area.replaceChildren(
    h("label", {}, "デッキ", select),
    startButtons(ctx, select.value, open),
    ...(sessions.has(select.value) ? [h("button", { class: "btn", type: "button", id: "solo-resume", onclick: open }, "続きから")] : []),
  );
  select.addEventListener("change", show);
  show();
  root.replaceChildren(toolTabs("solo"), head, area);
  return { el: root, refresh() {} };
}

export function soloView(ctx, deckId) {
  if (!deckOf(ctx, deckId)) {
    return { el: h("div", { class: "view empty" }, h("p", {}, "デッキが見つかりません"), h("a", { class: "btn", href: "#/solo" }, "一人回しへ")), refresh() {} };
  }
  const root = h("div", { class: "view solo" });
  const hist = () => sessions.get(deckId);
  const board = () => hist().now;
  const card = (c) => (c.token ? { cid: 0, name: "トークン", ruby: "", group: "normal", frame: "normal", limit: 3 } : cardOr(ctx.cards, c.cid));
  // 置く場所を押して決めるとき（一覧の「場へ」・トークン）
  let placing = null;

  function commit(next, fail = "そこには置けません") {
    if (!next) return toast(fail);
    sessions.set(deckId, record(hist(), next));
    refresh();
  }
  const step = (fn) => {
    const next = fn(hist());
    if (next) {
      sessions.set(deckId, next);
      refresh();
    }
  };

  function cardEl(c) {
    const el = c.token ? h("div", { class: "tile token" }, h("div", { class: "name" }, "トークン")) : tileEl(card(c), {});
    el.dataset.id = c.id;
    if (c.face === "down") el.classList.add("down");
    if (c.pos === "def") el.classList.add("def");
    if (c.mats.length) el.append(h("span", { class: "solo-mats" }, `素材${c.mats.length}`));
    if (c.counters) el.append(h("span", { class: "solo-counter" }, c.counters));
    return el;
  }

  function zoneEl(z) {
    const b = board();
    if (z === null) return h("div", { class: "zone none" });
    const el = h("div", { class: `zone z-${z.replace(/\d/, "")}`, "data-zone": z });
    if (SLOTS.includes(z)) {
      if (b.slots[z]) el.append(cardEl(b.slots[z]));
      else if (EMPTY_TEXT[z]) el.append(h("span", { class: "zone-label" }, EMPTY_TEXT[z]));
      return el;
    }
    // 束は一番上の1枚だけ出す。デッキと EX は裏で
    const list = b[z];
    const top = z === "deck" || z === "extra" ? list[0] : list.at(-1);
    if (!top) {
      el.append(h("span", { class: "zone-label" }, ZONE_TEXT[z]));
      return el;
    }
    if (z === "deck" || z === "extra") el.append(h("div", { class: "tile back", "data-id": top.id }));
    else el.append(cardEl(top));
    el.append(h("span", { class: "solo-count" }, `${ZONE_TEXT[z]} ${list.length}`));
    return el;
  }

  function refresh() {
    if (!hist()) {
      root.replaceChildren(h("div", { class: "solo-top" }, h("a", { class: "btn small", href: `#/deck/${encodeURIComponent(deckId)}` }, "← デッキ"), h("h1", { class: "solo-name" }, deckOf(ctx, deckId).name)),
        h("div", { class: "panel solo-pick" }, h("p", {}, "先攻か後攻を選ぶと、メインデッキを混ぜて引きます。"), startButtons(ctx, deckId, refresh)));
      return;
    }
    const b = board();
    const hand = h("div", { class: "solo-hand", "data-zone": "hand", style: `--n:${Math.max(b.hand.length, 1)}` }, b.hand.map(cardEl));
    root.replaceChildren(
      h("div", { class: "solo-top" },
        h("a", { class: "btn small", href: `#/deck/${encodeURIComponent(deckId)}` }, "←"),
        placing
          ? h("div", { class: "solo-placing", id: "solo-placing" }, placing.set ? "セットする場所を押してください" : "置く場所を押してください", h("button", { class: "btn small", type: "button", onclick: () => ((placing = null), refresh()) }, "やめる"))
          : h("h1", { class: "solo-name" }, deckOf(ctx, deckId).name),
        h("span", { class: "solo-turn", id: "solo-turn" }, `ターン${b.turn}`),
        h("button", { class: "btn small solo-life", type: "button", id: "solo-life", onclick: lifeSheet }, `LP ${b.life}`),
      ),
      h("div", { class: "solo-board" }, ROWS.flat().map(zoneEl)),
      hand,
      h("div", { class: "solo-bar" },
        h("button", { class: "btn small", type: "button", id: "solo-undo", disabled: !hist().past.length, onclick: () => step(undo) }, "元に戻す"),
        h("button", { class: "btn small", type: "button", id: "solo-redo", disabled: !hist().future.length, onclick: () => step(redo) }, "やり直す"),
        h("button", { class: "btn small", type: "button", id: "solo-draw", onclick: () => commit(b.deck.length ? drawCards(b, 1) : null, "デッキがありません") }, "1枚引く"),
        h("button", { class: "btn small", type: "button", id: "solo-end", onclick: () => (commit(endTurn(b)), toast(`ターン${b.turn + 1}`)) }, "ターン終了"),
        h("button", { class: "btn small", type: "button", id: "solo-more", onclick: moreSheet }, "その他"),
      ),
    );
  }

  // 埋まった置き場へ動かすとき、重ね方を聞く
  function moveTo(id, zone, opts = {}) {
    const b = board();
    const here = b.slots[zone];
    if (!here || here.id === id) return commit(moveCard(b, id, zone, opts));
    const close = openModal(h("div", { class: "sheet-body", id: "solo-stack" },
      h("h2", {}, `${card(here).name}のゾーンに置きます`),
      h("button", { class: "btn primary", type: "button", id: "stack-top", onclick: () => (close(), commit(moveCard(board(), id, zone, { stack: "top" }))) }, "上に重ねる（今のカードを素材に）"),
      h("button", { class: "btn", type: "button", id: "stack-under", onclick: () => (close(), commit(moveCard(board(), id, zone, { stack: "under" }))) }, "素材にする"),
      h("button", { class: "btn", type: "button", onclick: () => close() }, "やめる"),
    ), { sheet: true });
  }

  function detail(c) {
    if (c.token) return cardMenu(c.id);
    const close = openModal(h("div", { class: "cd", id: "card-detail" }, ...cardInfo(card(c), () => close())), { sheet: true });
  }

  // 長押し・右クリックのメニュー
  function cardMenu(id) {
    const at = findCard(board(), id);
    if (!at) return;
    const c = at.card;
    const zone = at.zone;
    let close;
    const act = (fn) => () => {
      close();
      fn();
    };
    const btn = (text, fn, attrs = {}) => h("button", { class: "btn", type: "button", ...attrs, onclick: act(fn) }, text);
    const pos = (face, p) => () => commit(setPosition(board(), id, { face, pos: p }));
    const rows = [];
    if (isMonsterSlot(zone)) {
      rows.push(h("div", { class: "solo-acts" },
        btn("攻撃表示", pos("up", "atk"), { id: "menu-atk" }),
        btn("守備表示", pos("up", "def"), { id: "menu-def" }),
        btn("裏側守備表示", pos("down", "def"), { id: "menu-set" })));
    } else if (SLOTS.includes(zone)) {
      rows.push(h("div", { class: "solo-acts" }, c.face === "down" ? btn("表にする", pos("up", "atk"), { id: "menu-up" }) : btn("セット（裏側）", pos("down", "atk"), { id: "menu-set" })));
    }
    if (SLOTS.includes(zone)) {
      rows.push(h("div", { class: "solo-acts" },
        h("span", { class: "muted" }, `カウンター ${c.counters}`),
        btn("＋1", () => commit(addCounter(board(), id, 1)), { id: "menu-counter-plus" }),
        c.counters ? btn("−1", () => commit(addCounter(board(), id, -1)), { id: "menu-counter-minus" }) : null));
      if (c.mats.length) {
        rows.push(h("div", { class: "solo-acts" },
          btn("素材を1つ墓地へ", () => commit(detach(board(), id)), { id: "menu-detach" }),
          btn(`素材を見る（${c.mats.length}）`, () => listSheet({ mats: zone }), { id: "menu-mats" })));
      }
    }
    const dests = [["hand", "手札へ"], ["gy", "墓地へ"], ["ban", "除外へ"], ["deck", "デッキの上へ"], ["deck-bottom", "デッキの下へ"], ["extra", "EXデッキへ"]];
    rows.push(h("div", { class: "solo-acts" },
      SLOTS.includes(zone) ? null : btn("場へ置く", () => ((placing = { id }), refresh()), { id: "menu-place" }),
      SLOTS.includes(zone) || c.token ? null : btn("セット", () => ((placing = { id, set: true }), refresh()), { id: "menu-place-set" }),
      ...dests.filter(([d]) => d !== zone).map(([d, text]) => btn(text, () => commit(d === "deck-bottom" ? moveCard(board(), id, "deck", { bottom: true }) : moveCard(board(), id, d)), { "data-dest": d }))));
    if (!c.token) rows.push(btn("カード詳細", () => detail(c), { id: "menu-detail" }));
    close = openModal(h("div", { class: "sheet-body", id: "solo-menu" }, h("h2", {}, card(c).name), ...rows), { sheet: true });
  }

  // 束（や素材）の中身の一覧。押すとそのカードのメニュー
  function listSheet(src) {
    const b = board();
    let list;
    let title;
    if (src.mats) {
      list = b.slots[src.mats].mats;
      title = `素材（${list.length}枚）`;
    } else if (src.top) {
      list = b.deck.slice(0, src.top);
      title = `デッキの上から${list.length}枚`;
    } else {
      // 墓地・除外は新しい順
      list = src.zone === "gy" || src.zone === "ban" ? [...b[src.zone]].reverse() : b[src.zone];
      title = `${ZONE_TEXT[src.zone]}（${list.length}枚）`;
    }
    const grid = h("div", { class: "grid solo-list", id: "solo-list" }, list.map((c) => {
      const el = cardEl(c);
      el.classList.remove("def");
      el.addEventListener("click", () => {
        close();
        cardMenu(c.id);
      });
      return el;
    }));
    const close = openModal(h("div", { class: "sheet-body" }, h("h2", {}, title), list.length ? grid : h("p", { class: "muted" }, "ありません")), { sheet: true });
  }

  function deckSheet() {
    let close;
    const act = (fn) => () => (close(), fn());
    close = openModal(h("div", { class: "sheet-body", id: "solo-deck-menu" },
      h("h2", {}, `デッキ（${board().deck.length}枚）`),
      h("div", { class: "solo-acts" },
        h("button", { class: "btn primary", type: "button", onclick: act(() => commit(board().deck.length ? drawCards(board(), 1) : null, "デッキがありません")) }, "1枚引く"),
        h("button", { class: "btn", type: "button", id: "deck-shuffle", onclick: act(() => (commit(shuffleDeck(board(), Math.random)), toast("デッキをシャッフルしました"))) }, "シャッフル"),
        h("button", { class: "btn", type: "button", id: "deck-list", onclick: act(() => listSheet({ zone: "deck" })) }, "デッキを見る")),
      h("div", { class: "solo-acts" }, h("span", { class: "muted" }, "上からめくる"),
        [1, 2, 3, 4, 5].map((n) => h("button", { class: "btn small", type: "button", "data-top": n, onclick: act(() => listSheet({ top: n })) }, `${n}枚`))),
    ), { sheet: true });
  }

  function moreSheet() {
    let close;
    const act = (fn) => () => (close(), fn());
    const restart = (n) => act(() => {
      commit(startSolo(deckOf(ctx, deckId), ctx.cards, n, Math.random));
      toast(n === 5 ? "先攻で引き直しました" : "後攻で引き直しました");
    });
    close = openModal(h("div", { class: "sheet-body", id: "solo-more-menu" },
      h("div", { class: "solo-acts" },
        h("button", { class: "btn", type: "button", id: "more-token", onclick: act(() => ((placing = { token: true }), refresh())) }, "トークンを出す"),
        h("button", { class: "btn", type: "button", onclick: act(() => (commit(shuffleDeck(board(), Math.random)), toast("デッキをシャッフルしました"))) }, "デッキをシャッフル")),
      h("div", { class: "solo-acts" }, h("span", { class: "muted" }, "最初から"),
        h("button", { class: "btn", type: "button", id: "more-first", onclick: restart(5) }, "先攻（5枚）"),
        h("button", { class: "btn", type: "button", id: "more-second", onclick: restart(6) }, "後攻（6枚）")),
    ), { sheet: true });
  }

  function lifeSheet() {
    const now = h("div", { class: "solo-life-now", id: "life-now" }, board().life);
    const change = (d) => () => {
      commit(changeLife(board(), d));
      now.textContent = board().life;
    };
    const input = h("input", { type: "number", inputmode: "numeric", min: "0", step: "50", id: "life-input", placeholder: "数を入れる" });
    const typed = (sign) => () => {
      const n = Math.floor(Number(input.value));
      if (n > 0) change(sign * n)();
      input.value = "";
    };
    openModal(h("div", { class: "sheet-body", id: "solo-life-menu" },
      h("h2", {}, "ライフ"), now,
      h("div", { class: "solo-life-grid" }, [-1000, -500, -100, 100, 500, 1000].map((d) => h("button", { class: "btn", type: "button", "data-life": d, onclick: change(d) }, d > 0 ? `+${d}` : `−${-d}`))),
      h("div", { class: "solo-acts" }, input,
        h("button", { class: "btn", type: "button", id: "life-minus", onclick: typed(-1) }, "減らす"),
        h("button", { class: "btn", type: "button", id: "life-plus", onclick: typed(1) }, "増やす")),
      h("button", { class: "btn", type: "button", id: "life-reset", onclick: () => change(8000 - board().life)() }, "8000 に戻す"),
    ), { sheet: true });
  }

  // 押した場所を見て、ゾーンかカードかを決める
  const zoneAt = (x, y) => document.elementFromPoint(x, y)?.closest("[data-zone]")?.dataset.zone ?? null;

  function tap(el, zoneEl) {
    const zone = zoneEl?.dataset.zone;
    if (placing) {
      if (!zone || !SLOTS.includes(zone)) return;
      const p = placing;
      placing = null;
      if (p.token) return commit(placeToken(board(), zone), "トークンは空いたモンスターゾーンに置けます");
      // セットは裏側で置く。モンスターゾーンなら裏側守備表示
      if (p.set) {
        const moved = board().slots[zone] ? null : moveCard(board(), p.id, zone);
        return commit(moved && setPosition(moved, p.id, { face: "down", pos: isMonsterSlot(zone) ? "def" : "atk" }), "セットは空いたゾーンにできます");
      }
      return moveTo(p.id, zone);
    }
    if (zone === "deck") return deckSheet();
    if (zone === "gy" || zone === "ban" || zone === "extra") return listSheet({ zone });
    const id = Number(el?.dataset.id);
    if (!id) return;
    const at = findCard(board(), id);
    if (at) detail(at.card);
  }
  function longPress(el, zoneEl) {
    const zone = zoneEl?.dataset.zone;
    if (placing) return;
    if (zone === "deck") return deckSheet();
    if (zone === "gy" || zone === "ban" || zone === "extra") return listSheet({ zone });
    const id = Number(el?.dataset.id);
    if (id) cardMenu(id);
  }

  // 手札のどこへ落としたか。落とした位置より左にある札の数
  function handIndex(x, id) {
    const others = [...root.querySelectorAll(".solo-hand > [data-id]")].filter((e) => Number(e.dataset.id) !== id);
    return others.filter((e) => {
      const r = e.getBoundingClientRect();
      return r.left + r.width / 2 < x;
    }).length;
  }

  // 押して動かせばドラッグ、動かさずに長押しでメニュー、すぐ離せばタップ
  let press = null;
  const endPress = () => {
    if (!press) return;
    clearTimeout(press.timer);
    press.ghost?.remove();
    press.el?.classList.remove("dragging");
    root.querySelector(".zone.over")?.classList.remove("over");
    press = null;
  };
  root.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || !hist()) return;
    const zoneEl = e.target.closest("[data-zone]");
    if (!zoneEl || !root.querySelector(".solo-board")) return;
    const el = e.target.closest("[data-id]");
    endPress();
    press = { x: e.clientX, y: e.clientY, el, zoneEl, pointerId: e.pointerId, long: false };
    press.timer = setTimeout(() => {
      press.long = true;
      longPress(el, zoneEl);
    }, LONG_MS);
  });
  root.addEventListener("pointermove", (e) => {
    if (!press || press.long || e.pointerId !== press.pointerId) return;
    if (!press.ghost) {
      if (!press.el || placing || Math.hypot(e.clientX - press.x, e.clientY - press.y) < DRAG_PX) return;
      clearTimeout(press.timer);
      const r = press.el.getBoundingClientRect();
      press.ghost = press.el.cloneNode(true);
      press.ghost.classList.add("solo-ghost");
      press.ghost.style.width = `${r.width}px`;
      press.ghost.style.height = `${r.height}px`;
      press.dx = press.x - r.left;
      press.dy = press.y - r.top;
      document.body.append(press.ghost);
      press.el.classList.add("dragging");
    }
    press.ghost.style.left = `${e.clientX - press.dx}px`;
    press.ghost.style.top = `${e.clientY - press.dy}px`;
    const over = zoneAt(e.clientX, e.clientY);
    const cur = root.querySelector(".zone.over");
    if (cur?.dataset.zone !== over) {
      cur?.classList.remove("over");
      if (over && over !== "hand") root.querySelector(`.zone[data-zone="${over}"]`)?.classList.add("over");
    }
  });
  root.addEventListener("pointerup", (e) => {
    if (!press || e.pointerId !== press.pointerId) return;
    const p = press;
    const dragging = Boolean(p.ghost);
    endPress();
    if (p.long) return;
    if (!dragging) return tap(p.el, p.zoneEl);
    const id = Number(p.el.dataset.id);
    const zone = zoneAt(e.clientX, e.clientY);
    if (!zone || zone === p.zoneEl.dataset.zone && zone !== "hand") return;
    if (zone === "hand") return commit(moveCard(board(), id, "hand", { index: handIndex(e.clientX, id) }));
    moveTo(id, zone);
  });
  root.addEventListener("pointercancel", endPress);
  root.addEventListener("contextmenu", (e) => {
    if (!root.querySelector(".solo-board")) return;
    e.preventDefault();
    if (e.pointerType === "touch") return; // 指の長押しは pointerdown の時間で拾う
    endPress();
    longPress(e.target.closest("[data-id]"), e.target.closest("[data-zone]"));
  });
  const onKey = (e) => {
    if (!root.isConnected) return document.removeEventListener("keydown", onKey);
    if (!(e.ctrlKey || e.metaKey) || !hist() || document.querySelector(".overlay")) return;
    const k = e.key.toLowerCase();
    if (k === "z" && !e.shiftKey) step(undo);
    else if (k === "y" || (k === "z" && e.shiftKey)) step(redo);
    else return;
    e.preventDefault();
  };
  document.addEventListener("keydown", onKey);

  refresh();
  return { el: root, refresh, solo: true };
}
