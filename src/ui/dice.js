import { rollDice, tossCoin } from "../core/dice.js";
import { h } from "./dom.js";
import { toolTabs } from "./shop.js";

// 目ごとの点の位置（3×3 の升目の番号）
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function setFace(el, n) {
  el.dataset.face = n;
  el.replaceChildren(...Array.from({ length: 9 }, (_, i) => h("span", { class: PIPS[n].includes(i) ? "pip" : "" })));
}
const dieEl = (n) => {
  const el = h("div", { class: "die", role: "img", "aria-label": `${n}の目` });
  setFace(el, n);
  return el;
};
const setCoin = (el, side) => {
  el.dataset.coin = side;
  el.textContent = side;
};

// 振った・投げた直後の動き。角度は経過時間から決め、止まったときに結果の目・面になる
const DURATION = 700;
let anim = 0;
function animate(result, root) {
  cancelAnimationFrame(anim);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const total = root.querySelector(".dice-total");
  if (total) total.hidden = true;
  const start = performance.now();
  let lastSwap = -1;
  const step = (now) => {
    const t = Math.min(1, Math.max(0, now - start) / DURATION);
    const ease = 1 - (1 - t) ** 3;
    if (result.coin) {
      // 3回転。手前を向いている間は結果の面、向こうを向いている間は反対の面
      const c = Math.cos(ease * 6 * Math.PI);
      const el = root.querySelector(".coin");
      setCoin(el, c >= 0 ? result.coin : result.coin === "表" ? "裏" : "表");
      el.style.transform = t < 1 ? `scaleX(${Math.max(Math.abs(c), 0.04)})` : "";
    } else {
      const swap = Math.floor((now - start) / 90);
      root.querySelectorAll(".die").forEach((el, i) => {
        if (t >= 1) setFace(el, result.dice[i]);
        else if (swap !== lastSwap) setFace(el, 1 + Math.floor(Math.random() * 6));
        el.style.transform = t < 1 ? `rotate(${(1 - ease) * -540}deg)` : "";
      });
      lastSwap = swap;
    }
    if (t < 1) anim = requestAnimationFrame(step);
    else if (total) total.hidden = false;
  };
  anim = requestAnimationFrame(step);
}

// タブを移っても、選んだ数と結果は開いている間は残す
let count = 1;
const results = []; // 新しい順

const label = (r) => (r.coin ? `コイン ${r.coin}` : `ダイス ${r.dice.join("・")}` + (r.dice.length > 1 ? `（合計${r.dice.reduce((a, b) => a + b)}）` : ""));

export function diceView() {
  const root = h("div", { class: "view" });

  // 振った直後だけ動かす。数の切り替えなどの描き直しでは、動きを止めて結果をそのまま出す
  function add(r) {
    results.unshift(r);
    results.length = Math.min(results.length, 4);
    refresh();
    animate(r, root.querySelector("#dice-result"));
  }

  function current() {
    const r = results[0];
    if (!r) return h("p", { class: "muted" }, "ダイスを振るか、コイントスをしてください");
    if (r.coin) return h("div", { class: "coin", "data-coin": r.coin }, r.coin);
    return [
      h("div", { class: "dice-row" }, r.dice.map(dieEl)),
      r.dice.length > 1 ? h("p", { class: "dice-total" }, `合計 ${r.dice.reduce((a, b) => a + b)}`) : null,
    ];
  }

  function refresh() {
    cancelAnimationFrame(anim);
    const countBtns = [1, 2, 3].map((n) =>
      h("button", { class: "seg", type: "button", "aria-pressed": String(n === count), onclick: () => { count = n; refresh(); } }, `${n}個`));
    root.replaceChildren(
      toolTabs("utility"),
      h("section", { class: "panel dice-panel" },
        h("div", { class: "seg-group", role: "group", "aria-label": "ダイスの数" }, h("span", { class: "muted" }, "ダイスの数"), countBtns),
        h("div", { class: "dice-acts" },
          h("button", { class: "btn", type: "button", id: "roll-dice", onclick: () => add({ dice: rollDice(count) }) }, "ダイスを振る"),
          h("button", { class: "btn", type: "button", id: "toss-coin", onclick: () => add({ coin: tossCoin() }) }, "コイントス"),
        ),
        h("div", { class: "dice-result", id: "dice-result", "aria-live": "polite" }, current()),
        results.length > 1
          ? h("ol", { class: "dice-history", id: "dice-history", "aria-label": "前の結果" }, results.slice(1).map((r) => h("li", {}, label(r))))
          : null,
      ),
    );
  }
  refresh();
  return { el: root, refresh };
}
