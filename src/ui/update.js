import { createVersionWatch } from "../core/update.js";
import { flushCloud } from "./cloud.js";
import { h } from "./dom.js";
import { toast } from "./dialogs.js";

const page = () => location.href.split("#")[0];

// このページが読み込んだ同じサイトのファイル。絵の本体（.bin）は中身が変わらないので除く
function siteFiles() {
  const urls = new Set([page()]);
  for (const r of performance.getEntriesByType("resource")) {
    const u = new URL(r.name);
    if (u.origin === location.origin && !u.pathname.endsWith(".bin")) urls.add(u.href);
  }
  return [...urls];
}

const tagOf = async (u, init) => {
  try {
    const r = await fetch(u, init);
    r.body?.cancel();
    return r.ok ? r.headers.get("etag") ?? r.headers.get("last-modified") : null;
  } catch {
    return null;
  }
};

// クラウドへの保存を先に送り、ブラウザの手元の写しを使わずにファイルを取り直してから開き直す。
// 開き直さなかったら false
export async function reloadLatest() {
  try {
    await fetch(page(), { cache: "reload" });
  } catch {
    toast("通信できないため更新できません");
    return false;
  }
  if (!(await flushCloud())) {
    toast("クラウドへの保存は次に開いたときに行います");
    await new Promise((r) => setTimeout(r, 2000));
  }
  await Promise.all(siteFiles().map((u) => fetch(u, { cache: "reload" }).catch(() => {})));
  location.reload();
  return true;
}

// 押したボタンを使えなくしてから開き直す。開き直さなかったら元に戻す
export async function reloadButton(btn) {
  const label = btn.textContent;
  btn.disabled = true;
  btn.textContent = "更新しています…";
  if (!(await reloadLatest())) {
    btn.disabled = false;
    btn.textContent = label;
  }
}

// 開いて10秒後と、アプリに戻ってきたときに、新しい版が出ていないか確かめる
export function initUpdate() {
  const watch = createVersionWatch({
    urls: siteFiles,
    baseTag: (u) => tagOf(u, { cache: "force-cache" }),
    freshTag: (u) => tagOf(u, { method: "HEAD", cache: "no-store" }),
    now: () => Date.now(),
  });
  let closed = false;
  const check = async () => {
    if (closed || document.getElementById("update-bar") || !(await watch.check())) return;
    if (closed || document.getElementById("update-bar")) return;
    const update = (e) => reloadButton(e.currentTarget);
    const bar = h("div", { id: "update-bar", role: "status" },
      h("span", {}, "新しい版があります"),
      h("button", { class: "btn small primary", type: "button", id: "update-now", onclick: update }, "更新する"),
      h("button", { class: "btn small", type: "button", id: "update-close", onclick: () => ((closed = true), bar.remove()) }, "閉じる"),
    );
    document.body.prepend(bar);
  };
  setTimeout(check, 10000);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") check();
  });
}
