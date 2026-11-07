// All synchronous MoonBit work runs off the UI thread, including prefill.
import * as engine from './web.js';

let handle = null;
self.onmessage = ({ data }) => {
  const { id, type } = data;
  const send = (event, payload = {}) => self.postMessage({ id, event, ...payload });
  try {
    if (type === 'load') {
      if (handle !== null) engine.moonlm_free(handle);
      handle = engine.moonlm_load(data.bytes, data.name);
      if (handle < 0) { handle = null; throw new Error(engine.moonlm_last_error()); }
      send('done', { context: engine.moonlm_context_length(handle) });
    } else if (type === 'generate') {
      if (handle === null) throw new Error('no model loaded');
      const nPrompt = engine.moonlm_count_tokens(handle, data.prompt);
      if (nPrompt < 0) throw new Error(engine.moonlm_last_error());
      if (nPrompt + data.maxNew > engine.moonlm_context_length(handle)) {
        throw new Error('提示词与生成长度超过模型上下文');
      }
      send('started', { nPrompt });
      const start = performance.now();
      let first = null;
      let count = 0;
      const stats = engine.moonlm_generate(handle, data.prompt, data.maxNew, data.temperature, () => {
        const now = performance.now();
        if (first === null) first = now;
        count++;
        // Decode the complete prefix: UTF-8 characters can span tokens.
        const ids = engine.moonlm_last_tokens();
        send('token', { text: engine.moonlm_decode(handle, ids), count,
          prefillRate: nPrompt / Math.max((first - start) / 1000, 0.001),
          decodeRate: (count - 1) / Math.max((now - first) / 1000, 0.001) });
      });
      if (!stats.length) throw new Error(engine.moonlm_last_error());
      const ids = Array.from(engine.moonlm_last_tokens());
      send('done', { stats: Array.from(stats), ids,
        text: engine.moonlm_decode(handle, ids) });
    } else {
      throw new Error('unknown request: ' + type);
    }
  } catch (error) {
    send('error', { message: error.message || String(error) });
  }
};
