// Песни – SPA: list + viewer
// Hash routing: '' = list, '#5' = song number 5

const STORAGE_THEME = 'pesni-theme'; // legacy, used только для миграции
const STORAGE_CHORDS = 'pesni-chords';
const STORAGE_FONT_SIZE = 'pesni-font-size';
const STORAGE_STYLE = 'pesni-style';
const STORAGE_PROJECTOR_OPEN = 'pesni-projector-open';

const PROJECTOR_CHANNEL = 'pesni-projector';
const IS_PROJECTOR = new URLSearchParams(location.search).has('projector');

const PRESETS = {
  'classic-dark': {
    name: 'Классика тёмная',
    bg: '#0F1B2D', text: '#F0EBE0', accent: '#D4A843', chord: '#5B8CA8',
    font: 'Montserrat',
  },
  'classic-light': {
    name: 'Классика светлая',
    bg: '#FAFAF7', text: '#1A1F2E', accent: '#B8901F', chord: '#2B6B8C',
    font: 'Montserrat',
  },
  'projector': {
    name: 'Проектор контраст',
    bg: '#000000', text: '#FFFFFF', accent: '#FFD700', chord: '#F0A500',
    font: 'Montserrat',
  },
  'sepia': {
    name: 'Сепия',
    bg: '#F4EBD0', text: '#3E2F1C', accent: '#8B2E2E', chord: '#7B6640',
    font: 'Lora',
  },
  'mono': {
    name: 'Монохром',
    bg: '#EEEEEE', text: '#1A1A1A', accent: '#555555', chord: '#777777',
    font: 'Inter',
  },
  'night': {
    name: 'Ночной минимализм',
    bg: '#15161A', text: '#E8E8E8', accent: '#9A9A9A', chord: '#7A7A7A',
    font: 'Inter',
  },
};
const PRESET_ORDER = ['classic-dark', 'classic-light', 'projector', 'sepia', 'mono', 'night'];
const DEFAULT_PRESET = 'classic-dark';

const FONT_SIZE_DEFAULT = 40;
const FONT_SIZE_MIN = 14;
const FONT_SIZE_MAX = 160;
const FONT_SIZE_STEP = 4;

const state = {
  songs: [],
  byNumber: new Map(),
  currentSong: null,
  currentBlockIdx: 0,
  search: '',
  style: null,
  projectorOpen: false,
  projectorWindow: null,
};

let projectorChannel = null; // BroadcastChannel

// ============ DOM ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const els = {
  listView: $('#list-view'),
  songView: $('#song-view'),
  search: $('#search'),
  searchCount: $('#search-count'),
  songsList: $('#songs-list'),
  chordsToggle: $('#chords-toggle'),
  songNumber: $('#song-number'),
  songTitle: $('#song-title'),
  songKey: $('#song-key'),
  blockLabel: $('#block-label'),
  blockContent: $('#block-content'),
  blockCounter: $('#block-counter'),
  prevBtn: $('#prev-block'),
  nextBtn: $('#next-block'),
  fontDecrease: $('#font-decrease'),
  fontIncrease: $('#font-increase'),
  settingsToggle: $('#settings-toggle'),
  settingsModal: $('#settings-modal'),
  presetGrid: $('#preset-grid'),
  settingFont: $('#setting-font'),
  settingBg: $('#setting-bg'),
  settingText: $('#setting-text'),
  settingAccent: $('#setting-accent'),
  settingChord: $('#setting-chord'),
  settingsReset: $('#settings-reset'),
  nextBlockHint: $('#next-block-hint'),
  presenterSearch: $('#presenter-search'),
  presenterSongsList: $('#presenter-songs-list'),
  presenterBlocksList: $('#presenter-blocks-list'),
};

