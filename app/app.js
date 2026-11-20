/* Leonida Trophy Atlas — GTA 6 trophy guide & tracker.
   Static, offline. Data lives in data/trophies.json; progress lives in localStorage.
   Demo mode (?demo=1) seeds a sample state for screenshots only. */
(function () {
  "use strict";
  var DATA_URL = "data/trophies.json";
  var LS_EARNED = "lta-earned-v1";
  var LS_COUNTERS = "lta-counters-v1";
  var LS_SELECTED = "lta-selected-v1";

  var trophies = [];
  var sourceUrls = {};
  var earned = {};
  var counters = {};
  var selectedId = null;
  var spoilerSafe = false;

  var STAGES = [
    { n: 1, title: "Story, Part I — Chapters 1–2", note: "Play the opening chapters. Start the meditation set now: its first spot is in Chapter 1 and may not come back." },
    { n: 2, title: "Story, Part II — Chapters 3–4 & Finale", note: "Finish the story. Clear the character-locked side strands before the finale: Lucia-only and Jason-only strands close after it." },
    { n: 3, title: "Activities & Skills", note: "Stunts, the shooting range, drone races, races, fishing and the arcade. Most of these can be done any time." },
    { n: 4, title: "Collectibles & Exploration", note: "Cards, WAiNK spots, vehicles, the 52 areas of Leonida and the hidden moments. Tag and collect as you travel." },
    { n: 5, title: "Money & Mayhem", note: "Laundering, spending, garages, the Scooter Bros app, bank vaults and the heist-style trophies." },
    { n: 6, title: "Cleanup & Platinum", note: "The 100% checklist, the last challenges, and the platinum itself." }
  ];

  var DISPUTES = [
    { id: "D1", title: "The finale and the airport", trophies: ["You Gotta Know When to Get Off", "Catch Me If You Can"],
      settled: "Both are tied to the end of the story and the airport: the final mission ends the story, and the unscheduled departure is a free-roam moment at VCIA.",
      open: "Whether the departure can happen during the story mission, or only in free roam afterwards." },
    { id: "D2", title: "Stunts and the range", trophies: ["Cunning Stunts", "The Shootist"],
      settled: "250 stunts count toward the trophy out of 397 in the game, and the range wants gold in all 42 challenges.",
      open: "Whether 100% completion needs 300 stunts, as PowerPyx reports — the trophy itself stops at 250." },
    { id: "D3", title: "Nine activities", trophies: ["Master of None", "Top Fun"],
      settled: "Nine activity types, one try each, and 14 Top Fun drone race locations, one win each.",
      open: "The exact list of the nine activity types: the guides agree on the count, not yet on every member." },
    { id: "D4", title: "Cards and WAiNK", trophies: ["Don't Touch My Deck", "You WAiNKer!"],
      settled: "Three full card sets out of 18, and 100 WAiNK tags across landmarks, curiosities and sculptures.",
      open: "Which three card sets are quickest, and whether every spot type counts the same toward the 100." },
    { id: "D5", title: "Choices and challenges", trophies: ["Actions Speak Louder", "One Last Thing"],
      settled: "PSN tracks choices to 500, and there are 80 challenges in 8 groups of 10 — 50 are needed.",
      open: "Which decisions count toward the 500, and which challenge groups are the fastest 50." },
    { id: "D6", title: "The unconfirmed pair", trophies: ["Personal Best", "The Truth Is Out There"],
      settled: "Nothing yet. Both trophies are unconfirmed: no guide has pinned down what either one asks for.",
      open: "Everything. Wait for a confirmed method before chasing either one." }
  ];

  function $(id) { return document.getElementById(id); }
  function loadJSON(key, fallback) {
    try { var v = JSON.parse(localStorage.getItem(key)); return v === null || v === undefined ? fallback : v; }
    catch (e) { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* storage unavailable */ }
  }
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
  function sourceLink(name) {
    var url = sourceUrls[name];
    if (url) { return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(name) + "</a>"; }
    return esc(name);
  }
  function gradeBadge(g) { return '<span class="badge ' + esc(g) + '">' + esc(g) + "</span>"; }
  function isDemo() { return new URLSearchParams(window.location.search).get("demo") === "1"; }

  function seedDemo() {
    var demoEarned = [2, 3, 8, 10, 15, 17, 19, 21, 28, 35, 42, 52];
    demoEarned.forEach(function (id) { earned[id] = true; });
    counters[15] = 87; counters[17] = 12; counters[31] = 42; counters[35] = 64;
    counters[42] = 31; counters[52] = 125000; counters[14] = 61;
    saveJSON(LS_EARNED, earned); saveJSON(LS_COUNTERS, counters);
  }

  function earnedCount() {
    var n = 0;
    trophies.forEach(function (t) { if (earned[t.id]) n++; });
    return n;
  }

  function renderProgress() {
    var n = earnedCount();
    $("earnedCount").textContent = String(n);
    $("progressFill").style.width = (n / trophies.length * 100).toFixed(1) + "%";
    var g = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    var tot = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
    trophies.forEach(function (t) {
      tot[t.grade]++;
      if (earned[t.id]) g[t.grade]++;
    });
    $("gradeCounts").textContent = "Platinum " + g.platinum + "/" + tot.platinum +
      " · Gold " + g.gold + "/" + tot.gold + " · Silver " + g.silver + "/" + tot.silver +
      " · Bronze " + g.bronze + "/" + tot.bronze;
  }

  function trophyById(id) {
    for (var i = 0; i < trophies.length; i++) { if (trophies[i].id === id) return trophies[i]; }
    return null;
  }
  function trophyByName(name) {
    for (var i = 0; i < trophies.length; i++) { if (trophies[i].name === name) return trophies[i]; }
    return null;
  }
  function displayName(t) {
    if (spoilerSafe && t.kind === "story" && !earned[t.id]) { return "Story trophy (hidden)"; }
    return t.name;
  }
  function displayDesc(t) {
    if (spoilerSafe && t.kind === "story" && !earned[t.id]) { return "Hidden until earned."; }
    return t.description;
  }

  function filteredTrophies() {
    var q = ($("search").value || "").toLowerCase();
    var kind = $("kindFilter").value;
    var grade = $("gradeFilter").value;
    var missOnly = $("missableOnly").checked;
    var uncOnly = $("unconfirmedOnly").checked;
    var hideEarned = $("hideEarned").checked;
    return trophies.filter(function (t) {
      if (q && t.name.toLowerCase().indexOf(q) === -1 && t.description.toLowerCase().indexOf(q) === -1) return false;
      if (kind && t.kind !== kind) return false;
      if (grade && t.grade !== grade) return false;
      if (missOnly && !t.missable) return false;
      if (uncOnly && !t.unconfirmed) return false;
      if (hideEarned && earned[t.id]) return false;
      return true;
    });
  }

  function renderList() {
    var list = filteredTrophies();
    var html = "";
    if (list.length === 0) { html = "<p>No trophies match these filters.</p>"; }
    list.forEach(function (t) {
      var flags = "";
      if (t.missable) flags += ' <span class="flag miss">Missable</span>';
      if (t.hidden) flags += ' <span class="flag">Hidden</span>';
      if (t.unconfirmed) flags += ' <span class="flag unconf">Unconfirmed</span>';
      html += '<div class="card' + (earned[t.id] ? " earned" : "") + '" data-id="' + t.id + '">' +
        '<div class="row"><input type="checkbox" data-earn="' + t.id + '"' + (earned[t.id] ? " checked" : "") +
        ' aria-label="Mark ' + esc(t.name) + ' earned">' +
        '<span class="name">' + esc(displayName(t)) + "</span>" + gradeBadge(t.grade) + flags + "</div>" +
        '<p class="desc">' + esc(displayDesc(t)) + "</p>" +
        '<div class="meta">' + esc(t.kind) +
        (t.chapter ? " · Chapter " + t.chapter : "") +
        (t.count !== null && t.count !== undefined ? " · " + esc(t.countLabel) + ": " + t.count : "") +
        " · " + t.steps.length + " step" + (t.steps.length === 1 ? "" : "s") + "</div></div>";
    });
    $("trophyList").innerHTML = html;
  }

  function renderDetail() {
    var pane = $("detailPane");
    var t = selectedId ? trophyById(selectedId) : null;
    if (!t) { pane.innerHTML = "<p class='empty'>Pick a trophy to see its guide, steps and sources.</p>"; return; }
    var html = "<h2>" + esc(t.name) + "</h2>" + gradeBadge(t.grade);
    if (t.missable) html += ' <span class="flag miss">Missable</span>';
    if (t.hidden) html += ' <span class="flag">Hidden</span>';
    if (t.unconfirmed) html += ' <span class="flag unconf">Unconfirmed</span>';
    html += '<p class="desc">' + esc(t.description) + "</p>";
    html += '<p class="meta">Kind: ' + esc(t.kind) +
      (t.chapter ? " · Chapter " + t.chapter : "") +
      (t.count !== null && t.count !== undefined ? " · " + esc(t.countLabel) + ": " + t.count : "") + "</p>";
    if (t.unconfirmed) {
      html += '<div class="warnbox"><strong>Unconfirmed.</strong> No guide has pinned down this trophy yet. The step below is a best guess from the description, not a checked method.</div>';
    }
    html += '<p class="guide">' + esc(t.guide) + "</p>";
    html += "<ol>";
    t.steps.forEach(function (s) {
      html += "<li>" + esc(s.text) + '<div class="src">Sources: ' +
        s.sources.map(sourceLink).join(", ") + "</div></li>";
    });
    html += "</ol>";
    html += '<p class="src">All sources for this trophy: ' + t.sources.map(sourceLink).join(", ") + "</p>";
    pane.innerHTML = html;
  }

  function renderRoadmap() {
    var html = "";
    STAGES.forEach(function (st) {
      var members = trophies.filter(function (t) { return t.stage === st.n; });
      var done = members.filter(function (t) { return earned[t.id]; }).length;
      var pct = members.length ? Math.round(done / members.length * 100) : 0;
      html += '<div class="stage"><h3>Stage ' + st.n + " — " + esc(st.title) + "</h3>" +
        "<p>" + esc(st.note) + "</p>" +
        '<div class="bar"><div class="fill" style="width:' + pct + '%"></div></div>' +
        "<div>" + done + " / " + members.length + " earned (" + pct + "%)</div>" +
        '<div class="trophies">' + members.map(function (t) {
          return (earned[t.id] ? "✓ " : "○ ") + esc(t.name);
        }).join(" · ") + "</div></div>";
    });
    $("roadmapStages").innerHTML = html;
  }

  function renderMissables() {
    var miss = trophies.filter(function (t) { return t.missable; });
    var html = "";
    miss.forEach(function (t) {
      html += '<div class="card' + (earned[t.id] ? " earned" : "") + '" data-id="' + t.id + '">' +
        '<div class="row"><span class="name">' + esc(displayName(t)) + "</span>" + gradeBadge(t.grade) + "</div>" +
        '<p class="desc">' + esc(displayDesc(t)) + "</p>" +
        '<div class="meta">' + esc(t.kind) + (t.chapter ? " · Chapter " + t.chapter : "") + "</div></div>";
    });
    $("missableGrid").innerHTML = html;
    var chapters = [1, 2, 3, 4];
    var ch = "";
    chapters.forEach(function (c) {
      var members = trophies.filter(function (t) { return t.chapter === c; });
      ch += '<div class="chapter"><div class="ch">Chapter ' + c + "</div><div>" +
        members.map(function (t) { return esc(t.name) + (t.missable ? " (missable)" : ""); }).join(" · ") +
        "</div></div>";
    });
    ch += '<div class="chapter"><div class="ch">After story</div><div>Side-character finals, collectibles, activities and cleanup.</div></div>';
    $("chapterGrid").innerHTML = ch;
  }

  function renderCounters() {
    var counted = trophies.filter(function (t) { return t.count !== null && t.count !== undefined; });
    var html = "";
    counted.forEach(function (t) {
      var v = counters[t.id] || 0;
      var done = v >= t.count;
      html += '<div class="counter"><div class="cname">' + esc(t.name) + "</div>" +
        '<div class="cval">' + v + " <small>/ " + t.count + " " + esc(t.countLabel) + "</small>" +
        (done ? ' <span class="done">Done</span>' : "") + "</div>" +
        '<button type="button" data-dec="' + t.id + '" aria-label="Decrease">−</button>' +
        '<button type="button" data-inc="' + t.id + '" aria-label="Increase">+</button>' +
        '<button type="button" data-reset="' + t.id + '">Reset</button></div>';
    });
    $("counterList").innerHTML = html;
  }

  function renderSources() {
    var all = {};
    trophies.forEach(function (t) {
      t.sources.forEach(function (s) {
        if (!all[s]) all[s] = [];
        all[s].push(t.name);
      });
    });
    var names = Object.keys(all).sort();
    var html = '<table class="matrix"><thead><tr><th>Source</th><th class="num">Trophies backed</th><th>Where it is used</th></tr></thead><tbody>';
    names.forEach(function (s) {
      html += "<tr><td>" + sourceLink(s) + "</td><td class='num'>" + all[s].length + "</td><td>" +
        esc(all[s].slice(0, 6).join(", ")) + (all[s].length > 6 ? " … (+" + (all[s].length - 6) + " more)" : "") + "</td></tr>";
    });
    html += "</tbody></table>";
    $("sourceMatrix").innerHTML = html;
  }

  function renderDisputes() {
    var html = "";
    DISPUTES.forEach(function (d) {
      html += '<div class="dispute"><h3>' + d.id + " — " + esc(d.title) + "</h3>" +
        "<p><strong>Trophies:</strong> " + d.trophies.map(function (n) {
          var t = trophyByName(n);
          return t ? esc(t.name) + " (" + esc(t.grade) + ")" : esc(n);
        }).join(" · ") + "</p>" +
        '<p><span class="settled"><strong>Settled:</strong></span> ' + esc(d.settled) + "</p>" +
        '<p><span class="open"><strong>Still open:</strong></span> ' + esc(d.open) + "</p></div>";
    });
    $("disputePanels").innerHTML = html;
  }

  function renderAll() {
    renderProgress();
    renderList();
    renderDetail();
    renderRoadmap();
    renderMissables();
    renderCounters();
    renderSources();
    renderDisputes();
  }

  function bindEvents() {
    document.querySelectorAll(".tab").forEach(function (btn) {
      btn.addEventListener("click", function () {
        document.querySelectorAll(".tab").forEach(function (b) {
          b.classList.remove("active"); b.setAttribute("aria-selected", "false");
        });
        document.querySelectorAll(".panel").forEach(function (p) { p.classList.remove("active"); });
        btn.classList.add("active"); btn.setAttribute("aria-selected", "true");
        $("tab-" + btn.getAttribute("data-tab")).classList.add("active");
        try { history.replaceState(null, "", "#" + btn.getAttribute("data-tab")); } catch (e) { /* no history */ }
      });
    });
    ["search", "kindFilter", "gradeFilter", "missableOnly", "unconfirmedOnly", "hideEarned"].forEach(function (id) {
      $(id).addEventListener("input", renderList);
      $(id).addEventListener("change", renderList);
    });
    $("spoilerSafe").addEventListener("change", function (e) {
      spoilerSafe = e.target.checked;
      renderList(); renderMissables();
    });
    $("trophyList").addEventListener("click", function (e) {
      var card = e.target.closest(".card");
      if (!card) return;
      var id = parseInt(card.getAttribute("data-id"), 10);
      if (e.target.matches("input[data-earn]")) {
        earned[id] = e.target.checked;
        saveJSON(LS_EARNED, earned);
        renderProgress(); renderList(); renderRoadmap(); renderMissables();
        return;
      }
      selectedId = id;
      saveJSON(LS_SELECTED, selectedId);
      renderDetail();
    });
    $("missableGrid").addEventListener("click", function (e) {
      var card = e.target.closest(".card");
      if (!card) return;
      selectedId = parseInt(card.getAttribute("data-id"), 10);
      saveJSON(LS_SELECTED, selectedId);
      document.querySelector('.tab[data-tab="checklist"]').click();
      renderDetail();
    });
    $("counterList").addEventListener("click", function (e) {
      var inc = e.target.getAttribute("data-inc");
      var dec = e.target.getAttribute("data-dec");
      var rst = e.target.getAttribute("data-reset");
      var id = inc || dec || rst;
      if (!id) return;
      id = parseInt(id, 10);
      var t = trophyById(id);
      if (!t) return;
      var v = counters[id] || 0;
      if (inc) v = Math.min(t.count, v + 1);
      if (dec) v = Math.max(0, v - 1);
      if (rst) v = 0;
      counters[id] = v;
      saveJSON(LS_COUNTERS, counters);
      renderCounters();
    });
    $("exportBtn").addEventListener("click", function () {
      var blob = new Blob([JSON.stringify({ earned: earned, counters: counters }, null, 2)], { type: "application/json" });
      var a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "leonida-trophy-atlas-progress.json";
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
    });
    $("importBtn").addEventListener("click", function () { $("importFile").click(); });
    $("importFile").addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var data = JSON.parse(reader.result);
          if (data.earned) earned = data.earned;
          if (data.counters) counters = data.counters;
          saveJSON(LS_EARNED, earned); saveJSON(LS_COUNTERS, counters);
          renderAll();
        } catch (err) { alert("That file is not valid progress JSON."); }
      };
      reader.readAsText(file);
      e.target.value = "";
    });
  }

  function init() {
    earned = loadJSON(LS_EARNED, {});
    counters = loadJSON(LS_COUNTERS, {});
    selectedId = loadJSON(LS_SELECTED, null);
    fetch(DATA_URL).then(function (r) { return r.json(); }).then(function (data) {
      trophies = data.trophies || [];
      sourceUrls = data.sourceUrls || {};
      if (isDemo() && earnedCount() === 0 && Object.keys(counters).length === 0) { seedDemo(); }
      if (selectedId === null) { selectedId = 17; saveJSON(LS_SELECTED, selectedId); }
      bindEvents();
      renderAll();
      var hash = (window.location.hash || "").replace(/^#/, "");
      var tabBtn = hash ? document.querySelector('.tab[data-tab="' + hash + '"]') : null;
      if (tabBtn) { tabBtn.click(); }
    }).catch(function () {
      $("trophyList").innerHTML = "<p>Could not load data/trophies.json.</p>";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
