const suits = [
  { key: "spades", label: "\u9ed1\u6843", symbol: "\u2660", color: "black" },
  { key: "hearts", label: "\u7ea2\u6843", symbol: "\u2665", color: "red" },
  { key: "clubs", label: "\u6885\u82b1", symbol: "\u2663", color: "black" },
  { key: "diamonds", label: "\u65b9\u5757", symbol: "\u2666", color: "red" },
];

const ranks = [
  { key: "A", value: 1 },
  { key: "2", value: 2 },
  { key: "3", value: 3 },
  { key: "4", value: 4 },
  { key: "5", value: 5 },
  { key: "6", value: 6 },
  { key: "7", value: 7 },
  { key: "8", value: 8 },
  { key: "9", value: 9 },
  { key: "10", value: 10 },
  { key: "J", value: 11 },
  { key: "Q", value: 12 },
  { key: "K", value: 13 },
];

const sortLabels = {
  suit: "\u6309\u82b1\u8272\u6392\u5217",
  rank: "\u6309\u6570\u5b57\u6392\u5217",
  missing: "\u672a\u6536\u96c6\u7684\u4f18\u5148",
};

const cards = [
  ...suits.flatMap((suit, suitIndex) =>
    ranks.map((rank) => ({
      id: `${suit.key}-${rank.key}`,
      label: `${suit.label}${rank.key}`,
      rank: rank.key,
      rankValue: rank.value,
      suitIndex,
      suitLabel: suit.label,
      suitSymbol: suit.symbol,
      color: suit.color,
      isJoker: false,
    })),
  ),
  {
    id: "joker-small",
    label: "\u5c0f\u738b",
    rank: "\u5c0f\u738b",
    rankValue: 14,
    suitIndex: 4,
    suitLabel: "\u738b\u724c",
    suitSymbol: "J",
    color: "black",
    isJoker: true,
  },
  {
    id: "joker-big",
    label: "\u5927\u738b",
    rank: "\u5927\u738b",
    rankValue: 15,
    suitIndex: 4,
    suitLabel: "\u738b\u724c",
    suitSymbol: "J",
    color: "red",
    isJoker: true,
  },
];

const storageKey = "poker-card-collection-v1";
const syncPrefix = "PCT1-";
const keyLength = 14;
const cardsGrid = document.querySelector("#cardsGrid");
const sortMode = document.querySelector("#sortMode");
const collectedCount = document.querySelector("#collectedCount");
const progressPercent = document.querySelector("#progressPercent");
const progressRing = document.querySelector("#progressRing");
const remainingText = document.querySelector("#remainingText");
const deckTitle = document.querySelector("#deckTitle");
const markAll = document.querySelector("#markAll");
const clearAll = document.querySelector("#clearAll");
const syncKey = document.querySelector("#syncKey");
const exportKey = document.querySelector("#exportKey");
const copyKey = document.querySelector("#copyKey");
const importKey = document.querySelector("#importKey");
const syncStatus = document.querySelector("#syncStatus");

let collected = new Set(JSON.parse(localStorage.getItem(storageKey) || "[]"));

function save() {
  localStorage.setItem(storageKey, JSON.stringify([...collected]));
}

function orderedCards() {
  const list = [...cards];
  const mode = sortMode.value;

  if (mode === "rank") {
    return list.sort((a, b) => a.rankValue - b.rankValue || a.suitIndex - b.suitIndex);
  }

  if (mode === "missing") {
    return list.sort((a, b) => {
      const stateDiff = Number(collected.has(a.id)) - Number(collected.has(b.id));
      return stateDiff || a.suitIndex - b.suitIndex || a.rankValue - b.rankValue;
    });
  }

  return list.sort((a, b) => a.suitIndex - b.suitIndex || a.rankValue - b.rankValue);
}

function updateStats() {
  const count = collected.size;
  const percent = Math.round((count / cards.length) * 100);
  collectedCount.textContent = count;
  progressPercent.textContent = `${percent}%`;
  progressRing.style.setProperty("--progress", percent);
  remainingText.textContent = count === cards.length ? "\u6536\u96c6\u5b8c\u6210" : `\u8fd8\u5dee ${cards.length - count} \u5f20`;
  deckTitle.textContent = sortLabels[sortMode.value];
}

