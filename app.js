import { findNote, nextSuggestions, parseNotebook } from "./reference-notebook.js?v=5";

const byId = (id) => document.getElementById(id);
const answerMode = byId("answer-mode");
const modelSetup = byId("model-setup");
const model = byId("model");
const load = byId("load");
const send = byId("send");
const clear = byId("clear");
const composer = byId("composer");
const question = byId("question");
const transcript = byId("transcript");
const greeting = transcript.firstElementChild;
const comparisonReference = byId("comparison-reference");
const starterButtons = byId("starter-buttons");
const status = byId("model-status");
const progress = byId("progress");
const progressWrap = byId("progress-wrap");
const progressText = byId("progress-text");
const replyTime = byId("reply-time");
const announcement = byId("announcement");
const portrait = byId("portrait");
const caption = byId("portrait-caption");
const readyStatus = "Ready on WASM · CPU.";

let worker;
let character;
let activeModel;
let state = "idle";
let history = [];
let pending;
let notebook;
let lastQuestion = "";
let suggestions = [];

const usesAI = () => answerMode.value === "ai";

async function loadNotebook() {
  if (!notebook) {
    const response = await fetch(new URL("./reference-notebook.md", import.meta.url), { cache: "no-cache" });
    if (!response.ok) throw new Error(`Notebook file returned ${response.status}`);
    notebook = parseNotebook(await response.text());
  }
  return notebook;
}

function setPortrait(pose, line) {
  portrait.dataset.pose = pose;
  caption.textContent = line;
}

function setStatus(message, error = false) {
  status.hidden = !message;
  status.textContent = message;
  status.dataset.error = String(error);
}

function setProgress(percent) {
  progressWrap.hidden = false;
  if (Number.isFinite(percent)) {
    progress.value = percent;
    progressText.textContent = `${percent}%`;
  } else {
    progress.removeAttribute("value");
    progressText.textContent = "";
  }
}

function refreshControls() {
  const busy = state === "loading" || state === "asking";
  const ready = activeModel === model.value;
  answerMode.disabled = busy;
  model.disabled = busy;
  load.disabled = busy || ready;
  load.textContent = state === "loading" ? "Loading…" : ready ? "Model ready" : "Download model";
  send.disabled = busy || (usesAI() && !ready) || !question.value.trim();
  clear.disabled = busy || transcript.children.length === 1;
  question.readOnly = state === "asking";
  for (const button of starterButtons.children) button.disabled = state === "asking";
}

function rotateSuggestions(question) {
  suggestions = nextSuggestions(suggestions, question);
  starterButtons.replaceChildren(...suggestions.map(({ label, prompt, category, symbol }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.question = prompt;
    button.setAttribute("aria-label", `${category}. ${prompt}`);
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = symbol;
    button.append(icon, ` ${label}`);
    return button;
  }));
}

function resetConversation() {
  history = [];
  lastQuestion = "";
  transcript.replaceChildren(greeting);
  comparisonReference.hidden = true;
  replyTime.hidden = true;
  announcement.textContent = "";
  setPortrait("idle", "Pull up a chair.");
  refreshControls();
}

function scrollToLatest() {
  transcript.scrollTop = transcript.scrollHeight;
}

function addTurn(label, text, className = "") {
  const turn = document.createElement("article");
  turn.className = `turn ${className}`.trim();
  const heading = document.createElement("h3");
  heading.textContent = label;
  const body = document.createElement("p");
  body.textContent = text;
  turn.append(heading, body);
  transcript.append(turn);
  scrollToLatest();
  return { turn, body };
}

function showSources(container, sources) {
  container.replaceChildren(...sources.map(({ label, url }) => {
    const link = document.createElement("a");
    link.href = url;
    link.textContent = label;
    return link;
  }));
}

function showReferenceReply(note, available) {
  const text = note?.answer ?? (available
    ? "I don’t have a checked note for that question. Try one topic below or browse the notebook."
    : "The notebook couldn’t load. Try again or open it from the link above.");
  const { turn } = addTurn(note ? `Notebook · ${note.title}` : "Reference notebook", text);
  if (note) {
    const sources = document.createElement("div");
    sources.className = "reference-sources";
    showSources(sources, note.sources);
    turn.append(sources);
  }
  announcement.textContent = text;
  setPortrait("replying", "From the notebook.");
  state = activeModel ? "ready" : "idle";
  scrollToLatest();
  refreshControls();
}

function handleError(phase, recoverable) {
  progressWrap.hidden = true;
  if (phase === "ask" && pending) {
    pending.turn.classList.remove("pending");
    pending.body.textContent = "The model ran into a snag. You can try that question again.";
    question.value = pending.question;
    announcement.textContent = pending.body.textContent;
    pending = null;
    setPortrait("idle", "One more try?");
  }
  if (!recoverable) {
    worker?.terminate();
    worker = null;
    activeModel = null;
  }
  state = activeModel ? "ready" : "idle";
  const message = phase === "load"
    ? "The model couldn’t load. Check your connection and try again in Chrome or Edge."
    : "A local reply failed. Try again or reload the model.";
  setStatus(message, true);
  refreshControls();
}

