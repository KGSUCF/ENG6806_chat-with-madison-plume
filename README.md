# Chat with Madison Plume

A browser-based chat for ENG 6806, Humanities in the Age of AI. Madison Plume is the graphic novelist behind *We the People*, *It’s Not You, It’s the Economy*, and *Sherlock Hound and the Case of the Suspicious Headline*.

## Use the app

Pick a question to see Madison’s answer immediately. Each choice points to a specific entry in the [reference notebook](reference-notebook.md). Her reply shows the exact explanation, an italic aside, and its source links in the same message. The current chat runs in the browser and uses the notebook directly.

**Pick a question** shows one prompt each for U.S. government (◆), the U.S. economy ($), and media literacy (?). All three rotate after each answer.

## Edit the notebook

Edit the explanations, asides, and source links in [reference-notebook.md](reference-notebook.md). Keep each entry’s topic ID, one explanation paragraph, an optional one-line aside wrapped in single asterisks, and bulleted HTTPS source links. To add a new topic, add its ID, button label, and full question to the appropriate category in [reference-notebook.js](reference-notebook.js).

The [earlier local-model comparison](https://github.com/KGSUCF/ENG6806_chat-with-madison-plume/tree/0f9a0c4d1b36c82d3ac169107b58bbd170a9c732) used Transformers.js to generate replies with two SmolLM2 models in the browser. It is available in the project history.

## GitHub Pages

The site is served from the root of the `main` branch. To run it locally, serve this directory over HTTP with `python -m http.server 8000` and open `http://localhost:8000`.

The portrait follows the device’s reduced-motion setting.
