/* global getTargetOrigin safeParse */
let INITIALIZED = false;
const EVENT_BUFFER = [];

const PARENT = window.parent;
const ORIGIN = PARENT.location.origin;

Object.defineProperty(window, 'listen', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: (evt, cb, src) => {
    if (!window) {
      console.warn(`not initialized, can't register listener for '${evt}'`);
      return;
    }

    window.addEventListener('message', ({ origin, data, source: eventSource }) => {
      if (origin !== ORIGIN || eventSource !== PARENT) {
        return;
      }

      const { type, payload, source } = safeParse(data);
      if (type === evt && (typeof src === 'undefined' || src === source)) {
        cb(payload, source);
      }
    });
  }
});

Object.defineProperty(window, 'emit', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: ({ type, payload, source }) => {
    if (!window) {
      console.warn(`not initialized, can't send message`, { type, payload });
      return;
    }

    if (!INITIALIZED) {
      EVENT_BUFFER.push({ type, payload });
      return;
    }

    const message = JSON.stringify({ type, payload, source });
    window.postMessage(message, getTargetOrigin(ORIGIN));
  }
});

window.onerror = function(msg, url, lineNo, columnNo, error) {
  window.emit({ type: 'error', payload: { msg, url, lineNo, columnNo, error } });
  return true;
};

Object.defineProperty(window, 'onerror', {
  configurable: false,
  writable: false
});

window.listen('BOOTSTRAP', () => {
  INITIALIZED = true;
  EVENT_BUFFER.forEach(window.emit);
});

window.listen('ECHO', ({ type, payload, source }) => {
  window.emit({ type, payload, source });
});

// Remove security relevant properties from the sandboxed `window` object
delete window.parent;
delete window.opener;
