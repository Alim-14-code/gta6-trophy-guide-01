// Leonida Trophy Atlas: checklist + tracker + cited guides for GTA VI's 55 PS5 trophies.
// Data lives in data/trophies.json; progress lives in localStorage only; nothing is fetched at run time.
const KEY_EARNED = 'lta-earned-v1';
const KEY_COUNTERS = 'lta-counters-v1';
const KEY_SPOILER = 'lta-spoiler-v1';
const params = new URLSearchParams(location.search);
const doc = await (await fetch('data/trophies.json')).json();
const trophies = doc.trophies;
const sources = doc.sources;
const disputes = Object.fromEntries(doc.disputes.map((d) => [d.id, d]));

const earned = new Set(JSON.parse(localStorage.getItem(KEY_EARNED) ?? '[]'));
const counters = JSON.parse(localStorage.getItem(KEY_COUNTERS) ?? '{}');
let spoiler = (localStorage.getItem(KEY_SPOILER) ?? '') === '1' || params.get('spoiler') === '1';
let kind = params.get('kind') ?? 'all';
let grade = params.get('grade') ?? 'all';
let query = '';
let tab = params.get('tab') ?? 'checklist';
let selectedId = Number(params.get('t') ?? 17);

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const save = () => {
  localStorage.setItem(KEY_EARNED, JSON.stringify([...earned]));
  localStorage.setItem(KEY_COUNTERS, JSON.stringify(counters));
  localStorage.setItem(KEY_SPOILER, spoiler ? '1' : '0');
};
const byId = (id) => trophies.find((t) => t.id === id);
const isHidden = (t) => t.hidden && !earned.has(t.name);
const shownName = (t) => (spoiler && isHidden(t) ? 'Hidden trophy' : t.name);
const shownDesc = (t) => (spoiler && isHidden(t) ? 'Hidden until earned — spoiler-safe mode is on.' : t.description);
const counterOf = (t) => (t.count ? Math.min(t.count.target, Math.max(0, Number(counters[t.id] ?? 0))) : 0);
const counterStep = (t) => (t.count.target >= 10000 ? 1000 : t.count.target >= 100 ? 10 : 1);
const money = (n) => n.toLocaleString('en-US');

function sourceChip(key) {
  const s = sources[key];
  if (!s) return el('span', 'src', key);
  const chip = el('span', 'src');
  if (s.url) {
    const a = document.createElement('a');
    a.href = s.url; a.target = '_blank'; a.rel = 'noopener';
    a.textContent = 'Source: ' + s.name;
    chip.append(a);
  } else {
    chip.textContent = 'Source: ' + s.name;
  }
  return chip;
}

function renderAudit() {
  let claims = 0; let backed = 0;
  const citedBy = {};
  for (const t of trophies) for (const s of t.steps) {
    claims++;
    if (s.s.length >= 2) backed++;
    for (const k of s.s) citedBy[k] = (citedBy[k] ?? 0) + 1;
  }
  const line = $('auditline');
  line.replaceChildren();
  line.append(
    document.createTextNode(' '),
    el('span', 'num', String(claims)), document.createTextNode(' claims cited  ·  '),
    el('span', 'num', String(backed)), document.createTextNode(' backed by 2+ sources  ·  '),
    el('span', 'num', String(Object.keys(sources).length)), document.createTextNode(' sources named  ·  '),
    el('span', 'num', String(doc.disputes.length)), document.createTextNode(' disagreements shown both ways  ·  '),
    el('span', 'num', String(trophies.filter((t) => t.count).length)), document.createTextNode(' count trackers'),
  );
  $('audit').dataset.citedBy = JSON.stringify(citedBy);
}

function renderProgress() {
  $('bigcount').textContent = `${earned.size} / ${trophies.length}`;
  const pct = Math.round((earned.size / trophies.length) * 100);
  $('progressfill').style.width = pct + '%';
  const stagesDone = STAGES.filter((s) => trophies.filter((t) => t.stage === s.n).every((t) => earned.has(t.name))).length;
  $('progresstext').textContent = `${earned.size} earned · ${pct}% to platinum · ${stagesDone} of 6 roadmap stages done`;
}

const STAGES = [
  { n: 1, title: 'First steps in Leonida', note: 'Chapters 1–2, the opening mission, and the one missable warning. Do the Chapter 1 meditation before the chapter ends.' },
  { n: 2, title: 'Story: Chapters 3–4 + stranger strands', note: 'Chapter trophies, the six named missions, and the five stranger chains — start them as they appear.' },
  { n: 3, title: 'Finale + Vice City activities', note: 'The final mission (gold), then bowling, the arcade, drone races and the activity sampler while the city is fully open.' },
  { n: 4, title: 'Collectibles & exploration', note: 'WAiNK scans, card sets, vehicles, garages and the full 52-area map sweep. Long, calm work — best done with the map fog as your guide.' },
  { n: 5, title: 'Heists, money & open-world chaos', note: 'Bank vaults, armored trucks, shop robberies with your partner, laundering $250,000 and spending $100,000.' },
  { n: 6, title: '100% cleanup & platinum', note: 'Finish the 100% Completion Checklist after the story, then the platinum pops with the last trophy.' },
];