// ============ STYLE (presets + overrides) ============
function hexToRgba(hex, alpha) {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function isDarkBg(hex) {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return true;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 128;
}

function resolveStyle(style) {
  const preset = PRESETS[style.preset] || PRESETS[DEFAULT_PRESET];
  const ov = style.overrides || {};
  return {
    bg: ov.bg || preset.bg,
    text: ov.text || preset.text,
    accent: ov.accent || preset.accent,
    chord: ov.chord || preset.chord,
    font: ov.font || preset.font,
  };
}

function applyStyle(style) {
  const r = resolveStyle(style);
  const root = document.documentElement.style;
  root.setProperty('--bg', r.bg);
  root.setProperty('--text', r.text);
  root.setProperty('--accent', r.accent);
  root.setProperty('--chord', r.chord);
  root.setProperty('--font-body', `"${r.font}", Helvetica, sans-serif`);

  // Derived overlays — подбираем исходя из яркости фона.
  const dark = isDarkBg(r.bg);
  root.setProperty('--bg-elevated', dark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)');
  root.setProperty('--bg-input',    dark ? 'rgba(255,255,255,0.07)' : '#FFFFFF');
  root.setProperty('--text-muted',  hexToRgba(r.text, 0.55));
  root.setProperty('--line',        dark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.10)');
  root.setProperty('--shadow',      dark ? 'rgba(0,0,0,0.45)'       : 'rgba(0,0,0,0.12)');

  state.style = style;
  localStorage.setItem(STORAGE_STYLE, JSON.stringify(style));
  syncSettingsUI();
  broadcast({ type: 'style', style });
}

function loadStyle() {
  try {
    const raw = localStorage.getItem(STORAGE_STYLE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && parsed.preset) return parsed;
    }
  } catch (_) { /* fall through to migration */ }

  // Migration from old pesni-theme (light/dark) — runs once.
  const legacy = localStorage.getItem(STORAGE_THEME);
  if (legacy === 'light') return { preset: 'classic-light', overrides: {} };
  return { preset: DEFAULT_PRESET, overrides: {} };
}

function setPreset(name) {
  if (!PRESETS[name]) return;
  applyStyle({ preset: name, overrides: {} });
}

function setOverride(key, value) {
  const current = state.style || { preset: DEFAULT_PRESET, overrides: {} };
  const next = { preset: current.preset, overrides: { ...(current.overrides || {}) } };
  if (value == null || value === '') {
    delete next.overrides[key];
  } else {
    next.overrides[key] = value;
  }
  applyStyle(next);
}

function resetOverrides() {
  const current = state.style || { preset: DEFAULT_PRESET, overrides: {} };
  applyStyle({ preset: current.preset, overrides: {} });
}

// ============ SETTINGS MODAL ============
function renderPresetGrid() {
  els.presetGrid.innerHTML = PRESET_ORDER.map((key) => {
    const p = PRESETS[key];
    return `
      <button type="button" class="preset-card" data-preset="${key}">
        <div class="preset-swatches">
          <span style="background:${p.bg}"></span>
          <span style="background:${p.text}"></span>
          <span style="background:${p.accent}"></span>
          <span style="background:${p.chord}"></span>
        </div>
        <span class="preset-name">${escapeHtml(p.name)}</span>
      </button>
    `;
  }).join('');

  els.presetGrid.querySelectorAll('.preset-card').forEach((btn) => {
    btn.addEventListener('click', () => setPreset(btn.dataset.preset));
  });
}

function syncSettingsUI() {
  if (!state.style) return;
  const r = resolveStyle(state.style);
  // Highlight active preset card
  if (els.presetGrid) {
    els.presetGrid.querySelectorAll('.preset-card').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.preset === state.style.preset);
    });
  }
  if (els.settingFont)   els.settingFont.value   = r.font;
  if (els.settingBg)     els.settingBg.value     = r.bg;
  if (els.settingText)   els.settingText.value   = r.text;
  if (els.settingAccent) els.settingAccent.value = r.accent;
  if (els.settingChord)  els.settingChord.value  = r.chord;
}

function openSettings() {
  els.settingsModal.classList.remove('hidden');
  els.settingsModal.setAttribute('aria-hidden', 'false');
  syncSettingsUI();
}

function closeSettings() {
  els.settingsModal.classList.add('hidden');
  els.settingsModal.setAttribute('aria-hidden', 'true');
}

// ============ PROJECTOR (presenter side) ============
function broadcast(msg) {
  if (projectorChannel && !IS_PROJECTOR) projectorChannel.postMessage(msg);
}

function sendFullState() {
  broadcast({
    type: 'state',
    song: state.currentSong ? state.currentSong.number : null,
    block: state.currentBlockIdx,
    chords: !els.blockContent.classList.contains('no-chords'),
    style: state.style,
    fontSize: getFontSize(),
  });
}

function setProjectorOpen(open) {
  state.projectorOpen = open;
  if (open) {
    localStorage.setItem(STORAGE_PROJECTOR_OPEN, '1');
  } else {
    localStorage.removeItem(STORAGE_PROJECTOR_OPEN);
    state.projectorWindow = null;
  }
  document.body.classList.toggle('presenter-active', open && !IS_PROJECTOR);
  $$('.projector-btn').forEach((btn) => {
    btn.classList.toggle('active', open);
    btn.title = open ? 'Проектор открыт — клик, чтобы закрыть' : 'Открыть окно проектора';
  });
  updateNextBlockHint();
  renderPresenterSongsList();
  renderPresenterBlocksList();
}

