const groups = [
  { category: "U.S. government", symbol: "◆", entries: [
    ["electoral-college", "Electoral College?", "How does the Electoral College work?", /\belectoral[\s-]+(?:college|votes?)\b|\bpresidential\s+electors?\b/i],
    ["three-branches", "Why three branches?", "Why do we split the U.S. government into three branches?", /\b(?:three|3) (?:branches|parts)\b|\bbranches of (?:the (?:u\.?s\.? |federal )?)?government\b|\bseparation of powers\b|\bchecks and balances\b/i],
    ["bill-to-law", "How does a bill become law?", "How does a bill become a federal law?", /\bbill\b.*\b(?:become|becomes|pass\w*|sign\w*)\b|\bhow (?:are (?:federal )?laws made|does congress make laws)\b|\bpass(?:ing)? a (?:federal )?bill\b/i],
    ["federalism", "Who has which powers?", "How does federalism divide power between the U.S. government and the states?", /\bfederalism\b|\b(?:tenth|10th) amendment\b|(?=.*\b(?:federal|national)\b)(?=.*\bstate(?:s| government)?\b)(?=.*\b(?:power\w*|authorit\w*|responsibilit\w*)\b)/i],
    ["bill-of-rights", "What does the First Amendment protect?", "What does the First Amendment protect?", /\bbill of rights\b|\b(?:first|1st) amendment\b|\bfreedom of (?:speech|the press|religion|assembly)\b|\bright to (?:assemble peacefully|peaceful assembly|petition the government)\b/i],
    ["founding-documents", "Declaration or Constitution?", "How is the Declaration of Independence different from the Constitution?", /\bdeclaration of independence\b|\b(?:what is|what’s|what's) (?:the )?(?:u\.?s\.? )?constitution\b/i],
    ["amendment-process", "How do we amend the Constitution?", "How do we amend the Constitution?", /\bamend(?:ing)? (?:the )?constitution\b|\b(?:amendment|article v) process\b|\b(?:how|propos\w*|ratif\w*)\b.*\b(?:constitutional amendment|article v)\b/i],
  ] },
  { category: "U.S. economy", symbol: "$", entries: [
    ["fed-independence", "Why an independent Fed?", "Why does the Fed need to be independent?", /(?=.*\b(?:fed(?:eral reserve)?|central bank)\b)(?=.*\b(?:independen\w*|autonom\w*|politic\w*|election\w*)\b)/i],
    ["inflation", "Why pricier sandwiches?", "Why does the same sandwich cost more than it used to?", /\binflation\b|\bconsumer price index\b|\bbuying power\b|(?=.*\bsandwich\b)(?=.*\b(?:cost|pric\w*|expensive)\b)/i],
    ["interest-rates", "How do Fed rates affect loans?", "How do the Fed’s interest rates affect what I pay to borrow?", /\binterest rates?\b|\bfederal funds rate\b|\bfed (?:rates?|rate cuts?)\b|\bfed(?:eral reserve)? (?:rais\w*|cut\w*|lower\w*|hik\w*) (?:\w+ ){0,3}rates?\b|(?=.*\b(?:borrow\w*|loans?)\b)(?=.*\brates?\b)/i],
    ["supply-demand", "How do supply and demand move prices?", "How do supply and demand change prices?", /\bsupply and demand\b|\bdemand and supply\b/i],
    ["opportunity-cost", "What’s an opportunity cost?", "What is an opportunity cost?", /\bopportunity costs?\b/i],
    ["gdp", "What does GDP measure?", "What does GDP measure?", /\bgdp\b|\bgross domestic product\b/i],
    ["unemployment", "Who counts as unemployed?", "Who counts as unemployed in the U.S. unemployment rate?", /\bunemploy(?:ment|ed)\b|\blabor force\b/i],
  ] },
  { category: "Media literacy", symbol: "?", entries: [
    ["percent-change", "Crime up 300%?", "A headline says crime is up 300%. What should I ask before I share it?", /\bpercent(?:age)? (?:change|increase|decrease)\b|(?=.*\b(?:up|rose|risen|increas\w*|down|fell|decreas\w*)\b)(?=.*\d\s*(?:%|percent\b))/i],
    ["check-a-source", "Can I trust this headline?", "How do I know if a headline is true?", /(?=.*\b(?:headlines?|stories|story|posts?|sources?|information)\b)(?=.*\b(?:check\w*|verif\w*|trust\w*|credib\w*|reliab\w*|true|accura\w*|believ\w*)\b)/i],
    ["primary-sources", "What’s a primary source?", "What is the difference between a primary source and a secondary source?", /\b(?:primary|secondary) sources?\b/i],
    ["chart-axes", "Can a chart’s scale fool me?", "How can a chart’s scale make a small change look huge?", /(?=.*\b(?:chart|graph)s?\b)(?=.*\b(?:ax(?:is|es)|scales?|zero|start\w*|truncat\w*|mislead\w*)\b)/i],
    ["photo-context", "What can a photo crop hide?", "How can a cropped photo change what I think happened?", /\breverse image search\b|(?=.*\b(?:photos?|photographs?|pictures?|images?)\b)(?=.*\b(?:crops?|cropp\w*|caption\w*|mislead\w*|mislabel\w*|context|verif\w*)\b)/i],
    ["news-opinion", "News or opinion?", "How do I tell a news report from an opinion piece?", /\b(?:opinion (?:piece|column|journalism)|editorials?)\b|\bnews\b.*\bopinion\b/i],
    ["mean-median", "Mean or median?", "What is the difference between the mean and the median?", /\bmedian\b|\b(?:arithmetic mean|mean average)\b/i],
  ] },
];

const topics = groups.flatMap(({ entries }) => entries);

function matchTopic(question) {
  const matches = topics.filter(([, , , pattern]) => pattern.test(question)).map(([id]) => id);
  // The narrower question takes precedence over terms it naturally includes.
  const fedIndependence = matches.includes("fed-independence");
  const ratePolicy = matches.includes("interest-rates");
  const specific = matches.filter(id => id !== "check-a-source"
    && !(id === "inflation" && (fedIndependence || ratePolicy))
    && !(id === "interest-rates" && fedIndependence));
  const candidates = specific.length ? specific : matches;
  return candidates.length === 1 ? candidates[0] : undefined;
}

export function nextSuggestions(previous, question) {
  const asked = matchTopic(question);
  return groups.map(({ category, symbol, entries }, index) => {
    const current = entries.findIndex(([id]) => id === previous[index]?.id);
    const next = (current + 1) % entries.length;
    const [id, label, prompt] = entries[next][0] === asked
      ? entries[(next + 1) % entries.length]
      : entries[next];
    return { id, label, prompt, category, symbol };
  });
}

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
  return notes.get(matchTopic(question));
}
