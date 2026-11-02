import { addCard, addHandTraps, deleteDeck, hasTag, moveOne, removeOne, renameDeck, sortedEntries, tapCopy, tilesOf, toggleFavorite, toggleShared, toggleTag, warnings } from "../core/deck.js";
import { officialDbUrl } from "../core/shopping.js";
import { search, searchWithText } from "../core/search.js";
import { artState, cardText, loadTexts } from "./art.js";
import { areaOf, compareCards, monsterInfo } from "../core/cards.js";
import { ATTR_OPTIONS, KIND_OPTIONS, RACE_OPTIONS, SUB_OPTIONS, TRAIT_OPTIONS, emptyFilter, filterLabel, isFiltering, matchesFilter } from "../core/filter.js";
import { drawHand, tagOdds } from "../core/hand.js";
import { h } from "./dom.js";
import { nameDialog, noteDialog, openModal, toast } from "./dialogs.js";
import { cardOr, tileEl } from "./tile.js";

const REASON = {
  "same-name-limit": "同じカードは3枚までです",
  "main-full": "メインデッキは60枚までです",
  "extra-full": "EXデッキは15枚までです",
  "cand-full": "候補は15枚までです",
};
const AREA_SHORT = { main: "メイン", extra: "EX", cand: "候補" };
const TAG_TEXT = { hand: ["誘", "誘発"], starter: ["初", "初動"] };
// デッキの中のカードの右上に出す誘発・初動の印
const tagMarks = (deck, cid) => {
  const on = Object.keys(TAG_TEXT).filter((t) => hasTag(deck, cid, t));
  return on.length ? h("span", { class: "tags" }, on.map((t) => h("span", { class: `tag ${t}`, title: TAG_TEXT[t][1] }, TAG_TEXT[t][0]))) : null;
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

// 属性・種族・攻守・リンクマーカー・スケールの行。番号が無いカードは何も出さない
const ARROWS = { 左上: "◤", 上: "▲", 右上: "◥", 左: "◀", 右: "▶", 左下: "◣", 下: "▼", 右下: "◢" };
function monsterRows(card) {
  const m = monsterInfo(card);
  if (!m) return [];
  const rows = [
    h("div", { class: "cd-attr" }, [m.attr, m.race, ...m.traits].filter(Boolean).join("／")),
    h("div", { class: "cd-atk" }, m.def === null ? `ATK ${m.atk}` : `ATK ${m.atk} / DEF ${m.def}`, m.scale !== null ? `　スケール ${m.scale}` : ""),
  ];
  if (m.markers) {
    const cells = ["左上", "上", "右上", "左", "", "右", "左下", "下", "右下"];
    rows.push(h("div", { class: "cd-markers", title: `リンクマーカー: ${m.markers.join("・")}` },
      ...cells.map((c) => h("span", { class: m.markers.includes(c) ? "on" : "" }, ARROWS[c] ?? "")),
    ));
  }
  return rows;
}

const pct = (p) => `${(p * 100).toFixed(1)}%`;

// デッキ編集画面の上に出す、初手5枚に誘発・初動が1枚以上来る確率
function oddsText(deck) {
  const odds = Object.entries(TAG_TEXT).map(([tag, [, label]]) => [label, tagOdds(deck, tag, 5)]);
  if (odds[0][1].total < 5) return "メインが5枚以上になると、初手を引けます";
  if (odds.every(([, o]) => o.count === 0)) return "誘発・初動の印を付けると、初手に来る確率が出ます";
  return "初手5枚: " + odds.map(([label, o]) => (o.count ? `${label} 1枚以上 ${pct(o.atLeastOne)}（${o.count}枚）` : `${label} 印なし`)).join("／");
}

// 初手のテスト。先攻5枚・後攻6枚を引き、枚数ごとの確率の表を出す
function handDialog(ctx, deck) {
  let draw = 5;
  const body = h("div", { class: "hand-body" });
  const seg = [[5, "先攻 5枚"], [6, "後攻 6枚"]].map(([n, label]) =>
    h("button", { class: "seg", type: "button", "data-draw": n, "aria-pressed": String(n === draw), onclick: () => {
      draw = n;
      for (const b of seg) b.setAttribute("aria-pressed", String(Number(b.dataset.draw) === draw));
      render();
    } }, label),
  );
  const render = () => {
    const hand = drawHand(deck, draw, Math.random);
    if (!hand) {
      body.replaceChildren(h("p", { class: "muted" }, `メインデッキが${draw}枚以上になると、初手を引けます`));
      return;
    }
    const count = (tag) => hand.filter((c) => hasTag(deck, c.cid, tag)).length;
    const head = h("tr", {}, h("th", {}, ""), ["0枚", "1枚", "2枚", "3枚以上", "1枚以上"].map((x) => h("th", {}, x)));
    const rows = Object.entries(TAG_TEXT).map(([tag, [, label]]) => {
      const o = tagOdds(deck, tag, draw);
      const d = o.dist;
      const cells = [d[0], d[1] ?? 0, d[2] ?? 0, d.slice(3).reduce((a, b) => a + b, 0), o.atLeastOne];
      return h("tr", { "data-tag": tag }, h("th", {}, `${label}（${o.count}枚）`), cells.map((p) => h("td", {}, pct(p))));
    });
    body.replaceChildren(
      h("div", { class: "grid hand-grid", id: "hand-cards" }, hand.map(({ cid, shared }) => {
        const el = tileEl(cardOr(ctx.cards, cid), { shared });
        const marks = tagMarks(deck, cid);
        if (marks) el.append(marks);
        return el;
      })),
      h("p", { id: "hand-count" }, `この手札: 誘発 ${count("hand")}枚・初動 ${count("starter")}枚`),
      h("button", { class: "btn primary", type: "button", id: "hand-redraw", onclick: render }, "引き直す"),
      h("table", { class: "odds-table", id: "odds-table" }, h("caption", {}, `${draw}枚引いたときに来る枚数の確率（メイン${tagOdds(deck, "hand", draw).total}枚）`), head, rows),
    );
  };
  render();
  const close = openModal(
    h("div", { class: "hand", id: "hand-test" },
      h("h2", {}, "初手のテスト"),
      h("div", { class: "seg-group" }, seg),
      body,
      h("button", { class: "btn", type: "button", onclick: () => close() }, "閉じる"),
    ),
  );
}

// 検索の絞り込みの条件を選ぶ画面。決めたら onApply に新しい条件を渡す
function filterDialog(current, onApply) {
  const f = structuredClone(current);
  const chips = (key, options) => h("div", { class: "chips" }, options.map(([v, label]) => {
    const b = h("button", { class: "chip", type: "button", "data-key": key, "data-value": String(v), "aria-pressed": String(f[key].includes(v)), onclick: () => {
      f[key] = f[key].includes(v) ? f[key].filter((x) => x !== v) : [...f[key], v];
      b.setAttribute("aria-pressed", String(f[key].includes(v)));
    } }, label);
    return b;
  }));
  const num = (key) => {
    const input = h("input", { type: "number", inputmode: "numeric", min: "0", id: `filter-${key}`, value: f[key] ?? "" });
    input.addEventListener("input", () => (f[key] = input.value === "" ? null : Number(input.value)));
    return input;
  };
  const range = (label, k) => h("div", { class: "range" }, h("span", {}, label), num(`${k}Min`), h("span", {}, "〜"), num(`${k}Max`));
  const section = (title, ...kids) => h("section", { class: "filter-sec" }, h("h3", {}, title), ...kids);
  const close = openModal(
    h("div", { class: "form filter", id: "filter-dialog" },
      h("h2", {}, "絞り込み"),
      section("カードの種類", chips("kinds", KIND_OPTIONS)),
      section("魔法・罠の種類", chips("subs", SUB_OPTIONS)),
      section("属性", chips("attrs", ATTR_OPTIONS)),
      section("種族", chips("races", RACE_OPTIONS)),
      section("チューナーなど", chips("traits", TRAIT_OPTIONS)),
      section("数値", range("レベル・ランク・リンク", "level"), range("攻撃力", "atk"), range("守備力", "def")),
      h("p", { class: "muted" }, "同じ項目の中はどれか、項目どうしはすべてに当てはまるカードを出します。属性・種族・攻守の情報が無いカード（発売前のカードなど）は、それらの条件では出ません。"),
      h("div", { class: "row-btns" },
        h("button", { class: "btn", type: "button", id: "filter-reset", onclick: () => (close(), onApply(emptyFilter())) }, "条件を消す"),
        h("button", { class: "btn primary", type: "button", id: "filter-apply", onclick: () => (close(), onApply(f)) }, "この条件で探す"),
      ),
    ),
  );
}

// タイルを長押し（500ms）とタップに振り分ける。長押しが成立したら、その後の click は捨てる。
// onRight はマウスの右クリック。スマホの長押しでも contextmenu が来るので、マウスのときだけ呼ぶ
function bindTiles(container, { onTap, onLong, onRight }) {
  let timer = null;
  let start = null;
  let suppress = false;
  let pointerType = "";
  const cancel = () => {
    clearTimeout(timer);
    timer = null;
  };
  container.addEventListener("pointerdown", (e) => {
    pointerType = e.pointerType;
    suppress = false;
    if (e.button !== 0) return;
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
  container.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    const tile = e.target.closest(".tile");
    if (tile && onRight && pointerType === "mouse") onRight(tile);
  });
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

  const removeTile = (t) => {
    ctx.commit(removeOne(ctx.state, deckId, t.cid, t.area, t.index).state);
    toast(`${cardOr(ctx.cards, t.cid).name}を1枚抜きました`);
  };
  bindTiles(body, {
    onTap(tile) {
      const t = parseTile(tile);
      if (tapMode === "remove") removeTile(t);
      else ctx.commit(tapCopy(ctx.state, deckId, t.cid, t.area, t.index).state);
    },
    onRight: (tile) => removeTile(parseTile(tile)),
    onLong(tile) {
      const t = parseTile(tile);
      openSheet(t.cid, t.area, t.index);
    },
  });

  // 長押しで開くカード詳細。area が null のときは検索結果など、デッキの外のカード
  function openSheet(cid, area, index) {
    const card = cardOr(ctx.cards, cid);
    const countIn = (a) => deckOf().entries.filter((e) => e.cid === cid && e.area === a).reduce((n, e) => n + e.count, 0);
    const home = areaOf(card);
    const act = (fn) => () => {
      close();
      fn();
    };
    const apply = (r) => (r.ok ? ctx.commit(r.state) : toast(REASON[r.reason] ?? "操作できません"));
    const addTo = area === "cand" ? "cand" : area ? "deck" : dest;
    // ＋1・−1 はシートを閉じずに続けて押せる。枚数の表示はその場で直す
    const countEl = h("div", { class: "cd-count" });
    const cur = area ?? (addTo === "cand" ? "cand" : home); // ＋1・−1 の主な相手の欄を大きく出す
    const showCounts = () => countEl.replaceChildren(...["main", "extra", "cand"].map((a) => h("span", { class: a === cur ? "cur" : "" }, `${AREA_SHORT[a]} `, h("b", {}, countIn(a)), "枚")));
    showCounts();
    const plus = () => {
      apply(addCard(ctx.state, deckId, card, addTo));
      showCounts();
    };
    const gone = (a) => `${AREAS.find(([x]) => x === a)[1]}に${card.name}はもうありません`;
    let pressed = index; // 長押ししたカードの位置。抜くと並びが変わるので最初の1枚だけに使う
    const minus = () => {
      // 抜く欄: デッキの中なら押したカードの欄、外からならメインかEX、無ければ候補
      const from = area ?? (countIn(home) ? home : countIn("cand") ? "cand" : null);
      if (!from) return toast(`このデッキに${card.name}は入っていません`);
      if (!countIn(from)) return toast(gone(from));
      ctx.commit(removeOne(ctx.state, deckId, cid, from, pressed).state);
      pressed = undefined;
      showCounts();
    };
    const fav = (ctx.state.favorites ?? []).includes(cid);
    const sharedNow = () => {
      const e = deckOf().entries.find((x) => x.cid === cid && x.area === area);
      return Boolean(e && pressed !== undefined && pressed < e.count && tilesOf(e)[pressed].shared);
    };
    const sharedBtn = () => {
      const b = h("button", { class: "btn tag-btn", type: "button", id: "cd-shared", "data-tag": "shared", "aria-pressed": String(sharedNow()), onclick: () => {
        // −1 で並びが変わると、長押しした1枚がどれか分からなくなる
        if (pressed === undefined || !countIn(area)) return toast("枚数を変えたので、印を付ける札をもう一度長押ししてください");
        ctx.commit(toggleShared(ctx.state, deckId, cid, area, pressed).state);
        b.setAttribute("aria-pressed", String(sharedNow()));
      } }, "共用の印（この1枚）");
      return b;
    };
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
          h("div", { class: "cd-title" },
            h("div", { class: "cd-ruby" }, card.ruby !== card.name ? card.ruby : ""),
            h("div", { class: "cd-name" }, card.name),
          ),
          h("button", { class: "cd-close", type: "button", "aria-label": "閉じる", onclick: () => close() }, "×"),
        ),
        h("div", { class: "cd-top" },
          big,
          h("div", { class: "cd-info" },
            h("div", { class: "cd-stat" }, statText(card)),
            h("div", { class: "cd-kind" }, `【${kindText(card)}】`),
            ...monsterRows(card),
            h("div", { class: `cd-limit lim-${card.limit}` }, LIMIT_TEXT[card.limit] ?? ""),
            card.date ? h("div", { class: "cd-date" }, `OCG 発売日 ${card.date}`) : null,
          ),
        ),
        text,
        h("div", { class: "cd-pm" },
          h("button", { class: "btn minus", type: "button", id: "cd-minus", onclick: minus }, "−1 抜く"),
          countEl,
          h("button", { class: "btn primary", type: "button", id: "cd-plus", onclick: plus }, addTo === "cand" ? "＋1 候補へ" : "＋1 デッキへ"),
        ),
        h("div", { class: "cd-tags" }, Object.entries(TAG_TEXT).map(([tag, [, label]]) => {
          const on = () => String(hasTag(deckOf(), cid, tag));
          const b = h("button", { class: "btn tag-btn", type: "button", id: `cd-tag-${tag}`, "data-tag": tag, "aria-pressed": on(), onclick: () => {
            ctx.commit(toggleTag(ctx.state, deckId, cid, tag));
            b.setAttribute("aria-pressed", on());
          } }, `${label}の印`);
          return b;
        }),
        // 共用は長押しした1枚だけに付ける。デッキの外から開いたときは出さない
        area && index != null ? sharedBtn() : null),
        h("div", { class: "cd-acts" },
          h("button", { class: `btn${fav ? " on" : ""}`, type: "button", "aria-pressed": String(fav), onclick: act(() => {
            ctx.commit(toggleFavorite(ctx.state, cid));
            toast(ctx.state.favorites.includes(cid) ? "お気に入りに追加しました" : "お気に入りから外しました");
          }) }, fav ? "★ お気に入りから外す" : "☆ お気に入りに追加"),
          area ? h("button", { class: "btn", type: "button", onclick: () => (countIn(area) ? act(() => apply(moveOne(ctx.state, deckId, cid, area, area === "cand" ? "deck" : "cand", card, pressed)))() : toast(gone(area))) }, area === "cand" ? "デッキへ移す" : "候補へ移す") : null,
          area ? h("button", { class: "btn", type: "button", onclick: act(() => {
            const s = structuredClone(ctx.state);
            s.decks.find((d) => d.id === deckId).cover = cid;
            ctx.commit(s);
          }) }, "表紙にする") : null,
          h("button", { class: "btn", type: "button", onclick: act(() => noteDialog(ctx, cid)) }, "購入メモ"),
          card.custom ? null : h("a", { class: "btn", href: officialDbUrl(cid), target: "_blank", rel: "noopener" }, "公式DB"),
        ),
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
            return tilesOf(e).map((t, i) => {
              const el = tileEl(card, { missing: t.missing, shared: t.shared, area, index: i });
              const marks = tagMarks(deck, e.cid);
              if (marks) el.append(marks);
              return el;
            });
          }),
        ),
      );
    });
    // replaceChildren は null を「null」という文字で出すので、警告が無いときは渡さない
    body.replaceChildren(
      head,
      modeRow,
      h("div", { class: "odds", id: "odds" },
        h("span", { id: "odds-line" }, oddsText(deck)),
        h("button", { class: "btn small", type: "button", id: "draw-hand", onclick: () => handDialog(ctx, deck) }, "初手を引く"),
      ),
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
  // 絞り込みはデッキを開いている間だけ覚える
  let filter = emptyFilter();
  const filterText = h("span", { id: "filter-text" });
  const filterLine = h("div", { class: "filter-line", id: "filter-line", hidden: true }, h("span", {}, "絞り込み: "), filterText,
    h("button", { class: "search-clear-filter", type: "button", id: "filter-clear", "aria-label": "絞り込みを解除" }, "×"));
  const setFilter = (f) => {
    filter = f;
    filterText.textContent = filterLabel(f);
    filterLine.hidden = !isFiltering(f) || panelTab !== "search";
    filterBtn.setAttribute("aria-pressed", String(isFiltering(f)));
    runSearch();
  };
  const filterBtn = h("button", { class: "btn small filter-btn", type: "button", id: "filter-open", "aria-pressed": "false", onclick: () => filterDialog(filter, setFilter) }, "絞り込み");
  filterLine.lastChild.addEventListener("click", () => setFilter(emptyFilter()));
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
    // 名前が空でも、絞り込みがあれば全カードから絞る
    const list = !input.value.trim()
      ? (isFiltering(filter) ? ctx.index.map((e) => e.card).sort(compareCards) : [])
      : textIndex ? searchWithText(ctx.index, textIndex, input.value) : search(ctx.index, input.value);
    found = isFiltering(filter) ? list.filter((c) => matchesFilter(c, filter)) : list;
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
  const searchField = h("div", { class: "search-box" }, input, clearBtn);
  const searchBox = h("div", { class: "search-row" }, searchField, filterBtn);
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
      filterLine.hidden = !isFiltering(filter) || panelTab !== "search";
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
    runSearch();
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
    h("div", { class: "search-top" }, h("div", { class: "panel-tabs", role: "tablist" }, tabBtns), searchBox, filterLine, h("div", { class: "dest-row" }, h("div", { class: "seg-group", role: "group", "aria-label": "追加先" }, h("span", { class: "muted" }, "追加先"), destBtns), h("button", { class: "btn small", type: "button", id: "add-hand-traps", onclick: addHandTrapsClick }, "汎用誘発を追加"))),
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
