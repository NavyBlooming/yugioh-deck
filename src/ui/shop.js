import { buildShoppingList, cardRushUrl, markBought } from "../core/shopping.js";
import { h, yen } from "./dom.js";
import { noteDialog } from "./dialogs.js";
import { cardOr, tileEl } from "./tile.js";

export function shopView(ctx) {
  const root = h("div", { class: "view" });

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
        ),
      ),
    );
  }

  function refresh() {
    const list = buildShoppingList(ctx.state, ctx.cards);
    const head = h("div", { class: "page-head" }, h("h1", {}, "買い物リスト"));
    if (list.length === 0) {
      root.replaceChildren(head, h("div", { class: "empty" }, h("p", {}, "未所持のカードはありません")));
      return;
    }
    root.replaceChildren(head, ...list.map((g) =>
      h("section", { class: "panel shop-group", "data-deck": g.deckId },
        h("div", { class: "shop-head" },
          h("h2", {}, g.name),
          h("span", { class: "total" }, `合計 ${yen(g.total)}`),
          g.unpriced > 0 ? h("span", { class: "warn-mark" }, `価格未入力 ${g.unpriced}枚`) : null,
        ),
        g.items.map((r) => row(g, r)),
        g.candidates.length
          ? [h("h3", { class: "sub-head" }, "候補", h("span", { class: "muted" }, "（合計に含みません）")), g.candidates.map((r) => row(g, r))]
          : null,
      ),
    ));
  }
  refresh();
  return { el: root, refresh };
}
