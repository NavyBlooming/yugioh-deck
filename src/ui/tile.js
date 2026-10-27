import { h } from "./dom.js";

let provider = async () => null;
// イラスト取得の差し込み口。fn は cid を受けて Promise<画像URL|null> を返す。
export function setArtProvider(fn) {
  provider = fn;
}

const LIMIT_MARK = { 0: "禁", 1: "1", 2: "2" };

// 一覧にないカード ID（データ更新で消えたなど）でも画面を壊さないための代役
export const cardOr = (cards, cid) =>
  cards.get(cid) ?? { cid, name: "(不明なカード)", ruby: "", group: "normal", frame: "normal", limit: 3 };

export function tileEl(card, { missing = false, area = "", index = null } = {}) {
  const pend = card.frame.endsWith("_pendulum");
  const base = pend ? card.frame.slice(0, -"_pendulum".length) : card.frame;
  const art = h("div", { class: "art" });
  const el = h(
    "div",
    {
      class: `tile f-${base}${pend ? " pend" : ""}`,
      "data-cid": card.cid,
      "data-area": area,
      "data-missing": missing ? "true" : "false",
      "data-index": index,
      title: card.name,
    },
    art,
    h("div", { class: "name" }, card.name),
    LIMIT_MARK[card.limit] ? h("span", { class: "lim" }, LIMIT_MARK[card.limit]) : null,
  );
  Promise.resolve(provider(card.cid))
    .then((url) => {
      if (!url) return;
      art.append(h("img", { src: url, alt: "", draggable: "false" }));
      el.classList.add("has-art");
    })
    .catch(() => {});
  return el;
}
