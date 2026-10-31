import io
import json
import os

import pytest
from PIL import Image

import art_crypto as ac
import build_art as ba

IT = 1000
PASS = "pw"


def jpeg(size=300):
    buf = io.BytesIO()
    Image.new("RGB", (size, size), (200, 30, 30)).save(buf, "JPEG")
    return buf.getvalue()


CARDS = {"version": 1, "cards": [[cid, f"n{cid}", f"n{cid}", "normal", "normal", 3] for cid in (10, 20, 30)]}
YPD = {"data": [{"id": 1000 + cid, "misc_info": [{"konami_id": cid}]} for cid in (10, 20, 30)]}


@pytest.fixture
def repo(tmp_path):
    (tmp_path / "data").mkdir()
    (tmp_path / "data" / "cards.json").write_text(json.dumps(CARDS), encoding="utf-8")
    return tmp_path


class Net:
    def __init__(self, missing=()):
        self.calls = []
        self.missing = set(missing)

    def ypd(self):
        return YPD

    def image(self, pw):
        self.calls.append(pw)
        if pw in self.missing:
            raise ba.ImageNotFound(pw)
        return jpeg()


def run(repo, net, passphrase=PASS, **kw):
    return ba.build_art(
        repo, passphrase, net.ypd, net.image, iterations=IT, sleep=lambda s: None, **kw
    )


def index(repo):
    return json.loads((repo / "art" / "index.json").read_text(encoding="utf-8"))


def test_parallel_workers_same_result(repo):
    stats = run(repo, Net(missing={1020}), workers=3)
    assert index(repo) == [10, 30]
    assert stats["new"] == 2 and stats["no_image"] == 1
    key = ac.key_from_meta(json.loads((repo / "art" / "meta.json").read_text(encoding="utf-8")), PASS)
    for cid in (10, 30):
        assert ac.decrypt(key, (repo / "art" / f"{cid}.bin").read_bytes())[8:12] == b"WEBP"


def test_creates_meta_bins_and_index(repo):
    stats = run(repo, Net())
    assert (repo / "art" / "meta.json").exists()
    assert index(repo) == [10, 20, 30]
    for cid in (10, 20, 30):
        assert (repo / "art" / f"{cid}.bin").exists()
    assert stats["new"] == 3 and stats["processed"] == 3


def test_existing_index_entries_untouched(repo):
    run(repo, Net(), limit=1)
    assert index(repo) == [10]
    p = repo / "art" / "10.bin"
    before, mtime = p.read_bytes(), p.stat().st_mtime_ns
    net = Net()
    run(repo, net)
    assert index(repo) == [10, 20, 30]
    assert p.read_bytes() == before and p.stat().st_mtime_ns == mtime
    assert sorted(net.calls) == [1020, 1030]


def test_wrong_passphrase_writes_nothing(repo):
    run(repo, Net())
    (repo / "art" / "index.json").write_text("[10]", encoding="utf-8")
    snap = {p.name: p.read_bytes() for p in (repo / "art").iterdir()}
    with pytest.raises(SystemExit):
        run(repo, Net(), passphrase="bad")
    assert {p.name: p.read_bytes() for p in (repo / "art").iterdir()} == snap


def test_404_skipped_not_indexed(repo):
    stats = run(repo, Net(missing={1020}))
    assert index(repo) == [10, 30]
    assert not (repo / "art" / "20.bin").exists()
    assert stats["no_image"] == 1 and stats["new"] == 2


def test_other_error_counted_and_continues(repo):
    net = Net()
    orig = net.image

    def boom(pw):
        if pw == 1020:
            raise RuntimeError("500")
        return orig(pw)

    stats = ba.build_art(repo, PASS, net.ypd, boom, iterations=IT, sleep=lambda s: None)
    assert stats["failed"] == 1 and index(repo) == [10, 30]


def test_cache_avoids_network(repo):
    cache = repo / ".cache" / "art"
    cache.mkdir(parents=True)
    for cid in (10, 20, 30):
        (cache / f"{1000 + cid}.jpg").write_bytes(jpeg())
    net = Net()
    run(repo, net)
    assert net.calls == []
    assert index(repo) == [10, 20, 30]


def test_network_image_is_cached_and_sleeps(repo):
    sleeps = []
    net = Net()
    ba.build_art(repo, PASS, net.ypd, net.image, iterations=IT, sleep=sleeps.append)
    assert (repo / ".cache" / "art" / "1010.jpg").exists()
    assert sleeps == [0.2, 0.2, 0.2]


