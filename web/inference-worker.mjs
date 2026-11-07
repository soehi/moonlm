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
      send('done', { context: engine.moonlm_context_length(handle), profile: engine.moonlm_chat_profile(handle) });
    } else if (type === 'generate') {
      if (handle === null) throw new Error('no model loaded');
      const mode = data.mode ?? 'chat';
      if (!['chat', 'raw'].includes(mode)) throw new Error('未知生成模式');
      const penalty = data.penalty ?? 1.1;
      const topP = data.topP ?? 0.9;
      if (!Number.isInteger(data.maxNew) || data.maxNew < 1 || data.maxNew > 4096 ||
          !Number.isFinite(data.temperature) || data.temperature < 0 || data.temperature > 2 ||
          !Number.isFinite(penalty) || penalty < 1 || penalty > 2 ||
          !Number.isFinite(topP) || topP <= 0 || topP > 1 || !data.prompt.trim()) {
        throw new Error('参数无效：token 1–4096，温度 0–2，重复惩罚 1–2，top-p (0,1]；提示词不能为空');
      }
      const prompt = mode === 'chat' ? engine.moonlm_chat_prompt(handle, data.prompt) : data.prompt;
      if (!prompt) throw new Error(engine.moonlm_last_error());
      const nPrompt = engine.moonlm_count_tokens(handle, prompt);
      if (nPrompt < 0) throw new Error(engine.moonlm_last_error());
      if (nPrompt + data.maxNew > engine.moonlm_context_length(handle)) {
        throw new Error('提示词与生成长度超过模型上下文');
      }
      send('started', { nPrompt, mode, profile: engine.moonlm_chat_profile(handle) });
      const start = performance.now();
      let first = null;
      let count = 0;
      const onToken = () => {
        const now = performance.now();
        if (first === null) first = now;
        count++;
        // Decode the complete prefix: UTF-8 characters can span tokens.
        const ids = engine.moonlm_last_tokens();
        send('token', { text: engine.moonlm_decode(handle, ids), count,
          prefillRate: nPrompt / Math.max((first - start) / 1000, 0.001),
          decodeRate: (count - 1) / Math.max((now - first) / 1000, 0.001) });
      };
      const stats = mode === 'raw'
        ? engine.moonlm_generate(handle, prompt, data.maxNew, data.temperature, onToken)
        : engine.moonlm_generate_configured(handle, prompt, data.maxNew, data.temperature, penalty, topP, onToken);
      if (!stats.length) throw new Error(engine.moonlm_last_error());
      const ids = Array.from(engine.moonlm_last_tokens());
      const reason = stats[2] === 1 ? 'eos' : mode === 'chat' && engine.moonlm_repetition_stopped()
        ? 'repetition' : 'length';
      send('done', { stats: Array.from(stats), ids, reason,
        text: engine.moonlm_decode(handle, ids) });
    } else {
      throw new Error('unknown request: ' + type);
    }
  } catch (error) {
    send('error', { message: error.message || String(error) });
  }
};
