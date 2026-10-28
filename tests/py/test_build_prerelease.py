import json

import pytest

import build_prerelease as bp

LIST = """
<div id="body">
<h2 id="series13">第13期</h2>
<a href="/?NEW%20PACK">NEW PACK</a>
<a href="/?OLD%20PACK">OLD PACK</a>
<a href="#DB_13">デッキビルドパック</a>
<a href="https://www.yugioh-card.com/japan/">公式</a>
<h2 id="series12">第12期</h2>
<a href="/?PACK%2012">PACK 12</a>
</div>
"""

NEW_PACK = """<title>遊戯王カードWiki - NEW PACK</title>
<div id="body" class="body-prose"><p>2026年10月31日発売予定。</p>
<ul class="list1"><li>NEWP-JP001 <a href="/?%A1%D4A%A1%D5" title="《新しい竜》 (9d)">《新しい竜》</a> Rare</li>
<li>NEWP-JP002 <a href="/?%A1%D4B%A1%D5" title="《既にある》 (4d)">《既にある》</a></li>
<li>NEWP-JP003 <a href="/?%A1%D4C%A1%D5" title="《新しい罠》 (4d)">《新しい罠》</a></li>
<li>NEWP-JP004 <a href="/?%A1%D4D%A1%D5" title="《新しい融合》 (4d)">《新しい融合》</a></li></ul></div>"""

OLD_PACK = """<div id="body" class="body-prose"><p>2025年4月26日発売。</p>
<ul class="list1"><li>OLDP-JP001 <a href="/?%A1%D4E%A1%D5" title="《昔のカード》 (9d)">《昔のカード》</a></li></ul></div>"""

CARD_A = """<div id="body" class="body-prose"><h2 id="content_1_0">《<ruby><rb>新</rb><rp>(</rp><rt>あたら</rt><rp>)</rp></ruby>しい<ruby><rb>竜</rb><rp>(</rp><rt>りゅう</rt><rp>)</rp></ruby>/New Dragon》  <a class="anchor_super" href="#top">&dagger;</a></h2>
<pre>効果モンスター
星５/闇属性/悪魔族/攻2000/守1400
効果の文。</pre></div>"""

CARD_C = """<div id="body"><h2>《<ruby><rb>新</rb><rp>(</rp><rt>あたら</rt><rp>)</rp></ruby>しい<ruby><rb>罠</rb><rp>(</rp><rt>わな</rt><rp>)</rp></ruby>/New Trap》</h2>
<pre>カウンター罠
効果の文。</pre></div>"""

CARD_D = """<div id="body"><h2>《ニュー・フュージョン/New Fusion》</h2>
<pre>融合・効果モンスター
星８/光属性/ドラゴン族/攻3000/守2500
効果の文。</pre></div>"""

PAGES = {
    bp.LIST_URL: LIST,
    "https://yugioh-wiki.net/?NEW%20PACK": NEW_PACK,
    "https://yugioh-wiki.net/?OLD%20PACK": OLD_PACK,
    "https://yugioh-wiki.net/?%A1%D4A%A1%D5": CARD_A,
    "https://yugioh-wiki.net/?%A1%D4C%A1%D5": CARD_C,
    "https://yugioh-wiki.net/?%A1%D4D%A1%D5": CARD_D,
}


@pytest.fixture
def repo(tmp_path):
    (tmp_path / "data").mkdir()
    cards = {"version": 2, "cards": [[1, "既にある", "すでにある", "effect", "effect", 3, 4, ""]]}
    (tmp_path / "data" / "cards.json").write_text(json.dumps(cards, ensure_ascii=False), encoding="utf-8")
    return tmp_path


class Net:
    def __init__(self, pages):
        self.pages = pages
        self.calls = []

    def __call__(self, url):
        self.calls.append(url)
        return self.pages[url]


def test_カードのページから読み_種類_レベルを読む():
    assert bp.parse_card(CARD_A) == {"ruby": "あたらしいりゅう", "kind": "effect", "level": 5, "sub": ""}
    assert bp.parse_card(CARD_C) == {"ruby": "あたらしいわな", "kind": "trap", "level": 0, "sub": "counter"}
    assert bp.parse_card(CARD_D) == {"ruby": "ニュー・フュージョン", "kind": "fusion", "level": 8, "sub": ""}


