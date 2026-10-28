import { addCard, addHandTraps, deleteDeck, moveOne, removeOne, renameDeck, sortedEntries, tapCopy, tilesOf, toggleFavorite, warnings } from "../core/deck.js";
import { cardRushUrl, officialDbUrl } from "../core/shopping.js";
import { search, searchWithText } from "../core/search.js";
import { artState, cardText, loadTexts } from "./art.js";
import { areaOf } from "../core/cards.js";
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
const FRAME_TEXT = { normal: "通常モンスター", effect: "効果モンスター", ritual: "儀式モンスター", fusion: "融合モンスター", synchro: "シンクロモンスター", xyz: "エクシーズモンスター", link: "リンクモンスター" };
const SUB_TEXT = { normal: "通常", quickplay: "速攻", continuous: "永続", equip: "装備", field: "フィールド", ritual: "儀式", counter: "カウンター" };
const frameBase = (card) => card.frame.replace(/_pendulum$/, "");
function kindText(card) {
  if (card.group === "spell") return `${SUB_TEXT[card.sub] ?? ""}魔法`;
  if (card.group === "trap") return `${SUB_TEXT[card.sub] ?? ""}罠`;
  return (FRAME_TEXT[frameBase(card)] ?? "モンスター") + (card.frame.endsWith("_pendulum") ? "・ペンデュラム" : "");
}
function statText(card) {
  if (card.group === "spell" || card.group === "trap") return "";
  if (card.group === "xyz") return `ランク ${card.level}`;
  if (card.group === "link") return `LINK-${card.level}`;
  return `★ ${card.level}`;
}

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

  const addHandTrapsClick = () => {
    const r = addHandTraps(ctx.state, deckId, ctx.cards);
    if (r.added) ctx.commit(r.state);
    if (r.added && r.full) toast(`${r.added}枚入れたところでメインデッキがいっぱいになりました`);
    else if (r.added) toast(`汎用誘発を${r.added}枚、メインデッキに入れました`);
    else toast(r.full ? "メインデッキがいっぱいです" : "汎用誘発はすでに上限まで入っています");
  };

  // タップしたときの動き。デッキを開くたびに「未所持」から始める
  let tapMode = "missing";

  // index は同じカードの中で左から何枚目か
  const parseTile = (tile) => ({ cid: Number(tile.dataset.cid), area: tile.dataset.area, index: Number(tile.dataset.index) });

  bindTiles(body, {
    onTap(tile) {
      const t = parseTile(tile);
      if (tapMode === "remove") {
        ctx.commit(removeOne(ctx.state, deckId, t.cid, t.area, t.index).state);
        toast(`${cardOr(ctx.cards, t.cid).name}を1枚抜きました`);
      } else ctx.commit(tapCopy(ctx.state, deckId, t.cid, t.area, t.index).state);
    },
    onLong(tile) {
      const t = parseTile(tile);
      openSheet(t.cid, t.area, t.index);
    },
  });

  // 長押しで開くカード詳細。area が null のときは検索結果など、デッキの外のカード
  function openSheet(cid, area, index) {
    const card = cardOr(ctx.cards, cid);
    const deck = deckOf();
    const countIn = (a) => deck.entries.filter((e) => e.cid === cid && e.area === a).reduce((n, e) => n + e.count, 0);
    const home = areaOf(card);
    const act = (fn) => () => {
      close();
      fn();
    };
    const apply = (r) => (r.ok ? ctx.commit(r.state) : toast(REASON[r.reason] ?? "操作できません"));
    const addTo = area === "cand" ? "cand" : area ? "deck" : dest;
    // 抜く欄: デッキの中なら押したカードの欄、外からならメインかEX、無ければ候補
    const fromArea = area ?? (countIn(home) ? home : countIn("cand") ? "cand" : null);
    const fav = (ctx.state.favorites ?? []).includes(cid);
    const text = h("div", { class: "cd-text", id: "cd-text" }, "効果テキストを読み込んでいます…");
    const noText = card.custom ? (card.set ? `発売前のカードです（${card.set}）。効果テキストはありません。` : "発売前のカードです。効果テキストはありません。") : "効果テキストがありません。";
    // 自分で登録したカード（-1, -2, …）には効果テキストが無い。Wiki から取得したカードは遊戯王カードWiki の文がある
    if (card.custom && cid > -1000000) text.textContent = noText;
    else if (artState() !== "on") text.textContent = "合言葉を入れると、効果テキストが表示されます。";
    else cardText(cid).then((t) => (text.textContent = t ?? noText));
    const big = tileEl(card, {});
    big.classList.add("cd-tile");
    const close = openModal(
      h("div", { class: "cd", id: "card-detail" },
        h("div", { class: `cd-head f-${frameBase(card)}` },
          h("div", { class: "cd-ruby" }, card.ruby !== card.name ? card.ruby : ""),
          h("div", { class: "cd-name" }, card.name),
        ),
        h("div", { class: "cd-top" },
          big,
          h("div", { class: "cd-info" },
            h("div", { class: "cd-stat" }, statText(card)),
            h("div", { class: "cd-kind" }, `【${kindText(card)}】`),
            h("div", { class: `cd-limit lim-${card.limit}` }, LIMIT_TEXT[card.limit] ?? ""),
            h("div", { class: "cd-count" },
              h("span", {}, `メイン ${countIn("main")}`), h("span", {}, `EX ${countIn("extra")}`), h("span", {}, `候補 ${countIn("cand")}`)),
          ),
        ),
        text,
        h("div", { class: "cd-pm" },
          h("button", { class: "btn", type: "button", id: "cd-plus", onclick: act(() => apply(addCard(ctx.state, deckId, card, addTo))) }, addTo === "cand" ? "＋1 候補へ" : "＋1 デッキへ"),
          h("button", { class: "btn", type: "button", id: "cd-minus", disabled: !fromArea, onclick: act(() => ctx.commit(removeOne(ctx.state, deckId, cid, fromArea, area ? index : undefined).state)) }, "−1 抜く"),
        ),
        h("div", { class: "cd-acts" },
          h("button", { class: `btn${fav ? " on" : ""}`, type: "button", "aria-pressed": String(fav), onclick: act(() => {
            ctx.commit(toggleFavorite(ctx.state, cid));
            toast(ctx.state.favorites.includes(cid) ? "お気に入りに追加しました" : "お気に入りから外しました");
          }) }, fav ? "★ お気に入りから外す" : "☆ お気に入りに追加"),
          area ? h("button", { class: "btn", type: "button", onclick: act(() => apply(moveOne(ctx.state, deckId, cid, area, area === "cand" ? "deck" : "cand", card, index))) }, area === "cand" ? "デッキへ移す" : "候補へ移す") : null,
          area ? h("button", { class: "btn", type: "button", onclick: act(() => {
            const s = structuredClone(ctx.state);
            s.decks.find((d) => d.id === deckId).cover = cid;
            ctx.commit(s);
          }) }, "表紙にする") : null,
          h("button", { class: "btn", type: "button", onclick: act(() => noteDialog(ctx, cid)) }, "購入メモ"),
          card.custom ? null : h("a", { class: "btn", href: officialDbUrl(cid), target: "_blank", rel: "noopener" }, "公式DB"),
          h("a", { class: "btn", href: cardRushUrl(card.name), target: "_blank", rel: "noopener" }, "カードラッシュ"),
        ),
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
    const modeBtns = [["missing", "未所持"], ["remove", "抜く"]].map(([v, label]) =>
      h("button", { class: "seg", type: "button", "data-tap": v, "aria-pressed": String(v === tapMode), onclick: () => {
        tapMode = v;
        for (const b of modeBtns) b.setAttribute("aria-pressed", String(b.dataset.tap === tapMode));
      } }, label),
    );
    const modeRow = h("div", { class: "seg-group tap-mode", id: "tap-mode", role: "group", "aria-label": "タップしたとき" }, h("span", { class: "muted" }, "タップで"), modeBtns);
    const warns = warnings(deck, ctx.cards);
    const sections = AREAS.map(([area, label, max]) => {
      const entries = sortedEntries(deck, ctx.cards, area);
      const total = entries.reduce((n, e) => n + e.count, 0);
      return h("section", { class: "area", "data-area": area },
        h("div", { class: "area-head" },
          h("h2", { class: "area-title" }, `${label} `, h("span", { class: "area-count", "data-area": area }, `${total}/${max}`)),
        ),
        h("div", { class: "grid" },
          entries.flatMap((e) => {
            const card = cardOr(ctx.cards, e.cid);
            return tilesOf(e).map((t, i) => tileEl(card, { missing: t.missing, area, index: i }));
          }),
        ),
      );
    });
    // replaceChildren は null を「null」という文字で出すので、警告が無いときは渡さない
    body.replaceChildren(
      head,
      modeRow,
      ...(warns.length ? [h("div", { class: "warnings" }, warns.map((w) => h("p", {}, "⚠ " + warningText(w))))] : []),
      ...sections,
    );
    if (panelTab !== "search") renderList();
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
  const clearBtn = h("button", { class: "search-clear", type: "button", id: "search-clear", "aria-label": "入力を消す", hidden: true }, "×");
  // 合言葉があれば効果テキストでも探す。初めて検索したときに取り、取れるまでは名前と読みだけで探す
  let textIndex = null;
  let textLoading = false;
  const runSearch = () => {
    if (!textIndex && !textLoading && input.value.trim() && artState() === "on") {
      textLoading = true;
      loadTexts().then((t) => {
        textIndex = t;
        textLoading = false;
        if (t) runSearch();
      });
    }
    if (panelTab !== "search") return;
    found = textIndex ? searchWithText(ctx.index, textIndex, input.value) : search(ctx.index, input.value);
    shown = 0;
    results.replaceChildren();
    showMore();
  };
  // 結果は全部出すが、描くのは60枚ずつ。下の端の目印が見えたら次を足す
  const PAGE = 60;
  let found = [];
  let shown = 0;
  const more = h("div", { class: "results-more" });
  const showMore = () => {
    more.remove();
    results.append(...found.slice(shown, shown + PAGE).map((c) => tileEl(c, { area: "search", lazy: true })));
    shown = Math.min(found.length, shown + PAGE);
    if (shown < found.length) results.append(more);
  };
  const moreSeen = new IntersectionObserver((items) => {
    if (items.some((it) => it.isIntersecting) && panelTab === "search" && more.isConnected) showMore();
  }, { root: results, rootMargin: "200px" });
  moreSeen.observe(more);

  // 検索・履歴・お気に入りのタブ。履歴とお気に入りでは入力欄を隠し、同じ場所にカードを並べる
  let panelTab = "search";
  const searchBox = h("div", { class: "search-box" }, input, clearBtn);
  const renderList = () => {
    const items = panelTab === "history"
      ? (deckOf()?.history ?? []).filter((x) => ctx.cards.has(x.cid)).map((x) => {
          const el = tileEl(ctx.cards.get(x.cid), { area: "search" });
          el.append(h("span", { class: `hist-mark ${x.op}`, title: x.op === "in" ? "入れた" : "抜いた" }, x.op === "in" ? "＋" : "−"));
          return el;
        })
      : (ctx.state.favorites ?? []).map((cid) => ctx.cards.get(cid)).filter(Boolean)
          .sort((a, b) => (a.ruby < b.ruby ? -1 : a.ruby > b.ruby ? 1 : 0))
          .map((c) => tileEl(c, { area: "search" }));
    const empty = panelTab === "history" ? "このデッキで入れたり抜いたりしたカードがここに出ます" : "長押しのメニューの「お気に入りに追加」で、ここに出ます";
    results.replaceChildren(...(items.length ? items : [h("p", { class: "muted list-empty" }, empty)]));
  };
  const tabBtns = [["search", "検索"], ["history", "履歴"], ["fav", "お気に入り"]].map(([v, label]) =>
    h("button", { class: "ptab", type: "button", role: "tab", "data-ptab": v, "aria-selected": String(v === panelTab), onclick: () => {
      panelTab = v;
      for (const b of tabBtns) b.setAttribute("aria-selected", String(b.dataset.ptab === panelTab));
      searchBox.hidden = panelTab !== "search";
      if (panelTab === "search") runSearch();
      else renderList();
    } }, label),
  );
  let timer = null;
  input.addEventListener("input", () => {
    clearBtn.hidden = !input.value;
    clearTimeout(timer);
    timer = setTimeout(runSearch, 150);
  });
  clearBtn.addEventListener("click", () => {
    clearTimeout(timer);
    input.value = "";
    clearBtn.hidden = true;
    results.replaceChildren();
    input.focus();
  });
  // 検索結果・履歴・お気に入りは、タップで追加先に入れ、長押しでカード詳細を開く
  bindTiles(results, {
    onTap(tile) {
      const card = ctx.cards.get(Number(tile.dataset.cid));
      const r = addCard(ctx.state, deckId, card, dest);
      if (r.ok) ctx.commit(r.state);
      else toast(REASON[r.reason] ?? "追加できません");
    },
    onLong(tile) {
      openSheet(Number(tile.dataset.cid), null, null);
    },
  });
  const panel = h("aside", { class: "search-panel", id: "search-panel" },
    h("div", { class: "search-top" }, h("div", { class: "panel-tabs", role: "tablist" }, tabBtns), searchBox, h("div", { class: "dest-row" }, h("div", { class: "seg-group", role: "group", "aria-label": "追加先" }, h("span", { class: "muted" }, "追加先"), destBtns), h("button", { class: "btn small", type: "button", id: "add-hand-traps", onclick: addHandTrapsClick }, "汎用誘発を追加"))),
    results,
  );

  // 検索結果の有無でパネルの高さが変わるので、そのつど余白を合わせる
  const ro = new ResizeObserver(() => {
    if (!panel.isConnected) return ro.disconnect();
    document.documentElement.style.setProperty("--search-h", panel.offsetHeight + "px");
  });
  ro.observe(panel);
  root.append(body, panel);
  refresh();
  return { el: root, refresh, hasSearch: true };
}
