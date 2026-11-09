const byId = (id) => document.getElementById(id);
const model = byId("model");
const load = byId("load");
const send = byId("send");
const clear = byId("clear");
const composer = byId("composer");
const question = byId("question");
const transcript = byId("transcript");
const greeting = transcript.firstElementChild;
const starterButtons = [...document.querySelectorAll("[data-question]")];
const status = byId("model-status");
const progress = byId("progress");
const progressWrap = byId("progress-wrap");
const progressText = byId("progress-text");
const replyTime = byId("reply-time");
const announcement = byId("announcement");
const portrait = byId("portrait");
const caption = byId("portrait-caption");

let worker;
let character;
let activeModel;
let activeDevice;
let state = "idle";
let history = [];
let pending;

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
  model.disabled = busy;
  load.disabled = busy || ready;
  load.textContent = state === "loading" ? "Loading…" : ready ? "Model ready" : "Download model";
  send.disabled = busy || !ready || !question.value.trim();
  clear.disabled = busy || transcript.children.length === 1;
  question.readOnly = state === "asking";
  for (const button of starterButtons) button.disabled = state === "asking";
}

function resetConversation() {
  history = [];
  transcript.replaceChildren(greeting);
  replyTime.hidden = true;
  announcement.textContent = "";
  setPortrait("idle", "Pull up a chair.");
  refreshControls();
}

function engineName(device) {
  return device === "webgpu" ? "WebGPU · graphics processor" : "WASM · CPU";
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
    case "fallback":
      setStatus("Switching to WASM on your CPU…");
      if (pending) {
        pending.firstWord = null;
        pending.body.textContent = "Madison is thinking…";
        pending.turn.classList.add("pending");
        setPortrait("thinking", "Let me think…");
      }
      break;
    case "ready":
      activeModel = model.value;
      activeDevice = data.device;
      state = "ready";
      progressWrap.hidden = true;
      setStatus(`Ready on ${engineName(activeDevice)}.`);
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
      activeDevice = data.device;
      progressWrap.hidden = true;
      setStatus(`Ready on ${engineName(activeDevice)}.`);
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
  if (state === "loading" || state === "asking") return;
  const switching = Boolean(activeModel && activeModel !== model.value);
  state = "loading";
  activeModel = null;
  if (switching) resetConversation();
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
    worker = new Worker(new URL("./model-worker.js?v=2", import.meta.url), { type: "module" });
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
  setStatus(activeModel === model.value ? `Ready on ${engineName(activeDevice)}.` : "");
  refreshControls();
});

for (const button of starterButtons) {
  button.addEventListener("click", () => {
    question.value = button.dataset.question;
    refreshControls();
    question.focus();
  });
}

question.addEventListener("input", refreshControls);
clear.addEventListener("click", resetConversation);
composer.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = question.value.trim();
  if (!text || state !== "ready" || activeModel !== model.value) return;
  const messages = [
    { role: "system", content: character },
    ...history.map(({ role, content }) => ({ role, content: content.slice(0, 400) })),
    { role: "user", content: text },
  ];
  addTurn("You", text, "user");
  pending = {
    ...addTurn("Madison", "Madison is thinking…", "pending"),
    question: text,
    startedAt: performance.now(),
    firstWord: null,
  };
  announcement.textContent = "Madison is thinking.";
  question.value = "";
  state = "asking";
  replyTime.hidden = true;
  setPortrait("thinking", "Let me think…");
  refreshControls();
  worker.postMessage({ type: "ask", messages });
});
