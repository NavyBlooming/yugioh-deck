"""data/cards.json の cid のうち絵が未作成のものを、暗号化した art/<cid>.bin にする。
--prerelease のときは、data/prerelease.json の発売前のカードの絵を作る。"""

import io
import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from PIL import Image

import art_crypto

YPD_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes"
IMG_URL = "https://images.ygoprodeck.com/images/cards_cropped/{}.jpg"
FULL_URL = "https://images.ygoprodeck.com/images/cards/{}.jpg"  # カード全体。発売前のカードは絵だけの画像が無い
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


# カード全体の画像のうち、絵の枠の位置（幅・高さに対する割合。左・上・右・下）
ART_BOX = (0.119, 0.179, 0.881, 0.702)


def to_webp(jpeg: bytes, box=None) -> bytes:
    im = Image.open(io.BytesIO(jpeg)).convert("RGB")
    if box:
        l, t, r, b = box
        im = im.crop((round(im.width * l), round(im.height * t), round(im.width * r), round(im.height * b)))
    if im.width > WIDTH:
        im = im.resize((WIDTH, round(im.height * WIDTH / im.width)), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, "WEBP", quality=70)
    return out.getvalue()


def _open_art(repo, passphrase, iterations):
    """(書き出す meta か None, 鍵, index)。meta.json があれば合言葉を確かめる。"""
    meta_path = repo / "art" / "meta.json"
    index_path = repo / "art" / "index.json"
    if meta_path.exists():
        try:
            key = art_crypto.key_from_meta(json.loads(meta_path.read_text(encoding="utf-8")), passphrase)
        except ValueError:
            sys.exit("wrong passphrase for art/meta.json")
        meta = None
    else:
        meta, key = art_crypto.new_meta(passphrase, iterations)
    index = set(json.loads(index_path.read_text(encoding="utf-8"))) if index_path.exists() else set()
    return meta, key, index


def build_art(repo, passphrase, fetch_ypd, fetch_image, limit=None, iterations=300000, sleep=time.sleep, workers=1, fetch_full=None):
    art = repo / "art"
    meta_path = art / "meta.json"
    index_path = art / "index.json"
    meta, key, index = _open_art(repo, passphrase, iterations)
    cards = json.loads((repo / "data" / "cards.json").read_text(encoding="utf-8"))["cards"]
    cids = {c[0] for c in cards}

    pw_of, pendulum = {}, set()
    for c in fetch_ypd()["data"]:
        info = c.get("misc_info")
        if info and info[0].get("konami_id") in cids:
            pw_of[info[0]["konami_id"]] = c["id"]
            if "pendulum" in c.get("frameType", ""):
                pendulum.add(c["id"])
    targets = sorted(cid for cid in cids if cid not in index and cid in pw_of)
    if limit is not None:
        targets = targets[:limit]

    art.mkdir(exist_ok=True)
    if meta is not None:
        _write_json(meta_path, meta)
    cache = repo / ".cache" / "art"
    cache.mkdir(parents=True, exist_ok=True)
    def get(cached, fetch, pw):
        if cached.exists():
            return cached.read_bytes()
        try:
            jpeg = fetch(pw)
        finally:
            sleep(0.2)
        _write_bytes(cached, jpeg)
        return jpeg

    def one(cid):
        pw = pw_of[cid]
        try:
            try:
                blob = art_crypto.encrypt(key, to_webp(get(cache / f"{pw}.jpg", fetch_image, pw)))
            except ImageNotFound:
                # 絵だけの画像が無いカードは、カード全体の画像から絵の枠を切り出す。ペンデュラムは枠の形が違うので除く
                if fetch_full is None or pw in pendulum:
                    raise
                blob = art_crypto.encrypt(key, to_webp(get(cache / f"full-{pw}.jpg", fetch_full, pw), ART_BOX))
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


YPD_SPELL_SUBS = {"Normal": "normal", "Quick-Play": "quickplay", "Continuous": "continuous", "Equip": "equip", "Field": "field", "Ritual": "ritual"}
YPD_TRAP_SUBS = {"Normal": "normal", "Continuous": "continuous", "Counter": "counter"}
YPD_MONSTERS = {"normal", "effect", "ritual", "fusion", "synchro", "xyz", "link"}