function matches(t) {
  if (kind === 'story' && t.kind !== 'story') return false;
  if (kind === 'missable' && t.missable !== true && t.missable !== 'watch') return false;
  if (kind === 'collectibles' && t.kind !== 'collectibles') return false;
  if (kind === 'activities' && t.kind !== 'activities') return false;
  if (kind === 'other' && t.kind !== 'other') return false;
  if (grade !== 'all' && t.grade !== grade) return false;
  if (query) {
    const hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.steps.map((s) => s.t).join(' ')).toLowerCase();
    if (!hay.includes(query)) return false;
  }
  return true;
}

function renderList() {
  const list = $('trophylist');
  list.replaceChildren();
  const shown = trophies.filter(matches);
  $('listhint').textContent = `Showing ${shown.length} of ${trophies.length} trophies — click one to read its cited guide. ${earned.size} earned so far.`;
  for (const t of shown) {
    const li = el('li');
    if (t.id === selectedId) li.classList.add('selected');
    if (earned.has(t.name)) li.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox'; box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' earned');
    box.addEventListener('change', (e) => {
      e.stopPropagation();
      if (box.checked) earned.add(t.name); else earned.delete(t.name);
      save(); renderProgress(); renderList(); renderDetail(); renderTab(tab);
    });
    const body = el('div');
    const name = el('span', 'tname', shownName(t));
    if (t.hidden) name.append(el('span', 'hiddenmark', ' · hidden'));
    const badge = el('span', 'badge ' + t.grade, t.grade);
    name.append(badge);
    if (t.missable === true) name.append(el('span', 'tag miss', 'MISSABLE'));
    else if (t.missable === 'watch') name.append(el('span', 'tag warn', 'watch'));
    if (t.count) name.append(el('span', 'tag', `${money(counterOf(t))}/${money(t.count.target)} ${t.count.unit}`));
    body.append(name, el('div', 'tdesc', shownDesc(t)));
    li.append(box, body);
    li.addEventListener('click', () => { selectedId = t.id; renderList(); renderDetail(); });
    list.append(li);
  }
}

function counterBox(t) {
  const wrap = el('div', 'counter');
  wrap.append(el('h3', '', 'Count tracker — PSN counter'));
  const row = el('div');
  const num = el('span', 'cnum', `${money(counterOf(t))} / ${money(t.count.target)} ${t.count.unit}`);
  row.append(num);
  wrap.append(row);
  const btns = el('div');
  const step = counterStep(t);
  const minus = el('button', '', '−' + money(step));
  const plus = el('button', '', '+' + money(step));
  minus.addEventListener('click', () => { counters[t.id] = counterOf(t) - step; save(); renderDetail(); renderList(); renderTab(tab); });
  plus.addEventListener('click', () => { counters[t.id] = counterOf(t) + step; save(); renderDetail(); renderList(); renderTab(tab); });
  const input = document.createElement('input');
  input.type = 'number'; input.min = '0'; input.max = String(t.count.target); input.value = String(counterOf(t));
  input.style.cssText = 'width:110px;background:#0d0a16;color:#f2eefc;border:1px solid #3a2f5c;border-radius:6px;padding:4px 6px;';
  input.addEventListener('change', () => { counters[t.id] = Number(input.value); save(); renderDetail(); renderList(); renderTab(tab); });
  btns.append(minus, plus, input);
  wrap.append(btns);
  const bar = el('div', 'cbar');
  const fill = el('div');
  fill.style.width = (counterOf(t) / t.count.target * 100) + '%';
  bar.append(fill);
  wrap.append(bar);
  wrap.append(el('p', 'muted', t.count.label + ' — saved in your browser with the checklist.'));
  return wrap;
}

