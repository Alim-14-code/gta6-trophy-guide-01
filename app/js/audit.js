// Audit strip: every number is computed from the ledger's own data, never typed in.
export function computeLedgerAudit(data) {
  const trophies = data.trophies;
  let citedSteps = 0;
  for (const trophy of trophies) citedSteps += trophy.steps.filter((step) => step.c && step.c.trim()).length;
  return {
    citedSteps,
    guidesWithTwoSources: trophies.filter((trophy) => trophy.sources.length >= 2).length,
    guideTotal: trophies.length,
    sourceSites: data.sources.length,
    checkedDate: data.checkedDate,
    possibleMissable: trophies.filter((trophy) => trophy.risk === "possible").length,
    atRisk: trophies.filter((trophy) => trophy.risk === "at-risk").length,
    disputed: trophies.filter((trophy) => trophy.disputed).length,
    unconfirmed: trophies.filter((trophy) => trophy.risk === "unconfirmed").length,
  };
}

export function auditStripHtml(audit) {
  const cells = [
    "<b>" + audit.citedSteps + "</b> steps cited",
    "<b>" + audit.guidesWithTwoSources + "/" + audit.guideTotal + "</b> guides with 2+ sources",
    "<b>" + audit.sourceSites + "</b> source sites",
    "list checked <b>" + audit.checkedDate + "</b>",
    "<b>" + audit.possibleMissable + "</b> possibly missable",
    "<b>" + audit.atRisk + "</b> at risk",
    "<b>" + audit.disputed + "</b> disputed",
    "<b>" + audit.unconfirmed + "</b> unconfirmed",
  ];
  return cells.map((cell) => '<span class="audit-cell">' + cell + "</span>").join("");
}
