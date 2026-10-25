// Firebase のエミュレーター（firebase emulators:start --only auth,firestore）を起動してから動かす
import { test } from "node:test";
import assert from "node:assert/strict";

const PROJECT = "demo-yugioh-deck";
const AUTH = "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1";
const DOCS = `http://127.0.0.1:8080/v1/projects/${PROJECT}/databases/(default)/documents`;

async function signUp() {
  const r = await fetch(`${AUTH}/accounts:signUp?key=fake`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: `u${Date.now()}${Math.random()}@example.com`, password: "password", returnSecureToken: true }),
  });
  const j = await r.json();
  return { uid: j.localId, token: j.idToken };
}

const headers = (token) => ({ "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) });
const write = (uid, token) =>
  fetch(`${DOCS}/users/${uid}`, {
    method: "PATCH",
    headers: headers(token),
    body: JSON.stringify({ fields: { state: { stringValue: "{}" } } }),
  });
const read = (uid, token) => fetch(`${DOCS}/users/${uid}`, { headers: headers(token) });

test("本人は自分のデータを読み書きできる", async () => {
  const a = await signUp();
  assert.equal((await write(a.uid, a.token)).status, 200);
  const r = await read(a.uid, a.token);
  assert.equal(r.status, 200);
  assert.equal((await r.json()).fields.state.stringValue, "{}");
});

test("ログインしていない読み書きは拒否される", async () => {
  const a = await signUp();
  await write(a.uid, a.token);
  assert.equal((await read(a.uid, null)).status, 403);
  assert.equal((await write(a.uid, null)).status, 403);
});

test("他人のデータは読み書きできない", async () => {
  const a = await signUp();
  const b = await signUp();
  await write(a.uid, a.token);
  assert.equal((await read(a.uid, b.token)).status, 403);
  assert.equal((await write(a.uid, b.token)).status, 403);
});
