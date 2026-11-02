import { buildShoppingList, cardRushUrl, dorasutaUrl, markBought } from "../core/shopping.js";
import { h, yen } from "./dom.js";
import { noteDialog } from "./dialogs.js";
import { cardOr, tileEl } from "./tile.js";

// ツールタブの中の切り替え
export function toolTabs(active) {
  const tab = (key, href, text) => h("a", { class: "seg", href, "aria-current": key === active ? "page" : null }, text);
  return h("nav", { class: "seg-group tool-tabs", "aria-label": "ツール" }, tab("shop", "#/shop", "買い物"), tab("utility", "#/utility", "ユーティリティ"), tab("other", "#/other", "その他"));
}

// 畳んだデッキ。タブを移っても、開いている間は残す
const folded = new Set();

export function shopView(ctx) {
  const root = h("div", { class: "view" });

  // 上に留まった帯を押して畳むと帯が画面の外へ行くので、畳んだデッキの頭まで戻す
  function toggle(deckId, section) {
    const stuck = section.getBoundingClientRect().top < 0;
    if (folded.has(deckId)) folded.delete(deckId);
    else folded.add(deckId);
    refresh();
    if (stuck) root.querySelector(`.shop-group[data-deck="${CSS.escape(deckId)}"]`)?.scrollIntoView({ block: "start" });
  }

  function row(group, r) {
    const card = cardOr(ctx.cards, r.cid);
    const openNote = () => noteDialog(ctx, r.cid);
    return h("div", { class: "shop-row", "data-cid": r.cid, "data-area": r.area },
      h("div", { class: "shop-tile" }, tileEl(card, { area: r.area })),
      h("div", { class: "shop-main" },
        h("div", {},
          h("button", { class: "link-btn name", type: "button", onclick: openNote }, r.name || card.name),
          " ",
          h("span", { class: "qty" }, `×${r.missing}`),
        ),
        h("div", { class: "shop-sub" },
          h("button", { class: "link-btn", type: "button", onclick: openNote }, r.price === null ? "単価を入れる" : yen(r.price)),
          r.rarity ? h("span", { class: "tag" }, r.rarity) : null,
          r.print ? h("span", { class: "tag" }, r.print) : null,
        ),
        h("div", { class: "shop-actions" },
          h("button", { class: "btn primary small", type: "button", onclick: () => ctx.commit(markBought(ctx.state, group.deckId, r.cid, r.area)) }, "買った"),
          h("a", { class: "btn small", href: cardRushUrl(r.name || card.name), target: "_blank", rel: "noopener" }, "カードラッシュ"),
          h("a", { class: "btn small", href: dorasutaUrl(r.name || card.name), target: "_blank", rel: "noopener" }, "ドラスタ"),
        ),
      ),
    );
  }

  function refresh() {
    const list = buildShoppingList(ctx.state, ctx.cards);
    const head = h("div", { class: "page-head" }, h("h1", {}, "買い物リスト"));
    if (list.length === 0) {
      root.replaceChildren(toolTabs("shop"), head, h("div", { class: "empty" }, h("p", {}, "未所持のカードはありません")));
      return;
    }
    root.replaceChildren(toolTabs("shop"), head, ...list.map((g) => {
      const open = !folded.has(g.deckId);
      const onKey = (e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), toggle(g.deckId, e.currentTarget.parentElement));
      return h("section", { class: "panel shop-group", "data-deck": g.deckId },
        h("div", { class: "shop-head", role: "button", tabindex: "0", "aria-expanded": String(open), onclick: (e) => toggle(g.deckId, e.currentTarget.parentElement), onkeydown: onKey },
          h("span", { class: "fold-mark", "aria-hidden": "true" }, open ? "▼" : "▶"),
          h("h2", {}, g.name),
          h("span", { class: "total" }, `合計 ${yen(g.total)}`),
          g.unpriced > 0 ? h("span", { class: "warn-mark" }, `価格未入力 ${g.unpriced}枚`) : null,
        ),
        open ? g.items.map((r) => row(g, r)) : null,
        open && g.candidates.length
          ? [h("h3", { class: "sub-head" }, "候補", h("span", { class: "muted" }, "（合計に含みません）")), ...g.candidates.map((r) => row(g, r))]
          : null,
      );
    }));
  }
  refresh();
  return { el: root, refresh };
}
