// Leonida Trophy Atlas — GTA VI trophy guide & tracker.
// Plain ES module, no dependencies. Runs fully offline: the only fetch is
// the app's own data/trophies.json. Progress and the spoiler setting live in
// localStorage; export/import move them as a file.
const STORAGE_KEY = 'leonida-trophy-atlas-v1';
const SPOILER_KEY = 'leonida-trophy-atlas-spoilers';
const DEMO_EARNED = [2, 3, 4, 8, 16, 20, 21, 35, 37, 42, 44, 53, 55];

const KIND_LABELS = {
  all: 'All kinds',
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  side: 'Side quests',
  crime: 'Crime',
  exploration: 'Exploration',
  money: 'Money',
  completion: 'Completion',
  online: 'Online',
};
const GRADE_LETTER = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };

const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sources = doc.sourceList;

let earned = loadEarned();
let spoilerOn = loadSpoiler();
let currentView = params.get('view') || 'checklist';
let kindFilter = params.get('kind') || 'all';
let gradeFilter = params.get('grade') || 'all';
let statusFilter = params.get('status') || 'all';
let searchText = '';
let selectedId = Number(params.get('trophy')) || null;
const demoMode = params.get('demo') === '13';
if (params.get('spoilers') === 'on') spoilerOn = true;
if (demoMode) earned = new Set(DEMO_EARNED.map((id) => trophyById(id).name));

const listEl = document.getElementById('trophyList');
const detailEl = document.getElementById('detail');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const listMeta = document.getElementById('listMeta');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('gradeFilter');
const statusSelect = document.getElementById('statusFilter');
const spoilerToggle = document.getElementById('spoilerToggle');

function loadEarned() {
  try {
    return new Set(JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

function loadSpoiler() {
  return localStorage.getItem(SPOILER_KEY) === '1';
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned]));
  document.getElementById('saveState').textContent =
    'Progress saved in this browser (localStorage) — ' + earned.size + ' of ' + trophies.length + ' earned.';
}

function saveSpoiler() {
  localStorage.setItem(SPOILER_KEY, spoilerOn ? '1' : '0');
}

function trophyById(id) {
  return trophies.find((t) => t.id === id) || null;
}

function isHiddenFromSpoilers(t) {
  return spoilerOn && t.hidden && !earned.has(t.name);
}

function visibleName(t) {
  return isHiddenFromSpoilers(t) ? 'Hidden trophy' : t.name;
}

function visibleDescription(t) {
  return isHiddenFromSpoilers(t) ? 'Hidden on PlayStation until earned.' : t.description;
}

function matchesFilters(t) {
  if (kindFilter === 'missable' && !t.missable) return false;
  if (kindFilter === 'online') return false;
  if (kindFilter !== 'all' && kindFilter !== 'missable' && !t.kind.includes(kindFilter)) return false;
  if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
  if (statusFilter === 'earned' && !earned.has(t.name)) return false;
  if (statusFilter === 'remaining' && earned.has(t.name)) return false;
  if (searchText) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
    if (!hay.includes(searchText)) return false;
  }
  return true;
}

function renderMasthead() {
  const counts = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophies) counts[t.grade] += 1;
  const hidden = trophies.filter((t) => t.hidden).length;
  document.getElementById('mastheadStats').innerHTML =
    '<span class="stat-chip"><b>' + trophies.length + '</b> trophies</span>' +
    '<span class="stat-chip"><b>1</b> platinum · <b>2</b> gold · <b>6</b> silver · <b>46</b> bronze</span>' +
    '<span class="stat-chip"><b>' + hidden + '</b> hidden</span>' +
    '<span class="stat-chip"><b>~200 h</b> · 4/10 · <b>0</b> online</span>';
}

function renderProgress() {
  const pct = Math.round((earned.size / trophies.length) * 100);
  progressFill.style.width = pct + '%';
  const byGrade = {};
  for (const t of trophies) if (earned.has(t.name)) byGrade[t.grade] = (byGrade[t.grade] || 0) + 1;
  progressText.textContent =
    earned.size + ' of ' + trophies.length + ' earned (' + pct + '%) — ' +
    'Platinum ' + (byGrade.platinum || 0) + '/1 · Gold ' + (byGrade.gold || 0) + '/2 · ' +
    'Silver ' + (byGrade.silver || 0) + '/6 · Bronze ' + (byGrade.bronze || 0) + '/46';
}

function renderKindChips() {
  const host = document.getElementById('kindChips');
  host.replaceChildren();
  for (const [key, label] of Object.entries(KIND_LABELS)) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip' + (kindFilter === key ? ' active' : '');
    btn.textContent = label;
    btn.addEventListener('click', () => {
      kindFilter = key;
      renderKindChips();
      renderList();
    });
    host.append(btn);
  }
}

