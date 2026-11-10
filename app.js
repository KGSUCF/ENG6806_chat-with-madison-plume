import { nextSuggestions, parseNotebook } from "./reference-notebook.js?v=9";

const byId = (id) => document.getElementById(id);
const clear = byId("clear");
const transcript = byId("transcript");
const greeting = transcript.firstElementChild;
const starterButtons = byId("starter-buttons");
const questionStatus = byId("question-status");
const announcement = byId("announcement");
const portrait = byId("portrait");
const caption = byId("portrait-caption");

let notebook;
let suggestions = [];

function setPortrait(pose, line) {
  portrait.dataset.pose = pose;
  caption.textContent = line;
}

function rotateSuggestions() {
  suggestions = nextSuggestions(suggestions, notebook);
  starterButtons.replaceChildren(...suggestions.map(({ id, label, prompt, category, symbol }) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.noteId = id;
    button.setAttribute("aria-label", `${category}. ${label}`);
    button.title = prompt;
    const icon = document.createElement("span");
    icon.className = "question-symbol";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = symbol;
    button.append(icon, label);
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
  const button = event.target.closest("button[data-note-id]");
  if (!button) return;
  const index = suggestions.findIndex(({ id }) => id === button.dataset.noteId);
  if (index < 0) return;
  const { id, prompt } = suggestions[index];
  const { answer, sources } = notebook.get(id);
  const restoreFocus = document.activeElement === button;
  addTurn("You", prompt, { user: true });
  addTurn("Madison", answer, { sources });
  announcement.textContent = `Madison says: ${answer}`;
  setPortrait("replying", "From the notebook.");
  rotateSuggestions();
  if (restoreFocus) starterButtons.children[index].focus({ preventScroll: true });
  clear.disabled = false;
});

clear.addEventListener("click", () => {
  transcript.replaceChildren(greeting);
  announcement.textContent = "";
  setPortrait("idle", "Pull up a chair.");
  starterButtons.firstElementChild?.focus({ preventScroll: true });
  clear.disabled = true;
});

async function openNotebook() {
  setPortrait("thinking", "Opening my notebook…");
  try {
    const response = await fetch(new URL("./reference-notebook.md", import.meta.url), { cache: "no-cache" });
    if (!response.ok) throw new Error(`Notebook file returned ${response.status}`);
    notebook = parseNotebook(await response.text());
    rotateSuggestions();
    questionStatus.hidden = true;
    setPortrait("idle", "Pick a question!");
  } catch (error) {
    console.error(error);
    questionStatus.textContent = "I couldn’t open the notebook. Reload the page or use the notebook link above.";
    setPortrait("idle", "Try again in a moment.");
  }
}

openNotebook();
