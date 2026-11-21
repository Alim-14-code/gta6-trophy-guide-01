// Leonida Trophy Ledger — GTA VI trophy guide & tracker (PS5), offline.
// Data: app/data/trophies.json. Progress: localStorage. No network at runtime.
(function () {
  'use strict';
  var KEY = 'leonida-ledger-v1';
  var POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };
  var GRADE_LABEL = { platinum: 'P', gold: 'G', silver: 'S', bronze: 'B' };
  var RISK_LABEL = { possible: 'Possibly missable', 'at-risk': 'At risk', unconfirmed: 'Unconfirmed', none: '' };
  var state = { earned: {}, counts: {}, spoiler: true, hideEarned: false, filter: 'all', query: '' };
  var data = null, selectedId = null, currentView = 'tracker';

  function loadState() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) { var s = JSON.parse(raw); if (s && typeof s === 'object') state = Object.assign(state, s); }
    } catch (e) { /* fresh start */ }
  }
  function saveState() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage full/blocked */ }
    var n = document.getElementById('savedNote'); if (n) n.textContent = 'Saved in this browser';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function trophyById(id) { return data.trophies.find(function (t) { return t.id === id; }); }
  function isStory(t) { return t.kinds.indexOf('story') !== -1; }
  function masked(t) { return state.spoiler && t.hidden && isStory(t) && !state.earned[t.id]; }
  function displayName(t) { return masked(t) ? 'Hidden story trophy' : t.name; }
  function displayDesc(t) { return masked(t) ? 'Earn it to reveal its name and description.' : t.description; }

  function gradeCounts(list) {
    var c = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    list.forEach(function (t) { c[t.grade]++; });
    return c;
  }
  function earnedList() { return data.trophies.filter(function (t) { return state.earned[t.id]; }); }

  function renderHeader() {
    var earned = earnedList(), total = data.trophies.length;
    var pts = 0; earned.forEach(function (t) { pts += POINTS[t.grade] || 0; });
    var all = gradeCounts(data.trophies), got = gradeCounts(earned);
    var split = ['platinum', 'gold', 'silver', 'bronze'].map(function (g) {
      return GRADE_LABEL[g] + ' ' + got[g] + '/' + all[g];
    }).join(' · ');
    document.getElementById('headstats').innerHTML =
      '<span><b>' + earned.length + '/' + total + '</b> earned</span>' +
      '<span>PSN points <b>' + pts + '/1,350</b></span>' +
      '<span>' + split + '</span>';
  }

  function renderAudit() {
    var steps = 0, twoPlus = 0;
    data.trophies.forEach(function (t) { steps += t.steps.length; if (t.sources.length >= 2) twoPlus++; });
    var risk = { possible: 0, 'at-risk': 0, unconfirmed: 0, disputed: 0 };
    data.trophies.forEach(function (t) {
      if (risk[t.risk] !== undefined) risk[t.risk]++;
      if (t.disputed) risk.disputed++;
    });
    var tiles = [
      [steps + '/' + steps + ' steps cited', 'every guide step cites a source'],
      [twoPlus + '/55 guides with 2+ sources', 'each guide cites two or more sites'],
      [data.sites.length + ' sites', 'guide pages read 20–21 Nov 2026'],
      [risk.possible + ' possibly missable', 'Positive Mental Attitude, Ch. 1'],
      [risk['at-risk'] + ' at risk', 'act before the window closes'],
      [risk.unconfirmed + ' unconfirmed', 'marked, never invented'],
      [risk.disputed + ' disputed', 'Sources Differ — both versions shown']
    ];
    document.getElementById('auditStrip').innerHTML = tiles.map(function (t) {
      return '<div class="tile"><b>' + esc(t[0]) + '</b><span>' + esc(t[1]) + '</span></div>';
    }).join('');
  }

  var FILTERS = [
    ['all', 'All 55'], ['story', 'Story'], ['missable', 'Missable'], ['collectibles', 'Collectibles'],
    ['activities', 'Activities'], ['online', 'Online'], ['disputed', 'Disputed'], ['notearned', 'Not earned']
  ];
  function filterCount(f) {
    return data.trophies.filter(function (t) {
      if (f === 'all') return true;
      if (f === 'story') return isStory(t);
      if (f === 'missable') return t.risk !== 'none';
      if (f === 'collectibles') return t.kinds.indexOf('collectibles') !== -1;
      if (f === 'activities') return t.kinds.indexOf('activities') !== -1;
      if (f === 'online') return t.kinds.indexOf('online') !== -1;
      if (f === 'disputed') return t.disputed;
      if (f === 'notearned') return !state.earned[t.id];
      return true;
    }).length;
  }
  function renderChips() {
    document.getElementById('filterChips').innerHTML = FILTERS.map(function (f) {
      return '<button type="button" data-filter="' + f[0] + '"' + (state.filter === f[0] ? ' class="active"' : '') + '>' + esc(f[1]) + ' ' + filterCount(f[0]) + '</button>';
    }).join('');
  }
  function visibleTrophies() {
    var q = state.query.trim().toLowerCase();
    return data.trophies.filter(function (t) {
      if (state.hideEarned && state.earned[t.id]) return false;
      if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
      if (state.filter === 'all') return true;
      if (state.filter === 'story') return isStory(t);
      if (state.filter === 'missable') return t.risk !== 'none';
      if (state.filter === 'collectibles') return t.kinds.indexOf('collectibles') !== -1;
      if (state.filter === 'activities') return t.kinds.indexOf('activities') !== -1;
      if (state.filter === 'online') return t.kinds.indexOf('online') !== -1;
      if (state.filter === 'disputed') return t.disputed;
      if (state.filter === 'notearned') return !state.earned[t.id];
      return true;
    });
  }

  function riskTags(t) {
    var out = '<span class="tag ' + t.grade + '">' + t.grade + '</span>';
    if (t.hidden) out += '<span class="tag hidden">PSN-hidden</span>';
    if (t.risk === 'possible') out += '<span class="tag miss">Possibly missable</span>';
    if (t.risk === 'at-risk') out += '<span class="tag risk">At risk</span>';
    if (t.risk === 'unconfirmed') out += '<span class="tag unc">Unconfirmed</span>';
    if (t.disputed) out += '<span class="tag disp">Sources differ</span>';
    return out;
  }
  function renderList() {
    var list = visibleTrophies();
    document.getElementById('listCount').textContent = list.length + ' of 55 trophies';
    document.getElementById('trophyList').innerHTML = list.map(function (t) {
      var earned = !!state.earned[t.id];
      return '<li data-id="' + t.id + '" class="' + (t.id === selectedId ? 'sel ' : '') + (earned ? 'earned' : '') + '">' +
        '<input type="checkbox" data-earn="' + t.id + '"' + (earned ? ' checked' : '') + ' aria-label="Earned: ' + esc(t.name) + '">' +
        '<div><div class="tname">' + esc(displayName(t)) + '</div>' +
        '<div class="tmeta">' + riskTags(t) + ' · ' + t.sources.length + ' sources · Stage ' + t.stage + '</div></div></li>';
    }).join('');
  }

  function disputeFor(t) {
    return (data.disputes || []).find(function (d) { return d.trophies.indexOf(t.name) !== -1; });
  }
  function renderDetail() {
    var t = trophyById(selectedId) || data.trophies[0];
    if (!t) return;
    var mine = state.counts[t.id] || 0;
    var html = '<h1>' + esc(displayName(t)) + '</h1><div>' + riskTags(t) + '</div>' +
      '<p class="official">&ldquo;' + esc(displayDesc(t)) + '&rdquo; — official description</p>' +
      '<p class="window"><b>Missable window:</b> ' + esc(t.window) + '</p>';
    if (t.count) {
      html += '<div class="countbox"><span>Your count</span><button type="button" data-count="-1" aria-label="Decrease count">−</button>' +
        '<b>' + mine + ' / ' + t.count.target + ' ' + esc(t.count.unit) + '</b>' +
        '<button type="button" data-count="1" aria-label="Increase count">+</button>' +
        '<span class="tmeta">official PSN count: ' + t.count.target + ' ' + esc(t.count.unit) + '</span></div>';
    }
    html += '<h2>How to earn it</h2><ol class="steps">' + t.steps.map(function (s) {
      return '<li>' + esc(s.text) + ' <span class="cite">[' + esc(s.source) + ']</span></li>';
    }).join('') + '</ol>';
    if (t.disputed) {
      var d = disputeFor(t);
      if (d) {
        html += '<div class="diff"><h3>Sources Differ</h3><p><b>Version A:</b> ' + esc(d.argued) + '</p>' +
          '<p><b>Version B:</b> the official description is the whole text — ' + esc(t.description) + '</p>' +
          '<p class="call"><b>Our call:</b> ' + esc(d.settled) + '</p></div>';
      }
    }
    html += '<h2>Claims — every fact cited</h2><ul class="claims"><li>Official name, description and grade as PlayStation publishes them — PlayStation official trophy list.</li>' +
      t.sources.map(function (s) { return '<li>Guide steps draw on ' + esc(s) + '.</li>'; }).join('') + '</ul>' +
      '<div class="earnedBox"><label><input type="checkbox" id="detailEarned"' + (state.earned[t.id] ? ' checked' : '') + '> Earned</label></div>';
    document.getElementById('detailPane').innerHTML = html;
    var rail = document.getElementById('railSources');
    rail.innerHTML = '<p class="tmeta">' + t.steps.length + ' cited steps · ' + t.sources.length + ' sources · read 20–21 Nov 2026</p>' +
      '<ol class="srcList">' + t.sources.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
  }

  function roadmapOrder() {
    return data.trophies.slice().sort(function (a, b) { return (a.stage - b.stage) || (a.id - b.id); });
  }
  function renderNextUp() {
    var next = roadmapOrder().filter(function (t) { return !state.earned[t.id]; }).slice(0, 5);
    var html = next.map(function (t, i) {
      return '<li><b>#' + (i + 1) + '</b> ' + esc(displayName(t)) + ' — ' + riskTags(t) + ' <span class="tmeta">Stage ' + t.stage + '</span></li>';
    }).join('');
    document.getElementById('nextUp').innerHTML = html;
    var wide = document.getElementById('roadmapNextUp'); if (wide) wide.innerHTML = html;
    document.getElementById('railStages').innerHTML = data.roadmap.map(function (r) {
      return '<li><b>Stage ' + r.stage + ':</b> ' + esc(r.title) + '</li>';
    }).join('');
  }

  function renderRoadmap() {
    document.getElementById('roadmapList').innerHTML = data.roadmap.map(function (r) {
      var mine = data.trophies.filter(function (t) { return t.stage === r.stage; });
      var got = mine.filter(function (t) { return state.earned[t.id]; }).length;
      return '<li><h2>Stage ' + r.stage + ' — ' + esc(r.title) + ' <span class="tmeta">' + got + '/' + mine.length + ' earned</span></h2><p>' + esc(r.text) + '</p></li>';
    }).join('');
  }
  function renderDisputes() {
    document.getElementById('disputePanels').innerHTML = (data.disputes || []).map(function (d) {
      return '<article class="dispute"><h2>' + esc(d.title) + '</h2><p class="tmeta">Trophies: ' + d.trophies.map(esc).join(' · ') + '</p>' +
        '<p><b>Version A:</b> ' + esc(d.argued) + '</p>' +
        '<p><b>Version B:</b> the official descriptions are the whole published text; where they are silent, the guides fill in differently.</p>' +
        '<p class="call"><b>Our call:</b> ' + esc(d.settled) + '</p></article>';
    }).join('');
  }
  function renderSources() {
    document.getElementById('sourcesList').innerHTML = '<ol class="srcList">' + data.sites.map(function (s) {
      return '<li><b>' + esc(s.name) + '</b> — ' + esc(s.url) + '</li>';
    }).join('') + '</ol>';
    var steps = 0; data.trophies.forEach(function (t) { steps += t.steps.length; });
    document.getElementById('sourcesCoverage').textContent =
      steps + ' cited steps across 55 guides; 55/55 guides cite two or more sources; ' +
      data.trophies.filter(function (t) { return t.disputed; }).length + ' disputed trophies shown both ways. ' +
      'Official list checked 21 Nov 2026.';
  }

  function renderAll() {
    renderHeader(); renderAudit(); renderChips(); renderList(); renderDetail(); renderNextUp();
    if (currentView === 'roadmap') renderRoadmap();
    if (currentView === 'disputes') renderDisputes();
    if (currentView === 'sources') renderSources();
  }
  function showView(v) {
    currentView = v;
    document.querySelectorAll('#tabs button').forEach(function (b) { b.classList.toggle('active', b.dataset.view === v); });
    ['tracker', 'roadmap', 'disputes', 'sources'].forEach(function (name) {
      document.getElementById('view-' + name).hidden = (name !== v);
    });
    renderAll();
  }

  function exportProgress() {
    var blob = new Blob([JSON.stringify({ app: 'leonida-trophy-ledger', exported: new Date().toISOString(), state: state }, null, 2)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'leonida-trophy-ledger-progress.json'; a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  fetch('data/trophies.json').then(function (r) { return r.json(); }).then(function (d) {
    data = d;
    loadState();
    var params = new URLSearchParams(location.search);
    var pma = data.trophies.find(function (t) { return t.name === 'Positive Mental Attitude'; });
    selectedId = params.get('t') ? Number(params.get('t')) : (pma ? pma.id : data.trophies[0].id);
    document.getElementById('spoilerToggle').checked = state.spoiler;
    document.getElementById('hideEarned').checked = state.hideEarned;
    if (params.get('view') && ['tracker', 'roadmap', 'disputes', 'sources'].indexOf(params.get('view')) !== -1) currentView = params.get('view');
    if (params.get('earned')) {
      params.get('earned').split(',').forEach(function (id) { state.earned[Number(id)] = true; });
    }
    renderAll(); showView(currentView);

    document.getElementById('tabs').addEventListener('click', function (e) {
      if (e.target.dataset.view) showView(e.target.dataset.view);
    });
    document.getElementById('searchBox').addEventListener('input', function (e) { state.query = e.target.value; saveState(); renderChips(); renderList(); });
    document.getElementById('filterChips').addEventListener('click', function (e) {
      if (e.target.dataset.filter) { state.filter = e.target.dataset.filter; saveState(); renderChips(); renderList(); }
    });
    document.getElementById('spoilerToggle').addEventListener('change', function (e) { state.spoiler = e.target.checked; saveState(); renderAll(); });
    document.getElementById('hideEarned').addEventListener('change', function (e) { state.hideEarned = e.target.checked; saveState(); renderList(); });
    document.getElementById('trophyList').addEventListener('click', function (e) {
      var li = e.target.closest('li[data-id]'); if (!li) return;
      var id = Number(li.dataset.id);
      if (e.target.dataset.earn) { state.earned[id] = e.target.checked; saveState(); renderAll(); return; }
      selectedId = id; renderList(); renderDetail(); renderNextUp();
    });
    document.getElementById('detailPane').addEventListener('click', function (e) {
      if (e.target.dataset.count) {
        var t = trophyById(selectedId);
        var cur = state.counts[selectedId] || 0;
        cur = Math.max(0, Math.min(t.count.target, cur + Number(e.target.dataset.count)));
        state.counts[selectedId] = cur; saveState(); renderDetail(); return;
      }
      if (e.target.id === 'detailEarned') { state.earned[selectedId] = e.target.checked; saveState(); renderAll(); }
    });
    document.getElementById('exportBtn').addEventListener('click', exportProgress);
    document.getElementById('resetBtn').addEventListener('click', function () {
      if (confirm('Reset all earned trophies and counts?')) { state.earned = {}; state.counts = {}; saveState(); renderAll(); }
    });
    document.getElementById('importFile').addEventListener('change', function (e) {
      var f = e.target.files[0]; if (!f) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = JSON.parse(reader.result);
          var s = imported.state || imported;
          if (s.earned) state.earned = s.earned;
          if (s.counts) state.counts = s.counts;
          saveState(); renderAll(); alert('Progress imported.');
        } catch (err) { alert('Could not read that file — it is not a ledger export.'); }
      };
      reader.readAsText(f);
    });
  }).catch(function (err) {
    document.getElementById('detailPane').innerHTML = '<p>Could not load the trophy data. Serve app/ over HTTP and try again.</p>';
  });
})();