function receive({ data }) {
  switch (data.type) {
    case "progress":
      setProgress(data.percent);
      if (data.percent === 100 && state === "loading") setStatus("Preparing the model…");
      break;
    case "ready":
      activeModel = model.value;
      state = "ready";
      progressWrap.hidden = true;
      setStatus(readyStatus);
      refreshControls();
      break;
    case "chunk":
      if (pending.firstWord === null) {
        if (!data.text.trim()) return;
        pending.firstWord = performance.now();
        pending.body.textContent = "";
        pending.turn.classList.remove("pending");
        setPortrait("replying", "Here’s what I’d say.");
      }
      pending.body.append(data.text);
      scrollToLatest();
      break;
    case "reply": {
      const elapsed = (performance.now() - pending.startedAt) / 1000;
      const first = ((pending.firstWord ?? performance.now()) - pending.startedAt) / 1000;
      pending.body.textContent = data.text;
      pending.turn.classList.remove("pending");
      setPortrait("replying", "Here’s what I’d say.");
      announcement.textContent = `Madison says: ${data.text}`;
      history.push(
        { role: "user", content: pending.question },
        { role: "assistant", content: data.text },
      );
      history = history.slice(-4);
      pending = null;
      state = "ready";
      progressWrap.hidden = true;
      setStatus(readyStatus);
      replyTime.textContent = `First words in ${first.toFixed(1)} s · Full reply in ${elapsed.toFixed(1)} s`;
      replyTime.hidden = false;
      scrollToLatest();
      refreshControls();
      break;
    }
    case "error":
      handleError(data.phase, data.recoverable);
      break;
  }
}

load.addEventListener("click", async () => {
  if (!usesAI() || state === "loading" || state === "asking") return;
  const switching = Boolean(activeModel && activeModel !== model.value);
  state = "loading";
  activeModel = null;
  if (switching) {
    const draft = question.value || lastQuestion;
    resetConversation();
    question.value = draft;
  }
  worker?.terminate();
  worker = null;
  refreshControls();
  setStatus("Getting the model files…");
  setProgress();
  try {
    if (!character) {
      const response = await fetch(new URL("./character.md", import.meta.url), { cache: "no-cache" });
      if (!response.ok) throw new Error(`Character file returned ${response.status}`);
      character = (await response.text()).trim();
    }
    worker = new Worker(new URL("./model-worker.js?v=6", import.meta.url), { type: "module" });
    worker.onmessage = receive;
    worker.onerror = (event) => {
      console.error(event.message);
      handleError(state === "asking" ? "ask" : "load", false);
    };
    worker.postMessage({ type: "load", model: model.value });
  } catch (error) {
    console.error(error);
    handleError("load", false);
  }
});

model.addEventListener("change", () => {
  setStatus(activeModel === model.value ? readyStatus : "");
  refreshControls();
});

function syncMode() {
  const ai = usesAI();
  modelSetup.hidden = !ai;
  byId("mode-note").textContent = ai
    ? "Try the same question with both models. A notebook note appears below when the topic is covered."
    : "Read checked answers for covered topics. AI model comparison lets you try the two local models.";
  byId("answer-foot").textContent = ai
    ? "AI replies can get facts wrong. Madison has no live news or web lookup."
    : "Reference answers come from the notebook. Your questions stay on this device.";
  refreshControls();
}

answerMode.addEventListener("change", () => {
  const draft = question.value || lastQuestion;
  resetConversation();
  question.value = draft;
  syncMode();
});

starterButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-question]");
  if (!button) return;
  question.value = button.dataset.question;
  refreshControls();
  question.focus();
});

question.addEventListener("input", refreshControls);
clear.addEventListener("click", resetConversation);
composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = question.value.trim();
  const ai = usesAI();
  if (!text || state === "asking" || state === "loading" || (ai && activeModel !== model.value)) return;
  lastQuestion = text;
  question.value = "";
  replyTime.hidden = true;
  comparisonReference.hidden = true;
  addTurn("You", text, "user");
  state = "asking";
  rotateSuggestions(text);
  refreshControls();
  let note;
  let available = false;
  try {
    note = findNote(await loadNotebook(), text);
    available = true;
  } catch (error) {
    console.error(error);
  }
  if (!ai) {
    showReferenceReply(note, available);
    return;
  }
  if (note) {
    byId("comparison-title").textContent = `Notebook · ${note.title}`;
    byId("comparison-facts").textContent = note.answer;
    showSources(byId("comparison-sources"), note.sources);
    comparisonReference.hidden = false;
  }
  const prompt = note
    ? `Reference facts: ${note.answer}\n\nQuestion: ${text}\nExplain in plain English using the facts above.`
    : text;
  const messages = [
    { role: "system", content: character },
    ...history.map(({ role, content }) => ({ role, content: content.slice(0, 400) })),
    { role: "user", content: prompt },
  ];
  pending = {
    ...addTurn("Madison · AI reply", "Madison is thinking…", "pending"),
    question: text,
    startedAt: performance.now(),
    firstWord: null,
  };
  announcement.textContent = "Madison is thinking.";
  setPortrait("thinking", "Let me think…");
  worker.postMessage({ type: "ask", messages });
});

rotateSuggestions("");
syncMode();