def _signature(c):
    """YGOPRODeck のカードの (種類, レベル, 魔法罠の種類)。data/prerelease.json の kind・level・sub と同じ形。ペンデュラムなどは None。"""
    frame = c.get("frameType")
    if frame == "spell":
        return ("spell", 0, YPD_SPELL_SUBS.get(c.get("race")))
    if frame == "trap":
        return ("trap", 0, YPD_TRAP_SUBS.get(c.get("race")))
    if frame in YPD_MONSTERS:
        return (frame, c.get("linkval") if frame == "link" else c.get("level"), "")
    return None


def match_prerelease(pre_cards, ypd_cards):
    """発売前のカードの cid → YGOPRODeck の仮の番号。
    仮の番号は「商品ごとの頭」＋「型番の下3桁」なので、商品ごとに、種類とレベルが一致する枚数の最も多い頭を選び、
    その頭で一致したカードだけを結び付ける。公式のカードIDがある（発売済みの）カードは使わない。"""
    sig = {}
    for c in ypd_cards:
        info = c.get("misc_info") or [{}]
        if not info[0].get("konami_id") and _signature(c):
            sig[c["id"]] = _signature(c)
    sets = {}
    for c in pre_cards:
        m = re.fullmatch(r"([A-Z0-9]+)-JP(\d{3})", c.get("number") or "")
        if m:
            sets.setdefault(m.group(1), []).append((c, int(m.group(2))))
    out = {}
    for items in sets.values():
        def hits(head):
            return [(c["cid"], head * 1000 + n) for c, n in items if sig.get(head * 1000 + n) == (c["kind"], c["level"], c["sub"])]

        best = max(({pid // 1000 for pid in sig}), key=lambda head: len(hits(head)), default=None)
        if best is not None:
            out.update(hits(best))
    return out


def build_prerelease_art(repo, passphrase, fetch_ypd, fetch_image, iterations=300000, sleep=time.sleep):
    """発売前のカードの絵を、カード全体の画像から絵の枠を切り出して作る。発売前でなくなったカードの絵は消す。"""
    art = repo / "art"
    meta, key, index = _open_art(repo, passphrase, iterations)
    pre_path = repo / "data" / "prerelease.json"
    pre = json.loads(pre_path.read_text(encoding="utf-8"))["cards"] if pre_path.exists() else []
    matched = match_prerelease(pre, fetch_ypd()["data"])

    art.mkdir(exist_ok=True)
    if meta is not None:
        _write_json(art / "meta.json", meta)
    stats = {"matched": len(matched), "new": 0, "removed": 0, "no_image": 0, "failed": 0}
    alive = {c["cid"] for c in pre}
    for cid in sorted(c for c in index if c < 0 and c not in alive):
        (art / f"{cid}.bin").unlink(missing_ok=True)
        index.discard(cid)
        stats["removed"] += 1

    cache = repo / ".cache" / "art"
    cache.mkdir(parents=True, exist_ok=True)
    for cid in sorted(c for c in matched if c not in index):
        pid = matched[cid]
        try:
            cached = cache / f"full-{pid}.jpg"
            if cached.exists():
                jpeg = cached.read_bytes()
            else:
                try:
                    jpeg = fetch_image(pid)
                finally:
                    sleep(0.2)
                _write_bytes(cached, jpeg)
            blob = art_crypto.encrypt(key, to_webp(jpeg, ART_BOX))
        except ImageNotFound:
            stats["no_image"] += 1
            continue
        except Exception:
            stats["failed"] += 1
            continue
        _write_bytes(art / f"{cid}.bin", blob)
        index.add(cid)
        stats["new"] += 1
    _write_json(art / "index.json", sorted(index))
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
    if "--prerelease" in sys.argv:
        s = build_prerelease_art(
            root,
            load_passphrase(root, os.environ),
            lambda: json.loads(_get(YPD_URL).content.decode("utf-8")),
            lambda pid: _get(FULL_URL.format(pid)).content,
        )
        print(f"matched {s['matched']} / new {s['new']} / removed {s['removed']} / no image {s['no_image']} / failed {s['failed']}")
        sys.exit(0)
    limit = int(sys.argv[sys.argv.index("--limit") + 1]) if "--limit" in sys.argv else None
    stats = build_art(
        root,
        load_passphrase(root, os.environ),
        lambda: json.loads(_get(YPD_URL).content.decode("utf-8")),
        lambda pw: _get(IMG_URL.format(pw)).content,
        limit=limit,
        workers=2,
        fetch_full=lambda pw: _get(FULL_URL.format(pw)).content,
    )
    print(_summary(stats))