function updateNextBlockHint() {
  if (!els.nextBlockHint) return;
  const song = state.currentSong;
  const next = song && song.blocks[state.currentBlockIdx + 1];
  const show = state.projectorOpen && next;
  els.nextBlockHint.classList.toggle('hidden', !show);
  if (show) {
    const label = next.label || '';
    els.nextBlockHint.textContent = label ? `· Далее: ${label}` : '· Далее';
  }
}

function renderPresenterSongsList() {
  if (!els.presenterSongsList || !state.projectorOpen) return;
  const query = (state.search || '').trim();
  const filtered = query ? state.songs.filter((s) => songMatchesSearch(s, query)) : state.songs;
  const currentNum = state.currentSong ? state.currentSong.number : null;

  if (filtered.length === 0) {
    els.presenterSongsList.innerHTML = '<li class="empty-state">Ничего не найдено</li>';
    return;
  }
  els.presenterSongsList.innerHTML = filtered
    .map((s) => `
      <a class="song-row ${s.number === currentNum ? 'active' : ''}" href="#${s.number}">
        <span class="num">${s.number}</span>
        <span class="title">${escapeHtml(s.title)}</span>
        ${s.key ? `<span class="key">${escapeHtml(s.key)}</span>` : ''}
      </a>
    `)
    .join('');
}

function renderPresenterBlocksList() {
  if (!els.presenterBlocksList || !state.projectorOpen) return;
  const song = state.currentSong;
  if (!song) {
    els.presenterBlocksList.innerHTML = '<li class="empty-state">Выберите песню</li>';
    return;
  }
  const total = song.blocks.length;
  els.presenterBlocksList.innerHTML = song.blocks
    .map((b, i) => {
      const previewLines = b.lines
        .slice(0, 6)
        .map(([chord, text]) => {
          const c = chord && chord.trim() ? `<span class="pc">${escapeHtml(chord)}</span>` : '';
          return `${c}<span class="pl">${escapeHtml(text)}</span>`;
        })
        .join('');
      return `
        <li class="${i === state.currentBlockIdx ? 'active' : ''}" data-idx="${i}">
          <div class="block-preview-header">
            <span class="block-preview-label">${escapeHtml(b.label || '…')}</span>
            <span class="block-preview-num">${i + 1} / ${total}</span>
          </div>
          <div class="block-preview-body">${previewLines}</div>
        </li>
      `;
    })
    .join('');

  els.presenterBlocksList.querySelectorAll('li[data-idx]').forEach((li) => {
    li.addEventListener('click', () => {
      const idx = parseInt(li.dataset.idx, 10);
      if (!isNaN(idx) && state.currentSong) {
        state.currentBlockIdx = idx;
        renderBlock();
      }
    });
  });

  // Автоскролл активной карточки в видимую область
  const active = els.presenterBlocksList.querySelector('li.active');
  if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

function openProjector() {
  const url = location.pathname + '?projector=1';
  const win = window.open(url, 'pesni-projector', 'popup,width=1280,height=800');
  if (!win) {
    alert('Браузер заблокировал всплывающее окно. Разрешите pop-ups для этого сайта и попробуй снова.');
    return;
  }
  state.projectorWindow = win;
  setProjectorOpen(true);
  closeSettings();
  // sendFullState() подтянется когда projector пришлёт 'ready'
}

function closeProjector() {
  if (state.projectorWindow && !state.projectorWindow.closed) {
    state.projectorWindow.close();
  }
  setProjectorOpen(false);
}

function initPresenterChannel() {
  projectorChannel = new BroadcastChannel(PROJECTOR_CHANNEL);
  projectorChannel.onmessage = (event) => {
    const msg = event.data || {};
    if (msg.type === 'ready') {
      setProjectorOpen(true);
      sendFullState();
    } else if (msg.type === 'nav') {
      if (msg.dir === 'next') nextBlock();
      else if (msg.dir === 'prev') prevBlock();
    } else if (msg.type === 'closed') {
      setProjectorOpen(false);
    }
  };

  // «Hello» на случай, если projector уже открыт и пропустил свой ранний 'ready'
  // (race при reload presenter-а). Projector ответит свежим 'ready'.
  projectorChannel.postMessage({ type: 'hello' });

  // Heartbeat: если у нас есть ссылка на projectorWindow и он закрылся без
  // beforeunload (force-close, kill tab) — сбрасываем флаг.
  setInterval(() => {
    if (state.projectorOpen && state.projectorWindow && state.projectorWindow.closed) {
      setProjectorOpen(false);
    }
  }, 2000);

  // На случай, если presenter перезагрузился при уже открытом projector'е
  if (localStorage.getItem(STORAGE_PROJECTOR_OPEN) === '1') {
    setProjectorOpen(true);
    sendFullState();
  }
}

// ============ PROJECTOR (projector side) ============
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen();
  }
}

