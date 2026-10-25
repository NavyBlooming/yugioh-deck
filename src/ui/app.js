import { parseCards } from "../core/cards.js";
import { buildIndex } from "../core/search.js";
import { loadState, saveState } from "../core/storage.js";
import { initArt } from "./art.js";
import { deckView } from "./deck.js";
import { listView } from "./list.js";
import { settingsView } from "./settings.js";
import { shopView } from "./shop.js";

let current = null;
const ctx = {
  cards: null,
  index: null,
  meta: null,
  state: null,
  // 状態を変える操作はすべてここを通す。保存して今の画面を描き直す。
  commit(next) {
    ctx.state = next;
    saveState(localStorage, next);
    current?.refresh();
  },
  rerender: () => route(),
};
const app = document.getElementById("app");

function route() {
  const hash = location.hash || "#/";
  const m = hash.match(/^#\/deck\/(.+)$/);
  let tab = "deck";
  let view;
  if (m) view = deckView(ctx, decodeURIComponent(m[1]));
  else if (hash === "#/shop") {
    view = shopView(ctx);
    tab = "shop";
  } else if (hash === "#/settings") {
    view = settingsView(ctx);
    tab = "settings";
  } else view = listView(ctx);
  current = view;
  app.classList.toggle("has-search", Boolean(view.hasSearch));
  app.replaceChildren(view.el);
  window.scrollTo(0, 0);
  for (const a of document.querySelectorAll("#tabs a")) {
    if (a.dataset.tab === tab) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  }
}

async function boot() {
  try {
    // Pages は10分の手元保存を許すので、データは毎回サーバーに変化の有無を問い合わせる
    const get = (url) =>
      fetch(url, { cache: "no-cache" }).then((r) => {
        if (!r.ok) throw new Error(url + " " + r.status);
        return r.json();
      });
    const [cardsJson, meta] = await Promise.all([get("data/cards.json"), get("data/meta.json")]);
    ctx.cards = parseCards(cardsJson);
    ctx.index = buildIndex([...ctx.cards.values()]);
    ctx.meta = meta;
    ctx.state = loadState(localStorage);
  } catch (e) {
    app.textContent = "カードデータを読み込めませんでした。通信を確かめて、開き直してください。";
    console.error(e);
    return;
  }
  window.addEventListener("hashchange", route);
  route();
  // 鍵の計算に時間がかかるので、画面を先に出し、絵が使えるようになったら描き直す
  // 設定画面は絵の状態を表示しているので、合言葉が無くても描き直す
  if ((await initArt()) || location.hash === "#/settings") route();
}

boot();