function collectionToKey() {
  let bits = 0n;

  cards.forEach((card, index) => {
    if (collected.has(card.id)) {
      bits |= 1n << BigInt(index);
    }
  });

  return `${syncPrefix}${bits.toString(16).toUpperCase().padStart(keyLength, "0")}`;
}

function keyToCollection(value) {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, "");
  const hex = normalized.startsWith(syncPrefix) ? normalized.slice(syncPrefix.length) : normalized;

  if (!/^[0-9A-F]{1,14}$/.test(hex)) {
    throw new Error("\u5bc6\u94a5\u683c\u5f0f\u4e0d\u5bf9");
  }

  const bits = BigInt(`0x${hex}`);
  const imported = new Set();

  cards.forEach((card, index) => {
    if ((bits & (1n << BigInt(index))) !== 0n) {
      imported.add(card.id);
    }
  });

  return imported;
}

function setSyncStatus(message, type = "") {
  syncStatus.textContent = message;
  syncStatus.className = `sync-status ${type}`.trim();
}

async function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  syncKey.focus();
  syncKey.select();
  document.execCommand("copy");
}

function render() {
  cardsGrid.innerHTML = "";

  for (const card of orderedCards()) {
    const isCollected = collected.has(card.id);
    const button = document.createElement("button");
    button.className = [
      "card",
      card.color === "red" ? "red" : "",
      card.isJoker ? "joker" : "",
      isCollected ? "owned" : "missing",
    ]
      .filter(Boolean)
      .join(" ");
    button.type = "button";
    button.setAttribute("aria-pressed", String(isCollected));
    button.setAttribute("aria-label", `${card.label}${isCollected ? "\uff0c\u5df2\u6536\u96c6" : "\uff0c\u672a\u6536\u96c6"}`);
    button.innerHTML = `
      <span class="corner">${card.suitLabel}</span>
      <span>
        <span class="rank">${card.rank}</span>
        <span class="suit">${card.suitSymbol}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      if (collected.has(card.id)) {
        collected.delete(card.id);
      } else {
        collected.add(card.id);
      }
      save();
      render();
    });
    cardsGrid.appendChild(button);
  }

  updateStats();
}

sortMode.addEventListener("change", render);

markAll.addEventListener("click", () => {
  collected = new Set(cards.map((card) => card.id));
  save();
  render();
  setSyncStatus("\u5df2\u5168\u9009\uff0c\u53ef\u4ee5\u5bfc\u51fa\u65b0\u5bc6\u94a5\u3002", "ok");
});

clearAll.addEventListener("click", () => {
  collected = new Set();
  save();
  render();
  setSyncStatus("\u5df2\u6e05\u7a7a\uff0c\u53ef\u4ee5\u5bfc\u51fa\u65b0\u5bc6\u94a5\u3002", "warn");
});

exportKey.addEventListener("click", () => {
  syncKey.value = collectionToKey();
  syncKey.select();
  setSyncStatus("\u5df2\u751f\u6210\u5bc6\u94a5\uff0c\u53ef\u4ee5\u590d\u5236\u5230\u65b0\u8bbe\u5907\u3002", "ok");
});

copyKey.addEventListener("click", async () => {
  if (!syncKey.value.trim()) {
    syncKey.value = collectionToKey();
  }

  try {
    await copyText(syncKey.value.trim());
    setSyncStatus("\u5bc6\u94a5\u5df2\u590d\u5236\u3002", "ok");
  } catch {
    setSyncStatus("\u590d\u5236\u5931\u8d25\uff0c\u8bf7\u624b\u52a8\u9009\u4e2d\u5bc6\u94a5\u590d\u5236\u3002", "warn");
  }
});

importKey.addEventListener("click", () => {
  try {
    collected = keyToCollection(syncKey.value);
    save();
    render();
    setSyncStatus(`\u5df2\u5bfc\u5165 ${collected.size} \u5f20\u724c\u7684\u8fdb\u5ea6\u3002`, "ok");
  } catch (error) {
    setSyncStatus(error.message || "\u5bfc\u5165\u5931\u8d25", "error");
  }
});

render();
