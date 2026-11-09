const library = "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1/dist/transformers.min.js";

const models = {
  small: {
    id: "onnx-community/SmolLM2-135M-Instruct-ONNX",
    revision: "b8a5c0f183b78c55955a5364f610c36668b5e681",
  },
  large: {
    id: "onnx-community/SmolLM2-360M-Instruct-ONNX",
    revision: "fe7c7db4c8921c9e3fa1c65cfd296fb3b1b1a8f9",
  },
};

let runtime;
let generator;

const report = (type, details = {}) => self.postMessage({ type, ...details });

async function load(model) {
  const { id, revision } = models[model];
  runtime = await import(library);
  runtime.env.allowLocalModels = false;
  runtime.env.useBrowserCache = true;
  // Single-threaded WASM works on static hosts without cross-origin isolation.
  runtime.env.backends.onnx.wasm.numThreads = 1;
  // Both q8 models use the CPU after scrambled replies were reported.
  generator = await runtime.pipeline("text-generation", id, {
    device: "wasm",
    revision,
    dtype: "q8",
    progress_callback(event) {
      if (!event.file?.endsWith(".onnx")) return;
      if (event.status === "progress" && event.total > 0) {
        report("progress", { percent: Math.min(100, Math.floor(100 * event.loaded / event.total)) });
      } else if (event.status === "done") {
        report("progress", { percent: 100 });
      }
    },
  });
  report("ready");
}

async function reply(messages) {
  const streamer = new runtime.TextStreamer(generator.tokenizer, {
    skip_prompt: true,
    skip_special_tokens: true,
    callback_function(text) {
      if (text) report("chunk", { text });
    },
  });
  const [output] = await generator(messages, {
    max_new_tokens: 90,
    do_sample: false,
    repetition_penalty: 1.15,
    return_full_text: false,
    streamer,
  });
  const generated = output.generated_text;
  const text = typeof generated === "string" ? generated : generated.at(-1)?.content;
  if (!text?.trim()) throw new Error("The model returned no text.");
  report("reply", { text: text.trim() });
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") {
      await load(data.model);
    } else if (data.type === "ask") {
      await reply(data.messages);
    }
  } catch (error) {
    console.error(error);
    report("error", { phase: data.type, recoverable: Boolean(generator) });
  }
};
