// Leonida Trophy Ledger boot: load the data, render the three panes, wire the tracker.
import {
  loadLedgerState, saveLedgerState, emptyLedgerState, isEarned, toggleEarned,
  trophyCount, changeTrophyCount, earnedPoints, totalPoints,
  exportLedgerState, parseImportedLedger,
} from "./store.js";
import { KIND_FILTERS, applyLedgerFilters, spoilerHides } from "./filters.js";
import { computeLedgerAudit, auditStripHtml } from "./audit.js";
import { detailHtml, sourcesPaneHtml, riskFlagHtml } from "./detail.js";
import { nextUpHtml, roadmapHtml } from "./roadmap.js";

const DEFAULT_SELECTED_ID = 28;

function escapeMainHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function bootLedger() {
  const response = await fetch("data/trophies.json");
  const data = await response.json();
  const trophies = data.trophies;
  const state = loadLedgerState();
  let selectedId = DEFAULT_SELECTED_ID;
  let kindFilter = "all";
  let query = "";

  const earnedCountEl = document.getElementById("earned-count");
  const earnedPointsEl = document.getElementById("earned-points");
  const totalPointsEl = document.getElementById("total-points");
  const gradeSplitEl = document.getElementById("grade-split");
  const auditStripEl = document.getElementById("audit-strip");
  const filtersEl = document.getElementById("kind-filters");
  const searchBox = document.getElementById("search-box");
  const spoilerBox = document.getElementById("spoiler-box");
  const trophyListEl = document.getElementById("trophy-list");
  const listCountEl = document.getElementById("list-count");
  const listEmptyEl = document.getElementById("list-empty");
  const detailEl = document.getElementById("detail-pane");
  const nextUpEl = document.getElementById("nextup-pane");
  const sourcesEl = document.getElementById("sources-pane");
  const roadmapEl = document.getElementById("roadmap-pane");

  function selectedTrophy() {
    return trophies.find((trophy) => trophy.id === selectedId) || trophies[0];
  }

  function renderHeader() {
    const earned = trophies.filter((trophy) => isEarned(state, trophy.id));
    earnedCountEl.textContent = String(earned.length);
    earnedPointsEl.textContent = String(earnedPoints(state, trophies));
    totalPointsEl.textContent = String(totalPoints(trophies).toLocaleString("en-US"));
    const grades = ["platinum", "gold", "silver", "bronze"];
    gradeSplitEl.innerHTML = grades.map((grade) => {
      const total = trophies.filter((trophy) => trophy.grade === grade).length;
      const got = earned.filter((trophy) => trophy.grade === grade).length;
      return '<span class="grade-chip"><span class="medal ' + grade + '"></span> ' + grade + " <b>" + got + "/" + total + "</b></span>";
    }).join("");
  }

  function renderList() {
    const visible = applyLedgerFilters(trophies, state, kindFilter, query);
    listCountEl.textContent = "showing " + visible.length + " of " + trophies.length;
    if (visible.length === 0) {
      listEmptyEl.hidden = false;
      listEmptyEl.textContent = kindFilter === "online"
        ? "The official list has no online trophies — every one of the 55 is earned offline, in the story, collectibles or activities."
        : "No trophies match this filter.";
    } else {
      listEmptyEl.hidden = true;
    }
    trophyListEl.innerHTML = visible.map((trophy) => {
      const hidden = spoilerHides(state, trophy);
      const name = hidden ? "Hidden story trophy" : trophy.name;
      const description = hidden ? "Hidden on PlayStation until earned." : trophy.description;
      const countLine = trophy.count
        ? '<span class="t-count">' + trophyCount(state, trophy) + "/" + trophy.count.target + " " + escapeMainHtml(trophy.count.unit) + "</span>"
        : "";
      return '<li data-id="' + trophy.id + '" class="' + (trophy.id === selectedId ? "selected " : "") + (isEarned(state, trophy.id) ? "earned" : "") + '">'
        + '<input type="checkbox" data-earned-box="' + trophy.id + '"' + (isEarned(state, trophy.id) ? " checked" : "") + ' aria-label="Earned: ' + escapeMainHtml(name) + '">'
        + '<span class="medal ' + trophy.grade + '"></span>'
        + '<span><span class="t-name">' + escapeMainHtml(name) + "</span><br>"
        + '<span class="t-desc">' + escapeMainHtml(description) + "</span><br>"
        + riskFlagHtml(trophy) + (trophy.disputed ? '<span class="flag disputed">Disputed</span>' : "") + "</span>"
        + '<span class="t-grade">' + trophy.grade + "<br>" + countLine + "</span></li>";
    }).join("");
  }

  function renderDetail() {
    const trophy = selectedTrophy();
    detailEl.innerHTML = detailHtml(trophy, data, state);
  }

  function renderRail() {
    const trophy = selectedTrophy();
    nextUpEl.innerHTML = nextUpHtml(data, state);
    sourcesEl.innerHTML = sourcesPaneHtml(trophy, data, state);
    roadmapEl.innerHTML = roadmapHtml(data, state);
  }

  function renderAll() {
    renderHeader();
    renderList();
    renderDetail();
    renderRail();
  }

  // Audit strip: computed once from the data, never typed in.
  auditStripEl.innerHTML = auditStripHtml(computeLedgerAudit(data));

  filtersEl.innerHTML = KIND_FILTERS.map((filter) => (
    '<button type="button" data-kind="' + filter.key + '" aria-pressed="' + (filter.key === kindFilter) + '">' + filter.label + "</button>"
  )).join("");
  spoilerBox.checked = state.spoiler;

  filtersEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-kind]");
    if (!button) return;
    kindFilter = button.dataset.kind;
    filtersEl.querySelectorAll("button").forEach((other) => {
      other.setAttribute("aria-pressed", String(other === button));
    });
    renderList();
  });

  searchBox.addEventListener("input", () => {
    query = searchBox.value;
    renderList();
  });

  spoilerBox.addEventListener("change", () => {
    state.spoiler = spoilerBox.checked;
    saveLedgerState(state);
    renderAll();
  });

  trophyListEl.addEventListener("click", (event) => {
    const row = event.target.closest("li[data-id]");
    if (!row) return;
    selectedId = Number(row.dataset.id);
    renderList();
    renderDetail();
    renderRail();
  });

  trophyListEl.addEventListener("change", (event) => {
    const box = event.target.closest("input[data-earned-box]");
    if (!box) return;
    toggleEarned(state, Number(box.dataset.earnedBox));
    renderAll();
  });

  detailEl.addEventListener("click", (event) => {
    const deltaButton = event.target.closest("button[data-count-delta]");
    if (deltaButton) {
      changeTrophyCount(state, selectedTrophy(), Number(deltaButton.dataset.countDelta));
      renderAll();
      return;
    }
    const toggleButton = event.target.closest("button[data-toggle-earned]");
    if (toggleButton) {
      toggleEarned(state, Number(toggleButton.dataset.toggleEarned));
      renderAll();
    }
  });

  document.getElementById("nextup-pane").addEventListener("click", (event) => {
    const item = event.target.closest("[data-select]");
    if (!item) return;
    selectedId = Number(item.dataset.select);
    renderList();
    renderDetail();
    renderRail();
  });

  document.getElementById("export-btn").addEventListener("click", () => {
    exportLedgerState(state);
  });

  document.getElementById("import-file").addEventListener("change", (event) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = parseImportedLedger(String(reader.result));
        state.earned = imported.earned;
        state.counts = imported.counts;
        state.spoiler = imported.spoiler;
        spoilerBox.checked = state.spoiler;
        saveLedgerState(state);
        renderAll();
      } catch (error) {
        window.alert("That file is not a Leonida Trophy Ledger export.");
      }
    };
    reader.readAsText(file);
    event.target.value = "";
  });

  document.getElementById("reset-btn").addEventListener("click", () => {
    if (!window.confirm("Clear all earned trophies and counts in this ledger?")) return;
    const fresh = emptyLedgerState();
    state.earned = fresh.earned;
    state.counts = fresh.counts;
    saveLedgerState(state);
    renderAll();
  });

  renderAll();
}

bootLedger();
