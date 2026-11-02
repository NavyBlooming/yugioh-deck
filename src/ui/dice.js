import { rollDice, tossCoin } from "../core/dice.js";
import { h } from "./dom.js";
import { toolTabs } from "./shop.js";

// 目ごとの点の位置（3×3 の升目の番号）
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
const dieEl = (n) =>
  h("div", { class: "die", role: "img", "aria-label": `${n}の目`, "data-face": n },
    Array.from({ length: 9 }, (_, i) => h("span", { class: PIPS[n].includes(i) ? "pip" : "" })));

// タブを移っても、選んだ数と結果は開いている間は残す
let count = 1;
const results = []; // 新しい順

const label = (r) => (r.coin ? `コイン ${r.coin}` : `ダイス ${r.dice.join("・")}` + (r.dice.length > 1 ? `（合計${r.dice.reduce((a, b) => a + b)}）` : ""));

export function diceView() {
  const root = h("div", { class: "view" });

  function add(r) {
    results.unshift(r);
    results.length = Math.min(results.length, 4);
    refresh();
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
    const countBtns = [1, 2, 3].map((n) =>
      h("button", { class: "seg", type: "button", "aria-pressed": String(n === count), onclick: () => { count = n; refresh(); } }, `${n}個`));
    root.replaceChildren(
      toolTabs("dice"),
      h("section", { class: "panel dice-panel" },
        h("div", { class: "seg-group", role: "group", "aria-label": "ダイスの数" }, h("span", { class: "muted" }, "ダイスの数"), countBtns),
        h("div", { class: "dice-acts" },
          h("button", { class: "btn primary", type: "button", id: "roll-dice", onclick: () => add({ dice: rollDice(count) }) }, "ダイスを振る"),
          h("button", { class: "btn", type: "button", id: "toss-coin", onclick: () => add({ coin: tossCoin() }) }, "コイントス"),
        ),
        // 振るたびに作り直すので、結果の動きも毎回始まる
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
