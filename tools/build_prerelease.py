"""遊戯王カードWiki の発売予定の商品から、カードデータに無いカードを data/prerelease.json にする。

効果テキストは公開しないので .cache/prerelease-texts.json に置き、build_texts.py が暗号化して取り込む。"""

import datetime
import html as htmllib
import json
import re
import sys
import time
import unicodedata
import zlib
from pathlib import Path

BASE = "https://yugioh-wiki.net"
LIST_URL = BASE + "/?%A5%AB%A1%BC%A5%C9%A5%EA%A5%B9%A5%C8"  # カードリスト
UA = "yugioh-deck (https://github.com/NavyBlooming/yugioh-deck)"
WAIT = 2

SPELL_SUBS = {"通常": "normal", "速攻": "quickplay", "永続": "continuous", "装備": "equip", "フィールド": "field", "儀式": "ritual"}
TRAP_SUBS = {"通常": "normal", "永続": "continuous", "カウンター": "counter"}
# 種類の行に含まれる語 → kind。上から順に見る
MONSTER_KINDS = [("融合", "fusion"), ("シンクロ", "synchro"), ("エクシーズ", "xyz"), ("リンク", "link"), ("儀式", "ritual"), ("効果", "effect"), ("通常", "normal")]


def normalize(s: str) -> str:
    """src/core/search.js の normalize と同じ（全角半角・カタカナとひらがな・大小・記号の違いを無視）。"""
    s = unicodedata.normalize("NFKC", s)
    s = "".join(chr(ord(c) - 0x60) if "ァ" <= c <= "ヶ" else c for c in s).lower()
    return "".join(c for c in s if unicodedata.category(c)[0] in "LN")


def cid_of(name: str) -> int:
    """取得したカードの番号。名前から決め、自分で登録したカード（-1, -2, …）と重ならない範囲にする。"""
    return -(1_000_000 + zlib.crc32(normalize(name).encode("utf-8")) % 1_000_000_000)


def _text(fragment: str) -> str:
    return htmllib.unescape(re.sub(r"<[^>]+>", "", fragment))


def product_urls(list_html: str) -> list[str]:
    """カードリストの第13期の部分にある商品のページ。"""
    m = re.search(r'id="series13"(.*?)id="series12"', list_html, re.S)
    if not m:
        raise ValueError("series13 section not found on the card list page")
    urls = []
    for href in re.findall(r'<a [^>]*href="([^"]+)"', m.group(1)):
        href = htmllib.unescape(href)
        if href.startswith("/?"):
            urls.append(BASE + href)
    return list(dict.fromkeys(urls))


def parse_product(page: str) -> tuple[bool, str, list[tuple[str, str]]]:
    """(発売予定か, 商品名, [(カード名, カードのページの URL, 型番)])。"""
    upcoming = "発売予定" in _text(page)
    title = re.search(r"<title>遊戯王カードWiki - (.*?)</title>", page)
    set_name = _text(title.group(1)).strip() if title else ""
    cards = [
        (htmllib.unescape(name), BASE + htmllib.unescape(href), number)
        for number, href, name in re.findall(r'<li>([A-Z0-9]+-JP\d{3})\s*<a href="([^"]+)"[^>]*>《([^》]+)》</a>', page)
    ]
    return upcoming, set_name, cards


def parse_card(page: str) -> dict | None:
    """カードのページの見出しと種類の行から、読み・種類・レベル・魔法罠の種類・効果テキストを読む。読めなければ None。"""
    h2 = re.search(r"<h2[^>]*>《(.*?)》", page, re.S)
    pre = re.search(r"<pre>(.*?)</pre>", page, re.S)
    if not h2 or not pre:
        return None
    title = re.sub(r"<ruby><rb>.*?</rb><rp>\(</rp><rt>(.*?)</rt><rp>\)</rp></ruby>", r"\1", h2.group(1))
    ruby = _text(title).split("/")[0].strip()
    lines = [x.strip() for x in _text(pre.group(1)).splitlines() if x.strip()]
    first = lines[0]
    if first.endswith("魔法") and first[:-2] in SPELL_SUBS:
        return {"ruby": ruby, "kind": "spell", "level": 0, "sub": SPELL_SUBS[first[:-2]], "text": "\n".join(lines[1:])}
    if first.endswith("罠") and first[:-1] in TRAP_SUBS:
        return {"ruby": ruby, "kind": "trap", "level": 0, "sub": TRAP_SUBS[first[:-1]], "text": "\n".join(lines[1:])}
    if not first.endswith("モンスター") or len(lines) < 2:
        return None
    kind = next((k for word, k in MONSTER_KINDS if word in first), None)
    # 星５ / ランク４ / リンク４（LINK－４ と書かれることもある）
    lv = re.match(r"(?:星|ランク|リンク|LINK-?)(\d+)", unicodedata.normalize("NFKC", lines[1]).replace("－", "-"))
    if not kind or not lv:
        return None
    return {"ruby": ruby, "kind": kind, "level": int(lv.group(1)), "sub": "", "text": "\n".join(lines[2:])}


RETRY_WAITS = [10, 30]


def with_retry(fetch_text, sleep=time.sleep):
    """接続が切れたら、間を空けて2回まで読み直す。"""

    def get(url):
        for wait in [*RETRY_WAITS, None]:
            try:
                return fetch_text(url)
            except (ConnectionError, OSError) as e:
                if wait is None:
                    raise
                print(f"retry in {wait}s: {url} ({e})", file=sys.stderr)
                sleep(wait)

    return get


def build_prerelease(repo: Path, fetch_text, sleep=time.sleep, today: str | None = None) -> dict:
    known = {normalize(c[1]) for c in json.loads((repo / "data" / "cards.json").read_text(encoding="utf-8"))["cards"]}
    first = True

    def get(url):
        nonlocal first
        if not first:
            sleep(WAIT)
        first = False
        return fetch_text(url)

    cards, texts, seen = [], {}, set()
    for url in product_urls(get(LIST_URL)):
        upcoming, set_name, items = parse_product(get(url))
        if not upcoming:
            continue
        for name, card_url, number in items:
            key = normalize(name)
            if key in known or key in seen:
                continue
            seen.add(key)
            info = parse_card(get(card_url))
            if info is None:
                print(f"skip (unreadable): {name}", file=sys.stderr)
                continue
            cid = cid_of(name)
            texts[str(cid)] = info.pop("text")
            cards.append({"cid": cid, "name": name, **info, "set": set_name, "number": number})

    cache = repo / ".cache"
    cache.mkdir(exist_ok=True)
    (cache / "prerelease-texts.json").write_bytes(json.dumps(texts, ensure_ascii=False).encode("utf-8"))

    out = repo / "data" / "prerelease.json"
    if out.exists() and json.loads(out.read_text(encoding="utf-8")).get("cards") == cards:
        return {"status": "unchanged", "count": len(cards)}
    data = {"updated": today or datetime.date.today().isoformat(), "cards": cards}
    out.write_bytes(json.dumps(data, ensure_ascii=False, indent=1).encode("utf-8"))
    return {"status": "updated", "count": len(cards)}


if __name__ == "__main__":
    import requests

    session = requests.Session()
    session.headers["User-Agent"] = UA

    def _get(url):
        r = session.get(url, timeout=(10, 30))
        r.raise_for_status()
        return r.content.decode("utf-8")

    root = Path(__file__).resolve().parent.parent
    r = build_prerelease(root, with_retry(_get))
    print(f"{r['status']} ({r['count']} cards)")
