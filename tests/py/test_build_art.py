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
