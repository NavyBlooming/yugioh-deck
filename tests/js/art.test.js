import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { deriveKey, checkKey, decryptArt, decryptTexts } from "../../src/core/art.js";

const dir = new URL("../fixtures/art/", import.meta.url);
const meta = JSON.parse(readFileSync(new URL("meta.json", dir), "utf8"));
const bin = readFileSync(new URL("sample.bin", dir));
const webp = readFileSync(new URL("sample.webp", dir));
const buf = () => bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength);
const sha = async (b) => Buffer.from(await crypto.subtle.digest("SHA-256", b)).toString("hex");

test("正しい合言葉で確認でき、Python が暗号化した絵を復号できる", async () => {
  const key = await deriveKey("test-pass", meta);
  assert.equal(await checkKey(key, meta), true);
  const plain = await decryptArt(key, buf());
  assert.equal(await sha(plain), await sha(webp));
});

test("Python が圧縮して暗号化した効果テキストを復号できる", async () => {
  const key = await deriveKey("test-pass", meta);
  const t = readFileSync(new URL("texts.bin", dir));
  const texts = await decryptTexts(key, t.buffer.slice(t.byteOffset, t.byteOffset + t.byteLength));
  assert.equal(texts["3"], "相手は手札から捨てる。");
  assert.equal(Object.keys(texts).length, 2);
});

test("違う合言葉では確認が false で、復号は例外", async () => {
  const key = await deriveKey("wrong", meta);
  assert.equal(await checkKey(key, meta), false);
  await assert.rejects(decryptArt(key, buf()));
});
