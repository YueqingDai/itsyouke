const STORAGE_KEY = "palbreed.records.v1";

const state = {
  pals: [],
  byName: new Map(),
  bySlug: new Map(),
  records: loadRecords(),
  filter: "all",
};

const els = {
  form: document.querySelector("#breed-form"),
  parentA: document.querySelector("#parent-a"),
  parentB: document.querySelector("#parent-b"),
  child: document.querySelector("#child"),
  recordList: document.querySelector("#record-list"),
  search: document.querySelector("#search"),
  recordCount: document.querySelector("#record-count"),
  resultCount: document.querySelector("#result-count"),
  syncDialog: document.querySelector("#sync-dialog"),
  syncKey: document.querySelector("#sync-key"),
  syncMessage: document.querySelector("#sync-message"),
  toast: document.querySelector("#toast"),
};

function loadRecords() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.records));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[char]);
}

function palName(slug) {
  return state.bySlug.get(slug)?.name_zh || slug;
}

function normalize(value) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function normalizeSearch(value) {
  return normalize(value).replace(/^#/, "").replace(/[\s_-]+/g, "");
}

function resolvePal(input) {
  if (input.dataset.slug && state.bySlug.has(input.dataset.slug)) return state.bySlug.get(input.dataset.slug);
  const query = normalizeSearch(input.value);
  return state.pals.find(pal => [pal.name_zh, pal.slug, pal.dex_no].some(value => normalizeSearch(value) === query));
}

function validatePal(input, errorId) {
  const pal = resolvePal(input);
  const error = document.querySelector(`#${errorId}`);
  input.classList.toggle("is-invalid", !pal);
  error.textContent = pal ? "" : "请选择图鉴中的帕鲁";
  return pal;
}

function attachAutocomplete(input) {
  const list = document.createElement("div");
  list.className = "suggestions";
  list.id = `${input.id}-suggestions`;
  list.setAttribute("role", "listbox");
  input.setAttribute("aria-controls", list.id);
  input.setAttribute("aria-expanded", "false");
  input.insertAdjacentElement("afterend", list);
  let activeIndex = -1;
  let matches = [];

  const close = () => {
    list.innerHTML = "";
    list.classList.remove("is-open");
    input.setAttribute("aria-expanded", "false");
    activeIndex = -1;
  };

  const choose = pal => {
    input.value = pal.name_zh;
    input.dataset.slug = pal.slug;
    close();
    input.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const paintActive = () => {
    list.querySelectorAll(".suggestion").forEach((item, index) => {
      item.classList.toggle("is-active", index === activeIndex);
      item.setAttribute("aria-selected", index === activeIndex ? "true" : "false");
    });
  };

  const update = () => {
    delete input.dataset.slug;
    const query = normalizeSearch(input.value);
    matches = state.pals.filter(pal => {
      if (!query) return true;
      return [pal.dex_no, pal.name_zh, pal.slug].some(value => normalizeSearch(value).includes(query));
    }).slice(0, 10);
    activeIndex = -1;
    if (!matches.length) {
      list.innerHTML = '<div class="suggestion-empty">没有匹配的帕鲁</div>';
    } else {
      list.innerHTML = matches.map((pal, index) => `
        <button class="suggestion" type="button" role="option" data-index="${index}">
          <span class="suggestion__number">#${escapeHtml(pal.dex_no)}</span>
          <span class="suggestion__names"><strong>${escapeHtml(pal.name_zh)}</strong><small>${escapeHtml(pal.slug.replaceAll("_", " "))}</small></span>
        </button>
      `).join("");
    }
    list.classList.add("is-open");
    input.setAttribute("aria-expanded", "true");
  };

  input.addEventListener("focus", update);
  input.addEventListener("input", update);
  input.addEventListener("keydown", event => {
    if (!list.classList.contains("is-open") && event.key === "ArrowDown") update();
    if (event.key === "ArrowDown" && matches.length) {
      event.preventDefault();
      activeIndex = (activeIndex + 1) % matches.length;
      paintActive();
    } else if (event.key === "ArrowUp" && matches.length) {
      event.preventDefault();
      activeIndex = (activeIndex - 1 + matches.length) % matches.length;
      paintActive();
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      choose(matches[activeIndex]);
    } else if (event.key === "Escape") {
      close();
    }
  });
  list.addEventListener("pointerdown", event => {
    const option = event.target.closest("[data-index]");
    if (!option) return;
    event.preventDefault();
    choose(matches[Number(option.dataset.index)]);
  });
  input.addEventListener("blur", () => window.setTimeout(close, 120));
}

function clearValidation(input, errorId) {
  input.classList.remove("is-invalid");
  document.querySelector(`#${errorId}`).textContent = "";
}

function formatTime(iso) {
  try {
    return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function render() {
  const query = normalize(els.search.value);
  const records = state.records.filter(record => {
    const parents = `${palName(record.parentA)} ${palName(record.parentB)}`.toLocaleLowerCase("zh-CN");
    const child = palName(record.child).toLocaleLowerCase("zh-CN");
    if (!query) return true;
    if (state.filter === "parents") return parents.includes(query);
    if (state.filter === "child") return child.includes(query);
    return parents.includes(query) || child.includes(query);
  });

  els.recordCount.textContent = state.records.length;
  els.resultCount.textContent = new Set(state.records.map(record => record.child)).size;

  if (!records.length) {
    const hasRecords = state.records.length > 0;
    els.recordList.innerHTML = `<div class="empty-state"><b>${hasRecords ? "⌕" : "◇"}</b><h3>${hasRecords ? "没有匹配结果" : "还没有配种记录"}</h3><p>${hasRecords ? "换个名称或搜索范围试试。" : "从左侧选择两只亲代和出生帕鲁，保存第一条结果。"}</p></div>`;
    return;
  }

  els.recordList.innerHTML = records.map(record => `
    <article class="record-card">
      <div class="record-pal"><small>亲代 A</small><strong>${escapeHtml(palName(record.parentA))}</strong></div>
      <span class="record-symbol">＋</span>
      <div class="record-pal"><small>亲代 B</small><strong>${escapeHtml(palName(record.parentB))}</strong></div>
      <span class="record-symbol">→</span>
      <div class="record-pal record-pal--child"><small>出生</small><strong>${escapeHtml(palName(record.child))}</strong></div>
      <button class="delete-record" type="button" data-delete="${escapeHtml(record.id)}" aria-label="删除这条记录">×</button>
      <time class="record-time" datetime="${escapeHtml(record.createdAt)}">${escapeHtml(formatTime(record.createdAt))}</time>
    </article>
  `).join("");
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => els.toast.classList.remove("is-visible"), 2200);
}

function checksum(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function fromBase64Url(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0)));
}

function createSyncKey() {
  const payload = JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), records: state.records });
  return `PB1.${checksum(payload)}.${toBase64Url(payload)}`;
}

