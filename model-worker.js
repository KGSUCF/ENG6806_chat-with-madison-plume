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
let device;
let selectedModel;

const report = (type, details = {}) => self.postMessage({ type, ...details });

async function loadOn(target) {
  device = target;
  const { id, revision } = selectedModel;
  generator = await runtime.pipeline("text-generation", id, {
    device,
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
}

async function load(model) {
  selectedModel = models[model];
  runtime = await import(library);
  runtime.env.allowLocalModels = false;
  runtime.env.useBrowserCache = true;
  // Single-threaded WASM works on static hosts without cross-origin isolation.
  runtime.env.backends.onnx.wasm.numThreads = 1;
  let adapter;
  try {
    adapter = await navigator.gpu?.requestAdapter();
  } catch (error) {
    console.info("WebGPU adapter unavailable", error);
  }
  if (adapter) {
    try {
      await loadOn("webgpu");
    } catch (error) {
      console.info("WebGPU initialization failed; trying WASM", error);
      report("fallback");
    }
  }
  if (!generator) await loadOn("wasm");
  report("ready", { device });
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
  report("reply", { text: text.trim(), device });
}

self.onmessage = async ({ data }) => {
  try {
    if (data.type === "load") {
      await load(data.model);
    } else if (data.type === "ask") {
      try {
        await reply(data.messages);
      } catch (error) {
        if (device !== "webgpu") throw error;
        console.info("WebGPU generation failed; trying WASM", error);
        report("fallback");
        const previous = generator;
        generator = null;
        await previous.dispose().catch(console.info);
        await loadOn("wasm");
        await reply(data.messages);
      }
    }
  } catch (error) {
    console.error(error);
    report("error", { phase: data.type, recoverable: Boolean(generator) });
  }
};
