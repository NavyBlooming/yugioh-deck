import { exportDeck, importDeck, parseYdke, passcodeIndex } from "../core/ydke.js";
import { h } from "./dom.js";
import { nameDialog, toast } from "./dialogs.js";
import { toolTabs } from "./shop.js";

// パスワードの表は YDKE を使うときだけ要るので、この画面で初めて取る
let indexPromise = null;
const loadIndex = () =>
  (indexPromise ??= fetch("data/passcodes.json", { cache: "no-cache" })
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then(passcodeIndex)
    .catch((e) => {
      indexPromise = null;
      throw e;
    }));
const LOAD_ERROR = "パスワードの表を読み込めませんでした。通信を確かめて、もう一度押してください";

export function otherView(ctx) {
  const root = h("div", { class: "view" });
  // 保存すると画面が描き直されるので、入力と結果はここに持つ
  let inText = "";
  let importMsg = null;
  let deckId = "";
  let exported = null;

  async function doImport() {
    if (!parseYdke(inText)) {
      importMsg = { error: "YDKE の形ではありません。ydke:// で始まる文字列を貼ってください" };
      return refresh();
    }
    let index;
    try {
      index = await loadIndex();
    } catch {
      importMsg = { error: LOAD_ERROR };
      return refresh();
    }
    nameDialog("読み込むデッキの名前", "読み込んだデッキ", (name) => {
      const r = importDeck(ctx.state, name, inText, ctx.cards, index);
      const deck = r.state.decks.find((d) => d.id === r.deckId);
      inText = "";
      importMsg = { name, deckId: r.deckId, count: deck.entries.reduce((n, e) => n + e.count, 0), unknown: r.unknown, over: r.over };
      ctx.commit(r.state);
    });
  }

  async function doExport(id) {
    deckId = id;
    exported = null;
    if (id) {
      try {
        exported = exportDeck(ctx.state.decks.find((d) => d.id === id), ctx.cards, await loadIndex());
      } catch {
        exported = { error: LOAD_ERROR };
      }
    }
    refresh();
  }

  const copy = (area) =>
    navigator.clipboard.writeText(area.value).then(
      () => toast("コピーしました"),
      () => {
        area.select();
        toast("コピーできませんでした。文字列を選んでコピーしてください");
      },
    );

  function importResult() {
    if (!importMsg) return null;
    if (importMsg.error) return h("p", { class: "warn-mark", id: "ydke-in-result" }, importMsg.error);
    const { name, deckId: id, count, unknown, over } = importMsg;
    return h("div", { id: "ydke-in-result", class: "ydke-result" },
      h("p", {}, `「${name}」を作りました（${count}枚）。`, h("a", { href: `#/deck/${encodeURIComponent(id)}` }, "デッキを開く")),
      unknown.length ? h("p", { class: "warn-mark" }, `カードデータに無いため入れなかったカード ${unknown.length}枚（パスワード: ${[...new Set(unknown)].join("、")}）`) : null,
      over ? h("p", { class: "warn-mark" }, `枚数の上限（同名3枚、候補15枚など）を超えたため入れなかったカード ${over}枚`) : null,
    );
  }

  function exportResult() {
    if (!exported) return null;
    if (exported.error) return h("p", { class: "warn-mark" }, exported.error);
    const area = h("textarea", { id: "ydke-out", class: "ydke-text", readonly: true, rows: "4", onclick: (e) => e.target.select() });
    area.value = exported.ydke;
    return [
      area,
      h("button", { class: "btn primary", type: "button", id: "ydke-copy", onclick: () => copy(area) }, "コピー"),
      exported.missing.length ? h("p", { class: "warn-mark", id: "ydke-missing" }, `パスワードが無く書き出せないカード: ${exported.missing.join("、")}`) : null,
    ];
  }

  function refresh() {
    const input = h("textarea", { id: "ydke-in", class: "ydke-text", rows: "4", placeholder: "ydke://…", oninput: (e) => (inText = e.target.value) });
    input.value = inText;
    const decks = ctx.state.decks;
    if (deckId && !decks.some((d) => d.id === deckId)) [deckId, exported] = ["", null];
    const select = h("select", { id: "ydke-deck", onchange: (e) => doExport(e.target.value) },
      h("option", { value: "" }, "（デッキを選ぶ）"),
      decks.map((d) => h("option", { value: d.id, selected: d.id === deckId }, d.name)),
    );
    root.replaceChildren(
      toolTabs("other"),
      h("section", { class: "panel ydke-panel" },
        h("h2", {}, "YDKE で読み込む"),
        h("p", { class: "muted" }, "ygo-decklab などで書き出した ydke:// の文字列を貼ると、新しいデッキを作ります。サイドデッキは候補に入ります。"),
        input,
        h("button", { class: "btn primary", type: "button", id: "ydke-import", onclick: doImport }, "読み込む"),
        importResult(),
      ),
      h("section", { class: "panel ydke-panel" },
        h("h2", {}, "YDKE で書き出す"),
        h("p", { class: "muted" }, "候補はサイドデッキとして書き出します。未所持・共用の印・メモは入りません。"),
        select,
        exportResult(),
      ),
    );
  }
  refresh();
  return { el: root, refresh };
}
