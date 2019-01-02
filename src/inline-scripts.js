/* global safeParse, warn */
let INITIALIZED = false;
const EVENT_BUFFER = [];

let HOST_WINDOW = window;
let ORIGIN = null;

Object.defineProperty(window, 'listen', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: (evt, cb, src) => {
    if (!window) {
      warn(`not initialized, can't register listener for '${evt}'`);
      return;
    }

    window.addEventListener('message', ({ data, source: eventSource }) => {
      const { type, payload, source, origin } = safeParse(data);
      if (type !== evt) {
        return;
      }

      const bypassOriginCheck = type === 'SBX:SYN' || (type === 'SBX:ECHO' && !INITIALIZED);
      if ((bypassOriginCheck || origin === ORIGIN) && (typeof src === 'undefined' || src === source)) {
        cb(payload, type === 'SBX:SYN' ? eventSource : source, origin);
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
      warn(`not initialized, can't send message`, { type, payload });
      return;
    }

    if (!INITIALIZED) {
      EVENT_BUFFER.push({ type, payload });
      return;
    }

    const message = JSON.stringify({ type, payload, source, origin: ORIGIN });
    HOST_WINDOW.postMessage(message, '*');
  }
});

window.onerror = (msg, url, lineNo, columnNo, error) => {
  window.emit({ type: 'SBX:ERROR', payload: { msg, url, lineNo, columnNo, error } });
  return true;
};

Object.defineProperty(window, 'onerror', {
  configurable: false,
  writable: false
});

window.listen('SBX:SYN', (payload, source, origin) => {
  if (INITIALIZED) {
    return;
  }

  HOST_WINDOW = source;
  ORIGIN = origin;
  INITIALIZED = true;
  EVENT_BUFFER.forEach(window.emit);
});

window.listen('SBX:ECHO', ({ type, payload, source }) => {
  window.emit({ type, payload, source });
});

// Remove security relevant properties from the sandboxed `window` object
(() => {
  function safeDelete(property) {
    try {
      delete window[property];
    } catch (e) {
      // Intentionally empty
    }
  }

  safeDelete('parent');
  safeDelete('top');
  safeDelete('frameElement');
  safeDelete('opener');
})();
