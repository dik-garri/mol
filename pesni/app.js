// Песни – SPA: list + viewer
// Hash routing: '' = list, '#5' = song number 5

const STORAGE_THEME = 'pesni-theme';
const STORAGE_CHORDS = 'pesni-chords';
const STORAGE_FONT_SIZE = 'pesni-font-size';

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
};

// ============ DOM ============
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const els = {
  listView: $('#list-view'),
  songView: $('#song-view'),
  search: $('#search'),
  searchCount: $('#search-count'),
  songsList: $('#songs-list'),
  themeToggleList: $('#theme-toggle-list'),
  themeToggleSong: $('#theme-toggle-song'),
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
};

// ============ THEME / SETTINGS ============
function applyTheme(theme) {
  document.body.dataset.theme = theme;
  localStorage.setItem(STORAGE_THEME, theme);
  const icon = theme === 'dark' ? 'fa-moon' : 'fa-sun';
  $$('.icon-btn[id^="theme-toggle"] i').forEach((i) => {
    i.className = `fa-solid ${icon}`;
  });
}

function toggleTheme() {
  const next = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(next);
}

function applyChords(visible) {
  els.blockContent.classList.toggle('no-chords', !visible);
  els.chordsToggle.classList.toggle('active', visible);
  localStorage.setItem(STORAGE_CHORDS, visible ? '1' : '0');
}

function toggleChords() {
  const wasVisible = !els.blockContent.classList.contains('no-chords');
  applyChords(!wasVisible);
}

function applyFontSize(size) {
  const clamped = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, size));
  els.blockContent.style.fontSize = clamped + 'px';
  localStorage.setItem(STORAGE_FONT_SIZE, String(clamped));
  els.fontDecrease.disabled = clamped <= FONT_SIZE_MIN;
  els.fontIncrease.disabled = clamped >= FONT_SIZE_MAX;
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
  els.prevBtn.disabled = state.currentBlockIdx === 0;
  els.nextBtn.disabled = state.currentBlockIdx >= song.blocks.length - 1;
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
  // Theme
  const savedTheme = localStorage.getItem(STORAGE_THEME) || 'dark';
  applyTheme(savedTheme);

  // Chords default visible
  const chordsSaved = localStorage.getItem(STORAGE_CHORDS);
  const chordsVisible = chordsSaved === null ? true : chordsSaved === '1';
  applyChords(chordsVisible);

  // Font size
  const savedSize = parseFloat(localStorage.getItem(STORAGE_FONT_SIZE));
  applyFontSize(isNaN(savedSize) ? FONT_SIZE_DEFAULT : savedSize);

  // Listeners
  els.themeToggleList.addEventListener('click', toggleTheme);
  els.themeToggleSong.addEventListener('click', toggleTheme);
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
    renderList();
  });

  document.addEventListener('keydown', (e) => {
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
