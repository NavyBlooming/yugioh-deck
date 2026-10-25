import io
import json
import zipfile
from pathlib import Path

import pytest

import build_cards as bc

FIX = Path(__file__).resolve().parents[1] / "fixtures"
CDB = json.loads((FIX / "ygocdb_cards.json").read_text(encoding="utf-8"))
YPD = json.loads((FIX / "ypd_cardinfo.json").read_text(encoding="utf-8"))
HTML = (FIX / "forbidden_limited.html").read_text(encoding="utf-8")
LIMITS = {4095: 0, 4023: 1, 12950: 2}


@pytest.mark.parametrize(
    "t,frame,group",
    [
        (0x11, "normal", "normal"),
        (0x21, "effect", "effect"),
        (0x81, "ritual", "effect"),
        (0x61, "fusion", "fusion"),
        (0x2021, "synchro", "synchro"),
        (0x800021, "xyz", "xyz"),
        (0x4000021, "link", "link"),
        (0x1000011, "normal_pendulum", "normal"),
        (0x1000021, "effect_pendulum", "effect"),
        (0x40002, "spell", "spell"),
        (0x20004, "trap", "trap"),
        (0x4011, None, None),
    ],
)
def test_frame_from_bits(t, frame, group):
    assert bc.frame_from_bits(t) == frame
    if frame:
        assert bc.group_of(frame) == group


def test_xyz_pendulum():
    assert bc.frame_from_bits(0x1800021) == "xyz_pendulum"


def test_frame_from_ypd():
    assert bc.frame_from_ypd("effect") == "effect"
    assert bc.frame_from_ypd("token") is None
    assert bc.frame_from_ypd("skill") is None
    assert bc.frame_from_ypd("unknown") is None


def test_limit_of():
    assert bc.limit_of(4095, LIMITS) == 0
    assert bc.limit_of(4023, LIMITS) == 1
    assert bc.limit_of(12950, LIMITS) == 2
    assert bc.limit_of(1, LIMITS) == 3


def test_parse_limits():
    assert bc.parse_limits(HTML) == LIMITS


def test_parse_limits_broken():
    with pytest.raises(ValueError):
        bc.parse_limits(HTML.replace('id="list_limited"', ""))
    with pytest.raises(ValueError):
        bc.parse_limits(HTML.replace("cid=12950", "x"))


def test_build():
    rows, excluded = bc.build(CDB, YPD, LIMITS)
    by = {r[0]: r for r in rows}
    assert by[12950] == [12950, "灰流うらら", "はるうらら", "effect", "effect", 2]
    assert by[5925][4] == "effect"
    assert 5297 not in by and 19359 not in by and 99999 not in by
    reasons = {e["cid"]: e["reason"] for e in excluded}
    assert reasons[5297] == "no_type"
    assert reasons[19359] == "no_jp_name"
    assert 99999 not in reasons
    assert by[19092][5] == 3
    assert [r[0] for r in rows] == sorted(r[0] for r in rows)


def make_fetchers(ypd_text=None, md5="abc123\n", html=HTML):
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w") as z:
        z.writestr("cards.json", json.dumps(CDB, ensure_ascii=False))
    zbytes = buf.getvalue()
    ypd_text = ypd_text if ypd_text is not None else json.dumps(YPD, ensure_ascii=False)

    def fetch_text(url):
        if url.endswith(".md5"):
            return md5
        return html if "forbidden_limited" in url else ypd_text

    return fetch_text, lambda url: zbytes


def snap(d):
    return [((d / n).stat().st_mtime_ns, (d / n).read_bytes()) for n in ("cards.json", "meta.json")]


def test_main_writes_and_skips(tmp_path):
    ft, fb = make_fetchers()
    assert bc.main(ft, fb, tmp_path) == 0
    cards = json.loads((tmp_path / "cards.json").read_text(encoding="utf-8"))
    meta = json.loads((tmp_path / "meta.json").read_text(encoding="utf-8"))
    assert cards["version"] == 1 and meta["source_md5"] == "abc123"
    assert meta["count"] == len(cards["cards"])
    assert meta["limits_hash"] == bc.limits_hash(LIMITS)
    assert meta["limits_count"] == {"forbidden": 1, "limited": 1, "semi_limited": 1}
    before = snap(tmp_path)
    assert bc.main(ft, fb, tmp_path) == 0
    assert snap(tmp_path) == before


def test_main_regenerates_when_only_list_changes(tmp_path):
    ft, fb = make_fetchers()
    bc.main(ft, fb, tmp_path)
    html2 = HTML.replace(
        'id="list_semi_limited">', 'id="list_semi_limited"><a href="x?cid=19092">'
    )
    ft2, fb2 = make_fetchers(html=html2)
    bc.main(ft2, fb2, tmp_path)
    cards = json.loads((tmp_path / "cards.json").read_text(encoding="utf-8"))["cards"]
    assert {r[0]: r for r in cards}[19092][5] == 2


def test_main_broken_list_writes_nothing(tmp_path):
    ft, fb = make_fetchers(html=HTML.replace('id="list_limited"', ""))
    with pytest.raises(ValueError):
        bc.main(ft, fb, tmp_path)
    assert not (tmp_path / "cards.json").exists()


def test_main_broken_ypd_writes_nothing(tmp_path):
    ft, fb = make_fetchers(ypd_text='{"oops":[]}')
    with pytest.raises(KeyError):
        bc.main(ft, fb, tmp_path)
    assert not (tmp_path / "cards.json").exists()
    assert not (tmp_path / "meta.json").exists()