function renderDetail() {
  const d = $('detail');
  const t = byId(selectedId) ?? trophies[0];
  d.replaceChildren();
  const h = el('h2', '', shownName(t));
  h.append(el('span', 'badge ' + t.grade, t.grade));
  d.append(h);
  d.append(el('p', 'official', 'Official: "' + shownDesc(t) + '"'));
  const tags = el('p', 'muted');
  tags.textContent = `Stage ${t.stage} of 6 · ${t.kind} · ${t.hidden ? 'hidden on PSN until earned' : 'visible on PSN'}` + (t.missable === true ? ' · MISSABLE' : t.missable === 'watch' ? ' · missable watch' : '');
  d.append(tags);
  if (spoiler && isHidden(t)) {
    d.append(el('p', 'guide', 'Spoiler-safe mode is on and this story trophy is still unearned, so its guide stays hidden. Earn it (or switch spoiler-safe off) to read the guide.'));
  } else {
    d.append(el('p', 'guide', t.guide));
    if (t.count) d.append(counterBox(t));
    d.append(el('h3', '', 'How to earn it — each step cites its source'));
    const ol = el('ol', 'steps');
    for (const s of t.steps) {
      const li = el('li', '', s.t + ' ');
      for (const k of s.s) li.append(sourceChip(k));
      ol.append(li);
    }
    d.append(ol);
    if (t.dispute) {
      const dp = disputes[t.dispute];
      const box = el('div', 'dispute');
      box.append(el('b', '', 'Disagreement — shown both ways: ' + dp.title));
      box.append(el('p', '', 'One side: ' + dp.a));
      box.append(el('p', '', 'Other side: ' + dp.b));
      box.append(el('p', '', 'This guide says: ' + dp.verdict));
      d.append(box);
    }
  }
  const row = el('div', 'earnrow');
  const btn = el('button', '', earned.has(t.name) ? '✓ Earned — click to unmark' : 'Mark as earned');
  btn.addEventListener('click', () => {
    if (earned.has(t.name)) earned.delete(t.name); else earned.add(t.name);
    save(); renderProgress(); renderList(); renderDetail(); renderTab(tab);
  });
  row.append(btn);
  d.append(row);
}

function renderRoadmap() {
  const p = $('tab-roadmap');
  p.replaceChildren();
  p.append(el('p', 'hint', 'Six stages, in the order PowerPyx and Push Square both recommend: story first, activities alongside it, collectibles and heists after, 100% cleanup last. Per-stage progress is live from your checklist.'));
  for (const s of STAGES) {
    const ts = trophies.filter((t) => t.stage === s.n);
    const done = ts.filter((t) => earned.has(t.name)).length;
    const box = el('div', 'stage');
    const h = el('h3', '', '');
    h.append(el('span', 'stagenum', 'Stage ' + s.n + ' — '), document.createTextNode(s.title + ' '));
    h.append(el('span', done === ts.length ? 'done' : '', `(${done}/${ts.length})`));
    box.append(h, el('p', '', s.note));
    const bar = el('div', 'bar');
    const fill = el('div', 'fill');
    fill.style.width = (done / ts.length * 100) + '%';
    bar.append(fill);
    box.append(bar);
    const ul = el('ul');
    for (const t of ts) {
      const li = el('li', '', (earned.has(t.name) ? '✓ ' : '○ ') + shownName(t) + ' (' + t.grade + ')');
      li.style.cursor = 'pointer';
      li.addEventListener('click', () => { selectedId = t.id; switchTab('checklist'); renderList(); renderDetail(); });
      ul.append(li);
    }
    box.append(ul);
    p.append(box);
  }
}

function renderMissables() {
  const p = $('tab-missables');
  p.replaceChildren();
  p.append(el('p', 'hint', 'PowerPyx and GTABase agree there is potentially 1 missable trophy. TechWiser adds a warning about stranger chains. Everything else is safe in free-roam after the story.'));
  const grid = el('div', 'missgrid');
  const hot = byId(28);
  const c1 = el('div', 'misscard hot');
  c1.append(el('h4', '', '⚠ MISSABLE — ' + hot.name + ' (Bronze)'));
  c1.append(el('p', '', 'Meditate at every spot across Leonida. The Chapter 1 meditation — Lucia on the balcony at Jason\u2019s house, after the mission Down to Earth — disappears when Chapter 1 ends. Do it in Chapter 1; whether it is strictly required is disputed (see Sources & disputes, #1).'));
  c1.append(el('p', '', 'Counter: ' + money(counterOf(hot)) + ' / 18 spots.'));
  grid.append(c1);
  const c2 = el('div', 'misscard');
  c2.append(el('h4', '', 'Watch — five stranger chains'));
  c2.append(el('p', '', 'Andy, Kenton, Billy, Randy and Tyrone each end in a hidden final-mission trophy. TechWiser (via EGamers) reports story-linked windows on these chains; PowerPyx says all trophy-related quest givers return in free-roam. Do them as they appear — don\u2019t bank them for whole chapters.'));
  grid.append(c2);
  const c3 = el('div', 'misscard');
  c3.append(el('h4', '', 'Chapter grid — what can be missed, by chapter'));
  c3.append(el('p', '', 'Chapter 1: the meditation above — the only confirmed risk. Chapters 2–5: nothing missable; story trophies pop in sequence. After the finale: free-roam stays open and everything needed for 100% is still reachable (PowerPyx).'));
  grid.append(c3);
  const c4 = el('div', 'misscard');
  c4.append(el('h4', '', 'Safe by design'));
  c4.append(el('p', '', 'No online trophies, no mission gold medals, no mission replay needed. Cheats disable trophies and saving (GTABase, TechWiser) — keep cheats off for a trophy run. Optional missions that vanish after a while do not affect trophies (PowerPyx).'));
  grid.append(c4);
  p.append(grid);
}

