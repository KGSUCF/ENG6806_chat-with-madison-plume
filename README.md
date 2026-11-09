# Chat with Madison Plume

A single-page local AI experiment for ENG 6806, Humanities in the Age of AI. Madison Plume is the graphic novelist behind *We the People*, *It’s Not You, It’s the Economy*, and *Sherlock Hound and the Case of the Suspicious Headline*. A short character prompt draws on those books. The two models are pretrained.

## Use the app

1. Open the hosted page in a current version of Chrome or Edge.
2. Select **Small** and click **Download model**. A progress bar tracks the model weights. Once the model is ready, pick a starter question or type your own.
3. Pick **Larger** to try the same prompt with the comparison model. Downloading a different model starts a fresh chat. **New chat** clears the conversation without unloading the current model.

| Model | 8-bit ONNX weights | Use |
| --- | ---: | --- |
| [SmolLM2 135M Instruct](https://huggingface.co/onnx-community/SmolLM2-135M-Instruct-ONNX/tree/main/onnx) | ~136 MB | Start here |
| [SmolLM2 360M Instruct](https://huggingface.co/onnx-community/SmolLM2-360M-Instruct-ONNX/tree/main/onnx) | ~363 MB | Compare style, speed, and accuracy |

The tokenizer and runtime add to the first transfer. Transformers.js 3.8.1 downloads public assets and runs generation in a web worker. Small prefers WebGPU and falls back to WebAssembly (WASM) on the CPU. Larger uses WASM for compatibility after a report of scrambled replies. Browser storage can be cleared or evicted. A private window typically starts with a fresh cache. Prompts and replies stay in the current page and are sent only to its local worker. The model sees the two most recent exchanges and the current question. It has no live lookup.

## Edit and test

Use GitHub’s **Edit this file** button on [character.md](character.md) to change the persona, subject boundaries, or examples. For a fair comparison, use the same text and starting questions with both models. Record the engine shown below the model selector, since it affects reply time. Note the first download and reply time, whether Madison sounds like herself, and any made-up facts or repetition. Try an off-topic question and a fresh private window.

Suggested prompts:

- Why do we split the U.S. government into three branches?
- Why does the same sandwich cost more than it used to?
- A headline says crime is up 300%. What should I ask before I share it?
- A headline says sandwich prices doubled, and a politician promises to fix them by Friday. What would you check first?
- What is the weather in Philadelphia right now?

## GitHub Pages

The repository is ready for GitHub Pages as a static site. In **Settings → Pages**, choose **Deploy from a branch**, select **main** and **/ (root)**, and save. All app paths are relative to the site, including the character file and worker. To run locally, serve this directory over HTTP, for example with `python -m http.server 8000`, and open `http://localhost:8000`.

The portrait is animated in CSS in response to the chat state and follows the device’s reduced-motion setting.
