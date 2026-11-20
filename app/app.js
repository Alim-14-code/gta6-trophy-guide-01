// Leonida Trophy Atlas — static trophy guide + tracker. No network: reads only ./data/trophies.json.
(function () {
  'use strict';
  var LS_PROGRESS = 'leonida-trophy-atlas-v1';
  var LS_SPOILER = 'leonida-trophy-atlas-spoiler';
  var SEED_EARNED = ['just-like-paradise', 'paradise-lost', 'trust', 'master-of-none',
    'stick-fiddler', 'top-fun', 'baited-my-tackle', 'whip-it-good', 'on-the-spot',
    'treat-yo-self', 'catch-me-if-you-can', 'earn-cash-not-kudos', 'dime-on-the-dollar'];
  var params = new URLSearchParams(location.search);
  var view = params.get('view') || 'checklist';
  var selectedId = params.get('trophy') || null;
  var seed = params.has('seed');
  var state = { data: null, earned: {}, spoiler: false, q: '', grade: '', kind: '', status: '' };
  var viewEl = document.getElementById('view');
  var detailEl = document.getElementById('detail');

  function loadProgress() {
    if (seed) { SEED_EARNED.forEach(function (id) { state.earned[id] = true; }); return; }
    try {
      var raw = localStorage.getItem(LS_PROGRESS);
      if (raw) state.earned = JSON.parse(raw) || {};
    } catch (e) { state.earned = {}; }
    try { state.spoiler = localStorage.getItem(LS_SPOILER) === '1'; } catch (e) {}
  }
  function saveProgress() {
    try { localStorage.setItem(LS_PROGRESS, JSON.stringify(state.earned)); } catch (e) {}
  }
  function saveSpoiler() {
    try { localStorage.setItem(LS_SPOILER, state.spoiler ? '1' : '0'); } catch (e) {}
  }
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function srcById(id) {
    var list = state.data.sources;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function srcNames(ids) {
    return (ids || []).map(function (id) {
      var s = srcById(id);
      return s ? s.name : id;
    });
  }
  function srcLinks(ids) {
    return (ids || []).map(function (id) {
      var s = srcById(id);
      if (!s) return esc(id);
      return s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name);
    }).join(', ');
  }
  function trophyById(id) {
    var list = state.data.trophies;
    for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
    return null;
  }
  function isEarned(t) { return !!state.earned[t.id]; }
  function displayName(t) {
    if (state.spoiler && t.hidden && !isEarned(t)) return 'Trofi tersembunyi';
    return t.name;
  }
  function displayDesc(t) {
    if (state.spoiler && t.hidden && !isEarned(t)) return 'Aktifkan spoiler untuk melihat deskripsi trofi ini.';
    return t.description;
  }
  function gradeBadge(t) {
    return '<span class="badge b-' + t.grade + '">' + t.grade + '</span>';
  }
  function flags(t) {
    var out = '';
    if (t.missable) out += '<span class="flag miss">Mungkin missable</span>';
    if (t.unconfirmed) out += '<span class="flag unconf">Belum terkonfirmasi</span>';
    return out;
  }
  function updateHeader() {
    var list = state.data.trophies;
    var earned = list.filter(isEarned).length;
    var pct = Math.round(earned / list.length * 100);
    document.getElementById('earnedCount').textContent = earned;
    document.getElementById('progressFill').style.width = pct + '%';
    document.getElementById('progressPct').textContent = pct + '% menuju Platinum';
    var grades = ['platinum', 'gold', 'silver', 'bronze'];
    document.getElementById('gradeCounts').innerHTML = grades.map(function (g) {
      var tot = list.filter(function (t) { return t.grade === g; }).length;
      var got = list.filter(function (t) { return t.grade === g && isEarned(t); }).length;
      return '<span><b>' + got + '/' + tot + '</b> ' + g + '</span>';
    }).join('');
  }
  function filtered() {
    var q = state.q.toLowerCase();
    return state.data.trophies.filter(function (t) {
      if (state.grade && t.grade !== state.grade) return false;
      if (state.kind && t.kind !== state.kind) return false;
      if (state.status === 'earned' && !isEarned(t)) return false;
      if (state.status === 'unearned' && isEarned(t)) return false;
      if (q && (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase().indexOf(q) === -1) return false;
      return true;
    });
  }
  function renderChecklist() {
    var list = filtered();
    var html = '<p class="hint">' + list.length + ' dari 55 trofi ditampilkan. Centang trofi yang sudah didapat — progres tersimpan di browser ini.</p>';
    html += list.map(function (t) {
      var earned = isEarned(t);
      return '<div class="trow' + (earned ? ' earned' : '') + '" data-id="' + t.id + '">' +
        '<input type="checkbox" ' + (earned ? 'checked' : '') + ' data-check="' + t.id + '" aria-label="Tandai ' + esc(t.name) + '">' +
        '<div><div class="tname">' + gradeBadge(t) + esc(displayName(t)) + flags(t) + '</div>' +
        '<div class="tdesc">' + esc(displayDesc(t)) + '</div>' +
        '<div class="tmeta">' + esc(t.kind) + (t.chapter ? ' &middot; Chapter ' + t.chapter : '') +
        (t.psn ? ' &middot; target PSN: ' + esc(t.psn) : '') +
        ' &middot; ' + t.steps.length + ' langkah &middot; sumber: ' + esc(srcNames(t.sources).join(', ')) + '</div></div></div>';
    }).join('');
    viewEl.innerHTML = html;
  }
  function renderRoadmap() {
    var html = '<p class="hint">Enam tahap menuju Platinum. Progres tiap tahap mengikuti centangmu di Checklist.</p>';
    html += state.data.stages.map(function (st) {
      var items = st.trophies.map(trophyById).filter(Boolean);
      var got = items.filter(isEarned).length;
      var pct = items.length ? Math.round(got / items.length * 100) : 0;
      return '<div class="card"><h3>' + esc(st.title) + ' — ' + got + '/' + items.length + '</h3>' +
        '<div class="stagebar"><i style="width:' + pct + '%"></i></div><p>' + esc(st.desc) + '</p><p>' +
        items.map(function (t) {
          return '<span class="chip">' + (isEarned(t) ? '✓ ' : '') + esc(displayName(t)) + '</span>';
        }).join('') + '</p></div>';
    }).join('');
    viewEl.innerHTML = html;
  }
  function renderMissables() {
    var miss = state.data.trophies.filter(function (t) { return t.missable; });
    var unconf = state.data.trophies.filter(function (t) { return t.unconfirmed; });
    var chapters = [1, 2, 3, 4, 5];
    var html = '<div class="card"><h3>Yang mungkin missable</h3><p>Hanya satu trofi yang mungkin missable. Sisanya aman dikerjakan setelah cerita, di free-roam.</p>' +
      miss.map(function (t) {
        return '<p><b>' + gradeBadge(t) + esc(t.name) + '</b> — ' + esc(t.description) + '</p><p>' + esc(t.guide) + '</p>';
      }).join('') + '</div>';
    html += '<div class="card"><h3>Grid chapter</h3><div class="grid2">' + chapters.map(function (c) {
      var items = state.data.trophies.filter(function (t) { return t.chapter === c; });
      return '<div><b>Chapter ' + c + '</b><br>' + items.map(function (t) {
        return '<span class="chip">' + esc(displayName(t)) + '</span>';
      }).join('') + '</div>';
    }).join('') + '</div></div>';
    html += '<div class="card"><h3>Belum terkonfirmasi (' + unconf.length + ')</h3><p>Trofi-trofi ini belum punya metode terverifikasi di dua sumber independen. Panduan ini tidak menebak caranya.</p><p>' +
      unconf.map(function (t) { return '<span class="chip">' + esc(t.name) + '</span>'; }).join('') + '</p></div>';
    viewEl.innerHTML = html;
  }
  function renderCounters() {
    var html = '<p class="hint">20 tracker hitungan PSN. Angka target dari PSNProfiles dan panduan; isi progresmu sendiri di Checklist — tracker di sini menunjukkan target tiap trofi.</p><div class="kv">';
    html += state.data.trackers.map(function (tr) {
      var t = trophyById(tr.trophy);
      var got = t && isEarned(t) ? '✓' : '·';
      return '<div class="cell"><div class="num">' + got + ' ' + esc(String(tr.target)) + (tr.of ? '<span style="font-size:14px;color:var(--muted)"> / ' + esc(String(tr.of)) + '</span>' : '') + '</div>' +
        '<div class="lbl">' + esc(tr.label) + (tr.note ? ' — ' + esc(tr.note) : '') + '</div></div>';
    }).join('') + '</div>';
    viewEl.innerHTML = html;
  }
  function renderSources() {
    var totalSteps = 0, backed = 0;
    state.data.trophies.forEach(function (t) {
      t.steps.forEach(function (s) {
        totalSteps++;
        if ((s.sources || []).length >= 2) backed++;
      });
    });
    var html = '<p class="hint">Panduan ini mengutip ' + state.data.sources.length + ' sumber. ' + backed + ' dari ' + totalSteps + ' langkah didukung 2+ sumber; 6 langkah trofi belum terkonfirmasi sengaja tanpa sumber.</p>';
    html += '<table><tr><th>Sumber</th><th>Meliputi</th><th>Tauputan</th></tr>';
    html += state.data.sources.map(function (s) {
      var n = 0;
      state.data.trophies.forEach(function (t) { if (t.sources.indexOf(s.id) !== -1) n++; });
      return '<tr><td>' + (s.url ? '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.name) + '</a>' : esc(s.name)) +
        '</td><td>' + esc(s.covers) + '</td><td>' + n + ' trofi</td></tr>';
    }).join('') + '</table>';
    viewEl.innerHTML = html;
  }
  function renderDisputes() {
    var html = '<p class="hint">Enam sengketa yang dicatat panduan ini — tempat sumber-sumber berbeda pendapat atau metodenya belum pasti. Total ' +
      state.data.disputes.reduce(function (a, d) { return a + d.trophies.length; }, 0) + ' trofi tercakup.</p>';
    html += state.data.disputes.map(function (d) {
      return '<div class="card"><h3>' + d.id + ' — ' + esc(d.title) + '</h3><p>' + esc(d.text) + '</p><p class="src">Trofi: ' +
        d.trophies.map(function (id) { var t = trophyById(id); return t ? esc(t.name) : esc(id); }).join(', ') +
        '<br>Sumber: ' + esc(srcNames(d.sources).join(', ')) + '</p></div>';
    }).join('');
    viewEl.innerHTML = html;
  }
  function renderView() {
    document.querySelectorAll('#tabs button').forEach(function (b) {
      b.classList.toggle('active', b.getAttribute('data-view') === view);
    });
    if (view === 'roadmap') renderRoadmap();
    else if (view === 'missables') renderMissables();
    else if (view === 'counters') renderCounters();
    else if (view === 'sources') renderSources();
    else if (view === 'disputes') renderDisputes();
    else renderChecklist();
    updateHeader();
  }
  function renderDetail() {
    var t = selectedId ? trophyById(selectedId) : null;
    if (!t) {
      detailEl.innerHTML = '<p class="hint">Pilih satu trofi untuk melihat panduannya, langkah demi langkah, beserta sumbernya.</p>';
      return;
    }
    var html = '<h2>' + gradeBadge(t) + esc(displayName(t)) + flags(t) + '</h2>' +
      '<p class="desc">' + esc(displayDesc(t)) + '</p>' +
      '<p class="src">' + esc(t.kind) + (t.chapter ? ' &middot; Chapter ' + t.chapter : '') +
      (t.psn ? ' &middot; target PSN: ' + esc(t.psn) : '') + '</p>' +
      '<p class="guide">' + esc(t.guide) + '</p>';
    if (t.unconfirmed) {
      html += '<p><b>Belum terkonfirmasi.</b> Langkah di bawah ini bukan metode — hanya penanda bahwa trofi ini menunggu konfirmasi.</p>';
    }
    html += '<ol>' + t.steps.map(function (s) {
      return '<li>' + esc(s.text) + (s.sources && s.sources.length ?
        '<br><span class="src">Sumber: ' + srcLinks(s.sources) + '</span>' :
        '<br><span class="src">Tanpa sumber — belum terkonfirmasi.</span>') + '</li>';
    }).join('') + '</ol>';
    html += '<p class="src">Semua sumber trofi ini: ' + srcLinks(t.sources) + '</p>';
    detailEl.innerHTML = html;
  }
  function bind() {
    document.getElementById('tabs').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-view]');
      if (!b) return;
      view = b.getAttribute('data-view');
      renderView();
    });
    document.getElementById('search').addEventListener('input', function (e) {
      state.q = e.target.value; if (view !== 'checklist') { view = 'checklist'; } renderView();
    });
    document.getElementById('gradeFilter').addEventListener('change', function (e) {
      state.grade = e.target.value; renderView();
    });
    document.getElementById('kindFilter').addEventListener('change', function (e) {
      state.kind = e.target.value; renderView();
    });
    document.getElementById('statusFilter').addEventListener('change', function (e) {
      state.status = e.target.value; renderView();
    });
    var sp = document.getElementById('spoilerToggle');
    sp.checked = state.spoiler;
    sp.addEventListener('change', function () { state.spoiler = sp.checked; saveSpoiler(); renderView(); renderDetail(); });
    document.getElementById('exportBtn').addEventListener('click', function () {
      var blob = new Blob([JSON.stringify({ earned: Object.keys(state.earned).filter(function (k) { return state.earned[k]; }), exported: new Date().toISOString() }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'leonida-trophy-atlas-progress.json';
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    document.getElementById('importBtn').addEventListener('click', function () {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        try {
          var data = JSON.parse(r.result);
          var list = data.earned || [];
          state.earned = {};
          list.forEach(function (id) { state.earned[id] = true; });
          saveProgress(); renderView(); renderDetail();
        } catch (err) { alert('File import tidak valid.'); }
      };
      r.readAsText(f);
    });
    viewEl.addEventListener('click', function (e) {
      var row = e.target.closest('.trow');
      if (!row) return;
      if (e.target.matches('input[data-check]')) {
        var id = e.target.getAttribute('data-check');
        state.earned[id] = e.target.checked;
        if (!e.target.checked) delete state.earned[id];
        saveProgress(); renderView(); renderDetail();
        return;
      }
      selectedId = row.getAttribute('data-id');
      renderDetail();
    });
  }
  fetch('data/trophies.json').then(function (r) { return r.json(); }).then(function (data) {
    state.data = data;
    loadProgress();
    if (params.get('grade')) { state.grade = params.get('grade'); document.getElementById('gradeFilter').value = state.grade; }
    if (params.get('kind')) { state.kind = params.get('kind'); document.getElementById('kindFilter').value = state.kind; }
    if (params.get('spoiler') === '1') { state.spoiler = true; }
    var totalSteps = 0, backed = 0;
    data.trophies.forEach(function (t) {
      t.steps.forEach(function (s) { totalSteps++; if ((s.sources || []).length >= 2) backed++; });
    });
    document.getElementById('statLine').textContent =
      '55 trofi · ' + totalSteps + ' langkah panduan · ' + backed + ' langkah didukung 2+ sumber · ' +
      data.sources.length + ' sumber dikutip · 20 tracker hitungan PSN · 6 panel sengketa · 6 tahap roadmap.';
    bind();
    renderView();
    renderDetail();
  }).catch(function () {
    viewEl.innerHTML = '<p>Gagal memuat data/trophies.json. Buka lewat server lokal (node serve.ts) atau file yang sama.</p>';
  });
})();
