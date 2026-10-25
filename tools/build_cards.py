"""ygocdb と YGOPRODeck から data/cards.json と data/meta.json を作る。"""

import datetime
import hashlib
import io
import json
import re
import zipfile
from pathlib import Path

MD5_URL = "https://ygocdb.com/api/v0/cards.zip.md5"
ZIP_URL = "https://ygocdb.com/api/v0/cards.zip"
YPD_URL = "https://db.ygoprodeck.com/api/v7/cardinfo.php?misc=yes"
LIMITS_URL = "https://www.db.yugioh-card.com/yugiohdb/forbidden_limited.action?request_locale=ja"
UA = "yugioh-deck (https://github.com/NavyBlooming/yugioh-deck)"

SPELL, TRAP, NORMAL, EFFECT = 0x2, 0x4, 0x10, 0x20
TOKEN, PENDULUM = 0x4000, 0x1000000
BASES = [
    (0x4000000, "link"),
    (0x800000, "xyz"),
    (0x2000, "synchro"),
    (0x40, "fusion"),
    (0x80, "ritual"),
]
YPD_FRAMES = {
    "normal", "effect", "ritual", "fusion", "synchro", "xyz", "link",
    "spell", "trap", "normal_pendulum", "effect_pendulum", "ritual_pendulum",
    "fusion_pendulum", "synchro_pendulum", "xyz_pendulum",
}  # fmt: skip
LIMIT_IDS = ["list_forbidden", "list_limited", "list_semi_limited", "list_release_of_restricted"]


def frame_from_bits(t: int) -> str | None:
    if t & TOKEN:
        return None
    if t & SPELL:
        return "spell"
    if t & TRAP:
        return "trap"
    base = next((name for bit, name in BASES if t & bit), None)
    if base is None:
        base = "normal" if t & NORMAL and not t & EFFECT else "effect"
    return base + ("_pendulum" if t & PENDULUM else "")


def frame_from_ypd(frame_type: str) -> str | None:
    return frame_type if frame_type in YPD_FRAMES else None


def group_of(frame: str) -> str:
    base = frame.removesuffix("_pendulum")
    return "effect" if base in ("effect", "ritual") else base


def parse_limits(html: str) -> dict[int, int]:
    pos = [html.find(f'id="{i}"') for i in LIMIT_IDS]
    if -1 in pos:
        raise ValueError("limit list section not found")
    limits: dict[int, int] = {}
    for state in range(3):
        cids = {int(c) for c in re.findall(r"cid=(\d+)", html[pos[state] : pos[state + 1]])}
        if not cids:
            raise ValueError(f"limit list section {LIMIT_IDS[state]} is empty")
        limits.update({c: state for c in cids})
    return limits


def limits_hash(limits: dict) -> str:
    return hashlib.sha256(json.dumps(sorted(limits.items())).encode()).hexdigest()


def limit_of(cid: int, limits: dict) -> int:
    return limits.get(cid, 3)


def build(cdb: dict, ypd: dict, limits: dict) -> tuple[list, list]:
    by_cid = {}
    for c in ypd["data"]:
        info = c.get("misc_info")
        if info and "konami_id" in info[0]:
            by_cid[info[0]["konami_id"]] = c
    rows, excluded = [], []
    for key, c in cdb.items():
        cid, name = c["cid"], c.get("jp_name")
        if not name:
            excluded.append({"cid": cid, "name": name, "reason": "no_jp_name"})
            continue
        y = by_cid.get(cid)
        t = c.get("data", {}).get("type")
        if t is not None:
            frame = frame_from_bits(t)
        elif y is not None:
            frame = frame_from_ypd(y["frameType"])
        else:
            excluded.append({"cid": cid, "name": name, "reason": "no_type"})
            continue
        if frame is None:
            continue
        rows.append([cid, name, c.get("jp_ruby") or name, group_of(frame), frame, limit_of(cid, limits)])
    rows.sort(key=lambda r: r[0])
    excluded.sort(key=lambda e: e["cid"])
    return rows, excluded


def _write(path: Path, obj, **kw) -> None:
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, **kw)


def main(fetch_text, fetch_bytes, out_dir: Path) -> int:
    md5 = fetch_text(MD5_URL).strip()
    limits = parse_limits(fetch_text(LIMITS_URL))
    lhash = limits_hash(limits)
    meta_path = out_dir / "meta.json"
    if meta_path.exists():
        old = json.loads(meta_path.read_text(encoding="utf-8"))
        if old.get("source_md5") == md5 and old.get("limits_hash") == lhash:
            print("unchanged")
            return 0
    with zipfile.ZipFile(io.BytesIO(fetch_bytes(ZIP_URL))) as z:
        cdb = json.loads(z.read("cards.json").decode("utf-8"))
    ypd = json.loads(fetch_text(YPD_URL))
    rows, excluded = build(cdb, ypd, limits)
    out_dir.mkdir(parents=True, exist_ok=True)
    _write(out_dir / "cards.json", {"version": 1, "cards": rows}, separators=(",", ":"))
    meta = {
        "source_md5": md5,
        "updated": datetime.date.today().isoformat(),
        "limits_hash": lhash,
        "limits_count": {
            k: list(limits.values()).count(i)
            for i, k in enumerate(["forbidden", "limited", "semi_limited"])
        },
        "count": len(rows),
        "excluded": excluded,
    }
    _write(meta_path, meta, indent=1)
    print(f"cards: {len(rows)}, excluded: {len(excluded)}")
    return 0


if __name__ == "__main__":
    import sys

    import requests

    def _get(url):
        r = requests.get(url, headers={"User-Agent": UA}, timeout=60)
        r.raise_for_status()
        return r

    out = Path(__file__).resolve().parent.parent / "data"
    sys.exit(main(lambda u: _get(u).content.decode("utf-8"), lambda u: _get(u).content, out))
