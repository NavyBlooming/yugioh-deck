import { exportJson, parseImport } from "../core/storage.js";
import { createScheduler, decideOnResume, decideOnSignIn } from "../core/sync.js";
import { firebaseConfig } from "./firebase-config.js";
import { h } from "./dom.js";
import { openModal, toast } from "./dialogs.js";

const SDK = "https://www.gstatic.com/firebasejs/13.1.0";
const DIRTY_KEY = "ygo.sync.dirty.v1"; // クラウドに送っていない変更がある
const PULLED_KEY = "ygo.sync.pulled.v1"; // 最後に取り込んだクラウドの updatedAt（ミリ秒）
const UID_KEY = "ygo.sync.uid.v1"; // ログイン時の選択まで済んだアカウント

const EMULATOR = new URLSearchParams(location.search).has("emulator");
const config = EMULATOR ? { apiKey: "fake", authDomain: "127.0.0.1", projectId: "demo-yugioh-deck" } : firebaseConfig;

// status: "off"（設定値が無い）| "loading" | "out" | "deciding"（ログイン時の選択待ち）| "in"
export const cloud = { status: config ? "loading" : "off", email: "" };

let ctx = null;
let fb = null;
let user = null;
let sched = null;

const store = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      if (v === null) localStorage.removeItem(k);
      else localStorage.setItem(k, v);
    } catch {}
  },
};

function setStatus(status) {
  cloud.status = status;
  cloud.email = user?.email ?? "";
  if (location.hash === "#/settings") ctx.rerender();
}

const docRef = () => fb.doc(fb.db, "users", user.uid);

async function fetchRemote() {
  const snap = await fb.getDoc(docRef());
  if (!snap.exists()) return null;
  const d = snap.data();
  const r = parseImport(d.state);
  return r.ok ? { state: r.state, at: d.updatedAt?.toMillis() ?? 0 } : null;
}

async function writeRemote() {
  await fb.setDoc(docRef(), { state: exportJson(ctx.state), updatedAt: fb.serverTimestamp() });
  // 書いている間に来た変更は、次の書き込みまで印を残す
  if (!sched.dirty) store.set(DIRTY_KEY, null);
}

// クラウドのデータで手元を置き換える。ctx.commit を通さないので、クラウドへ送り返さない
function applyRemote(remote) {
  store.set(PULLED_KEY, String(remote.at));
  if (exportJson(remote.state) === exportJson(ctx.state)) return;
  ctx.replace(remote.state);
}

function push() {
  store.set(DIRTY_KEY, "1");
  sched.schedule();
  return sched.flush();
}

// 開いたとき・戻ったとき
async function pull() {
  if (cloud.status !== "in") return;
  try {
    const remote = await fetchRemote();
    const d = decideOnResume(store.get(DIRTY_KEY) === "1", remote?.at ?? null, Number(store.get(PULLED_KEY) ?? 0));
    if (d === "push") await push();
    else if (d === "pull") applyRemote(remote);
  } catch (e) {
    console.warn("cloud pull", e);
  }
}

async function onSignedIn() {
  if (store.get(UID_KEY) === user.uid) {
    setStatus("in");
    return pull();
  }
  setStatus("deciding");
  let remote;
  try {
    remote = await fetchRemote();
  } catch (e) {
    console.warn("cloud sign-in", e);
    toast("クラウドのデータを取れませんでした。通信を確かめて、開き直してください");
    return;
  }
  const finish = async (choice) => {
    store.set(UID_KEY, user.uid);
    setStatus("in");
    if (choice === "download") applyRemote(remote);
    else if (choice === "same") store.set(PULLED_KEY, String(remote.at));
    else await push();
  };
  const d = decideOnSignIn(ctx.state, remote?.state ?? null);
  if (d !== "ask") return finish(d);
  const close = openModal(
    h("div", { class: "form", id: "sync-choice" },
      h("h2", {}, "どちらのデータを使いますか"),
      h("p", { class: "muted" }, "この端末とクラウドの両方にデータがあります。選ばなかった方は置き換えられます。"),
      h("div", { class: "row-btns stack" },
        h("button", { class: "btn", type: "button", id: "use-local", onclick: () => (close(), finish("upload")) }, "この端末のデータを使う"),
        h("button", { class: "btn primary", type: "button", id: "use-remote", onclick: () => (close(), finish("download")) }, "クラウドのデータを使う"),
      ),
    ),
  );
}

export async function initCloud(appCtx) {
  ctx = appCtx;
  if (!config) return;
  try {
    const [app, auth, fs] = await Promise.all([
      import(`${SDK}/firebase-app.js`),
      import(`${SDK}/firebase-auth.js`),
      import(`${SDK}/firebase-firestore-lite.js`),
    ]);
    const fapp = app.initializeApp(config);
    const a = auth.getAuth(fapp);
    const db = fs.getFirestore(fapp);
    if (EMULATOR) {
      auth.connectAuthEmulator(a, "http://127.0.0.1:9099", { disableWarnings: true });
      fs.connectFirestoreEmulator(db, "127.0.0.1", 8080);
    }
    fb = { auth: a, db, ...auth, ...fs };
    // ログインの画面から戻ったときの失敗を知らせる
    if (!EMULATOR) auth.getRedirectResult(a).catch((e) => (console.warn("redirect", e), toast("ログインできませんでした")));
  } catch (e) {
    console.warn("cloud init", e);
    cloud.status = "off";
    return;
  }
  sched = createScheduler({ write: writeRemote, now: () => Date.now(), setTimer: setTimeout, clearTimer: clearTimeout });
  fb.onAuthStateChanged(fb.auth, (u) => {
    user = u;
    if (u) onSignedIn();
    else setStatus("out");
  });
  document.addEventListener("visibilitychange", () => {
    if (cloud.status !== "in") return;
    if (document.visibilityState === "hidden") sched.flush();
    else pull();
  });
  window.addEventListener("online", () => {
    if (cloud.status === "in" && store.get(DIRTY_KEY) === "1") push();
  });
}

// ctx.commit から呼ぶ
export function cloudChanged() {
  if (cloud.status !== "in") return;
  store.set(DIRTY_KEY, "1");
  sched.schedule();
}

// 本番は同じ画面の中で Google のログインへ移動し、戻ってきたら onAuthStateChanged で受け取る。
// エミュレーターの試験はポップアップで行う
export function signIn() {
  const p = new fb.GoogleAuthProvider();
  return (EMULATOR ? fb.signInWithPopup(fb.auth, p) : fb.signInWithRedirect(fb.auth, p)).catch((e) => {
    if (e.code !== "auth/popup-closed-by-user" && e.code !== "auth/cancelled-popup-request") toast("ログインできませんでした");
  });
}

export async function signOutCloud() {
  if (sched?.dirty) await sched.flush();
  for (const k of [UID_KEY, DIRTY_KEY, PULLED_KEY]) store.set(k, null);
  await fb.signOut(fb.auth);
}