function initProjectorView() {
  document.body.classList.add('projector-mode');

  // Load songs data (нужно для рендера блока, когда придёт state)
  try {
    if (!window.SONGS_DATA) throw new Error('Файл data/songs.js не загружен');
    state.songs = window.SONGS_DATA;
    state.byNumber = new Map(state.songs.map((s) => [s.number, s]));
  } catch (e) {
    document.body.textContent = 'Ошибка загрузки: ' + e.message;
    return;
  }

  applyStyle(loadStyle());

  // Apply saved font size
  const savedSize = parseFloat(localStorage.getItem(STORAGE_FONT_SIZE));
  els.blockContent.style.fontSize = (isNaN(savedSize) ? FONT_SIZE_DEFAULT : savedSize) + 'px';

  // Show song-view with placeholder
  els.listView.classList.add('hidden');
  els.songView.classList.remove('hidden');
  els.blockLabel.textContent = '';
  els.blockLabel.style.display = 'none';
  els.blockContent.innerHTML = '<span class="projector-hint">Ожидание песни…</span>';

  // Channel: listen for state, announce readiness, announce close
  projectorChannel = new BroadcastChannel(PROJECTOR_CHANNEL);
  projectorChannel.onmessage = (event) => {
    const msg = event.data || {};
    if (msg.type === 'hello') {
      // Presenter подключился/перезагрузился — пересылаем 'ready', пусть пришлёт state.
      projectorChannel.postMessage({ type: 'ready' });
      return;
    }
    if (msg.type === 'state') {
      if (msg.style) applyStyle(msg.style);
      if (typeof msg.fontSize === 'number') els.blockContent.style.fontSize = msg.fontSize + 'px';
      els.blockContent.classList.toggle('no-chords', msg.chords === false);
      if (msg.song != null) {
        const song = state.byNumber.get(msg.song);
        if (song) {
          state.currentSong = song;
          state.currentBlockIdx = msg.block || 0;
          renderBlock();
        }
      } else {
        state.currentSong = null;
        els.blockLabel.textContent = '';
        els.blockLabel.style.display = 'none';
        els.blockContent.innerHTML = '<span class="projector-hint">Ожидание песни…</span>';
      }
    } else if (msg.type === 'song') {
      const song = state.byNumber.get(msg.number);
      if (song) {
        state.currentSong = song;
        state.currentBlockIdx = 0;
        renderBlock();
      }
    } else if (msg.type === 'block') {
      if (state.currentSong) {
        state.currentBlockIdx = msg.idx;
        renderBlock();
      }
    } else if (msg.type === 'chords') {
      els.blockContent.classList.toggle('no-chords', !msg.visible);
    } else if (msg.type === 'style') {
      applyStyle(msg.style);
    } else if (msg.type === 'fontSize') {
      els.blockContent.style.fontSize = msg.px + 'px';
    }
  };
  projectorChannel.postMessage({ type: 'ready' });
  window.addEventListener('beforeunload', () => {
    try { projectorChannel.postMessage({ type: 'closed' }); } catch (_) {}
  });

  // Keyboard: F fullscreen, arrows broadcast nav to presenter
  document.addEventListener('keydown', (e) => {
    const k = e.key;
    if (k === 'f' || k === 'F' || k === 'а' || k === 'А') {
      e.preventDefault();
      toggleFullscreen();
    } else if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') {
      e.preventDefault();
      projectorChannel.postMessage({ type: 'nav', dir: 'next' });
    } else if (k === 'ArrowLeft' || k === 'PageUp') {
      e.preventDefault();
      projectorChannel.postMessage({ type: 'nav', dir: 'prev' });
    }
  });
}

function applyChords(visible) {
  els.blockContent.classList.toggle('no-chords', !visible);
  els.chordsToggle.classList.toggle('active', visible);
  localStorage.setItem(STORAGE_CHORDS, visible ? '1' : '0');
  broadcast({ type: 'chords', visible });
}

