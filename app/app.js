/* Leonida Trophy Atlas — tracker logic.
   Loads only data/trophies.json from this app's own folder, keeps progress
   in localStorage, and never makes a network request. */
(function () {
  "use strict";
  var STORE_KEY = "leonida-trophy-atlas-v1";
  var state = { earned: {}, counts: {}, spoiler: true, filter: "all", query: "", hideEarned: false, selectedId: null };
  var data = null;

  function loadState() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        var saved = JSON.parse(raw);
        if (saved.earned) state.earned = saved.earned;
        if (saved.counts) state.counts = saved.counts;
        if (typeof saved.spoiler === "boolean") state.spoiler = saved.spoiler;
      }
    } catch (e) { /* fresh start on bad stored data */ }
  }
  function saveState() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify({ earned: state.earned, counts: state.counts, spoiler: state.spoiler })); } catch (e) { /* storage full or blocked */ }
  }
  function $(id) { return document.getElementById(id); }
  function esc(text) {
    return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function isStory(t) { return t.kinds && t.kinds.indexOf("story") !== -1; }
  function isHiddenFromReader(t) { return state.spoiler && isStory(t) && !state.earned[t.id]; }
  function gradeLabel(t) { return t.grade.charAt(0).toUpperCase() + t.grade.slice(1); }

  function visibleTrophies() {
    var q = state.query.trim().toLowerCase();
    return data.trophies.filter(function (t) {
      if (state.hideEarned && state.earned[t.id]) return false;
      if (state.filter === "story" && !isStory(t)) return false;
      if (state.filter === "missable" && !t.missable) return false;
      if (state.filter === "collectibles" && !(t.kinds && t.kinds.indexOf("collectibles") !== -1)) return false;
      if (state.filter === "activities" && !(t.kinds && t.kinds.indexOf("activities") !== -1)) return false;
      if (state.filter === "online") return false;
      if (state.filter === "earned" && !state.earned[t.id]) return false;
      if (state.filter === "todo" && state.earned[t.id]) return false;
      if (q) {
        var hay = (t.name + " " + t.description + " " + (t.guide || "")).toLowerCase();
        if (hay.indexOf(q) === -1) return false;
      }
      return true;
    });
  }

  function tagHtml(t) {
    var tags = '<span class="tag grade-' + esc(t.grade) + '">' + esc(gradeLabel(t)) + '</span>';
    if (t.hidden) tags += '<span class="tag hidden-tag">Hidden</span>';
    if (t.missable) tags += '<span class="tag missable">Missable</span>';
    if (t.count) tags += '<span class="tag count-tag">' + esc(String(t.count.target)) + ' ' + esc(t.count.unit) + '</span>';
    if (t.unconfirmed) tags += '<span class="tag unconfirmed-tag">Unconfirmed detail</span>';
    return tags;
  }

  function renderList() {
    var list = $("trophyList");
    var items = visibleTrophies();
    if (state.filter === "online") {
      list.innerHTML = '<p class="detail-empty">No online trophies: all 55 trophies are earned in single-player Leonida. Try Story, Missable, Collectibles or Activities.</p>';
      return;
    }
    if (!items.length) { list.innerHTML = '<p class="detail-empty">No trophies match this filter yet.</p>'; return; }
    list.innerHTML = items.map(function (t) {
      var hidden = isHiddenFromReader(t);
      var name = hidden ? "Hidden story trophy — earn it to reveal" : t.name;
      var desc = hidden ? "Its name and description stay hidden while the spoiler setting is on." : t.description;
      var checked = state.earned[t.id] ? " checked" : "";
      var sel = state.selectedId === t.id ? " selected" : "";
      var earned = state.earned[t.id] ? " earned" : "";
      return '<button type="button" class="trophy-card' + sel + earned + '" data-id="' + t.id + '">' +
        '<input type="checkbox" data-check="' + t.id + '"' + checked + ' aria-label="Mark ' + esc(name) + ' earned">' +
        '<span><span class="trophy-name">' + esc(name) + '</span><span class="trophy-desc">' + esc(desc) + '</span><span class="trophy-tags">' + tagHtml(t) + '</span></span>' +
        '<span aria-hidden="true">' + (state.earned[t.id] ? "✓" : "○") + '</span></button>';
    }).join("");
  }

  function renderDetail() {
    var pane = $("detailPane");
    var t = null;
    if (state.selectedId != null) {
      data.trophies.forEach(function (x) { if (x.id === state.selectedId) t = x; });
    }
    if (!t) { pane.innerHTML = '<p class="detail-empty">Pick a trophy on the left to read its guide, steps and sources here.</p>'; return; }
    var hidden = isHiddenFromReader(t);
    var steps = (t.steps || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    var sources = (t.sources || []).map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    pane.innerHTML =
      "<h2>" + esc(hidden ? "Hidden story trophy" : t.name) + "</h2>" +
      '<p class="official">Official: &ldquo;' + esc(hidden ? "Hidden until earned" : t.description) + '&rdquo; — ' + esc(gradeLabel(t)) +
      (t.hidden ? " · Hidden on PlayStation" : "") + (t.missable ? " · Missable" : "") + "</p>" +
      '<p><label><input type="checkbox" id="detailCheck"' + (state.earned[t.id] ? " checked" : "") + '> Earned</label></p>' +
      (t.count ? "<p><strong>Count tracker:</strong> " + esc(String(t.count.target)) + " " + esc(t.count.unit) +
        " — your count: " + String(state.counts[t.id] || 0) + "</p>" : "") +
      (t.unconfirmed ? "<p><strong>Unconfirmed detail:</strong> part of this guide is not pinned down — see the Disputed tab before you act on it.</p>" : "") +
      "<h3>Sources</h3><ul class=\"detail-sources\">" + sources + "</ul>" +
      "<h3>Guide — what to do</h3><ol>" + steps + "</ol>" +
      "<p class=\"detail-sources\">Guide written in the author's own words for this entry; sources are cited, never copied.</p>";
    var box = $("detailCheck");
    if (box) box.addEventListener("change", function () { toggleEarned(t.id, box.checked); });
  }

  function renderProgress() {
    var earned = data.trophies.filter(function (t) { return state.earned[t.id]; }).length;
    $("progressText").textContent = earned + " of 55 earned";
    $("progressPct").textContent = Math.round(earned / 55 * 100) + "%";
    $("progressFill").style.width = (earned / 55 * 100) + "%";
  }

  function renderRoadmap() {
    $("roadmapList").innerHTML = (data.roadmap || []).map(function (s) {
      return "<li><h3>Stage " + s.stage + " — " + esc(s.title) + "</h3><p>" + esc(s.text) + "</p></li>";
    }).join("");
    var stageNames = ["", "First playthrough — the story", "Side strands & contacts", "Collectibles & exploration", "Activities & challenges", "Cleanup & platinum"];
    $("roadmapTableBody").innerHTML = [1, 2, 3, 4, 5].map(function (n) {
      var names = data.trophies.filter(function (t) { return t.stage === n; }).map(function (t) { return t.name; });
      return "<tr><td>" + n + "</td><td>" + esc(stageNames[n]) + "</td><td>" + esc(names.join(", ")) + "</td></tr>";
    }).join("");
  }

  function renderMissable() {
    var items = data.trophies.filter(function (t) { return t.missable; });
    $("missableList").innerHTML = items.map(function (t) {
      var checked = state.earned[t.id] ? " checked" : "";
      return '<button type="button" class="trophy-card' + (state.earned[t.id] ? " earned" : "") + '" data-id="' + t.id + '">' +
        '<input type="checkbox" data-check="' + t.id + '"' + checked + ' aria-label="Mark ' + esc(t.name) + ' earned">' +
        '<span><span class="trophy-name">' + esc(t.name) + '</span><span class="trophy-desc">' + esc(t.description) + '</span><span class="trophy-tags">' + tagHtml(t) + "</span></span>" +
        '<span aria-hidden="true">' + (state.earned[t.id] ? "✓" : "○") + "</span></button>";
    }).join("");
  }

  function renderCounts() {
    var items = data.trophies.filter(function (t) { return t.count; });
    $("countsList").innerHTML = items.map(function (t) {
      var mine = state.counts[t.id] || 0;
      return '<div class="count-row"><div><span class="count-target">' + esc(t.name) + ' — ' + esc(String(t.count.target)) + " " + esc(t.count.unit) +
        '</span><div class="count-sub">' + esc(t.description) + " · " + esc(gradeLabel(t)) + "</div></div>" +
        '<div class="count-controls"><button type="button" data-count-minus="' + t.id + '" aria-label="Decrease">−</button>' +
        "<output>" + mine + " / " + esc(String(t.count.target)) + "</output>" +
        '<button type="button" data-count-plus="' + t.id + '" aria-label="Increase">+</button></div></div>';
    }).join("");
  }

  function renderDisputed() {
    $("disputedList").innerHTML = (data.disputed || []).map(function (d) {
      return '<article class="disputed-card"><h3>' + esc(d.title) + " — " + esc(d.trophies.join(" · ")) + "</h3>" +
        '<p><span class="label">What is argued over: </span>' + esc(d.argued) + "</p>" +
        '<p><span class="label">What is settled: </span>' + esc(d.settled) + "</p></article>";
    }).join("");
  }

  function renderSources() {
    $("sourceList").innerHTML = (data.sources || []).map(function (s) { return "<li>" + esc(s.name) + "</li>"; }).join("");
  }

  function renderAll() { renderProgress(); renderList(); renderDetail(); renderMissable(); renderCounts(); }

  function toggleEarned(id, on) {
    if (on) state.earned[id] = true; else delete state.earned[id];
    saveState(); renderAll();
  }

  function showTab(name) {
    document.querySelectorAll(".tab").forEach(function (b) { b.classList.toggle("active", b.getAttribute("data-tab") === name); });
    document.querySelectorAll(".panel").forEach(function (p) { p.classList.toggle("active", p.id === "tab-" + name); });
  }

  function applyShotMode() {
    var params = new URLSearchParams(window.location.search);
    var shot = params.get("shot");
    if (!shot) return;
    if (shot === "cover") {
      [2, 3, 8, 9, 15, 17, 20, 25, 30, 35, 42, 52].forEach(function (id) { state.earned[id] = true; });
      state.selectedId = 17;
      state.spoiler = true;
      saveState();
      showTab("tracker");
    } else if (shot === "roadmap") { showTab("roadmap"); }
    else if (shot === "missable") { showTab("missable"); }
    else if (shot === "counts") { showTab("counts"); }
  }

  function init() {
    loadState();
    fetch("data/trophies.json").then(function (r) { return r.json(); }).then(function (json) {
      data = json;
      $("spoilerToggle").checked = state.spoiler;
      renderRoadmap(); renderDisputed(); renderSources(); renderAll(); applyShotMode(); renderAll();
      if (state.selectedId != null) renderDetail();
    }).catch(function () {
      $("trophyList").innerHTML = "<p>Could not load data/trophies.json — open this app over a local static server, not from a bare file path.</p>";
    });

    document.querySelectorAll(".tab").forEach(function (b) {
      b.addEventListener("click", function () { showTab(b.getAttribute("data-tab")); });
    });
    document.querySelectorAll(".filter").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".filter").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        state.filter = b.getAttribute("data-filter");
        renderList();
      });
    });
    $("searchBox").addEventListener("input", function (e) { state.query = e.target.value; renderList(); });
    $("spoilerToggle").addEventListener("change", function (e) { state.spoiler = e.target.checked; saveState(); renderAll(); });
    $("hideEarnedToggle").addEventListener("change", function (e) { state.hideEarned = e.target.checked; renderList(); });
    document.addEventListener("click", function (e) {
      var card = e.target.closest ? e.target.closest(".trophy-card") : null;
      var check = e.target.closest ? e.target.closest("[data-check]") : null;
      var plus = e.target.closest ? e.target.closest("[data-count-plus]") : null;
      var minus = e.target.closest ? e.target.closest("[data-count-minus]") : null;
      if (plus) {
        var pid = Number(plus.getAttribute("data-count-plus"));
        state.counts[pid] = (state.counts[pid] || 0) + 1;
        saveState(); renderCounts(); renderDetail(); return;
      }
      if (minus) {
        var mid = Number(minus.getAttribute("data-count-minus"));
        state.counts[mid] = Math.max(0, (state.counts[mid] || 0) - 1);
        saveState(); renderCounts(); renderDetail(); return;
      }
      if (check) { e.stopPropagation(); toggleEarned(Number(check.getAttribute("data-check")), check.checked); return; }
      if (card) { state.selectedId = Number(card.getAttribute("data-id")); renderList(); renderDetail(); }
    });
    $("exportBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify({ app: "Leonida Trophy Atlas", earned: state.earned, counts: state.counts }, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "leonida-trophy-atlas-progress.json";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
      $("ioNote").textContent = "Exported your progress file.";
    });
    $("importFile").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = JSON.parse(String(reader.result));
          if (imported.earned) state.earned = imported.earned;
          if (imported.counts) state.counts = imported.counts;
          saveState(); renderAll();
          $("ioNote").textContent = "Imported progress.";
        } catch (err) { $("ioNote").textContent = "That file is not a valid progress export."; }
      };
      reader.readAsText(file);
    });
    $("resetBtn").addEventListener("click", function () {
      if (window.confirm("Clear all earned trophies and counts?")) {
        state.earned = {}; state.counts = {}; state.selectedId = null;
        saveState(); renderAll();
        $("ioNote").textContent = "Progress cleared.";
      }
    });
  }
  document.addEventListener("DOMContentLoaded", init);
})();
