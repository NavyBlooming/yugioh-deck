// 絵の復号。形式は tools/art_crypto.py と同じ（PBKDF2-SHA256 → AES-GCM-256、iv(12) | 暗号文 | タグ）。
const CHECK_PLAIN = "yugioh-deck-art";

const fromBase64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function deriveKey(passphrase, meta) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", hash: "SHA-256", salt: fromBase64(meta.salt), iterations: meta.iterations },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  );
}

export async function decryptArt(key, buffer) {
  const bytes = new Uint8Array(buffer);
  return crypto.subtle.decrypt({ name: "AES-GCM", iv: bytes.slice(0, 12) }, key, bytes.slice(12));
}

export async function checkKey(key, meta) {
  try {
    const plain = await decryptArt(key, fromBase64(meta.check).buffer);
    return new TextDecoder().decode(plain) === CHECK_PLAIN;
  } catch {
    return false;
  }
}
