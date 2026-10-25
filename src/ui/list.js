import { createDeck, deckSummary } from "../core/deck.js";
import { h } from "./dom.js";
import { nameDialog } from "./dialogs.js";
import { cardOr, tileEl } from "./tile.js";

export function listView(ctx) {
  const root = h("div", { class: "view" });

  const create = () =>
    nameDialog("新しいデッキ", "", (name) => {
      ctx.commit(createDeck(ctx.state, name).state);
    });
  const newBtn = () => h("button", { class: "btn primary", type: "button", id: "new-deck", onclick: create }, "＋ 新しいデッキ");

  function refresh() {
    const decks = ctx.state.decks;
    const head = h("div", { class: "page-head" }, h("h1", {}, "デッキ"), decks.length ? newBtn() : null);
    if (decks.length === 0) {
      root.replaceChildren(head, h("div", { class: "empty" }, h("p", {}, "まだデッキがありません"), newBtn()));
      return;
    }
    const cards = decks.map((deck) => {
      const s = deckSummary(deck, ctx.cards);
      const cover = s.coverCid === null ? h("div", { class: "tile-empty" }) : tileEl(cardOr(ctx.cards, s.coverCid));
      return h("a", { class: "deck-card panel", href: `#/deck/${encodeURIComponent(deck.id)}`, "data-deck": deck.id },
        cover,
        h("div", { class: "deck-name" }, deck.name, s.hasWarning ? h("span", { class: "warn-mark", title: "ルールの警告があります" }, " ⚠") : null),
        h("div", { class: s.missing > 0 ? "deck-missing" : "muted" }, s.missing > 0 ? `未所持 ${s.missing}枚` : "そろっています"),
      );
    });
    root.replaceChildren(head, h("div", { class: "deck-grid" }, cards));
  }
  refresh();
  return { el: root, refresh };
}
