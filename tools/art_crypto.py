"""カードイラストの暗号化。形式は src/core/art.js と同じ（PBKDF2-SHA256 → AES-GCM-256）。"""

import base64
import hashlib
import os

from cryptography.hazmat.primitives.ciphers.aead import AESGCM

CHECK_PLAIN = b"yugioh-deck-art"


def derive_key(passphrase: str, salt: bytes, iterations: int) -> bytes:
    return hashlib.pbkdf2_hmac("sha256", passphrase.encode("utf-8"), salt, iterations, 32)


def encrypt(key: bytes, data: bytes) -> bytes:
    iv = os.urandom(12)
    return iv + AESGCM(key).encrypt(iv, data, None)


def decrypt(key: bytes, blob: bytes) -> bytes:
    return AESGCM(key).decrypt(blob[:12], blob[12:], None)


def new_meta(passphrase: str, iterations: int = 300000) -> tuple[dict, bytes]:
    salt = os.urandom(16)
    key = derive_key(passphrase, salt, iterations)
    meta = {
        "version": 1,
        "salt": base64.b64encode(salt).decode("ascii"),
        "iterations": iterations,
        "check": base64.b64encode(encrypt(key, CHECK_PLAIN)).decode("ascii"),
    }
    return meta, key


def key_from_meta(meta: dict, passphrase: str) -> bytes:
    key = derive_key(passphrase, base64.b64decode(meta["salt"]), meta["iterations"])
    try:
        ok = decrypt(key, base64.b64decode(meta["check"])) == CHECK_PLAIN
    except Exception:
        ok = False
    if not ok:
        raise ValueError("wrong passphrase")
    return key