function toggleChords() {
  const wasVisible = !els.blockContent.classList.contains('no-chords');
  applyChords(!wasVisible);
}

function applyFontSize(size) {
  const clamped = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, size));
  els.blockContent.style.fontSize = clamped + 'px';
  localStorage.setItem(STORAGE_FONT_SIZE, String(clamped));
  if (els.fontDecrease) els.fontDecrease.disabled = clamped <= FONT_SIZE_MIN;
  if (els.fontIncrease) els.fontIncrease.disabled = clamped >= FONT_SIZE_MAX;
  broadcast({ type: 'fontSize', px: clamped });
  return clamped;
}

function getFontSize() {
  return parseFloat(els.blockContent.style.fontSize) || FONT_SIZE_DEFAULT;
}

function changeFontSize(delta) {
  applyFontSize(getFontSize() + delta);
}

// ============ LIST VIEW ============
function normalizeForSearch(s) {
  return (s || '').toLowerCase().replace(/ё/g, 'е');
}

function songMatchesSearch(song, query) {
  if (!query) return true;
  const q = normalizeForSearch(query);
  if (String(song.number).includes(q)) return true;
  if (normalizeForSearch(song.title).includes(q)) return true;
  // search in text
  for (const block of song.blocks) {
    for (const [, text] of block.lines) {
      if (normalizeForSearch(text).includes(q)) return true;
    }
  }
  return false;
}