function renderList() {
  const shown = trophies.filter(matchesFilters);
  listEl.replaceChildren();
  if (kindFilter === 'online') {
    const box = document.createElement('li');
    box.className = 'empty-state';
    box.textContent = 'No online trophies in GTA VI — all 55 are offline single-player, so the Platinum can never expire with a server.';
    listEl.append(box);
  } else if (shown.length === 0) {
    const box = document.createElement('li');
    box.className = 'empty-state';
    box.textContent = 'No trophies match these filters. Try clearing the search or choosing another kind.';
    listEl.append(box);
  }
  for (const t of shown) {
    const li = document.createElement('li');
    li.className = 'trophy-row' + (earned.has(t.name) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('click', (event) => event.stopPropagation());
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      saveEarned();
      renderProgress();
      renderList();
      renderDetail();
    });
    const disc = document.createElement('span');
    disc.className = 'grade-disc ' + t.grade;
    disc.textContent = GRADE_LETTER[t.grade];
    const body = document.createElement('div');
    body.className = 'trophy-body';
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = visibleName(t);
    if (t.hidden && !earned.has(t.name)) {
      const mark = document.createElement('span');
      mark.className = 'hidden-mark';
      mark.textContent = ' · hidden on PSN';
      name.append(mark);
    }
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = visibleDescription(t);
    const tags = document.createElement('div');
    tags.className = 'trophy-tags';
    if (t.missable) tags.append(makeTag('⚠ MISSABLE', 'missable'));
    if (t.target) tags.append(makeTag(t.target, 'target'));
    for (const k of t.kind) tags.append(makeTag(KIND_LABELS[k] || k, ''));
    if (t.chapter) tags.append(makeTag(t.chapter, ''));
    body.append(name, desc, tags);
    const gradeLabel = document.createElement('div');
    gradeLabel.className = 'trophy-grade-label';
    gradeLabel.textContent = t.grade;
    li.append(box, disc, body, gradeLabel);
    li.addEventListener('click', () => {
      selectedId = t.id;
      renderList();
      renderDetail();
    });
    listEl.append(li);
  }
  const earnedShown = shown.filter((t) => earned.has(t.name)).length;
  listMeta.textContent = shown.length + ' trophies shown · ' + earnedShown + ' earned in this view';
  if (selectedId && !shown.some((t) => t.id === selectedId)) renderDetail();
}

function makeTag(text, extraClass) {
  const span = document.createElement('span');
  span.className = 'tag' + (extraClass ? ' ' + extraClass : '');
  span.textContent = text;
  return span;
}

function renderDetail() {
  detailEl.replaceChildren();
  const t = selectedId ? trophyById(selectedId) : null;
  if (!t) {
    const p = document.createElement('p');
    p.className = 'empty';
    p.textContent = 'Select a trophy on the left to read its guide, steps and sources here.';
    detailEl.append(p);
    return;
  }
  const heading = document.createElement('h3');
  heading.textContent = visibleName(t);
  if (t.missable) {
    const badge = document.createElement('span');
    badge.className = 'badge missable-badge';
    badge.textContent = 'Possibly missable';
    heading.prepend(badge);
  }
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = '“' + visibleDescription(t) + '” — ' + t.grade + ' trophy' + (t.hidden ? ', hidden on PSN' : '') + '.';
  const guide = document.createElement('p');
  guide.className = 'guide-text';
  guide.textContent = t.guide;
  detailEl.append(heading, official, guide);
  if (t.steps && t.steps.length) {
    const h = document.createElement('h4');
    h.textContent = 'Steps';
    const ol = document.createElement('ol');
    for (const s of t.steps) {
      const li = document.createElement('li');
      li.textContent = s;
      ol.append(li);
    }
    detailEl.append(h, ol);
  }
  const sh = document.createElement('h4');
  sh.textContent = 'Sources';
  const src = document.createElement('p');
  src.className = 'sources';
  for (const key of t.sources) {
    const s = sources[key];
    if (!s) continue;
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.label;
    src.append(a);
  }
  detailEl.append(sh, src);
}

function renderSourcesView() {
  const host = document.getElementById('sourceList');
  if (!host || host.children.length) return;
  for (const s of Object.values(sources)) {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = s.url;
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = s.label;
    li.append(a);
    host.append(li);
  }
}

function switchView(name) {
  currentView = name;
  for (const btn of document.querySelectorAll('.view-tab')) {
    btn.classList.toggle('active', btn.dataset.view === name);
  }
  for (const section of document.querySelectorAll('.view')) {
    section.hidden = section.id !== 'view-' + name;
  }
  if (name === 'sources') renderSourcesView();
}

function exportProgress() {
  const payload = JSON.stringify({ app: 'leonida-trophy-atlas', earned: [...earned] }, null, 2);
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([payload], { type: 'application/json' }));
  a.download = 'gta6-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = new Set(trophies.map((t) => t.name));
    const incoming = (data.earned || []).filter((n) => names.has(n));
    earned = new Set(incoming);
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
    document.getElementById('saveState').textContent = 'Imported ' + incoming.length + ' earned trophies.';
  } catch {
    document.getElementById('saveState').textContent = 'Import failed: that file is not a progress export from this guide.';
  }
}

document.querySelectorAll('.view-tab').forEach((btn) => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
searchInput.addEventListener('input', () => {
  searchText = searchInput.value.trim().toLowerCase();
  renderList();
});
gradeSelect.addEventListener('change', () => {
  gradeFilter = gradeSelect.value;
  renderList();
});
statusSelect.addEventListener('change', () => {
  statusFilter = statusSelect.value;
  renderList();
});
spoilerToggle.addEventListener('change', () => {
  spoilerOn = spoilerToggle.checked;
  saveSpoiler();
  renderList();
  renderDetail();
});
document.getElementById('exportBtn').addEventListener('click', exportProgress);
document.getElementById('importFile').addEventListener('change', (event) => {
  importProgress(event.target.files[0]);
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (window.confirm('Clear all earned trophies and reset the tracker?')) {
    earned = new Set();
    saveEarned();
    renderProgress();
    renderList();
    renderDetail();
  }
});

const VALID_VIEWS = ['checklist', 'roadmap', 'missables', 'sources'];
gradeSelect.value = gradeFilter;
statusSelect.value = statusFilter;
spoilerToggle.checked = spoilerOn;
renderMasthead();
renderProgress();
renderKindChips();
renderList();
renderDetail();
switchView(VALID_VIEWS.includes(currentView) ? currentView : 'checklist');
if (!demoMode) saveEarned();
