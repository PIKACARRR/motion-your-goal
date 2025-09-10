
export class Assets {
  constructor(manifestUrl = './assets.json') {
    this.manifestUrl = manifestUrl;
    this.manifest = {};
    this.images = new Map();
    this.audios = new Map();
  }

  async init() {
    const res = await fetch(this.manifestUrl);
    this.manifest = await res.json();
    const tasks = [];
    for (const [key, meta] of Object.entries(this.manifest)) {
      if (meta.type === 'image') {
        tasks.push(this.#loadImage(key, meta.path));
      } else if (meta.type === 'audio') {
        tasks.push(this.#loadAudio(key, meta.path));
      }
    }
    await Promise.all(tasks);
    return this;
  }

  #loadImage(key, url) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => { this.images.set(key, img); resolve(); };
      img.onerror = reject;
      img.src = url;
    });
  }

  showGif(key, container, opts = {}) {
    const img = this.images.get(key);
    if (!img) throw new Error(`Image not loaded: ${key}`);
    const clone = img.cloneNode();
    const { x = 0, y = 0, width, height, className } = opts;
    if (width) clone.style.width = `${width}px`;
    if (height) clone.style.height = `${height}px`;
    clone.style.position = 'absolute';
    clone.style.left = `${x}px`;
    clone.style.top = `${y}px`;
    if (className) clone.className = className;
    (container || document.body).appendChild(clone);
    return clone;
  }

  #loadAudio(key, url) {
    return new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.oncanplaythrough = () => { this.audios.set(key, audio); resolve(); };
      audio.onerror = reject;
      audio.src = url;
      audio.preload = 'auto';
    });
  }

  play(key, { volume = 1.0, loop = false, from = 0 } = {}) {
    const audio = this.audios.get(key);
    if (!audio) throw new Error(`Audio not loaded: ${key}`);
    const node = audio.cloneNode(true);
    node.volume = volume;
    node.loop = loop;
    node.currentTime = from;
    node.play();
    return node;
  }

  stop(node) {
    if (node && typeof node.pause === 'function') {
      node.pause();
      node.currentTime = 0;
    }
  }

  list(type = 'all') {
    const keys = Object.keys(this.manifest);
    if (type === 'all') return keys;
    return keys.filter(k => this.manifest[k].type === type);
  }
}
