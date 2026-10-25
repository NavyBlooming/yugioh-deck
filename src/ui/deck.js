import { addCard, deleteDeck, moveOne, removeOne, renameDeck, sortedEntries, tapCopy, tilesOf, warnings } from "../core/deck.js";
import { cardRushUrl, officialDbUrl } from "../core/shopping.js";
import { search } from "../core/search.js";
import { h } from "./dom.js";
import { nameDialog, noteDialog, openModal, toast } from "./dialogs.js";
import { cardOr, tileEl } from "./tile.js";

const REASON = {
  "same-name-limit": "同じカードは3枚までです",
  "main-full": "メインデッキは60枚までです",
  "extra-full": "EXデッキは15枚までです",
  "cand-full": "候補は15枚までです",
};
const AREAS = [
  ["main", "メインデッキ", 60],
  ["extra", "EXデッキ", 15],
  ["cand", "候補", 15],
];
const LIMIT_TEXT = ["禁止カード", "制限カード", "準制限カード", "制限なし"];

// タイルを長押し（500ms）とタップに振り分ける。長押しが成立したら、その後の click は捨てる。
function bindTiles(container, { onTap, onLong }) {
  let timer = null;
  let start = null;
  let suppress = false;
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  container.addEventListener("pointerdown", (e) => {
    suppress = false;
    const tile = e.target.closest(".tile");
    if (!tile) return;
    start = { x: e.clientX, y: e.clientY };
    cancel();
    timer = setTimeout(() => {
      timer = null;
      suppress = true;
      onLong(tile);
    }, 500);
  });
  container.addEventListener("pointermove", (e) => {
    if (timer && Math.hypot(e.clientX - start.x, e.clientY - start.y) >= 10) cancel();
  });
  container.addEventListener("pointerup", cancel);
  container.addEventListener("pointercancel", cancel);
  container.addEventListener("contextmenu", (e) => e.preventDefault());
  container.addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    if (suppress) {
      suppress = false;
      return;
    }
    onTap(tile);
  });
}