def test_decrypted_is_webp_width_200(repo):
    run(repo, Net())
    meta = json.loads((repo / "art" / "meta.json").read_text(encoding="utf-8"))
    key = ac.key_from_meta(meta, PASS)
    im = Image.open(io.BytesIO(ac.decrypt(key, (repo / "art" / "10.bin").read_bytes())))
    assert im.format == "WEBP" and im.width == 200 and im.height == 200


def test_small_image_not_enlarged(repo):
    class Small(Net):
        def image(self, pw):
            return jpeg(100)

    run(repo, Small(), limit=1)
    meta = json.loads((repo / "art" / "meta.json").read_text(encoding="utf-8"))
    key = ac.key_from_meta(meta, PASS)
    im = Image.open(io.BytesIO(ac.decrypt(key, (repo / "art" / "10.bin").read_bytes())))
    assert im.width == 100


def test_load_passphrase(tmp_path):
    assert ba.load_passphrase(tmp_path, {"YGO_ART_PASSPHRASE": "e"}) == "e"
    (tmp_path / ".env").write_text("A=1\nYGO_ART_PASSPHRASE= from file \n", encoding="utf-8")
    assert ba.load_passphrase(tmp_path, {}) == "from file"
    assert ba.load_passphrase(tmp_path, {"YGO_ART_PASSPHRASE": ""}) == "from file"
    (tmp_path / ".env").write_text("A=1\n", encoding="utf-8")
    with pytest.raises(SystemExit):
        ba.load_passphrase(tmp_path, {})


# 発売前のカード。型番 NEWP-JP001.. の仮の番号は、YGOPRODeck では 101403001.. のように頭＋下3桁になる
def pre(cid, number, kind="effect", level=4, sub=""):
    return {"cid": cid, "name": f"p{cid}", "ruby": "", "kind": kind, "level": level, "sub": sub, "set": "NEW PACK", "number": number}


def ypd_card(pid, frame="effect", level=4, race="Dragon", konami_id=None, linkval=None):
    c = {"id": pid, "frameType": frame, "race": race, "misc_info": [{"konami_id": konami_id} if konami_id else {}]}
    if level is not None and frame not in ("spell", "trap", "link"):
        c["level"] = level
    if linkval is not None:
        c["linkval"] = linkval
    return c


PRE = [
    pre(-1000001, "NEWP-JP001"),
    pre(-1000002, "NEWP-JP002", kind="spell", level=0, sub="quickplay"),
    pre(-1000003, "NEWP-JP003", kind="link", level=2),
    pre(-1000004, "NEWP-JP004", level=7),  # 仮の番号のカードはレベル4なので結び付けない
    pre(-1000005, "NEWP-JP005"),  # ペンデュラム
    pre(-1000006, "NEWP-JP006"),  # YGOPRODeck に無い
]
YPD_PRE = [
    ypd_card(101403001),
    ypd_card(101403002, frame="spell", race="Quick-Play"),
    ypd_card(101403003, frame="link", level=None, linkval=2),
    ypd_card(101403004, level=4),
    ypd_card(101403005, frame="effect_pendulum"),
    # 別の商品の仮の番号。下3桁は同じだが種類が合わないので選ばれない
    ypd_card(100460001, frame="trap", race="Normal"),
    ypd_card(100460002, frame="xyz", level=4),
    # 発売済み（公式のカードIDがある）のカードは対象にしない
    ypd_card(12345001, konami_id=999),
]


def test_match_prerelease_by_set_prefix_and_signature():
    assert ba.match_prerelease(PRE, YPD_PRE) == {-1000001: 101403001, -1000002: 101403002, -1000003: 101403003}


def test_match_prerelease_ignores_cards_without_number():
    assert ba.match_prerelease([{**PRE[0], "number": ""}], YPD_PRE) == {}


def full_card(w=480, h=700):
    """カード全体の画像。絵の枠の中を赤、外を灰色にする。"""
    im = Image.new("RGB", (w, h), (128, 128, 128))
    l, t, r, b = ba.ART_BOX
    im.paste((220, 20, 20), (round(w * l), round(h * t), round(w * r), round(h * b)))
    buf = io.BytesIO()
    im.save(buf, "JPEG", quality=95)
    return buf.getvalue()