function renderCounters() {
  const p = $('tab-counters');
  p.replaceChildren();
  p.append(el('p', 'hint', 'Every trophy PlayStation tracks with a count, with its target and your progress. Values save in your browser. Money counters step by 1,000; big counts step by 10.'));
  for (const t of trophies.filter((x) => x.count)) {
    const box = el('div', 'stage');
    const h = el('h3', '', '');
    h.append(document.createTextNode(shownName(t) + ' '));
    h.append(el('span', 'muted', `— ${money(counterOf(t))} / ${money(t.count.target)} ${t.count.unit}`));
    box.append(h);
    box.append(counterBox(t));
    p.append(box);
  }
}

function renderSources() {
  const p = $('tab-sources');
  p.replaceChildren();
  p.append(el('p', 'hint', 'Every step in this guide names its source. The matrix counts how many cited steps each source backs. Links open the source page; the app itself fetches nothing.'));
  const citedBy = JSON.parse($('audit').dataset.citedBy ?? '{}');
  const table = el('table', 'matrix');
  const head = el('tr');
  for (const h of ['Source', 'Page', 'Steps backed']) head.append(el('th', '', h));
  table.append(head);
  for (const [key, s] of Object.entries(sources)) {
    const tr = el('tr');
    const nameCell = el('td');
    if (s.url) {
      const a = document.createElement('a');
      a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = s.name;
      a.style.color = '#f5c542';
      nameCell.append(a);
    } else {
      nameCell.textContent = s.name + ' (named guide)';
    }
    tr.append(nameCell, el('td', '', s.page), el('td', '', String(citedBy[key] ?? 0)));
    table.append(tr);
  }
  p.append(table);
  p.append(el('h3', '', 'Disagreements — both sides, plainly'));
  for (const d of doc.disputes) {
    const box = el('div', 'dispute');
    box.append(el('b', '', d.title));
    box.append(el('p', '', 'One side: ' + d.a));
    box.append(el('p', '', 'Other side: ' + d.b));
    box.append(el('p', '', 'This guide says: ' + d.verdict));
    p.append(box);
  }
  p.append(el('p', 'muted', 'Honesty note: GTA VI released 19 Nov 2026 and the published guides are early. Counts and names come from lists on which Exophase, PSNProfiles, PowerPyx, Push Square, KeenGamer, EGamers, GamesFuze and Insider Gaming agree. Where a trigger is unconfirmed (Personal Best, The Truth Is Out There), this guide says so instead of inventing one.'));
}

function renderTab(name) {
  tab = name;
  for (const b of document.querySelectorAll('#tabs button')) b.classList.toggle('active', b.dataset.tab === name);
  for (const id of ['checklist', 'roadmap', 'missables', 'counters', 'sources']) $('tab-' + id).hidden = id !== name;
  if (name === 'roadmap') renderRoadmap();
  if (name === 'missables') renderMissables();
  if (name === 'counters') renderCounters();
  if (name === 'sources') renderSources();
}
function switchTab(name) { renderTab(name); }

document.querySelectorAll('#tabs button').forEach((b) => b.addEventListener('click', () => switchTab(b.dataset.tab)));
document.querySelectorAll('#kinds button').forEach((b) => b.addEventListener('click', () => {
  kind = b.dataset.kind;
  document.querySelectorAll('#kinds button').forEach((x) => x.classList.toggle('active', x === b));
  switchTab('checklist'); renderList();
}));
$('grade').value = grade;
$('grade').addEventListener('change', (e) => { grade = e.target.value; renderList(); });
$('search').addEventListener('input', (e) => { query = e.target.value.trim().toLowerCase(); renderList(); });
$('spoiler').checked = spoiler;
$('spoiler').addEventListener('change', (e) => { spoiler = e.target.checked; save(); renderList(); renderDetail(); });
$('export').addEventListener('click', () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify({ earned: [...earned], counters }, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
});
$('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    earned.clear();
    for (const n of data.earned ?? []) earned.add(n);
    Object.assign(counters, data.counters ?? {});
    save(); renderProgress(); renderList(); renderDetail(); renderTab(tab);
  } catch { alert('That file is not a Leonida Trophy Atlas export.'); }
});

renderAudit();
renderProgress();
if (kind !== 'all') document.querySelectorAll('#kinds button').forEach((x) => x.classList.toggle('active', x.dataset.kind === kind));
renderList();
renderDetail();
renderTab(tab);
