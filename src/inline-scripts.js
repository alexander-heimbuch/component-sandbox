/* global safeParse, listeners */
const LISTENERS = listeners();
const EVENT_BUFFER = [];
let MESSAGE_PORT;

Object.defineProperty(window, 'listen', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: (evt, cb, src) => {
    // Register listener and return deregister handler
    return LISTENERS.add(evt, cb, src);
  }
});

Object.defineProperty(window, 'emit', {
  configurable: false,
  writable: false,
  enumerable: false,
  value: ({ type, payload, source }) => {
    if (!MESSAGE_PORT) {
      EVENT_BUFFER.push({ type, payload, source });
    } else {
      MESSAGE_PORT.postMessage(JSON.stringify({ type, payload, source }));
    }
  }
});

window.addEventListener('message', ({ data, ports }) => {
  const { type } = safeParse(data);
  if (type === 'SBX:SYN' && !MESSAGE_PORT) {
    MESSAGE_PORT = ports[0];
    MESSAGE_PORT.onmessage = ({ data }) => LISTENERS.execute(data);

    EVENT_BUFFER.forEach(window.emit);
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
