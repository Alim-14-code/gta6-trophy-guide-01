// Roadmap rail: Next Up in roadmap order, and the five stages with their progress.
import { isEarned } from "./store.js";
import { riskFlagHtml } from "./detail.js";

function roadmapOrder(trophies) {
  return [...trophies].sort((a, b) => (a.stage - b.stage) || (a.id - b.id));
}

export function nextUpHtml(data, state) {
  const ordered = roadmapOrder(data.trophies);
  const next = ordered.filter((trophy) => !isEarned(state, trophy.id)).slice(0, 3);
  let html = "<h2>Next up — roadmap order</h2>";
  if (next.length === 0) {
    html += "<p>Every trophy is earned. Vice Got a Price! is yours.</p>";
    return html;
  }
  for (const trophy of next) {
    html += '<div class="next-item" data-select="' + trophy.id + '"><span class="medal ' + trophy.grade + '"></span><span><span class="t-name">' + trophy.name + '</span><br><span class="t-desc">Stage ' + trophy.stage + " · " + trophy.grade + "</span> " + riskFlagHtml(trophy) + "</span></div>";
  }
  return html;
}

export function roadmapHtml(data, state) {
  let html = "<h2>Roadmap to the platinum</h2>";
  for (const stage of data.roadmap) {
    const stageTrophies = data.trophies.filter((trophy) => trophy.stage === stage.stage);
    const earned = stageTrophies.filter((trophy) => isEarned(state, trophy.id)).length;
    const percent = stageTrophies.length ? Math.round((earned / stageTrophies.length) * 100) : 0;
    html += '<div class="stage-row"><div class="stage-head"><span>Stage ' + stage.stage + " — " + stage.title + "</span><span>" + earned + "/" + stageTrophies.length + "</span></div>"
      + '<div class="bar"><i style="width:' + percent + '%"></i></div>'
      + "<p>" + stage.text + "</p></div>";
  }
  return html;
}
