import { findNote, nextSuggestions, parseNotebook } from "./reference-notebook.js?v=8";

const byId = (id) => document.getElementById(id);
const send = byId("send");
const clear = byId("clear");
const composer = byId("composer");
const question = byId("question");
const transcript = byId("transcript");
const greeting = transcript.firstElementChild;
const starterButtons = byId("starter-buttons");
const announcement = byId("announcement");
const portrait = byId("portrait");
const caption = byId("portrait-caption");

let answering = false;
let notebook;
let suggestions = [];

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

function refreshControls() {
  send.disabled = answering || !question.value.trim();
  clear.disabled = answering || transcript.children.length === 1;
  question.readOnly = answering;
  for (const button of starterButtons.children) button.disabled = answering;
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

function addTurn(label, text, { user = false, sources = [] } = {}) {
  const turn = document.createElement("article");
  turn.className = user ? "turn user" : "turn";
  const heading = document.createElement("h3");
  heading.textContent = label;
  const body = document.createElement("p");
  body.textContent = text;
  turn.append(heading, body);
  if (sources.length) {
    const links = document.createElement("div");
    links.className = "reference-sources";
    for (const { label, url } of sources) {
      const link = document.createElement("a");
      link.href = url;
      link.textContent = label;
      links.append(link);
    }
    turn.append(links);
  }
  transcript.append(turn);
  transcript.scrollTop = transcript.scrollHeight;
}

starterButtons.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-question]");
  if (!button) return;
  question.value = button.dataset.question;
  refreshControls();
  question.focus();
});

question.addEventListener("input", refreshControls);
clear.addEventListener("click", () => {
  transcript.replaceChildren(greeting);
  announcement.textContent = "";
  setPortrait("idle", "Pull up a chair.");
  refreshControls();
});

composer.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = question.value.trim();
  if (!text || answering) return;
  answering = true;
  question.value = "";
  addTurn("You", text, { user: true });
  rotateSuggestions(text);
  refreshControls();
  setPortrait("thinking", "Let me check…");
  let note;
  let answer;
  try {
    note = findNote(await loadNotebook(), text);
    answer = note?.answer ?? "I don’t have a checked answer for that question. Try one topic below or browse the notebook.";
  } catch (error) {
    console.error(error);
    answer = "I couldn’t open the notebook. Try again or open it from the link above.";
  }
  addTurn("Madison", answer, { sources: note?.sources });
  announcement.textContent = `Madison says: ${answer}`;
  setPortrait("replying", note ? "From the notebook." : "Try another question.");
  answering = false;
  refreshControls();
});

rotateSuggestions("");
refreshControls();
