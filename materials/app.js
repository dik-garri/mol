// Материалы: список + читалка. Vanilla JS, hash-routing.

const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => Array.from(root.querySelectorAll(s));

const state = {
  data: { sermons: [], luki: [], draft: [], archive: [] },
  tab: "sermons",
  subtab: "all",
  query: "",
  activeTags: new Set(),
};

const SUBTAB_KEYS = ["all", "series-nt", "series-ot", "attributes", "feasts", "seminars", "themes"];

const monthNames = [
  "", "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

function formatDate(d) {
  if (!d) return "";
  const m = d.match(/^(\d{4})-(\d{1,2})$/);
  if (!m) return d;
  const month = monthNames[parseInt(m[2], 10)] || "";
  return `${month} ${m[1]}`;
}

function normalize(s) {
  return (s || "").toLowerCase().replace(/ё/g, "е").trim();
}

function matchesQuery(item, q) {
  if (!q) return true;
  const haystack = [item.title, item.subtitle, ...(item.tags || [])].map(normalize).join(" ");
  return haystack.includes(q);
}

function matchesActiveTags(item) {
  if (state.activeTags.size === 0) return true;
  const itemTags = new Set((item.tags || []).map(normalize));
  for (const t of state.activeTags) {
    if (!itemTags.has(normalize(t))) return false;
  }
  return true;
}

function matchesSubtab(item) {
  if (state.tab !== "archive" || state.subtab === "all") return true;
  return item.category === state.subtab;
}

function renderSubtabs() {
  const box = $("#subtabs");
  if (state.tab !== "archive") {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  const items = state.data.archive || [];
  const counts = { all: items.length };
  for (const it of items) {
    const c = it.category || "themes";
    counts[c] = (counts[c] || 0) + 1;
  }
  for (const key of SUBTAB_KEYS) {
    const el = document.getElementById(`sub-${key}`);
    if (el) el.textContent = counts[key] || 0;
  }
  $$(".subtab").forEach((b) => b.classList.toggle("active", b.dataset.subtab === state.subtab));
}

function renderList() {
  const list = $("#materials-list");
  const items = state.data[state.tab] || [];
  const q = normalize(state.query);
  const filtered = items.filter((it) => matchesQuery(it, q) && matchesActiveTags(it) && matchesSubtab(it));

  list.innerHTML = "";
  $("#empty-state").hidden = filtered.length > 0;

  for (const item of filtered) {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "card";
    a.href = `#/${item.type}/${encodeURIComponent(item.slug)}`;

    const top = document.createElement("div");
    top.className = "card-top";
    const title = document.createElement("div");
    title.className = "card-title";
    title.textContent = item.title;
    top.appendChild(title);
    if (item.date) {
      const date = document.createElement("div");
      date.className = "card-date";
      date.textContent = formatDate(item.date);
      top.appendChild(date);
    }
    a.appendChild(top);

    if (item.subtitle) {
      const sub = document.createElement("div");
      sub.className = "card-subtitle";
      sub.textContent = item.subtitle;
      a.appendChild(sub);
    }

    if (item.tags && item.tags.length) {
      const tags = document.createElement("div");
      tags.className = "card-tags";
      for (const t of item.tags) {
        const tag = document.createElement("span");
        tag.className = "tag";
        tag.textContent = t;
        if (state.activeTags.has(t)) tag.classList.add("match");
        tag.addEventListener("click", (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleTag(t);
        });
        tags.appendChild(tag);
      }
      a.appendChild(tags);
    }

    li.appendChild(a);
    list.appendChild(li);
  }

  // Counts (отражают тек. фильтр поиска, но не вкладку и не теги — для понимания «сколько вообще»)
  $("#count-sermons").textContent = state.data.sermons.length;
  $("#count-luki").textContent = state.data.luki.length;
  $("#count-draft").textContent = (state.data.draft || []).length;
  $("#count-archive").textContent = (state.data.archive || []).length;

  renderSubtabs();

  renderActiveTags();
}

function renderActiveTags() {
  const box = $("#active-tags");
  box.innerHTML = "";
  for (const t of state.activeTags) {
    const chip = document.createElement("span");
    chip.className = "active-tag";
    chip.textContent = t;
    chip.title = "Убрать фильтр";
    chip.addEventListener("click", () => toggleTag(t));
    box.appendChild(chip);
  }
}

function toggleTag(t) {
  if (state.activeTags.has(t)) state.activeTags.delete(t);
  else state.activeTags.add(t);
  renderList();
}

function setTab(tab) {
  state.tab = tab;
  // Reset subtab when leaving archive
  if (tab !== "archive") state.subtab = "all";
  $$(".tab").forEach((el) => el.classList.toggle("active", el.dataset.tab === tab));
  renderList();
}

function setSubtab(sub) {
  state.subtab = sub;
  renderList();
}

function parseFrontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { meta: {}, body: text };
  const body = text.slice(m[0].length);
  const meta = {};
  for (const line of m[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (val.startsWith("[") && val.endsWith("]")) {
      meta[key] = val.slice(1, -1).split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
    } else {
      meta[key] = val.replace(/^["']|["']$/g, "");
    }
  }
  return { meta, body };
}

const TYPE_TO_KEY = { sermon: "sermons", luki: "luki", draft: "draft", archive: "archive" };

async function openReader(type, slug) {
  // find item
  const items = state.data[TYPE_TO_KEY[type]] || [];
  const item = items.find((it) => it.slug === slug);
  if (!item) {
    showList();
    return;
  }
  const res = await fetch(`../${item.path}`);
  if (!res.ok) {
    $("#reader-content").innerHTML = `<p style="color: var(--muted);">Не удалось загрузить материал.</p>`;
    showReader();
    return;
  }
  const text = await res.text();
  const { body } = parseFrontmatter(text);

  $("#reader-date").textContent = item.date ? formatDate(item.date) : "";
  const tagsBox = $("#reader-tags");
  tagsBox.innerHTML = "";
  for (const t of item.tags || []) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = t;
    tag.addEventListener("click", () => {
      state.activeTags.clear();
      state.activeTags.add(t);
      state.tab = TYPE_TO_KEY[type] || "sermons";
      location.hash = "";
    });
    tagsBox.appendChild(tag);
  }
  $("#reader-content").innerHTML = marked.parse(body);

  showReader();
  document.title = `${item.title} – Молодёжка`;
}

function scrollTop() {
  // double-call covers different timing quirks (hidden→visible, async fetch)
  window.scrollTo(0, 0);
  requestAnimationFrame(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  });
}

function showList() {
  $("#list-view").hidden = false;
  $("#reader-view").hidden = true;
  document.title = "Материалы – Молодёжка";
  scrollTop();
}

function showReader() {
  $("#list-view").hidden = true;
  $("#reader-view").hidden = false;
  scrollTop();
}

function route() {
  const hash = location.hash.slice(1); // strip '#'
  const m = hash.match(/^\/(sermon|luki|draft|archive)\/(.+)$/);
  if (m) {
    openReader(m[1], decodeURIComponent(m[2]));
  } else {
    showList();
  }
}

function applyTheme(theme) {
  if (theme === "light") document.documentElement.setAttribute("data-theme", "light");
  else document.documentElement.removeAttribute("data-theme");
}

function initTheme() {
  const saved = localStorage.getItem("materials-theme");
  const theme = saved || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
  applyTheme(theme);
  $("#theme-toggle").addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
    const next = current === "light" ? "dark" : "light";
    applyTheme(next);
    localStorage.setItem("materials-theme", next);
  });
}

function init() {
  initTheme();
  // Search
  const searchInput = $("#search");
  const searchWrap = searchInput.parentElement;
  searchInput.addEventListener("input", () => {
    state.query = searchInput.value;
    searchWrap.classList.toggle("has-text", !!state.query);
    renderList();
  });
  $("#clear-search").addEventListener("click", () => {
    searchInput.value = "";
    state.query = "";
    searchWrap.classList.remove("has-text");
    renderList();
    searchInput.focus();
  });

  // Tabs
  $$(".tab").forEach((btn) => {
    btn.addEventListener("click", () => setTab(btn.dataset.tab));
  });

  // Subtabs (archive only)
  $$(".subtab").forEach((btn) => {
    btn.addEventListener("click", () => setSubtab(btn.dataset.subtab));
  });

  // Back to list
  $("#back-to-list").addEventListener("click", (e) => {
    e.preventDefault();
    location.hash = "";
  });

  // Hash routing
  window.addEventListener("hashchange", route);

  // Initial render
  setTab(state.tab);
  route();
}

(async function load() {
  try {
    const res = await fetch("data.json");
    state.data = await res.json();
  } catch (e) {
    console.error("Failed to load data.json", e);
  }
  init();
})();
