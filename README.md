# Chat with Madison Plume

A single-page local AI experiment for ENG 6806, Humanities in the Age of AI. Madison Plume is the graphic novelist behind *We the People*, *It’s Not You, It’s the Economy*, and *Sherlock Hound and the Case of the Suspicious Headline*. A short character prompt draws on those books. The two models are pretrained.

## Use the app

1. Open the hosted page in a current version of Chrome or Edge. In **Reference answers**, pick a starter question or type your own. The app shows the closest covered note and its sources, or says when there is no matching note. This mode runs without a model download.
2. Select **AI model comparison**, then **Small**, and click **Download model**. A progress bar tracks the model weights. Ask a question once the model is ready.
3. Pick **Larger** to try the same prompt with the comparison model. Switching modes or downloading a different model starts a fresh chat and keeps your question in the text box. **New chat** clears the conversation without unloading the current model.

**Try a question** shows one prompt each for U.S. government (◆), the U.S. economy ($), and media literacy (?). All three rotate after every question you send, including questions you type yourself.

| Model | 8-bit ONNX weights | Use |
| --- | ---: | --- |
| [SmolLM2 135M Instruct](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX/tree/main/onnx) | ~136 MB | Start here |
| [SmolLM2 360M Instruct](https://huggingface.co/onnx-community/SmolLM2-360M-Instruct-ONNX/tree/main/onnx) | ~363 MB | Compare style, speed, and accuracy |

The tokenizer and runtime add to the first transfer. Transformers.js 3.8.1 downloads public assets and runs generation in a web worker. Both models use WebAssembly (WASM) on the CPU for compatibility after reports of scrambled replies. Browser storage can be cleared or evicted. A private window typically starts with a fresh cache. Prompts and replies stay in the current page and are sent only to its local worker. The model sees the two most recent exchanges and the current question. It has no live lookup.

## Edit and test

Use GitHub’s **Edit this file** button on [character.md](character.md) to change the persona, subject boundaries, or examples. For a fair comparison, use the same text and starting questions with both models. Record the engine shown below the model selector, since it affects reply time. Note the first download and reply time, whether Madison sounds like herself, and any made-up facts or repetition. Try an off-topic question and a fresh private window.

Both models have a 144-token reply limit. When a reply reaches the limit, the chat labels it and puts any unfinished fragment under **Show unfinished text**. You can still inspect the full model output for the comparison.

Suggested prompts:

- Why do we split the U.S. government into three branches?
- How does the Electoral College work?
- Why does the Fed need to be independent?
- Why does the same sandwich cost more than it used to?
- A headline says crime is up 300%. What should I ask before I share it?
- A headline says sandwich prices doubled, and a politician promises to fix them by Friday. What would you check first?
- What is the weather in Philadelphia right now?

Edit the explanations and source links in [reference-notebook.md](reference-notebook.md). Keep each entry’s topic ID, one explanation paragraph, and bulleted HTTPS source links. To add a new topic, add a matching rule in [reference-notebook.js](reference-notebook.js). In AI model comparison, both models receive the same note for a covered topic. The note appears separately so readers can check it against the generated reply.

## GitHub Pages

The repository is ready for GitHub Pages as a static site. In **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/ (root)**, and save. All app paths are relative to the site, including the character file and worker. To run locally, serve this directory over HTTP, for example with `python -m http.server 8000`, and open `http://localhost:8000`.

The portrait is animated in CSS in response to the chat state and follows the device’s reduced-motion setting.