export function deckView(ctx, deckId) {
  const deckOf = () => ctx.state.decks.find((d) => d.id === deckId);
  if (!deckOf()) {
    return { el: h("div", { class: "view empty" }, h("p", {}, "デッキが見つかりません"), h("a", { class: "btn", href: "#/" }, "一覧へ")), refresh() {} };
  }

  const root = h("div", { class: "view deck-view" });
  const body = h("div", { class: "deck-body" });

  const parseTile = (tile) => ({ cid: Number(tile.dataset.cid), area: tile.dataset.area, missing: tile.dataset.missing === "true" });

  bindTiles(body, {
    onTap(tile) {
      const t = parseTile(tile);
      ctx.commit(tapCopy(ctx.state, deckId, t.cid, t.area, t.missing).state);
    },
    onLong(tile) {
      const t = parseTile(tile);
      openSheet(t.cid, t.area);
    },
  });

  function openSheet(cid, area) {
    const card = cardOr(ctx.cards, cid);
    const act = (fn) => () => {
      close();
      fn();
    };
    const apply = (r) => (r.ok ? ctx.commit(r.state) : toast(REASON[r.reason] ?? "操作できません"));
    const to = area === "cand" ? "deck" : "cand";
    const close = openModal(
      h("div", { class: "sheet-body" },
        h("h2", { class: "sheet-title" }, card.name),
        h("p", { class: "muted" }, LIMIT_TEXT[card.limit] ?? ""),
        h("button", { class: "btn", type: "button", onclick: act(() => ctx.commit(removeOne(ctx.state, deckId, cid, area).state)) }, "1枚抜く"),
        h("button", { class: "btn", type: "button", onclick: act(() => apply(moveOne(ctx.state, deckId, cid, area, to, card))) }, area === "cand" ? "デッキへ移す" : "候補へ移す"),
        h("button", { class: "btn", type: "button", onclick: act(() => {
          const s = structuredClone(ctx.state);
          s.decks.find((d) => d.id === deckId).cover = cid;
          ctx.commit(s);
        }) }, "表紙にする"),
        h("button", { class: "btn", type: "button", onclick: act(() => noteDialog(ctx, cid)) }, "購入メモ"),
        h("a", { class: "btn", href: officialDbUrl(cid), target: "_blank", rel: "noopener" }, "公式DBで見る"),
        h("a", { class: "btn", href: cardRushUrl(card.name), target: "_blank", rel: "noopener" }, "カードラッシュで探す"),
        h("button", { class: "btn", type: "button", onclick: () => close() }, "閉じる"),
      ),
      { sheet: true },
    );
  }

  function warningText(w) {
    const name = ctx.cards.get(w.cid)?.name ?? "不明なカード";
    switch (w.type) {
      case "main-under": return `メインデッキが ${w.count}枚です（40〜60枚）`;
      case "forbidden": return `${name} は禁止カードです`;
      case "limited": return `${name} は制限カードです（${w.count}枚）`;
      case "semi": return `${name} は準制限カードです（${w.count}枚）`;
      default: return "";
    }
  }

  function refresh() {
    const deck = deckOf();
    if (!deck) {
      location.hash = "#/";
      return;
    }
    const head = h("div", { class: "deck-head" },
      h("a", { class: "btn small", href: "#/", id: "back" }, "‹ 戻る"),
      h("button", { class: "deck-title", type: "button", id: "deck-title", onclick: () => nameDialog("デッキ名の変更", deck.name, (n) => ctx.commit(renameDeck(ctx.state, deckId, n).state)) }, deck.name),
      h("button", { class: "btn small danger", type: "button", id: "deck-delete", onclick: () => {
        if (confirm(`「${deck.name}」を削除します。よろしいですか？`)) ctx.commit(deleteDeck(ctx.state, deckId).state);
      } }, "削除"),
    );
    const warns = warnings(deck, ctx.cards);
    const sections = AREAS.map(([area, label, max]) => {
      const entries = sortedEntries(deck, ctx.cards, area);
      const total = entries.reduce((n, e) => n + e.count, 0);
      return h("section", { class: "area", "data-area": area },
        h("h2", { class: "area-title" }, `${label} `, h("span", { class: "area-count", "data-area": area }, `${total}/${max}`)),
        h("div", { class: "grid" },
          entries.flatMap((e) => {
            const card = cardOr(ctx.cards, e.cid);
            return tilesOf(e).map((t) => tileEl(card, { missing: t.missing, area }));
          }),
        ),
      );
    });
    body.replaceChildren(
      head,
      warns.length ? h("div", { class: "warnings" }, warns.map((w) => h("p", {}, "⚠ " + warningText(w)))) : null,
      ...sections,
    );
  }

  // 検索パネルは入力と追加先を保つため、refresh では作り直さない
  let dest = "deck";
  const input = h("input", { type: "text", id: "search-input", placeholder: "カード名・読みで検索", autocomplete: "off", enterkeyhint: "search" });
  const results = h("div", { class: "grid results", id: "search-results" });
  const destBtns = [["deck", "デッキ"], ["cand", "候補"]].map(([v, label]) =>
    h("button", { class: "seg", type: "button", "data-dest": v, "aria-pressed": String(v === dest), onclick: () => {
      dest = v;
      for (const b of destBtns) b.setAttribute("aria-pressed", String(b.dataset.dest === dest));
    } }, label),
  );
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      results.replaceChildren(...search(ctx.index, input.value, 60).map((c) => tileEl(c, { area: "search" })));
    }, 150);
  });
  results.addEventListener("click", (e) => {
    const tile = e.target.closest(".tile");
    if (!tile) return;
    const card = ctx.cards.get(Number(tile.dataset.cid));
    const r = addCard(ctx.state, deckId, card, dest);
    if (r.ok) ctx.commit(r.state);
    else toast(REASON[r.reason] ?? "追加できません");
  });
  const panel = h("aside", { class: "search-panel", id: "search-panel" },
    h("div", { class: "search-top" }, input, h("div", { class: "seg-group", role: "group", "aria-label": "追加先" }, h("span", { class: "muted" }, "追加先"), destBtns)),
    results,
  );

  root.append(body, panel);
  refresh();
  return { el: root, refresh, hasSearch: true };
}
