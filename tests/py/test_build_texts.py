import gzip
import io
import json
import sqlite3
import zipfile

import pytest

import art_crypto as ac
import build_texts as bt

IT = 1000
PASS = "pw"


def cdb_bytes(tmp_path, rows):
    path = tmp_path / "src.cdb"
    db = sqlite3.connect(path)
    db.execute("create table texts (id integer primary key, name text, desc text)")
    db.executemany("insert into texts values (?, ?, ?)", rows)
    db.commit()
    db.close()
    return path.read_bytes()


def zip_bytes(entries):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("cards.json", json.dumps({str(i): e for i, e in enumerate(entries)}))
    return buf.getvalue()


YGOCDB = [
    {"cid": 10, "id": 1010, "jp_name": "十"},
    {"cid": 20, "id": 1020, "jp_name": "二十"},
    {"cid": 30, "id": 1030, "jp_name": "三十"},  # cdb に文が無い
    {"cid": 99, "id": 1099, "jp_name": "一覧に無い"},
]
CDB_ROWS = [(1010, "十", "①：手札から\r\n捨てる。"), (1020, "二十", "②：墓地へ送る。"), (1099, "x", "y"), (5555, "z", "w")]


@pytest.fixture
def repo(tmp_path):
    (tmp_path / "data").mkdir()
    cards = {"version": 2, "cards": [[cid, f"n{cid}", "", "normal", "normal", 3, 0, ""] for cid in (10, 20, 30)]}
    (tmp_path / "data" / "cards.json").write_text(json.dumps(cards), encoding="utf-8")
    (tmp_path / "art").mkdir()
    meta, _ = ac.new_meta(PASS, IT)
    (tmp_path / "art" / "meta.json").write_text(json.dumps(meta), encoding="utf-8")
    return tmp_path


def fetcher(tmp_path, rows=CDB_ROWS):
    cdb = cdb_bytes(tmp_path, rows)
    z = zip_bytes(YGOCDB)
    return lambda url: cdb if url == bt.CDB_URL else z


def read_texts(repo):
    meta = json.loads((repo / "art" / "meta.json").read_text(encoding="utf-8"))
    key = ac.key_from_meta(meta, PASS)
    blob = (repo / "art" / "texts.bin").read_bytes()
    return json.loads(gzip.decompress(ac.decrypt(key, blob)).decode("utf-8"))


def test_パスワードから公式のカードIDに結び付け_一覧に無いカードは除く(repo, tmp_path):
    r = bt.build_texts(repo, PASS, fetcher(tmp_path))
    assert r == {"status": "updated", "count": 2}
    assert read_texts(repo) == {"10": "①：手札から\n捨てる。", "20": "②：墓地へ送る。"}
    tm = json.loads((repo / "art" / "texts-meta.json").read_text(encoding="utf-8"))
    assert tm["count"] == 2 and len(tm["hash"]) == 64


def test_暗号化されていて合言葉が無いと読めない(repo, tmp_path):
    bt.build_texts(repo, PASS, fetcher(tmp_path))
    raw = (repo / "art" / "texts.bin").read_bytes()
    assert "手札".encode() not in raw and b"\x1f\x8b" != raw[:2]


def test_同じ内容なら書き換えない(repo, tmp_path):
    f = fetcher(tmp_path)
    bt.build_texts(repo, PASS, f)
    before = (repo / "art" / "texts.bin").read_bytes()
    assert bt.build_texts(repo, PASS, f) == {"status": "unchanged", "count": 2}
    assert (repo / "art" / "texts.bin").read_bytes() == before


def test_文が変われば書き直す(repo, tmp_path):
    bt.build_texts(repo, PASS, fetcher(tmp_path))
    rows = [(1010, "十", "変わった。"), (1020, "二十", "②：墓地へ送る。")]
    (tmp_path / "src.cdb").unlink()
    assert bt.build_texts(repo, PASS, fetcher(tmp_path, rows))["status"] == "updated"
    assert read_texts(repo)["10"] == "変わった。"


def test_合言葉が違えば止まる(repo, tmp_path):
    with pytest.raises(SystemExit):
        bt.build_texts(repo, "違う", fetcher(tmp_path))
    assert not (repo / "art" / "texts.bin").exists()


def put_prerelease(repo, cids, texts=None):
    (repo / "data" / "prerelease.json").write_text(json.dumps({"cards": [{"cid": c} for c in cids]}), encoding="utf-8")
    if texts is not None:
        (repo / ".cache").mkdir(exist_ok=True)
        (repo / ".cache" / "prerelease-texts.json").write_text(json.dumps(texts, ensure_ascii=False), encoding="utf-8")


def test_発売前のカードの文も入れる_今の発売前のカードだけ(repo, tmp_path):
    put_prerelease(repo, [-1000001, -1000002], {"-1000001": "Wikiの文。", "-1000003": "もう無いカード"})
    r = bt.build_texts(repo, PASS, fetcher(tmp_path))
    assert r == {"status": "updated", "count": 3}
    assert read_texts(repo)["-1000001"] == "Wikiの文。"
    assert "-1000003" not in read_texts(repo)


def test_発売前のカードの文が取れなかった週は前の文を残す(repo, tmp_path):
    put_prerelease(repo, [-1000001, -1000002], {"-1000001": "前の文。", "-1000002": "消える文。"})
    bt.build_texts(repo, PASS, fetcher(tmp_path))
    (repo / ".cache" / "prerelease-texts.json").unlink()
    put_prerelease(repo, [-1000001])
    (tmp_path / "src.cdb").unlink()
    assert bt.build_texts(repo, PASS, fetcher(tmp_path))["count"] == 3
    t = read_texts(repo)
    assert t["-1000001"] == "前の文。" and "-1000002" not in t
