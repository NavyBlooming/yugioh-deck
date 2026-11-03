// カード詳細の上半分（名前・絵・情報・効果テキスト）。デッキ編集と一人回しで使う
import { monsterInfo } from "../core/cards.js";
import { artState, cardText } from "./art.js";
import { h } from "./dom.js";
import { tileEl } from "./tile.js";

const LIMIT_TEXT = ["禁止カード", "制限カード", "準制限カード", "制限なし"];
const FRAME_TEXT = { normal: "通常モンスター", effect: "効果モンスター", ritual: "儀式モンスター", fusion: "融合モンスター", synchro: "シンクロモンスター", xyz: "エクシーズモンスター", link: "リンクモンスター" };
const SUB_TEXT = { normal: "通常", quickplay: "速攻", continuous: "永続", equip: "装備", field: "フィールド", ritual: "儀式", counter: "カウンター" };
const frameBase = (card) => card.frame.replace(/_pendulum$/, "");
function kindText(card) {
  if (card.group === "spell") return `${SUB_TEXT[card.sub] ?? ""}魔法`;
  if (card.group === "trap") return `${SUB_TEXT[card.sub] ?? ""}罠`;
  return (FRAME_TEXT[frameBase(card)] ?? "モンスター") + (card.frame.endsWith("_pendulum") ? "・ペンデュラム" : "");
}
function statText(card) {
  if (card.group === "spell" || card.group === "trap") return "";
  if (card.group === "xyz") return `ランク ${card.level}`;
  if (card.group === "link") return `LINK-${card.level}`;
  return `★ ${card.level}`;
}

// 属性・種族・攻守・リンクマーカー・スケールの行。番号が無いカードは何も出さない
const ARROWS = { 左上: "◤", 上: "▲", 右上: "◥", 左: "◀", 右: "▶", 左下: "◣", 下: "▼", 右下: "◢" };
function monsterRows(card) {
  const m = monsterInfo(card);
  if (!m) return [];
  const rows = [
    h("div", { class: "cd-attr" }, [m.attr, m.race, ...m.traits].filter(Boolean).join("／")),
    h("div", { class: "cd-atk" }, m.def === null ? `ATK ${m.atk}` : `ATK ${m.atk} / DEF ${m.def}`, m.scale !== null ? `　スケール ${m.scale}` : ""),
  ];
  if (m.markers) {
    const cells = ["左上", "上", "右上", "左", "", "右", "左下", "下", "右下"];
    rows.push(h("div", { class: "cd-markers", title: `リンクマーカー: ${m.markers.join("・")}` },
      ...cells.map((c) => h("span", { class: m.markers.includes(c) ? "on" : "" }, ARROWS[c] ?? "")),
    ));
  }
  return rows;
}

// 名前と×の帯・絵と情報・効果テキストの3つを返す。close は×を押したとき
export function cardInfo(card, close) {
  const text = h("div", { class: "cd-text", id: "cd-text" }, "効果テキストを読み込んでいます…");
  const noText = card.custom ? (card.set ? `発売前のカードです（${card.set}）。効果テキストはありません。` : "発売前のカードです。効果テキストはありません。") : "効果テキストがありません。";
  // 自分で登録したカード（-1, -2, …）には効果テキストが無い。Wiki から取得したカードは遊戯王カードWiki の文がある
  if (card.custom && card.cid > -1000000) text.textContent = noText;
  else if (artState() !== "on") text.textContent = "合言葉を入れると、効果テキストが表示されます。";
  else cardText(card.cid).then((t) => (text.textContent = t ?? noText));
  const big = tileEl(card, {});
  big.classList.add("cd-tile");
  return [
    h("div", { class: `cd-head f-${frameBase(card)}` },
      h("div", { class: "cd-title" },
        h("div", { class: "cd-ruby" }, card.ruby !== card.name ? card.ruby : ""),
        h("div", { class: "cd-name" }, card.name),
      ),
      h("button", { class: "cd-close", type: "button", "aria-label": "閉じる", onclick: close }, "×"),
    ),
    h("div", { class: "cd-top" },
      big,
      h("div", { class: "cd-info" },
        h("div", { class: "cd-stat" }, statText(card)),
        h("div", { class: "cd-kind" }, `【${kindText(card)}】`),
        ...monsterRows(card),
        h("div", { class: `cd-limit lim-${card.limit}` }, LIMIT_TEXT[card.limit] ?? ""),
        card.date ? h("div", { class: "cd-date" }, `OCG 発売日 ${card.date}`) : null,
      ),
    ),
    text,
  ];
}
