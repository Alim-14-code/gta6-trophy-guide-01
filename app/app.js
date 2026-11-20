/* Leonida Trophy Atlas — checklist, roadmap, counters, sources, disputes.
   Static, offline: the only fetch is the local data/trophies.json. Progress lives
   in localStorage under one key and can be exported / imported as JSON. */
(function () {
  'use strict';
  var LS_KEY = 'leonida-trophy-atlas-v1';
  var DATA_URL = 'data/trophies.json';

  var state = { earned: {}, counts: {}, spoiler: false };
  var data = null;          // the trophies.json document
  var byId = {};            // trophy id -> trophy
  var selectedId = null;

  function loadState() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === 'object') {
          state.earned = s.earned || {};
          state.counts = s.counts || {};
          state.spoiler = !!s.spoiler;
        }
      }
    } catch (e) { /* corrupted state: start fresh */ }
  }
  function saveState() {
    try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
  }

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function gradeLabel(g) { return g.charAt(0).toUpperCase() + g.slice(1); }
  function isEarned(id) { return !!state.earned[id]; }
  function trophyCount(t) { return t.count ? t.count.target + ' ' + t.count.unit : null; }

  /* ---------- progress ---------- */
  function earnedTotal() {
    return data.trophies.filter(function (t) { return isEarned(t.id); }).length;
  }
  function renderProgress() {
    var n = earnedTotal();
    el('earnedCount').textContent = n;
    el('progressFill').style.width = (n / data.trophies.length * 100).toFixed(1) + '%';
    el('progressNote').textContent = n >= 54
      ? (isEarned(1) ? 'Platinum earned — Leonida Legend!' : 'Platinum: one trophy left.')
      : 'Platinum: locked — earn the other 54 first.';
  }

  /* ---------- spoiler handling ---------- */
  function displayName(t) {
    if (state.spoiler && t.kind === 'story' && !isEarned(t.id)) return 'Hidden story trophy';
    return t.name;
  }
  function displayDesc(t) {
    if (state.spoiler && t.kind === 'story' && !isEarned(t.id)) return 'Hidden until earned — spoiler-safe mode is on.';
    return t.description;
  }

  /* ---------- checklist ---------- */
  function trophyRow(t) {
    var li = document.createElement('li');
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'trophy-row' + (isEarned(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '');
    btn.setAttribute('data-id', t.id);
    var tags = '';
    if (t.missable) tags += '<span class="tag missable">Missable</span>';
    if (!t.confirmed) tags += '<span class="tag unconfirmed">Unconfirmed</span>';
    if (t.hidden) tags += '<span class="tag hidden-t">Hidden</span>';
    if (t.count) tags += '<span class="tag count">' + esc(trophyCount(t)) + '</span>';
    if (t.chapter) tags += '<span class="tag">' + esc(t.chapter) + '</span>';
    tags += '<span class="tag">' + esc(t.kind) + '</span>';
    var spoilerCls = (state.spoiler && t.kind === 'story' && !isEarned(t.id)) ? ' spoiler-name' : '';
    btn.innerHTML =
      '<input type="checkbox" ' + (isEarned(t.id) ? 'checked' : '') + ' aria-label="Earned: ' + esc(t.name) + '">' +
      '<span class="grade ' + esc(t.grade) + '">' + esc(gradeLabel(t.grade)) + '</span>' +
      '<span><span class="trophy-name' + spoilerCls + '">' + esc(displayName(t)) + '</span><br>' +
      '<span class="trophy-desc">' + esc(displayDesc(t)) + '</span>' +
      '<span class="trophy-meta">' + tags + '</span></span>' +
      '<span aria-hidden="true">&rsaquo;</span>';
    btn.addEventListener('click', function (ev) {
      if (ev.target && ev.target.type === 'checkbox') {
        ev.stopPropagation();
        toggleEarned(t.id);
        return;
      }
      selectTrophy(t.id);
    });
    li.appendChild(btn);
    return li;
  }

  function filteredTrophies() {
    var q = el('q').value.trim().toLowerCase();
    var kind = el('fKind').value;
    var chapter = el('fChapter').value;
    var grade = el('fGrade').value;
    var uncOnly = el('fUnconfirmed').checked;
    return data.trophies.filter(function (t) {
      if (q && (t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1)) return false;
      if (kind === 'missable') { if (!t.missable) return false; }
      else if (kind && t.kind !== kind) return false;
      if (chapter && t.chapter !== chapter) return false;
      if (grade && t.grade !== grade) return false;
      if (uncOnly && t.confirmed) return false;
      return true;
    });
  }

  function renderChecklist() {
    var list = el('trophyList');
    list.innerHTML = '';
    var rows = filteredTrophies();
    if (rows.length === 0) {
      var li = document.createElement('li');
      li.textContent = 'No trophies match these filters.';
      list.appendChild(li);
      return;
    }
    rows.forEach(function (t) { list.appendChild(trophyRow(t)); });
  }

  function toggleEarned(id) {
    if (state.earned[id]) delete state.earned[id]; else state.earned[id] = true;
    saveState();
    renderAll();
  }

  /* ---------- detail pane (persistent) ---------- */
  function selectTrophy(id) {
    selectedId = id;
    var t = byId[id];
    if (!t) return;
    el('detailEmpty').hidden = true;
    var body = el('detailBody');
    body.hidden = false;
    var steps = t.steps.map(function (s, i) {
      return '<li><b>Step ' + (i + 1) + '.</b> ' + esc(s.text) +
        ' <span class="srcs">[' + s.sources.map(esc).join(', ') + ']</span></li>';
    }).join('');
    var disputeHtml = '';
    if (t.dispute) {
      var d = data.disputes.filter(function (x) { return x.id === t.dispute; })[0];
      if (d) disputeHtml = '<h3>Dispute ' + esc(d.id) + '</h3><p>' + esc(d.title) +
        ' <a class="dispute-link" href="#disputes">See the disputes tab &rsaquo;</a></p>';
    }
    var uncHtml = t.confirmed ? '' :
      '<div class="unconfirmed-box"><b>UNCONFIRMED.</b> Only one source reports this trophy. ' +
      'The name and description are shown as listed, but the trigger is not verified. ' +
      'Do not plan a run around it until a second source confirms it.</div>';
    body.innerHTML =
      '<span class="grade ' + esc(t.grade) + '">' + esc(gradeLabel(t.grade)) + '</span>' +
      '<h2>' + esc(t.name) + '</h2>' +
      '<p class="trophy-desc">' + esc(t.description) + '</p>' +
      '<p>' + (t.missable ? '<span class="tag missable">Missable</span> ' : '') +
      (t.chapter ? '<span class="tag">' + esc(t.chapter) + '</span> ' : '') +
      '<span class="tag">' + esc(t.kind) + '</span> ' +
      (t.count ? '<span class="tag count">' + esc(trophyCount(t)) + '</span>' : '') + '</p>' +
      uncHtml +
      '<h3>Guide</h3><p>' + esc(t.guide) + '</p>' +
      '<h3>Steps (' + t.steps.length + ')</h3><ol class="steps">' + steps + '</ol>' +
      '<h3>Sources</h3><p class="srcs">' + t.sources.map(esc).join(', ') + '</p>' +
      disputeHtml;
    renderChecklist();
    if (location.hash !== '#trophy-' + id) history.replaceState(null, '', '#trophy-' + id);
  }

  /* ---------- roadmap ---------- */
  function renderRoadmap() {
    var box = el('roadmapBox');
    box.innerHTML = '';
    data.roadmap.forEach(function (stage) {
      var done = stage.trophies.filter(function (id) { return isEarned(id); }).length;
      var div = document.createElement('div');
      div.className = 'stage';
      var chips = stage.trophies.map(function (id) {
        var t = byId[id];
        return '<button type="button" data-id="' + id + '" class="' + (isEarned(id) ? 'done' : '') + '">' + esc(t.name) + '</button>';
      }).join('');
      div.innerHTML =
        '<div class="stage-head"><h3>Stage ' + stage.stage + ' — ' + esc(stage.title) + '</h3>' +
        '<span>' + done + ' / ' + stage.trophies.length + '</span></div>' +
        '<div class="progress-bar"><div class="progress-fill" style="width:' + (done / stage.trophies.length * 100).toFixed(1) + '%"></div></div>' +
        '<p class="stage-note">' + esc(stage.note) + '</p>' +
        '<div class="stage-trophies">' + chips + '</div>';
      div.querySelectorAll('button[data-id]').forEach(function (b) {
        b.addEventListener('click', function () { selectTrophy(Number(b.getAttribute('data-id'))); showTab('checklist'); });
      });
      box.appendChild(div);
    });
  }

  /* ---------- missables + chapters ---------- */
  function renderMissables() {
    var list = el('missableList');
    list.innerHTML = '';
    var miss = data.trophies.filter(function (t) { return t.missable; });
    el('missableCount').textContent = miss.length + ' trophies';
    miss.forEach(function (t) { list.appendChild(trophyRow(t)); });
    var grid = el('chapterGrid');
    grid.innerHTML = '';
    ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Finale'].forEach(function (ch) {
      var ts = data.trophies.filter(function (t) { return t.chapter === ch; });
      var card = document.createElement('div');
      card.className = 'chapter-card';
      card.innerHTML = '<h3>' + esc(ch) + ' — ' + ts.length + ' trophies</h3>' +
        '<div class="stage-trophies">' + ts.map(function (t) {
          return '<button type="button" data-id="' + t.id + '" class="' + (isEarned(t.id) ? 'done' : '') + '">' + esc(t.name) + '</button>';
        }).join('') + '</div>';
      card.querySelectorAll('button[data-id]').forEach(function (b) {
        b.addEventListener('click', function () { selectTrophy(Number(b.getAttribute('data-id'))); showTab('checklist'); });
      });
      grid.appendChild(card);
    });
  }

  function renderChapters() {
    var box = el('chapterList');
    box.innerHTML = '';
    var groups = ['Chapter 1', 'Chapter 2', 'Chapter 3', 'Chapter 4', 'Finale', 'Strangers', 'Free Roam'];
    groups.forEach(function (ch) {
      var ts = data.trophies.filter(function (t) { return (t.chapter || 'Free Roam') === ch; });
      if (ts.length === 0) return;
      var card = document.createElement('div');
      card.className = 'chapter-card';
      var h = document.createElement('h3');
      h.textContent = ch + ' — ' + ts.length + ' trophies';
      card.appendChild(h);
      var ul = document.createElement('ul');
      ul.className = 'trophy-list compact';
      ts.forEach(function (t) { ul.appendChild(trophyRow(t)); });
      card.appendChild(ul);
      box.appendChild(card);
    });
  }

  /* ---------- counters ---------- */
  function renderCounters() {
    var box = el('counterBox');
    box.innerHTML = '';
    data.counters.forEach(function (id) {
      var t = byId[id];
      var val = state.counts[id] || 0;
      var row = document.createElement('div');
      row.className = 'counter-row';
      row.innerHTML =
        '<div><div class="c-name">' + esc(t.name) + '</div>' +
        '<div class="c-target">Target: ' + esc(trophyCount(t)) + ' &middot; ' + esc(t.description) + '</div></div>' +
        '<div class="stepper"><button type="button" data-d="-1" aria-label="Decrease">−</button>' +
        '<span class="c-val">' + val + ' / ' + t.count.target + '</span>' +
        '<button type="button" data-d="1" aria-label="Increase">+</button></div>';
      row.querySelectorAll('button[data-d]').forEach(function (b) {
        b.addEventListener('click', function () {
          var v = (state.counts[id] || 0) + Number(b.getAttribute('data-d'));
          if (v < 0) v = 0;
          if (v > t.count.target * 4) v = t.count.target * 4;
          state.counts[id] = v;
          saveState();
          renderCounters();
        });
      });
      box.appendChild(row);
    });
  }

  /* ---------- sources ---------- */
  function renderSources() {
    var box = el('sourceMatrix');
    var rows = data.sources.map(function (s) {
      var n = data.trophies.filter(function (t) { return t.sources.indexOf(s.name) !== -1; }).length;
      var steps = 0;
      data.trophies.forEach(function (t) {
        t.steps.forEach(function (st) { if (st.sources.indexOf(s.name) !== -1) steps++; });
      });
      return { name: s.name, url: s.url || '', note: s.note || '', trophies: n, steps: steps };
    });
    var html = '<table class="matrix"><thead><tr><th>Source</th><th class="num">Trophies citing it</th><th class="num">Steps citing it</th></tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr><td>' + (r.url ? '<a href="' + esc(r.url) + '">' + esc(r.name) + '</a>' : esc(r.name)) +
          '</td><td class="num">' + r.trophies + '</td><td class="num">' + r.steps + '</td></tr>';
      }).join('') + '</tbody></table>';
    html += '<div class="source-list">' + rows.map(function (r) {
      return '<div class="source-item"><b>' + esc(r.name) + '</b>' +
        (r.url ? ' — <a href="' + esc(r.url) + '">' + esc(r.url) + '</a>' : '') +
        '<div class="s-note">' + esc(r.note) + '</div></div>';
    }).join('') + '</div>';
    box.innerHTML = html;
  }

  /* ---------- disputes ---------- */
  function renderDisputes() {
    var box = el('disputeBox');
    box.innerHTML = '';
    data.disputes.forEach(function (d) {
      var div = document.createElement('div');
      div.className = 'dispute';
      var names = d.trophies.map(function (id) { return byId[id].name; }).join(' · ');
      div.innerHTML = '<h3>' + esc(d.id) + ' — ' + esc(d.title) + '</h3>' +
        '<div class="d-trophies">Trophies: ' + esc(names) + '</div>' +
        d.sides.map(function (s) {
          return '<div class="side"><p>' + esc(s.claim) + '</p><p class="srcs">Sources: ' + s.sources.map(esc).join(', ') + '</p></div>';
        }).join('') +
        '<div class="verdict"><b>What this guide does:</b> ' + esc(d.verdict) + '</div>';
      box.appendChild(div);
    });
  }

  /* ---------- tabs & hash routing ---------- */
  function showTab(name) {
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-tab') === name);
    });
    document.querySelectorAll('.tabpage').forEach(function (p) {
      p.classList.toggle('active', p.id === 'tab-' + name);
    });
  }

  function applyHash() {
    var h = location.hash || '';
    if (h.indexOf('#trophy-') === 0) {
      var id = Number(h.slice(8));
      if (byId[id]) { showTab('checklist'); selectTrophy(id); return; }
    }
    var tabs = ['checklist', 'roadmap', 'missables', 'chapters', 'counters', 'sources', 'disputes'];
    if (tabs.indexOf(h.slice(1)) !== -1) showTab(h.slice(1));
  }

  /* ---------- export / import / reset ---------- */
  function exportChecklist() {
    var payload = { app: 'Leonida Trophy Atlas', exportedAt: new Date().toISOString(), state: state };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-trophy-atlas-checklist.json';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function importChecklist(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var payload = JSON.parse(reader.result);
        var s = payload.state || payload;
        if (s && typeof s === 'object') {
          state.earned = s.earned || {};
          state.counts = s.counts || {};
          state.spoiler = !!s.spoiler;
          el('spoiler').checked = state.spoiler;
          saveState();
          renderAll();
        }
      } catch (e) { alert('That file is not a Leonida Trophy Atlas checklist.'); }
    };
    reader.readAsText(file);
  }

  function renderAll() {
    renderProgress();
    renderChecklist();
    renderRoadmap();
    renderMissables();
    renderChapters();
    renderCounters();
    renderSources();
    renderDisputes();
  }

  /* ---------- boot ---------- */
  function boot() {
    loadState();
    // Demo mode (?demo=1): seeds a realistic mid-playthrough state so the
    // screenshots show progress, roadmap stages and counters working. It only
    // writes the app's own localStorage state, nothing else.
    if (new URLSearchParams(location.search).has('demo')) {
      state.earned = {};
      [2, 3, 8, 15, 18, 20, 22, 28, 35, 36, 46, 52].forEach(function (id) { state.earned[id] = true; });
      state.counts = { 15: 87, 17: 12, 28: 6, 31: 34, 35: 41, 42: 23, 52: 87500, 55: 4 };
      saveState();
    }
    el('spoiler').checked = state.spoiler;
    fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (doc) {
      data = doc;
      data.trophies.forEach(function (t) { byId[t.id] = t; });
      renderAll();
      applyHash();
    }).catch(function () {
      el('trophyList').innerHTML = '<li>Could not load data/trophies.json. Serve the app/ folder over HTTP and reload.</li>';
    });

    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.addEventListener('click', function () {
        showTab(b.getAttribute('data-tab'));
        history.replaceState(null, '', '#' + b.getAttribute('data-tab'));
      });
    });
    ['q', 'fKind', 'fChapter', 'fGrade'].forEach(function (id) {
      el(id).addEventListener('input', renderChecklist);
      el(id).addEventListener('change', renderChecklist);
    });
    el('fUnconfirmed').addEventListener('change', renderChecklist);
    el('spoiler').addEventListener('change', function () {
      state.spoiler = el('spoiler').checked;
      saveState();
      renderChecklist();
    });
    el('exportBtn').addEventListener('click', exportChecklist);
    el('importFile').addEventListener('change', function () {
      if (el('importFile').files[0]) importChecklist(el('importFile').files[0]);
      el('importFile').value = '';
    });
    el('resetBtn').addEventListener('click', function () {
      if (confirm('Clear all earned trophies, counters and settings?')) {
        state = { earned: {}, counts: {}, spoiler: false };
        el('spoiler').checked = false;
        selectedId = null;
        el('detailBody').hidden = true;
        el('detailEmpty').hidden = false;
        saveState();
        renderAll();
      }
    });
    window.addEventListener('hashchange', applyHash);
  }

  document.addEventListener('DOMContentLoaded', boot);
})();
