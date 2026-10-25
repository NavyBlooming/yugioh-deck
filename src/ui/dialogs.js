import { setNote } from "../core/shopping.js";
import { h } from "./dom.js";

let toastTimer = null;
export function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.hidden = true), 2000);
}

// 下から出すシート（sheet: true）か、中央のダイアログ。閉じる関数を返す。
export function openModal(content, { sheet = false } = {}) {
  const openedAt = Date.now();
  const overlay = h("div", { class: `overlay${sheet ? " sheet-pos" : ""}` }, h("div", { class: sheet ? "sheet" : "dialog" }, content));
  const close = () => overlay.remove();
  overlay.addEventListener("click", (e) => {
    // 長押しの指を離した直後に合成される click で、開いたばかりのシートが閉じないようにする
    if (e.target === overlay && Date.now() - openedAt > 400) close();
  });
  document.body.append(overlay);
  return close;
}

export function nameDialog(title, initial, onOk) {
  const input = h("input", { type: "text", id: "name-input", value: initial, maxlength: "60", autocomplete: "off" });
  const submit = () => {
    const name = input.value.trim();
    if (!name) return input.focus();
    close();
    onOk(name);
  };
  input.addEventListener("keydown", (e) => e.key === "Enter" && submit());
  const close = openModal(
    h("div", { class: "form" },
      h("h2", {}, title),
      input,
      h("div", { class: "row-btns" },
        h("button", { class: "btn", type: "button", onclick: () => close() }, "キャンセル"),
        h("button", { class: "btn primary", type: "button", id: "name-ok", onclick: submit }, "決定"),
      ),
    ),
  );
  input.focus();
  input.select();
}

const RARITIES = ["N", "R", "SR", "UR", "SE", "UL", "CR", "HR", "PSE", "QCSE", "25thSE", "P-N"];

// 購入メモ。型番の候補は開いたときに ygoresources から取る。
export function noteDialog(ctx, cid) {
  const card = ctx.cards.get(cid);
  const note = ctx.state.notes[cid] ?? { price: null, rarity: "", print: "" };
  const price = h("input", { type: "number", id: "note-price", inputmode: "numeric", min: "0", step: "1", value: note.price ?? "" });
  const rarity = h("input", { type: "text", id: "note-rarity", list: "rarity-list", value: note.rarity, autocomplete: "off" });
  const printBox = h("div", {}, h("span", { class: "muted" }, "読み込み中…"));
  let printEl = null;
  const setPrintEl = (el) => {
    printEl = el;
    printBox.replaceChildren(el);
  };

  fetch(`https://db.ygoresources.com/data/card/${cid}`)
    .then((r) => {
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    })
    .then((d) => {
      const prints = [...d.cardData.ja.prints].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
      const codes = prints.map((p) => p.code);
      if (note.print && !codes.includes(note.print)) codes.unshift(note.print);
      setPrintEl(
        h("select", { id: "note-print" },
          h("option", { value: "" }, "（未選択）"),
          codes.map((c) => h("option", { value: c, selected: c === note.print }, c)),
        ),
      );
    })
    .catch(() => setPrintEl(h("input", { type: "text", id: "note-print", value: note.print, placeholder: "例: MACR-JP036", autocomplete: "off" })));

  const save = () => {
    const raw = price.value.trim();
    const n = Number(raw);
    ctx.commit(setNote(ctx.state, cid, {
      price: raw !== "" && Number.isFinite(n) && n >= 0 ? Math.round(n) : null,
      rarity: rarity.value.trim(),
      print: printEl ? printEl.value : note.print,
    }));
    close();
  };
  const close = openModal(
    h("div", { class: "form" },
      h("h2", {}, "購入メモ"),
      h("p", { class: "muted" }, card?.name ?? ""),
      h("label", {}, "単価（円）", price),
      h("label", {}, "レアリティ", rarity),
      h("datalist", { id: "rarity-list" }, RARITIES.map((r) => h("option", { value: r }))),
      h("label", {}, "収録パック", printBox),
      h("div", { class: "row-btns" },
        h("button", { class: "btn", type: "button", onclick: () => close() }, "キャンセル"),
        h("button", { class: "btn primary", type: "button", id: "note-save", onclick: save }, "保存"),
      ),
    ),
  );
}
