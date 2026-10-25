import { exportFileName, exportJson, parseImport } from "../core/storage.js";
import { h } from "./dom.js";
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
    ),
    h("section", { class: "panel" },
      h("h2", {}, "データの書き出しと読み込み"),
      h("p", { class: "muted" }, "デッキと購入メモはこの端末に保存されています。端末の移行やバックアップにファイルで書き出せます。"),
      h("button", { class: "btn primary", type: "button", id: "export-btn", onclick: download }, "書き出し"),
      h("label", { class: "import-label" }, "読み込み", fileInput),
    ),
    h("section", { id: "art-settings" }),
  );
  return { el, refresh() {} };
}