function renderList() {
  const query = state.search.trim();
  const filtered = query
    ? state.songs.filter((s) => songMatchesSearch(s, query))
    : state.songs;

  els.searchCount.textContent = query
    ? `${filtered.length} из ${state.songs.length}`
    : `${state.songs.length}`;

  if (filtered.length === 0) {
    els.songsList.innerHTML = '<li class="empty-state">Ничего не найдено</li>';
    return;
  }

  els.songsList.innerHTML = filtered
    .map(
      (s) => `
        <a class="song-row" href="#${s.number}">
          <span class="num">${s.number}</span>
          <span class="title">${escapeHtml(s.title)}</span>
          ${s.key ? `<span class="key">${escapeHtml(s.key)}</span>` : ''}
        </a>
      `
    )
    .join('');
  renderPresenterSongsList();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ============ SONG VIEW ============
function showSong(number) {
  const song = state.byNumber.get(number);
  if (!song) {
    location.hash = '';
    return;
  }
  state.currentSong = song;
  state.currentBlockIdx = 0;

  els.listView.classList.add('hidden');
  els.songView.classList.remove('hidden');

  els.songNumber.textContent = `№${song.number}`;
  els.songTitle.textContent = song.title;
  els.songKey.textContent = song.key || '';
  els.songKey.style.display = song.key ? '' : 'none';

  broadcast({ type: 'song', number: song.number });
  renderPresenterSongsList();
  renderPresenterBlocksList();
  renderBlock();
}

function showList() {
  state.currentSong = null;
  els.songView.classList.add('hidden');
  els.listView.classList.remove('hidden');
}

function renderBlock() {
  const song = state.currentSong;
  if (!song) return;
  const block = song.blocks[state.currentBlockIdx];
  if (!block) return;

  els.blockLabel.textContent = block.label || '';
  els.blockLabel.style.display = block.label ? '' : 'none';

  const html = block.lines
    .map(([chord, text]) => {
      const chordHtml = chord && chord.trim()
        ? `<span class="chord-line">${escapeHtml(chord)}</span>`
        : '';
      return `${chordHtml}<span class="line">${escapeHtml(text)}</span>`;
    })
    .join('');

  els.blockContent.innerHTML = html;
  els.blockCounter.textContent = `${state.currentBlockIdx + 1} / ${song.blocks.length}`;
  if (els.prevBtn) els.prevBtn.disabled = state.currentBlockIdx === 0;
  if (els.nextBtn) els.nextBtn.disabled = state.currentBlockIdx >= song.blocks.length - 1;
  updateNextBlockHint();
  renderPresenterBlocksList();
  broadcast({ type: 'block', idx: state.currentBlockIdx });
}

function nextBlock() {
  if (!state.currentSong) return;
  if (state.currentBlockIdx < state.currentSong.blocks.length - 1) {
    state.currentBlockIdx++;
    renderBlock();
  }
}

function prevBlock() {
  if (!state.currentSong) return;
  if (state.currentBlockIdx > 0) {
    state.currentBlockIdx--;
    renderBlock();
  }
}

// ============ ROUTING ============
function handleRoute() {
  const hash = location.hash.slice(1);
  const num = parseInt(hash, 10);
  if (hash && !isNaN(num)) {
    showSong(num);
  } else {
    showList();
  }
}

// ============ INIT ============
function init() {
  if (IS_PROJECTOR) {
    initProjectorView();
    return;
  }
  initPresenter();
}

function initPresenter() {
  // Projector channel first — тогда applyStyle/applyFontSize сразу транслируют
  // в случае, если projector уже открыт (пережил перезагрузку presenter'а).
  initPresenterChannel();

  // Style (presets + overrides) — до остального UI, чтобы шрифт применился до рендера
  renderPresetGrid();
  applyStyle(loadStyle());

  // Chords default visible
  const chordsSaved = localStorage.getItem(STORAGE_CHORDS);
  const chordsVisible = chordsSaved === null ? true : chordsSaved === '1';
  applyChords(chordsVisible);

  // Font size
  const savedSize = parseFloat(localStorage.getItem(STORAGE_FONT_SIZE));
  applyFontSize(isNaN(savedSize) ? FONT_SIZE_DEFAULT : savedSize);

  // Settings modal — кнопки в обеих шапках
  $$('[data-action="open-settings"], #settings-toggle').forEach((el) => {
    el.addEventListener('click', openSettings);
  });
  els.settingsModal.querySelectorAll('[data-action="close-settings"]').forEach((el) => {
    el.addEventListener('click', closeSettings);
  });
  els.settingFont.addEventListener('change', (e) => setOverride('font', e.target.value));
  els.settingBg.addEventListener('input', (e) => setOverride('bg', e.target.value));
  els.settingText.addEventListener('input', (e) => setOverride('text', e.target.value));
  els.settingAccent.addEventListener('input', (e) => setOverride('accent', e.target.value));
  els.settingChord.addEventListener('input', (e) => setOverride('chord', e.target.value));
  els.settingsReset.addEventListener('click', resetOverrides);

  // Projector toggle (кнопка в обеих шапках): клик по TV — открыть или закрыть
  $$('[data-action="toggle-projector"]').forEach((el) => {
    el.addEventListener('click', () => {
      if (state.projectorOpen) closeProjector();
      else openProjector();
    });
  });

  // Other listeners
  els.chordsToggle.addEventListener('click', toggleChords);
  els.fontDecrease.addEventListener('click', () => changeFontSize(-FONT_SIZE_STEP));
  els.fontIncrease.addEventListener('click', () => changeFontSize(FONT_SIZE_STEP));
  els.prevBtn.addEventListener('click', prevBlock);
  els.nextBtn.addEventListener('click', nextBlock);
  $('[data-action="back"]').addEventListener('click', () => {
    location.hash = '';
  });

  els.search.addEventListener('input', (e) => {
    state.search = e.target.value;
    if (els.presenterSearch && els.presenterSearch.value !== state.search) {
      els.presenterSearch.value = state.search;
    }
    renderList();
  });

  if (els.presenterSearch) {
    els.presenterSearch.addEventListener('input', (e) => {
      state.search = e.target.value;
      if (els.search.value !== state.search) els.search.value = state.search;
      renderList();
    });
  }

  document.addEventListener('keydown', (e) => {
    if (!els.settingsModal.classList.contains('hidden')) {
      if (e.key === 'Escape') { e.preventDefault(); closeSettings(); }
      return;
    }
    if (state.currentSong) {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        nextBlock();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        prevBlock();
      } else if (e.key === 'Escape') {
        location.hash = '';
      } else if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        changeFontSize(FONT_SIZE_STEP);
      } else if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        changeFontSize(-FONT_SIZE_STEP);
      }
    } else {
      if (e.key === '/' && document.activeElement !== els.search) {
        e.preventDefault();
        els.search.focus();
      }
    }
  });

  window.addEventListener('hashchange', handleRoute);

  // Load songs (from inline data/songs.js for file:// compatibility)
  try {
    if (!window.SONGS_DATA) throw new Error('Файл data/songs.js не загружен');
    state.songs = window.SONGS_DATA;
    state.byNumber = new Map(state.songs.map((s) => [s.number, s]));
    renderList();
    handleRoute();
  } catch (e) {
    els.songsList.innerHTML = `<li class="empty-state">Ошибка загрузки: ${escapeHtml(e.message)}</li>`;
  }
}

init();
