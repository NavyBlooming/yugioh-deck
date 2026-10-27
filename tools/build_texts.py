"""日本語の効果テキストを、絵と同じ合言葉で暗号化した art/texts.bin にする。"""

import gzip
import hashlib
import io
import json
import os
import sqlite3
import sys
import tempfile
import zipfile
from pathlib import Path

import art_crypto
from build_art import UA, _write_bytes, _write_json, load_passphrase

CDB_URL = "https://raw.githubusercontent.com/mycard/ygopro-database/master/locales/ja-JP/cards.cdb"
ZIP_URL = "https://ygocdb.com/api/v0/cards.zip"


def read_cdb(data: bytes) -> dict[int, str]:
    """パスワード → 効果テキスト。sqlite はファイルからしか開けないので一時ファイルに書く。"""
    fd, path = tempfile.mkstemp(suffix=".cdb")
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(data)
        db = sqlite3.connect(path)
        try:
            return {pw: desc for pw, desc in db.execute("select id, desc from texts") if desc}
        finally:
            db.close()
    finally:
        os.unlink(path)


def build_texts(repo: Path, passphrase: str, fetch_bytes) -> dict:
    art = repo / "art"
    meta = json.loads((art / "meta.json").read_text(encoding="utf-8"))
    try:
        key = art_crypto.key_from_meta(meta, passphrase)
    except ValueError:
        sys.exit("wrong passphrase for art/meta.json")
    cids = {c[0] for c in json.loads((repo / "data" / "cards.json").read_text(encoding="utf-8"))["cards"]}

    by_pw = read_cdb(fetch_bytes(CDB_URL))
    with zipfile.ZipFile(io.BytesIO(fetch_bytes(ZIP_URL))) as z:
        ygocdb = json.loads(z.read(z.namelist()[0]))
    texts = {}
    for e in ygocdb.values():
        if e["cid"] in cids and e["id"] in by_pw:
            texts[str(e["cid"])] = by_pw[e["id"]].replace("\r\n", "\n")

    plain = json.dumps(texts, ensure_ascii=False, sort_keys=True, separators=(",", ":")).encode("utf-8")
    digest = hashlib.sha256(plain).hexdigest()
    meta_path = art / "texts-meta.json"
    # 暗号化は毎回結果が変わるので、中身が同じなら書かない
    if meta_path.exists() and json.loads(meta_path.read_text(encoding="utf-8")).get("hash") == digest:
        return {"status": "unchanged", "count": len(texts)}
    _write_bytes(art / "texts.bin", art_crypto.encrypt(key, gzip.compress(plain, 9)))
    _write_json(meta_path, {"hash": digest, "count": len(texts)})
    return {"status": "updated", "count": len(texts)}


if __name__ == "__main__":
    import requests

    session = requests.Session()
    session.headers["User-Agent"] = UA

    def _get(url):
        r = session.get(url, timeout=(10, 60))
        r.raise_for_status()
        return r.content

    root = Path(__file__).resolve().parent.parent
    r = build_texts(root, load_passphrase(root, os.environ), _get)
    print(f"{r['status']} ({r['count']} cards)")
