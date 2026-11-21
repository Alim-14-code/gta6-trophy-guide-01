// Detail pane: the mini-dossier for the selected trophy.
import { isEarned, trophyCount } from "./store.js";
import { spoilerHides } from "./filters.js";

export function disputeFor(trophy, data) {
  if (!trophy.disputed) return null;
  return data.disputed.find((group) => group.trophies.includes(trophy.name)) || null;
}

export function riskFlagHtml(trophy) {
  if (trophy.risk === "possible") return '<span class="flag possible">Possibly missable</span>';
  if (trophy.risk === "at-risk") return '<span class="flag at-risk">At risk</span>';
  if (trophy.risk === "unconfirmed") return '<span class="flag unconfirmed">Unconfirmed</span>';
  return "";
}

export function ourCallFor(trophy, data) {
  if (trophy.risk === "possible") {
    return "Possibly missable — the only one in this ledger. Do the Chapter 1 balcony meditation before the chapter closes; everything else here can wait until after the story.";
  }
  if (trophy.risk === "at-risk") {
    return "At risk, not lost. Its window narrows as the story advances, so do it early; it is not a second-playthrough trophy.";
  }
  if (trophy.risk === "unconfirmed") {
    return "Unconfirmed. The sources do not pin the trigger down, so treat the steps above as the best reading of the official description and read the Sources Differ panel before grinding.";
  }
  if (trophy.disputed) {
    return "Disputed, but the official description is clear. Follow the steps above; the dispute is over the exact spot or method, not over what the trophy asks for.";
  }
  return "Safe. No window to miss: it is earned in free roam or by replaying a mission, so take it whenever it suits the roadmap.";
}

function escapeLedgerHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function detailHtml(trophy, data, state) {
  const hidden = spoilerHides(state, trophy);
  const name = hidden ? "Hidden story trophy" : trophy.name;
  const description = hidden
    ? "Hidden on PlayStation until earned — the spoiler shield hides it. Earn it, or switch the shield off, to reveal it."
    : trophy.description;
  const earned = isEarned(state, trophy.id);
  const dispute = disputeFor(trophy, data);
  const windowSafe = trophy.risk === "none";

  let html = "";
  html += '<p class="d-grade"><span class="medal ' + trophy.grade + '"></span> ' + trophy.grade + " · Stage " + trophy.stage + " · " + (trophy.hidden ? "hidden" : "shown") + "</p>";
  html += "<h2>" + escapeLedgerHtml(name) + "</h2>";
  html += riskFlagHtml(trophy);
  if (trophy.disputed) html += '<span class="flag disputed">Disputed</span>';
  html += '<div class="d-official"><span class="lbl">Official description — as PlayStation publishes it</span>' + escapeLedgerHtml(description) + "</div>";
  html += '<div class="d-window' + (windowSafe ? " safe" : "") + '"><span class="lbl">Missable window</span><p>' + escapeLedgerHtml(trophy.window) + "</p></div>";

  if (trophy.count) {
    const current = trophyCount(state, trophy);
    html += '<div class="d-counter"><span class="lbl">Your count</span>'
      + '<button type="button" data-count-delta="-1" aria-label="Count down">−</button>'
      + '<span class="count-read">' + current + " / " + trophy.count.target + " <small>" + escapeLedgerHtml(trophy.count.unit) + "</small></span>"
      + '<button type="button" data-count-delta="1" aria-label="Count up">+</button></div>';
  } else {
    html += '<div class="d-counter"><span class="lbl">Your count</span><span class="count-read">One moment earns it <small>no count</small></span></div>';
  }

  html += '<div class="d-steps"><span class="lbl">Steps — every step cites its source</span><ol>';
  for (const step of trophy.steps) {
    html += "<li>" + escapeLedgerHtml(step.t) + ' <span class="cite">' + escapeLedgerHtml(step.c) + "</span></li>";
  }
  html += "</ol></div>";

  if (dispute) {
    html += '<div class="d-differ"><span class="lbl">Sources differ — ' + escapeLedgerHtml(dispute.title) + "</span>"
      + "<p><b>Argued:</b> " + escapeLedgerHtml(dispute.argued) + "</p>"
      + "<p><b>Settled:</b> " + escapeLedgerHtml(dispute.settled) + "</p></div>";
  }

  html += '<div class="d-call"><span class="lbl">Our call</span><p>' + escapeLedgerHtml(ourCallFor(trophy, data)) + "</p></div>";
  html += '<div class="d-earn"><button type="button" data-toggle-earned="' + trophy.id + '">' + (earned ? "Mark as not earned" : "Mark as earned") + "</button></div>";
  return html;
}

export function sourcesPaneHtml(trophy, data, state) {
  const hidden = spoilerHides(state, trophy);
  const name = hidden ? "Hidden story trophy" : trophy.name;
  const urlByName = new Map(data.sources.map((source) => [source.name, source.url]));
  let html = "<h2>Sources — " + escapeLedgerHtml(name) + "</h2><ul class=\"src-list\">";
  for (const sourceName of trophy.sources) {
    const url = urlByName.get(sourceName);
    html += "<li>" + escapeLedgerHtml(sourceName) + (url ? ' — <a href="' + escapeLedgerHtml(url) + '" target="_blank" rel="noopener">' + escapeLedgerHtml(url) + "</a>" : "") + "</li>";
  }
  html += "</ul>";
  html += '<p class="audit-note">A link opens only when you follow it; the ledger itself fetches nothing.</p>';
  return html;
}