@pytest.mark.parametrize(
    "line,second,kind,level,sub",
    [
        ("通常モンスター", "星４/地属性", "normal", 4, ""),
        ("儀式・効果モンスター", "星８/光属性", "ritual", 8, ""),
        ("シンクロ・チューナー・効果モンスター", "星７/風属性", "synchro", 7, ""),
        ("エクシーズ・効果モンスター", "ランク４/闇属性", "xyz", 4, ""),
        ("リンク・効果モンスター", "LINK－３/炎属性", "link", 3, ""),
        ("リンク・効果モンスター", "リンク４/光属性/天使族/攻2500", "link", 4, ""),
        ("ペンデュラム・効果モンスター", "星４/水属性", "effect", 4, ""),
        ("速攻魔法", "", "spell", 0, "quickplay"),
        ("フィールド魔法", "", "spell", 0, "field"),
        ("通常罠", "", "trap", 0, "normal"),
    ],
)
def test_種類とレベルの読み分け(line, second, kind, level, sub):
    html = f"<div id=\"body\"><h2>《テスト/Test》</h2><pre>{line}\n{second}\n文。</pre></div>"
    r = bp.parse_card(html)
    assert (r["kind"], r["level"], r["sub"]) == (kind, level, sub)


def test_読めないページは_None():
    assert bp.parse_card("<div id=\"body\"><h2>《テスト》</h2><p>準備中</p></div>") is None


def test_発売予定の商品の_カードデータに無いカードだけ載せる(repo):
    net = Net(PAGES)
    r = bp.build_prerelease(repo, net, sleep=lambda s: None)
    assert r == {"status": "updated", "count": 3}
    data = json.loads((repo / "data" / "prerelease.json").read_text(encoding="utf-8"))
    by = {c["name"]: c for c in data["cards"]}
    # カード名は商品のページの表記、読みはカードのページのふりがな（無ければ見出しの名前）
    assert set(by) == {"新しい竜", "新しい罠", "新しい融合"}
    assert by["新しい融合"]["ruby"] == "ニュー・フュージョン"
    assert by["新しい竜"] == {"cid": by["新しい竜"]["cid"], "name": "新しい竜", "ruby": "あたらしいりゅう", "kind": "effect", "level": 5, "sub": "", "set": "NEW PACK", "number": "NEWP-JP001"}
    assert all(c["cid"] <= -1000000 for c in data["cards"])
    assert by["新しい融合"]["number"] == "NEWP-JP004"
    # カードデータにあるカードのページと、発売済みの商品のカードのページは読まない
    assert "https://yugioh-wiki.net/?%A1%D4B%A1%D5" not in net.calls
    assert "https://yugioh-wiki.net/?%A1%D4E%A1%D5" not in net.calls
    assert "https://yugioh-wiki.net/?PACK%2012" not in net.calls


def test_ページの間は2秒あける(repo):
    waits = []
    bp.build_prerelease(repo, Net(PAGES), sleep=waits.append)
    assert waits and all(w == 2 for w in waits)


def test_中身が同じなら書き換えない(repo):
    bp.build_prerelease(repo, Net(PAGES), sleep=lambda s: None)
    before = (repo / "data" / "prerelease.json").read_bytes()
    r = bp.build_prerelease(repo, Net(PAGES), sleep=lambda s: None, today="2099-01-01")
    assert r["status"] == "unchanged"
    assert (repo / "data" / "prerelease.json").read_bytes() == before


def test_取得に失敗したら書かずに例外(repo):
    def fail(url):
        if "NEW" in url:
            raise OSError("down")
        return PAGES[url]

    with pytest.raises(OSError):
        bp.build_prerelease(repo, fail, sleep=lambda s: None)
    assert not (repo / "data" / "prerelease.json").exists()


def test_接続が切れたら間を空けて2回まで読み直す():
    calls, waits = [], []

    def flaky(url):
        calls.append(url)
        if len(calls) < 3:
            raise ConnectionError("closed")
        return "ok"

    assert bp.with_retry(flaky, sleep=waits.append)("u") == "ok"
    assert len(calls) == 3 and waits == [10, 30]


def test_3回とも切れたら例外():
    def down(url):
        raise ConnectionError("closed")

    with pytest.raises(ConnectionError):
        bp.with_retry(down, sleep=lambda s: None)("u")