function importSyncKey(key) {
  const [prefix, expected, encoded] = key.trim().split(".");
  if (prefix !== "PB1" || !expected || !encoded) throw new Error("密钥格式不正确");
  const payloadText = fromBase64Url(encoded);
  if (checksum(payloadText) !== expected) throw new Error("密钥校验失败，可能复制不完整");
  const payload = JSON.parse(payloadText);
  if (payload.version !== 1 || !Array.isArray(payload.records)) throw new Error("不支持的密钥版本");
  const valid = payload.records.every(record => record && record.id && record.parentA && record.parentB && record.child && record.createdAt);
  if (!valid) throw new Error("密钥中的记录不完整");
  state.records = payload.records;
  persist();
  render();
}

els.form.addEventListener("submit", event => {
  event.preventDefault();
  const parentA = validatePal(els.parentA, "parent-a-error");
  const parentB = validatePal(els.parentB, "parent-b-error");
  const child = validatePal(els.child, "child-error");
  if (!parentA || !parentB || !child) return;
  state.records.unshift({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    parentA: parentA.slug,
    parentB: parentB.slug,
    child: child.slug,
    createdAt: new Date().toISOString(),
  });
  persist();
  els.form.reset();
  [els.parentA, els.parentB, els.child].forEach((input, index) => {
    delete input.dataset.slug;
    clearValidation(input, ["parent-a-error", "parent-b-error", "child-error"][index]);
  });
  render();
  showToast("配种结果已保存");
});

document.querySelector("#swap-parents").addEventListener("click", () => {
  [els.parentA.value, els.parentB.value] = [els.parentB.value, els.parentA.value];
  [els.parentA.dataset.slug, els.parentB.dataset.slug] = [els.parentB.dataset.slug || "", els.parentA.dataset.slug || ""];
});

els.search.addEventListener("input", render);
document.querySelectorAll(".filter").forEach(button => button.addEventListener("click", () => {
  state.filter = button.dataset.filter;
  document.querySelectorAll(".filter").forEach(item => item.classList.toggle("is-active", item === button));
  render();
}));

els.recordList.addEventListener("click", event => {
  const button = event.target.closest("[data-delete]");
  if (!button) return;
  state.records = state.records.filter(record => record.id !== button.dataset.delete);
  persist();
  render();
  showToast("记录已删除");
});

document.querySelector("#clear-records").addEventListener("click", () => {
  if (!state.records.length || !confirm("确定要清空全部配种记录吗？此操作无法撤销。")) return;
  state.records = [];
  persist();
  render();
  showToast("全部记录已清空");
});

document.querySelector("#open-sync").addEventListener("click", () => {
  els.syncKey.value = "";
  els.syncMessage.textContent = "";
  els.syncDialog.showModal();
});

document.querySelector("#generate-key").addEventListener("click", async () => {
  els.syncKey.value = createSyncKey();
  els.syncKey.select();
  try {
    await navigator.clipboard.writeText(els.syncKey.value);
    els.syncMessage.textContent = "密钥已生成并复制到剪贴板。";
  } catch {
    els.syncMessage.textContent = "密钥已生成，请手动复制。";
  }
});

document.querySelector("#import-key").addEventListener("click", () => {
  if (!els.syncKey.value.trim()) {
    els.syncMessage.textContent = "请先粘贴同步密钥。";
    return;
  }
  if (state.records.length && !confirm("导入会覆盖当前浏览器的配种记录，是否继续？")) return;
  try {
    importSyncKey(els.syncKey.value);
    els.syncMessage.textContent = "导入成功，记录已恢复。";
    showToast("同步密钥导入成功");
  } catch (error) {
    els.syncMessage.textContent = error.message || "密钥无法导入。";
  }
});

fetch("./pals.json", { cache: "no-store" })
  .then(response => {
    if (!response.ok) throw new Error("帕鲁数据加载失败");
    return response.json();
  })
  .then(data => {
    state.pals = data.pals || [];
    state.pals.forEach(pal => {
      state.byName.set(normalize(pal.name_zh), pal);
      state.bySlug.set(pal.slug, pal);
    });
    [els.parentA, els.parentB, els.child].forEach(attachAutocomplete);
    render();
  })
  .catch(error => {
    els.recordList.innerHTML = `<div class="empty-state"><b>!</b><h3>资料加载失败</h3><p>${escapeHtml(error.message)}</p></div>`;
  });
