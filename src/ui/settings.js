import { exportFileName, exportJson, parseImport } from "../core/storage.js";
import { h } from "./dom.js";
import { artState, clearPassphrase, setPassphrase } from "./art.js";
import { toast } from "./dialogs.js";

export function settingsView(ctx) {
  const download = () => {
    const url = URL.createObjectURL(new Blob([exportJson(ctx.state)], { type: "application/json" }));
    const a = h("a", { href: url, download: exportFileName(new Date()) });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const fileInput = h("input", { type: "file", id: "import-file", accept: ".json,application/json" });
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    fileInput.value = "";
    if (!file) return;
    const r = parseImport(await file.text());
    if (!r.ok) return toast("読み込めないファイルです");
    if (!confirm("今のデータを置き換えます。よろしいですか？")) return;
    ctx.commit(r.state);
    toast("読み込みました");
  });

  const m = ctx.meta;
  const el = h("div", { class: "view" },
    h("div", { class: "page-head" }, h("h1", {}, "設定")),
    h("section", { class: "panel" },
      h("h2", {}, "カードデータ"),
      h("p", { id: "meta-line" }, `カードデータ: ${m.updated} 更新（${m.count.toLocaleString("ja-JP")}枚）`),
      h("p", { class: "muted" }, "表示が古いと感じたら、最新の版を取り直してください。デッキと購入メモは消えません。"),
      h("button", { class: "btn", type: "button", id: "reload-latest", onclick: reloadLatest }, "最新の版に更新"),
    ),
    h("section", { class: "panel" },
      h("h2", {}, "データの書き出しと読み込み"),
      h("p", { class: "muted" }, "デッキと購入メモはこの端末に保存されています。端末の移行やバックアップにファイルで書き出せます。"),
      h("button", { class: "btn primary", type: "button", id: "export-btn", onclick: download }, "書き出し"),
      h("label", { class: "import-label" }, "読み込み", fileInput),
    ),
    artSection(ctx),
  );
  return { el, refresh() {} };
}

// このページが読み込んだ同じサイトのファイルを、ブラウザの手元の写しを使わずに取り直してから開き直す。
// 絵の本体（.bin）は中身が変わらないので取り直さない。
async function reloadLatest(e) {
  e.currentTarget.disabled = true;
  e.currentTarget.textContent = "取り直しています…";
  const urls = new Set([location.href.split("#")[0]]);
  for (const r of performance.getEntriesByType("resource")) {
    const u = new URL(r.name);
    if (u.origin === location.origin && !u.pathname.endsWith(".bin")) urls.add(u.href);
  }
  await Promise.all([...urls].map((u) => fetch(u, { cache: "reload" }).catch(() => {})));
  location.reload();
}

const ART_STATUS = {
  none: "絵のデータが見つかりません。上の「最新の版に更新」を押してください。",
  off: "合言葉が入っていません。カードは枠の色と名前で表示しています。",
  on: "合言葉が入っています。カードに絵を表示しています。",
};

function artSection(ctx) {
  const status = h("p", { class: "muted", id: "art-status" }, ART_STATUS[artState()]);
  const input = h("input", { type: "text", id: "art-pass", autocomplete: "off", spellcheck: "false", placeholder: "合言葉" });
  const save = h("button", { class: "btn primary", type: "button", id: "art-save" }, "合言葉を保存");
  const clear = h("button", { class: "btn", type: "button", id: "art-clear" }, "合言葉を消す");
  save.addEventListener("click", async () => {
    const pass = input.value.trim();
    if (!pass) return;
    save.disabled = true;
    save.textContent = "確かめています…";
    const ok = await setPassphrase(pass);
    save.disabled = false;
    save.textContent = "合言葉を保存";
    if (!ok) return toast("合言葉が違うようです");
    toast("合言葉が正しいです。絵を表示します");
    ctx.rerender();
  });
  clear.addEventListener("click", () => {
    clearPassphrase();
    ctx.rerender();
  });
  const off = artState() === "none";
  if (off) save.disabled = clear.disabled = input.disabled = true;
  return h("section", { class: "panel", id: "art-settings" },
    h("h2", {}, "カードの絵"),
    status,
    h("div", { class: "art-row" }, input, save),
    artState() === "on" ? clear : null,
  );
}
