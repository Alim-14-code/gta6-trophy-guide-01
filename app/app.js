/* Leonida Trophy Atlas — checklist, roadmap, missables, counters, sources.
   All data comes from data/trophies.json (same origin). Progress lives in
   localStorage; nothing is sent anywhere. */
(function () {
  'use strict';

  var LS_EARNED = 'lta-earned-v1';
  var LS_COUNTERS = 'lta-counters-v1';
  var LS_SPOILER = 'lta-spoiler-v1';

  var data = null;
  var earned = new Set();
  var counters = {};
  var spoiler = false;
  var view = 'checklist';
  var selectedId = null;

  var $ = function (id) { return document.getElementById(id); };

  function loadState() {
    try { (JSON.parse(localStorage.getItem(LS_EARNED) || '[]')).forEach(function (id) { earned.add(id); }); } catch (e) {}
    try { counters = JSON.parse(localStorage.getItem(LS_COUNTERS) || '{}') || {}; } catch (e) { counters = {}; }
    spoiler = localStorage.getItem(LS_SPOILER) === '1';
  }
  function saveState() {
    try {
      localStorage.setItem(LS_EARNED, JSON.stringify(Array.from(earned)));
      localStorage.setItem(LS_COUNTERS, JSON.stringify(counters));
      localStorage.setItem(LS_SPOILER, spoiler ? '1' : '0');
    } catch (e) {}
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function sourceByName(name) {
    var i, s;
    for (i = 0; i < data.sources.length; i++) { s = data.sources[i]; if (s.name === name) return s; }
    return { name: name, url: null };
  }

  function srcChips(names) {
    return names.map(function (n) {
      var s = sourceByName(n);
      if (s.url) return '<a class="src-chip" href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(n) + '</a>';
      return '<span class="src-chip plain">' + esc(n) + '</span>';
    }).join('');
  }

  function trophyById(id) {
    var i;
    for (i = 0; i < data.trophies.length; i++) if (data.trophies[i].id === id) return data.trophies[i];
    return null;
  }

  function isUnconfirmed(t) {
    return t.steps.some(function (s) { return s.text.indexOf('Unconfirmed:') === 0; });
  }

  function auditNumbers() {
    var steps = 0, twoPlus = 0, one = 0, used = {};
    data.trophies.forEach(function (t) {
      t.steps.forEach(function (s) {
        steps++;
        if (s.sources.length >= 2) twoPlus++; else if (s.sources.length === 1) one++;
        s.sources.forEach(function (n) { used[n] = true; });
      });
    });
    return { steps: steps, twoPlus: twoPlus, one: one, sources: Object.keys(used).length };
  }

  function renderAudit() {
    var a = auditNumbers();
    $('auditBar').innerHTML =
      '<span><b>' + a.steps + '</b> claims cited</span>' +
      '<span><b>' + a.twoPlus + '</b> backed by 2+ sources</span>' +
      '<span><b>' + a.sources + '</b> sources</span>' +
      '<span><b>' + data.disputes.length + '</b> disagreements</span>' +
      '<span><b>' + data.counters.length + '</b> count trackers</span>' +
      '<span><b>' + data.trophies.length + '</b> trophies · 1 platinum, 2 gold, 6 silver, 46 bronze</span>';
    $('footStats').textContent = 'Data: ' + a.steps + ' cited steps (' + a.twoPlus + ' with 2+ sources, ' + a.one + ' single-source on unconfirmed trophies), ' +
      a.sources + ' named sources, ' + data.disputes.length + ' open disagreements, ' + data.counters.length + ' PSN count trackers.';
  }

  function renderProgress() {
    var total = data.trophies.length, got = earned.size;
    var pct = Math.round((got / total) * 100);
    $('progressText').textContent = got + ' / ' + total + ' earned';
    $('progressPct').textContent = pct + '%';
    $('progressFill').style.width = pct + '%';
  }

  function trophyRow(t) {
    var hiddenName = spoiler && t.hidden && !earned.has(t.id);
    var nameHtml = hiddenName ? '<span class="spoiled">' + esc(t.name) + '</span>' : esc(t.name);
    var descHtml = hiddenName ? '<span class="spoiled">' + esc(t.description) + '</span>' : esc(t.description);
    var tags = '';
    if (t.hidden) tags += '<span class="tag hidden">Hidden</span>';
    if (t.missable) tags += '<span class="tag missable">Possibly missable</span>';
    if (isUnconfirmed(t)) tags += '<span class="tag unconfirmed">Unconfirmed</span>';
    if (t.count) tags += '<span class="tag">' + esc(String(t.count)) + ' to go</span>';
    return '<div class="trophy' + (earned.has(t.id) ? ' earned' : '') + (selectedId === t.id ? ' selected' : '') +
      '" data-id="' + t.id + '" role="button" tabindex="0">' +
      '<input type="checkbox" data-earn="' + t.id + '"' + (earned.has(t.id) ? ' checked' : '') + ' aria-label="Earned: ' + esc(t.name) + '">' +
      '<div><div class="tname">' + nameHtml + '</div><div class="tdesc">' + descHtml + '</div><div>' + tags + '</div></div>' +
      '<span class="grade ' + t.grade + '">' + t.grade + '</span></div>';
  }

  function filteredTrophies() {
    var q = ($('search').value || '').toLowerCase();
    var kind = $('kindFilter').value, grade = $('gradeFilter').value;
    var missOnly = $('missableOnly').checked, hideEarned = $('hideEarned').checked;
    return data.trophies.filter(function (t) {
      if (kind && t.kind !== kind) return false;
      if (grade && t.grade !== grade) return false;
      if (missOnly && !t.missable) return false;
      if (hideEarned && earned.has(t.id)) return false;
      if (q) {
        var hay = (t.name + ' ' + t.description + ' ' + t.guide + ' ' + t.kind).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function renderChecklist() {
    var list = filteredTrophies();
    var html = '<h2>Checklist — ' + list.length + ' of ' + data.trophies.length + ' trophies</h2>' +
      '<p class="muted">Tick a trophy when it pops. Progress saves in this browser and can be exported below. Spoiler-safe hides hidden story trophies until you earn them.</p>';
    if (!list.length) html += '<p class="muted">No trophies match these filters.</p>';
    list.forEach(function (t) { html += trophyRow(t); });
    $('viewPanel').innerHTML = html;
    bindRows();
  }

  function renderRoadmap() {
    var html = '<h2>Roadmap to the platinum</h2>' +
      '<p class="muted">Six stages in the order to earn them. Roughly 200 hours in all: 60–80 for the story, about 100 for the 100% checklist, about 10 for Strangers &amp; Freaks and cleanup (PowerPyx).</p>';
    data.stages.forEach(function (st) {
      var members = data.trophies.filter(function (t) { return t.stage === st.n; });
      var got = members.filter(function (t) { return earned.has(t.id); }).length;
      var pct = members.length ? Math.round((got / members.length) * 100) : 0;
      html += '<div class="stage"><div class="stage-head"><b>Stage ' + st.n + ' — ' + esc(st.title) + '</b><span>' + got + '/' + members.length + ' · ' + pct + '%</span></div>' +
        '<div class="bar"><i style="width:' + pct + '%"></i></div><p class="muted">' + esc(st.blurb) + '</p><ul>' +
        members.map(function (t) { return '<li>' + (earned.has(t.id) ? '✓ ' : '') + esc(t.name) + ' <span class="grade ' + t.grade + '">' + t.grade + '</span></li>'; }).join('') +
        '</ul></div>';
    });
    $('viewPanel').innerHTML = html;
  }

  function renderMissables() {
    var miss = data.trophies.filter(function (t) { return t.missable; });
    var unc = data.trophies.filter(function (t) { return isUnconfirmed(t); });
    var chapters = [1, 2, 3, 4, 5, 6];
    var html = '<h2>Missables &amp; the unknown</h2>' +
      '<p class="muted">Only one trophy is flagged as possibly missable. Everything else can be finished in free roam after the story — there is no mission replay, so keep a manual save at the start of each chapter.</p>' +
      '<h3>Possibly missable (' + miss.length + ')</h3>';
    miss.forEach(function (t) { html += trophyRow(t); });
    html += '<h3>Unconfirmed triggers (' + unc.length + ')</h3><p class="muted">No guide has confirmed how these unlock. Their guides paraphrase the official description only and say so — do not chase rumoured triggers.</p>';
    unc.forEach(function (t) { html += trophyRow(t); });
    html += '<h3>Missable grid — by roadmap stage</h3><p class="muted">One flag per stage: only Stage 5 (meditation) carries a missable trophy.</p>';
    chapters.forEach(function (n) {
      var members = data.trophies.filter(function (t) { return t.stage === n; });
      var flags = members.filter(function (t) { return t.missable || isUnconfirmed(t); });
      html += '<p><b>Stage ' + n + ':</b> ' + members.length + ' trophies · ' +
        (flags.length ? flags.map(function (t) { return esc(t.name) + (t.missable ? ' (possibly missable)' : ' (unconfirmed)'); }).join(', ') : 'nothing missable') + '</p>';
    });
    $('viewPanel').innerHTML = html;
    bindRows();
  }

  function renderCounters() {
    var html = '<h2>PSN count trackers — 20</h2>' +
      '<p class="muted">The numbers PlayStation tracks for these trophies. Tap + / − as you go; counts save in this browser.</p>';
    data.counters.forEach(function (c) {
      var v = counters[c.id] || 0;
      var pct = c.target ? Math.min(100, Math.round((v / c.target) * 100)) : 0;
      html += '<div class="counter"><div><div class="clabel">' + esc(c.label) + '</div>' +
        '<div class="cval">Target ' + c.target.toLocaleString('en-US') + ' ' + esc(c.unit) + '</div></div>' +
        '<div class="cbtns"><button type="button" data-dec="' + c.id + '" aria-label="Decrease">−</button>' +
        '<span class="cnum">' + v.toLocaleString('en-US') + '</span>' +
        '<button type="button" data-inc="' + c.id + '" aria-label="Increase">+</button></div>' +
        '<div class="cbar"><i style="width:' + pct + '%"></i></div></div>';
    });
    $('viewPanel').innerHTML = html;
  }

  function renderSources() {
    var html = '<h2>Sources &amp; disagreements</h2>' +
      '<p class="muted">Every guide step in this atlas cites its sources by name; a link opens only when you follow it. The app itself fetches nothing.</p>' +
      '<h3>Source matrix — ' + data.sources.length + ' sources</h3><table class="src-table"><tr><th>Source</th><th>What it covers here</th></tr>';
    data.sources.forEach(function (s) {
      html += '<tr><td>' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name)) +
        '</td><td>' + esc(s.covers) + '</td></tr>';
    });
    html += '</table><h3>Open disagreements (' + data.disputes.length + ')</h3>' +
      '<p class="muted">Where the guides disagree, both sides are shown instead of picking one silently.</p>';
    data.disputes.forEach(function (d) {
      html += '<div class="dispute"><h3>' + d.id.toUpperCase() + ' — ' + esc(d.title) + '</h3>' +
        '<p><b>Side A:</b> ' + esc(d.a) + '</p><p><b>Side B:</b> ' + esc(d.b) + '</p>' +
        '<p class="muted">Trophies: ' + d.trophies.map(esc).join(', ') + '</p></div>';
    });
    $('viewPanel').innerHTML = html;
  }

  function renderDetail() {
    var pane = $('detailPane');
    var t = selectedId ? trophyById(selectedId) : null;
    if (!t) { pane.innerHTML = '<p class="detail-empty">Select a trophy to see its cited guide, steps and sources.</p>'; return; }
    var hiddenName = spoiler && t.hidden && !earned.has(t.id);
    var html = '<h2>' + (hiddenName ? '<span class="spoiled">' + esc(t.name) + '</span>' : esc(t.name)) + '</h2>' +
      '<p><span class="grade ' + t.grade + '">' + t.grade + '</span> ' +
      (t.hidden ? '<span class="tag hidden">Hidden</span> ' : '') +
      (t.missable ? '<span class="tag missable">Possibly missable</span> ' : '') +
      (isUnconfirmed(t) ? '<span class="tag unconfirmed">Unconfirmed</span>' : '') + '</p>' +
      '<p class="muted">' + (hiddenName ? '<span class="spoiled">' + esc(t.description) + '</span>' : esc(t.description)) + '</p>' +
      '<p class="guide">' + esc(t.guide) + '</p>';
    if (t.missable) html += '<div class="warn">Possibly missable — do the Chapter 1 balcony meditation before leaving Chapter 1 (see Positive Mental Attitude, dispute d2).</div>';
    if (isUnconfirmed(t)) html += '<div class="warn">Unconfirmed trigger — no guide has verified how this unlocks. This guide paraphrases the official description only.</div>';
    t.steps.forEach(function (s, i) {
      html += '<div class="step"><p><b>Step ' + (i + 1) + '.</b> ' + esc(s.text) + '</p><div>' + srcChips(s.sources) + '</div></div>';
    });
    html += '<p><label class="check"><input type="checkbox" data-earn="' + t.id + '"' + (earned.has(t.id) ? ' checked' : '') + '> Earned</label></p>';
    pane.innerHTML = html;
  }

  function renderAll() {
    renderProgress();
    if (view === 'checklist') renderChecklist();
    else if (view === 'roadmap') renderRoadmap();
    else if (view === 'missables') renderMissables();
    else if (view === 'counters') renderCounters();
    else renderSources();
    renderDetail();
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === view);
    });
  }

  function bindRows() {
    document.querySelectorAll('.trophy').forEach(function (row) {
      row.addEventListener('click', function (ev) {
        if (ev.target && ev.target.getAttribute && ev.target.getAttribute('data-earn')) return;
        selectedId = parseInt(row.getAttribute('data-id'), 10);
        renderAll();
      });
      row.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); selectedId = parseInt(row.getAttribute('data-id'), 10); renderAll(); }
      });
    });
  }

  function bindGlobal() {
    document.querySelectorAll('.tabs button').forEach(function (b) {
      b.addEventListener('click', function () { view = b.getAttribute('data-view'); renderAll(); });
    });
    ['search', 'kindFilter', 'gradeFilter'].forEach(function (id) {
      $(id).addEventListener('input', function () { if (view !== 'checklist') { view = 'checklist'; } renderAll(); });
    });
    $('missableOnly').addEventListener('change', function () { view = 'checklist'; renderAll(); });
    $('hideEarned').addEventListener('change', function () { view = 'checklist'; renderAll(); });
    $('spoilerToggle').addEventListener('change', function () { spoiler = $('spoilerToggle').checked; saveState(); renderAll(); });
    document.addEventListener('change', function (ev) {
      var el = ev.target;
      if (el && el.getAttribute && el.getAttribute('data-earn')) {
        var id = parseInt(el.getAttribute('data-earn'), 10);
        if (el.checked) earned.add(id); else earned.delete(id);
        saveState(); renderAll();
      }
    });
    document.addEventListener('click', function (ev) {
      var el = ev.target;
      if (!el || !el.getAttribute) return;
      var inc = el.getAttribute('data-inc'), dec = el.getAttribute('data-dec');
      if (inc) { counters[inc] = (counters[inc] || 0) + 1; saveState(); renderAll(); }
      if (dec) { counters[dec] = Math.max(0, (counters[dec] || 0) - 1); saveState(); renderAll(); }
    });
    $('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ earned: Array.from(earned), counters: counters, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'leonida-trophy-atlas-progress.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $('importBtn').addEventListener('click', function () { $('importFile').click(); });
    $('importFile').addEventListener('change', function () {
      var f = $('importFile').files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var obj = JSON.parse(String(r.result));
          if (Array.isArray(obj.earned)) { earned = new Set(obj.earned.filter(function (id) { return trophyById(id); })); }
          if (obj.counters && typeof obj.counters === 'object') counters = obj.counters;
          saveState(); renderAll();
        } catch (e) { alert('That file is not a Leonida Trophy Atlas export.'); }
      };
      r.readAsText(f);
      $('importFile').value = '';
    });
  }

  function init() {
    loadState();
    $('spoilerToggle').checked = spoiler;
    var params = new URLSearchParams(window.location.search);
    if (params.get('view')) view = params.get('view');
    if (params.get('trophy')) selectedId = parseInt(params.get('trophy'), 10) || null;
    if (params.get('spoiler') === '1') { spoiler = true; $('spoilerToggle').checked = true; }
    fetch('data/trophies.json').then(function (r) { return r.json(); }).then(function (d) {
      data = d;
      renderAudit();
      bindGlobal();
      renderAll();
    }).catch(function () {
      $('auditBar').textContent = 'Could not load data/trophies.json. Serve app/ from a static server (node serve.ts) and reload.';
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
