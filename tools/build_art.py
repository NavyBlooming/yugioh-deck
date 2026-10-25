"""data/cards.json の cid のうち絵が未作成のものを、暗号化した art/<cid>.bin にする。"""

import io
import json
import os
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

import art_crypto

YPD_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes"
IMG_URL = "https://images.ygoprodeck.com/images/cards_cropped/{}.jpg"
UA = "yugioh-deck (https://github.com/NavyBlooming/yugioh-deck)"
ENV_KEY = "YGO_ART_PASSPHRASE"
WIDTH = 200
FLUSH_EVERY = 200


class ImageNotFound(Exception):
    pass


def load_passphrase(repo: Path, environ) -> str:
    value = (environ.get(ENV_KEY) or "").strip()
    env_file = repo / ".env"
    if not value and env_file.exists():
        for line in env_file.read_text(encoding="utf-8").splitlines():
            if line.startswith(ENV_KEY + "="):
                value = line.split("=", 1)[1].strip()
    if not value:
        sys.exit(f"{ENV_KEY} is not set (environment or .env)")
    return value


def _write_bytes(path: Path, data: bytes) -> None:
    tmp = path.with_name(path.name + ".tmp")
    with open(tmp, "wb") as f:
        f.write(data)
    os.replace(tmp, path)


def _write_json(path: Path, obj) -> None:
    _write_bytes(path, json.dumps(obj, separators=(",", ":")).encode("utf-8"))


def to_webp(jpeg: bytes) -> bytes:
    im = Image.open(io.BytesIO(jpeg)).convert("RGB")
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, "WEBP", quality=70)
    return out.getvalue()


def build_art(repo, passphrase, fetch_ypd, fetch_image, limit=None, iterations=300000, sleep=time.sleep, workers=1):
    art = repo / "art"
    meta_path = art / "meta.json"
    index_path = art / "index.json"
    if meta_path.exists():
        try:
            key = art_crypto.key_from_meta(json.loads(meta_path.read_text(encoding="utf-8")), passphrase)
        except ValueError:
            sys.exit("wrong passphrase for art/meta.json")
        meta = None
    else:
        meta, key = art_crypto.new_meta(passphrase, iterations)
    index = set(json.loads(index_path.read_text(encoding="utf-8"))) if index_path.exists() else set()
    cards = json.loads((repo / "data" / "cards.json").read_text(encoding="utf-8"))["cards"]
    cids = {c[0] for c in cards}

    pw_of = {}
    for c in fetch_ypd()["data"]:
        info = c.get("misc_info")
        if info and info[0].get("konami_id") in cids:
            pw_of[info[0]["konami_id"]] = c["id"]
    targets = sorted(cid for cid in cids if cid not in index and cid in pw_of)
    if limit is not None:
        targets = targets[:limit]

    art.mkdir(exist_ok=True)
    if meta is not None:
        _write_json(meta_path, meta)
    cache = repo / ".cache" / "art"
    cache.mkdir(parents=True, exist_ok=True)
    def one(cid):
        pw = pw_of[cid]
        try:
            cached = cache / f"{pw}.jpg"
            if cached.exists():
                jpeg = cached.read_bytes()
            else:
                try:
                    jpeg = fetch_image(pw)
                finally:
                    sleep(0.2)
                _write_bytes(cached, jpeg)
            blob = art_crypto.encrypt(key, to_webp(jpeg))
        except ImageNotFound:
            return "no_image", 0
        except Exception:
            return "failed", 0
        _write_bytes(art / f"{cid}.bin", blob)
        return "new", len(blob)

    stats = {"processed": 0, "new": 0, "no_image": 0, "failed": 0, "bytes": 0}
    # 応答の遅い画像で全体が止まらないよう並行で取る。index の更新はこのスレッドだけで行う
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for cid, (result, size) in zip(targets, pool.map(one, targets)):
            stats["processed"] += 1
            stats[result] += 1
            if result != "new":
                continue
            index.add(cid)
            stats["bytes"] += size
            if stats["new"] % FLUSH_EVERY == 0:
                _write_json(index_path, sorted(index))
    _write_json(index_path, sorted(index))
    return stats


def _summary(s: dict) -> str:
    return (
        f"processed {s['processed']} / new {s['new']} / no image {s['no_image']}"
        f" / failed {s['failed']} / size {s['bytes']} bytes"
    )


if __name__ == "__main__":
    import requests

    session = requests.Session()
    session.headers["User-Agent"] = UA

    def _get(url):
        r = session.get(url, timeout=(10, 15))
        if r.status_code == 404:
            raise ImageNotFound(url)
        r.raise_for_status()
        return r

    root = Path(__file__).resolve().parent.parent
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    stats = build_art(
        root,
        load_passphrase(root, os.environ),
        lambda: json.loads(_get(YPD_URL).content.decode("utf-8")),
        lambda pw: _get(IMG_URL.format(pw)).content,
        limit=limit,
        workers=2,
    )
    print(_summary(stats))
