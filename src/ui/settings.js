import { KINDS, addCustomCard, removeCustomCard } from "../core/custom.js";
import { exportFileName, exportJson, parseImport } from "../core/storage.js";
import { h } from "./dom.js";
import { artState, clearPassphrase, setPassphrase } from "./art.js";
import { toast } from "./dialogs.js";
import { cloud, sendPass, signIn, signOutCloud } from "./cloud.js";

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
    cloudSection(),
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
    customSection(ctx),
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

function cloudSection() {
  if (cloud.status === "off") return null;
  const body = {
    loading: [h("p", { class: "muted" }, "準備しています…")],
    out: [
      h("p", { class: "muted" }, "ログインすると、同じ Google アカウントのスマホと PC で、デッキと購入メモ、カードの絵の合言葉が同じになります。"),
      h("button", { class: "btn primary", type: "button", id: "login", onclick: signIn }, "Google でログイン"),
    ],
    deciding: [h("p", { class: "muted" }, `${cloud.email} でログインしています。クラウドのデータを確かめています…`)],
    in: [
      h("p", { id: "login-line" }, `ログイン中: ${cloud.email}`),
      h("p", { class: "muted" }, "変更はこの端末に保存し、クラウドには30秒に1回まで、ほかのアプリに切り替えたときにも保存します。"),
      h("button", { class: "btn", type: "button", id: "logout", onclick: () => signOutCloud() }, "ログアウト"),
    ],
  }[cloud.status];
  return h("section", { class: "panel", id: "cloud-settings" }, h("h2", {}, "ログインと同期"), body);
}

const SUBS = {
  spell: [["normal", "通常"], ["field", "フィールド"], ["equip", "装備"], ["continuous", "永続"], ["quickplay", "速攻"], ["ritual", "儀式"]],
  trap: [["normal", "通常"], ["continuous", "永続"], ["counter", "カウンター"]],
};
const isSpellTrap = (kind) => kind === "spell" || kind === "trap";
const customLabel = (c) => `${KINDS[c.kind].label}・${isSpellTrap(c.kind) ? SUBS[c.kind].find(([v]) => v === c.sub)?.[1] ?? "" : `レベル${c.level}`}`;

// 発売前のカードの登録。カードデータに同じ名前のカードが入ったら、開いたときに置き換わる
function customSection(ctx) {
  const name = h("input", { type: "text", id: "custom-name", placeholder: "カード名", autocomplete: "off" });
  const ruby = h("input", { type: "text", id: "custom-ruby", placeholder: "読み（ひらがな）", autocomplete: "off" });
  const kind = h("select", { id: "custom-kind" }, Object.entries(KINDS).map(([v, k]) => h("option", { value: v, selected: v === "effect" }, k.label)));
  const level = h("input", { type: "number", id: "custom-level", min: "0", max: "13", step: "1", value: "4", inputmode: "numeric" });
  const sub = h("select", { id: "custom-sub" });
  const levelLabel = h("label", {}, "レベル・ランク・リンク", level);
  const subLabel = h("label", {}, "種類", sub);
  const syncKind = () => {
    const st = isSpellTrap(kind.value);
    levelLabel.hidden = st;
    subLabel.hidden = !st;
    if (st) sub.replaceChildren(...SUBS[kind.value].map(([v, l]) => h("option", { value: v }, l)));
  };
  kind.addEventListener("change", syncKind);
  syncKind();
  const add = () => {
    const n = name.value.trim();
    if (!n) return name.focus();
    const st = isSpellTrap(kind.value);
    const lv = Math.max(0, Math.min(13, Math.round(Number(level.value) || 0)));
    ctx.commit(addCustomCard(ctx.state, { name: n, ruby: ruby.value.trim() || n, kind: kind.value, level: st ? 0 : lv, sub: st ? sub.value : "" }).state);
    toast(`「${n}」を登録しました`);
    ctx.rerender();
  };
  const list = (ctx.state.customCards ?? []).map((c) =>
    h("div", { class: "custom-row" },
      h("div", { class: "custom-main" }, h("div", { class: "custom-name" }, c.name), h("div", { class: "muted" }, customLabel(c))),
      h("button", { class: "btn small danger", type: "button", "data-cid": c.cid, onclick: () => {
        if (!confirm(`「${c.name}」を削除します。デッキからも抜けます。よろしいですか？`)) return;
        ctx.commit(removeCustomCard(ctx.state, c.cid));
        ctx.rerender();
      } }, "削除"),
    ),
  );
  return h("section", { class: "panel", id: "custom-settings" },
    h("h2", {}, "発売前のカード"),
    h("p", { class: "muted" }, "まだカードデータに無いカードを登録すると、検索してデッキに入れられます。発売されてカードデータに同じ名前のカードが入ったら、そのカードに置き換わります。"),
    list,
    h("div", { class: "form custom-form" }, name, ruby, h("label", {}, "種類", kind), levelLabel, subLabel,
      h("button", { class: "btn primary", type: "button", id: "custom-add", onclick: add }, "登録")),
  );
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
    sendPass(pass);
    ctx.rerender();
  });
  clear.addEventListener("click", () => {
    clearPassphrase();
    sendPass(null);
    ctx.rerender();
  });
  const off = artState() === "none";
  if (off) save.disabled = clear.disabled = input.disabled = true;
  return h("section", { class: "panel", id: "art-settings" },
    h("h2", {}, "カードの絵"),
    status,
    h("div", { class: "art-row" }, input, save),
    artState() === "on" ? clear : null,
    cloud.status === "in" ? h("p", { class: "muted" }, "ログイン中は、合言葉もクラウドに保存し、同じアカウントの端末で使えます。消すとクラウドからも消えます。") : null,
  );
}
