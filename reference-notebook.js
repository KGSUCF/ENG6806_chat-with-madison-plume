const groups = [
  { category: "U.S. government", symbol: "◆", entries: [
    ["electoral-college", "Electoral College?", "How does the Electoral College work?"],
    ["three-branches", "Why three branches?", "Why do we split the U.S. government into three branches?"],
    ["bill-to-law", "How does a bill become law?", "How does a bill become a federal law?"],
    ["federalism", "Who has which powers?", "How does federalism divide power between the U.S. government and the states?"],
    ["bill-of-rights", "What does the First Amendment protect?", "What does the First Amendment protect?"],
    ["founding-documents", "Declaration or Constitution?", "How is the Declaration of Independence different from the Constitution?"],
    ["amendment-process", "How do we amend the Constitution?", "How do we amend the Constitution?"],
  ] },
  { category: "U.S. economy", symbol: "$", entries: [
    ["fed-independence", "Why an independent Fed?", "Why does the Fed need to be independent?"],
    ["inflation", "Why pricier sandwiches?", "Why does the same sandwich cost more than it used to?"],
    ["interest-rates", "How do Fed rates affect loans?", "How do the Fed’s interest rates affect what I pay to borrow?"],
    ["supply-demand", "How do supply and demand move prices?", "How do supply and demand change prices?"],
    ["opportunity-cost", "What’s an opportunity cost?", "What is an opportunity cost?"],
    ["gdp", "What does GDP measure?", "What does GDP measure?"],
    ["unemployment", "Who counts as unemployed?", "Who counts as unemployed in the U.S. unemployment rate?"],
  ] },
  { category: "Media literacy", symbol: "?", entries: [
    ["percent-change", "Crime up 300%?", "A headline says crime is up 300%. What should I ask before I share it?"],
    ["check-a-source", "Can I trust this headline?", "How do I know if a headline is true?"],
    ["primary-sources", "What’s a primary source?", "What is the difference between a primary source and a secondary source?"],
    ["chart-axes", "Can a chart’s scale fool me?", "How can a chart’s scale make a small change look huge?"],
    ["photo-context", "What can a photo crop hide?", "How can a cropped photo change what I think happened?"],
    ["news-opinion", "News or opinion?", "How do I tell a news report from an opinion piece?"],
    ["mean-median", "Mean or median?", "What is the difference between the mean and the median?"],
  ] },
];

export function nextSuggestions(previous, notes) {
  return groups.map(({ category, symbol, entries }, index) => {
    const covered = entries.filter(([id]) => notes.has(id));
    if (!covered.length) throw new Error(`No notebook entries for ${category}`);
    const current = covered.findIndex(([id]) => id === previous[index]?.id);
    const [id, label, prompt] = covered[(current + 1) % covered.length];
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
