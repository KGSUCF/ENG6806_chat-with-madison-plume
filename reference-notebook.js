const topics = [
  ["electoral-college", /\belectoral[\s-]+(?:college|votes?)\b|\bpresidential\s+electors?\b/i],
  ["three-branches", /\b(?:three|3) (?:branches|parts)\b|\bbranches of (?:the (?:u\.?s\.? |federal )?)?government\b|\bseparation of powers\b|\bchecks and balances\b/i],
  ["bill-of-rights", /\bbill of rights\b|\b(?:first|1st) amendment\b/i],
  ["fed-independence", /(?=.*\b(?:fed(?:eral reserve)?|central bank)\b)(?=.*\b(?:independen\w*|autonom\w*|politic\w*|election\w*)\b)/i],
  ["inflation", /\binflation\b|\bconsumer price index\b|\bbuying power\b|(?=.*\bsandwich\b)(?=.*\b(?:cost|pric\w*|expensive)\b)/i],
  ["opportunity-cost", /\bopportunity costs?\b/i],
  ["check-a-source", /(?=.*\b(?:headlines?|stories|story|posts?|sources?|information)\b)(?=.*\b(?:check\w*|verif\w*|trust\w*|credib\w*|reliab\w*|true|accura\w*|believ\w*)\b)/i],
  ["percent-change", /\bpercent(?:age)? (?:change|increase|decrease)\b|(?=.*\b(?:up|rose|risen|increas\w*|down|fell|decreas\w*)\b)(?=.*\d\s*(?:%|percent\b))/i],
  ["photo-context", /\breverse image search\b|(?=.*\b(?:photos?|photographs?|pictures?|images?)\b)(?=.*\b(?:cropp\w*|caption\w*|mislead\w*|mislabel\w*|context|verif\w*)\b)/i],
];

export function parseNotebook(markdown) {
  const notes = new Map();
  for (const section of markdown.split(/^## /m).slice(1)) {
    const [title, tag, answer, ...links] = section.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const id = tag?.match(/^<!-- ref: ([a-z-]+) -->$/)?.[1];
    const sources = links.map(line => line.match(/^- \[([^\]]+)\]\((https:\/\/[^\s)]+)\)$/));
    if (!id || notes.has(id) || !answer || !sources.length || sources.some(link => !link)) {
      throw new Error(`Invalid notebook entry: ${title}`);
    }
    notes.set(id, { title, answer, sources: sources.map(([, label, url]) => ({ label, url })) });
  }
  return notes;
}

export function findNote(notes, question) {
  // A specific media example can also contain a generic request to check the source.
  const matches = topics.filter(([, pattern]) => pattern.test(question));
  const asksAboutFedIndependence = matches.some(([id]) => id === "fed-independence");
  const specific = matches.filter(([id]) => id !== "check-a-source" && !(asksAboutFedIndependence && id === "inflation"));
  const candidates = specific.length ? specific : matches;
  return candidates.length === 1 ? notes.get(candidates[0][0]) : undefined;
}