class PreNet:
    def __init__(self, missing=()):
        self.calls = []
        self.missing = set(missing)

    def ypd(self):
        return {"data": YPD_PRE}

    def image(self, pid):
        self.calls.append(pid)
        if pid in self.missing:
            raise ba.ImageNotFound(pid)
        return full_card()


def write_pre(repo, cards):
    (repo / "data" / "prerelease.json").write_text(json.dumps({"updated": "2026-10-28", "cards": cards}), encoding="utf-8")


def run_pre(repo, net, passphrase=PASS):
    return ba.build_prerelease_art(repo, passphrase, net.ypd, net.image, iterations=IT, sleep=lambda s: None)


def test_prerelease_art_cropped_encrypted_and_indexed(repo):
    run(repo, Net())
    write_pre(repo, PRE)
    net = PreNet()
    stats = run_pre(repo, net)
    assert stats["new"] == 3
    assert sorted(net.calls) == [101403001, 101403002, 101403003]
    assert index(repo) == [-1000003, -1000002, -1000001, 10, 20, 30]
    key = ac.key_from_meta(json.loads((repo / "art" / "meta.json").read_text(encoding="utf-8")), PASS)
    im = Image.open(io.BytesIO(ac.decrypt(key, (repo / "art" / "-1000001.bin").read_bytes()))).convert("RGB")
    assert im.width == 200
    # 絵の枠だけを切り出すので、四隅も赤い
    for x, y in [(3, 3), (im.width - 4, 3), (3, im.height - 4), (im.width - 4, im.height - 4)]:
        r, g, b = im.getpixel((x, y))
        assert r > 180 and g < 70, (x, y, im.getpixel((x, y)))


def test_prerelease_art_not_fetched_again(repo):
    write_pre(repo, PRE)
    run_pre(repo, PreNet())
    net = PreNet()
    assert run_pre(repo, net)["new"] == 0
    assert net.calls == []


def test_prerelease_art_removed_when_no_longer_prerelease(repo):
    run(repo, Net())
    write_pre(repo, PRE)
    run_pre(repo, PreNet())
    write_pre(repo, PRE[1:])
    stats = run_pre(repo, PreNet())
    assert stats["removed"] == 1
    assert -1000001 not in index(repo) and 10 in index(repo)
    assert not (repo / "art" / "-1000001.bin").exists()


def test_prerelease_art_404_skipped(repo):
    write_pre(repo, PRE)
    stats = run_pre(repo, PreNet(missing={101403002}))
    assert stats["no_image"] == 1 and -1000002 not in index(repo)


def test_prerelease_art_wrong_passphrase_writes_nothing(repo):
    run(repo, Net())
    write_pre(repo, PRE)
    with pytest.raises(SystemExit):
        run_pre(repo, PreNet(), passphrase="wrong")
    assert -1000001 not in index(repo)


class FallbackNet(Net):
    """1020 と 1030 は絵だけの画像が無い。1030 はペンデュラム。"""

    def __init__(self):
        super().__init__(missing={1020, 1030})
        self.full_calls = []

    def ypd(self):
        data = [dict(c) for c in YPD["data"]]
        data[2]["frameType"] = "effect_pendulum"
        return {"data": data}

    def full(self, pw):
        self.full_calls.append(pw)
        return full_card()


def test_絵だけの画像が無ければカード全体から切り出す_ペンデュラムは除く(repo):
    net = FallbackNet()
    stats = ba.build_art(repo, PASS, net.ypd, net.image, iterations=IT, sleep=lambda s: None, fetch_full=net.full)
    assert net.full_calls == [1020]
    assert index(repo) == [10, 20]
    assert stats["new"] == 2 and stats["no_image"] == 1
    assert (repo / ".cache" / "art" / "full-1020.jpg").exists()
    key = ac.key_from_meta(json.loads((repo / "art" / "meta.json").read_text(encoding="utf-8")), PASS)
    im = Image.open(io.BytesIO(ac.decrypt(key, (repo / "art" / "20.bin").read_bytes()))).convert("RGB")
    r, g, b = im.getpixel((3, 3))
    assert r > 180 and g < 70


def test_カード全体の画像も無ければ数えて飛ばす(repo):
    net = FallbackNet()

    def none(pw):
        raise ba.ImageNotFound(pw)

    stats = ba.build_art(repo, PASS, net.ypd, net.image, iterations=IT, sleep=lambda s: None, fetch_full=none)
    assert index(repo) == [10] and stats["no_image"] == 2
