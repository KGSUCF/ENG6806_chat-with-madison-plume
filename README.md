# Chat with Madison Plume

A browser-based chat for ENG 6806, Humanities in the Age of AI. Madison Plume is the graphic novelist behind *We the People*, *It’s Not You, It’s the Economy*, and *Sherlock Hound and the Case of the Suspicious Headline*.

## Use the app

- [Project cover](https://kgsucf.github.io/ENG6806_chat-with-madison-plume/cover/) summarizes the experiment, with excerpts from the project discussion and links to both versions.
- [Newest notebook version](https://kgsucf.github.io/ENG6806_chat-with-madison-plume/) gives checked answers with Madison’s italic asides.
- [Local AI demo](https://kgsucf.github.io/ENG6806_chat-with-madison-plume/local-model/) runs the earlier Transformers.js comparison with SmolLM2 135M and 360M. Choose a model and click **Download model**. For covered questions, the demo gives the model a checked note and shows it below the generated reply for comparison. The two small models can still make mistakes.

Pick a question to see Madison’s answer immediately. Each choice points to a specific entry in the [reference notebook](reference-notebook.md). Her reply shows the exact explanation, an italic aside, and its source links in the same message. The current chat runs in the browser and uses the notebook directly.

**Pick a question** shows one prompt each for U.S. government (◆), the U.S. economy ($), and media literacy (?). All three rotate after each answer.

Open either hosted page while connected. The newest notebook version can answer offline once the question cards appear. The AI demo can generate replies offline in the same open tab once the selected model says **Ready**. It loads the character and source notes before the model starts. Reloading the page, opening a fresh tab, or downloading a model for the first time can require a connection.

## Edit the notebook

Edit the explanations, asides, and source links in [reference-notebook.md](reference-notebook.md). Keep each entry’s topic ID, one explanation paragraph, an optional one-line aside wrapped in single asterisks, and bulleted HTTPS source links. To add a new topic, add its ID, button label, and full question to the appropriate category in [reference-notebook.js](reference-notebook.js).

The local AI demo keeps its own earlier [notebook](local-model/reference-notebook.md) and [character prompt](local-model/character.md) for the model comparison.

## GitHub Pages

The site is served from the root of the `main` branch. To run it locally, serve this directory over HTTP with `python -m http.server 8000` and open `http://localhost:8000`.

The portrait follows the device’s reduced-motion setting.
