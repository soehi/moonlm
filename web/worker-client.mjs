export class InferenceClient {
  constructor(factory = () => new Worker(new URL('./inference-worker.mjs', import.meta.url), { type: 'module' })) {
    this.factory = factory;
    this.worker = null;
    this.pending = null;
    this.serial = 0;
  }
  request(type, payload, progress = () => {}, transfer = []) {
    if (this.pending) return Promise.reject(new Error('inference is busy'));
    if (!this.worker) {
      this.worker = this.factory();
      this.worker.onmessage = ({ data }) => {
        const task = this.pending;
        if (!task || task.id !== data.id) return;
        if (data.event === 'done' || data.event === 'error') {
          this.pending = null;
          if (data.event === 'error') task.reject(new Error(data.message));
          else task.resolve(data);
        } else task.progress(data);
      };
      this.worker.onerror = event => this.stop(new Error(event.message || 'worker failed'));
    }
    return new Promise((resolve, reject) => {
      this.pending = { id: ++this.serial, resolve, reject, progress };
      try { this.worker.postMessage({ id: this.serial, type, ...payload }, transfer); }
      catch (error) { this.pending = null; reject(error); }
    });
  }
  stop(error = new DOMException('已停止；请重新加载模型', 'AbortError')) {
    if (this.worker) this.worker.terminate();
    this.worker = null;
    const task = this.pending;
    this.pending = null;
    if (task) task.reject(error);
  }
}
